using Prometheus;

namespace Application.Metrics;

public static class TasteoryMetrics
{
    public static readonly Gauge RecipesCurrent = Prometheus.Metrics
        .CreateGauge("tasteory_recipes_current", "Текущее количество рецептов в системе", 
            new GaugeConfiguration { LabelNames = new[] { "visibility", "origin" } });
    
    public static readonly Counter SiteTrafficTotal = Prometheus.Metrics
        .CreateCounter("tasteory_site_traffic_total", "Количество заходов на страницы",
            new CounterConfiguration { LabelNames = new[] { "user_type" } });

    public static readonly Gauge UsersRegisteredTotal = Prometheus.Metrics
        .CreateGauge("tasteory_users_registered_total", "Всего зарегистрированных пользователей");

    public static readonly Gauge GroupsCurrent = Prometheus.Metrics
        .CreateGauge("tasteory_groups_current", "Текущее количество активных групп");
    
    public static readonly Counter GroupInvitationsTotal = Prometheus.Metrics
        .CreateCounter("tasteory_group_invitations_total", "Принято приглашений");
    
    public static readonly Gauge FavoritesCurrent = Prometheus.Metrics
        .CreateGauge("tasteory_favorites_current", "Рецептов в избранном сейчас");
    
    public static readonly Gauge ActiveUsers = Prometheus.Metrics
        .CreateGauge("tasteory_active_users_monthly", "пользователи которые логинятся.");
}