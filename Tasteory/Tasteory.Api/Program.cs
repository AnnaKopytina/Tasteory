using Amazon.S3;
using Application.DTO.Responses;
using Application.Interfaces.Repositories;
using Application.Interfaces.Services;
using Application.Metrics;
using Application.Services;
using Application.Validation;
using DotNetEnv;
using FluentValidation;
using FluentValidation.AspNetCore;
using Infrastructure.Media;
using Infrastructure.Persistence.Context;
using Infrastructure.Persistence.Repositories;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using Prometheus;
using Serilog;
using Serilog.Events;
using Serilog.Sinks.Grafana.Loki;
using Tasteory.Extensions;
using Tasteory.Middleware;

var builder = WebApplication.CreateBuilder(args);

// --- Пу пу пу Логи.. ---
Log.Logger = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.Hosting.Lifetime", LogEventLevel.Information)
    .MinimumLevel.Override("System", LogEventLevel.Warning)
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database.Command", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .Filter.ByExcluding("RequestPath = '/metrics' or RequestPath = '/swagger/index.html'")
    .WriteTo.Console(outputTemplate: "[{Timestamp:HH:mm:ss} {Level:u3}] {Message:lj}{NewLine}{Exception}")
    .WriteTo.GrafanaLoki("http://loki:3100", new[]
    {
        new LokiLabel { Key = "app", Value = "tasteory-api" }
    })
    .CreateLogger();

builder.Host.UseSerilog();
// -------------------------

Env.TraversePath().Load();
builder.Configuration.AddEnvironmentVariables();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");

if (string.IsNullOrWhiteSpace(connectionString))
{
    var dbPort = Environment.GetEnvironmentVariable("POSTGRES_PORT");
    var dbName = Environment.GetEnvironmentVariable("POSTGRES_DB");
    var dbUser = Environment.GetEnvironmentVariable("POSTGRES_USER");
    var dbPass = Environment.GetEnvironmentVariable("POSTGRES_PASSWORD");

    connectionString = $"Host=localhost;Port={dbPort};Database={dbName};Username={dbUser};Password={dbPass}";
}

builder.Services.Configure<S3Options>(builder.Configuration.GetSection(S3Options.SectionName));

builder.Services.AddSingleton<IAmazonS3>(sp =>
{
    var cfg = sp.GetRequiredService<IOptions<S3Options>>().Value;
    
    return new AmazonS3Client(cfg.AccessKey, cfg.SecretKey, new AmazonS3Config
    {
        ServiceURL = cfg.Endpoint,
        ForcePathStyle = true,
        AuthenticationRegion = "ru-central1"
    });
});

builder.Services.AddScoped<IFileStorageService, S3FileStorageService>();
builder.Services.AddScoped<IMediaService, MediaService>();


builder.Services.AddDbContext<AppDbContext>(options => { options.UseNpgsql(connectionString); });

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IGroupRepository, GroupRepository>();
builder.Services.AddScoped<IGroupService, GroupService>();
builder.Services.AddScoped<IRecipeRepository, RecipeRepository>();
builder.Services.AddScoped<IRecipeService, RecipeService>();
builder.Services.AddScoped<INoteRepository, NoteRepository>();
builder.Services.AddScoped<INoteService, NoteService>();
builder.Services.AddScoped<IFavoriteRepository, FavoriteRepository>(); 

builder.Services.AddTransient<ErrorHandlerMiddleware>();
builder.Services.AddAutoMapper(_ => { }, AppDomain.CurrentDomain.GetAssemblies());

builder.Services.AddControllers();

builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<PaginationQueryValidator>();

builder.Services.AddApiAuthentication(builder.Configuration);

if (Environment.GetEnvironmentVariable("DOTNET_RUNNING_IN_CONTAINER") == "true")
{
    builder.Services.AddDataProtection()
        .PersistKeysToFileSystem(new DirectoryInfo(@"/root/.aspnet/DataProtection-Keys"));
}

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.WithOrigins("http://localhost:5173", "http://localhost:8080", "http://localhost:3000", "https://tasteory.ru", "http://tasteory.ru")
            .AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials();
    });
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    var logger = scope.ServiceProvider.GetRequiredService<ILogger<Program>>();

    try
    {
        logger.LogInformation("Applying database migrations...");
        dbContext.Database.Migrate();
        logger.LogInformation("Database migrations applied successfully!");
        
        // --- Инициализация метрик ---
        logger.LogInformation("Initializing metrics from database...");
        
        var recipeStats = await dbContext.Recipes
            .Select(r => new { 
                r.IsPrivate, 
                InGroup = dbContext.GroupRecipes.Any(gr => gr.RecipeId == r.Id) 
            })
            .ToListAsync();

        var combinations = new[] 
        { 
            new { Vis = "public", Scp = "personal" },
            new { Vis = "public", Scp = "group" },
            new { Vis = "private", Scp = "personal" },
            new { Vis = "private", Scp = "group" }
        };

        foreach (var combo in combinations)
        {
            var count = recipeStats.Count(x => 
                (x.IsPrivate ? "private" : "public") == combo.Vis && 
                (x.InGroup ? "group" : "personal") == combo.Scp);
            
            TasteoryMetrics.RecipesCurrent.WithLabels(combo.Vis, combo.Scp).Set(count);
        }

        var groupsCount = await dbContext.Groups.CountAsync();
        TasteoryMetrics.GroupsCurrent.Set(groupsCount);

        var favoritesCount = await dbContext.UserFavoriteRecipes.CountAsync();
        TasteoryMetrics.FavoritesCurrent.Set(favoritesCount);

        var usersCount = await dbContext.Users.CountAsync();
        TasteoryMetrics.UsersRegisteredTotal.Set(usersCount);
        
        var monthAgo = DateTime.UtcNow.AddDays(-7);

        var activeUsers = await dbContext.Users
            .CountAsync(u => u.LastActivityAt >= monthAgo);

        TasteoryMetrics.ActiveUsers.Set(activeUsers);

        logger.LogInformation("Metrics initialized successfully!");
    }
    catch (Exception ex)
    {
        logger.LogCritical(ex, "A fatal error occurred while applying database migrations or make metrics!");
        Console.WriteLine($"Could not run migrations: {ex}");
    }
}

app.UseMiddleware<ErrorHandlerMiddleware>();
app.UseMetricServer();
app.UseHttpMetrics();
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

//app.UseHttpsRedirection();
app.UseCors();

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

app.Run();