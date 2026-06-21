using Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class GroupRecipeEntityConfiguration : IEntityTypeConfiguration<GroupRecipeEntity>
{
    public void Configure(EntityTypeBuilder<GroupRecipeEntity> builder)
    {
        builder
            .HasKey(x => new { x.GroupId, x.RecipeId });

        builder
            .HasOne(x => x.Group)
            .WithMany(x => x.Recipes)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .HasOne(x => x.Recipe)
            .WithMany(x => x.GroupRecipes)
            .OnDelete(DeleteBehavior.Cascade);
    }
}