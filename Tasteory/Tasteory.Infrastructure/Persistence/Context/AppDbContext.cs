using Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Context;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<UserEntity> Users { get; set; }
    public DbSet<GroupEntity> Groups { get; set; }
    public DbSet<UserGroupEntity> UserGroups { get; set; }
    public DbSet<GroupInviteEntity> GroupInvites { get; set; }
    public DbSet<RecipeEntity> Recipes { get; set; }
    public DbSet<GroupRecipeEntity> GroupRecipes { get; set; }
    public DbSet<IngredientEntity> Ingredients { get; set; }
    public DbSet<StepEntity> Steps { get; set; }
    public DbSet<StepNoteEntity> StepNotes { get; set; }
    public DbSet<UserFavoriteRecipeEntity> UserFavoriteRecipes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);
        modelBuilder.HasPostgresExtension("pg_trgm");

        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}