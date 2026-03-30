using Prometheus;

namespace Application.Metrics;

public static class TasteoryMetrics
{
    public static readonly Counter RecipesCreatedTotal = Prometheus.Metrics
        .CreateCounter("tasteory_recipes_created_total", "Количество созданных рецептов", 
            new CounterConfiguration { LabelNames = new[] { "visibility" } });

    public static readonly Counter UsersRegisteredTotal = Prometheus.Metrics
        .CreateCounter("tasteory_users_registered_total", "Всего зарегистрированных пользователей");

    public static readonly Counter GroupInvitationsTotal = Prometheus.Metrics
        .CreateCounter("tasteory_group_invitations_total", "Количество принятых приглашений в группы");
    
    public static readonly Gauge ActiveUsersMonthly = Prometheus.Metrics
        .CreateGauge("tasteory_active_users_monthly", "Активные пользователи за последние 30 дней");
}