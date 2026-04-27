using Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using Microsoft.Extensions.Configuration;

namespace Infrastructure.Persistence.Context;

public class DesignTimeDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        string path = Path.Combine(Directory.GetCurrentDirectory(), "..", "Tasteory.Api");

        IConfigurationRoot configuration = new ConfigurationBuilder()
            .SetBasePath(path)
            .AddJsonFile("appsettings.json", optional: true)
            .AddEnvironmentVariables()
            .Build();

        var builder = new DbContextOptionsBuilder<AppDbContext>();
        
        var connectionString = configuration.GetConnectionString("DefaultConnection") 
                               ?? "Host=localhost;Port=5432;Database=tasteory_db;Username=postgres;Password=postgres";

        builder.UseNpgsql(connectionString);

        return new AppDbContext(builder.Options);
    }
}