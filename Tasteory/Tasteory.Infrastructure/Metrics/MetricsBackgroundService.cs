using Application.Metrics;
using Infrastructure.Persistence.Context;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Infrastructure.Persistence.Services;

public class MetricsBackgroundService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<MetricsBackgroundService> _logger;
    
    private readonly TimeSpan _period = TimeSpan.FromHours(1);

    public MetricsBackgroundService(IServiceScopeFactory scopeFactory, ILogger<MetricsBackgroundService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Background Metrics Service started.");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                _logger.LogInformation("Updating Active Users metric from DB...");
                await UpdateActiveUsersAsync();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to update active users metric.");
            }
            
            await Task.Delay(_period, stoppingToken);
        }
    }

    private async Task UpdateActiveUsersAsync()
    {
        using var scope = _scopeFactory.CreateScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var monthAgo = DateTime.UtcNow.AddDays(-30);
        
        var count = await dbContext.Users
            .CountAsync(u => u.LastActivityAt >= monthAgo);

        TasteoryMetrics.ActiveUsers.Set(count);
        
        _logger.LogInformation($"Metric updated: {count} active users found.");
    }
}