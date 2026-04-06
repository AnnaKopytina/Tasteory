using Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class UserFavoriteRecipeEntityConfiguration : IEntityTypeConfiguration<UserFavoriteRecipeEntity>
{
    public void Configure(EntityTypeBuilder<UserFavoriteRecipeEntity> builder)
    {
        builder
            .HasKey(x => new { x.UserId, x.RecipeId });

        builder
            .HasOne(x => x.User)
            .WithMany(x => x.FavoriteRecipes)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .HasOne(x => x.Recipe)
            .WithMany(x => x.FavoritedBy)
            .OnDelete(DeleteBehavior.Cascade);
    }
}