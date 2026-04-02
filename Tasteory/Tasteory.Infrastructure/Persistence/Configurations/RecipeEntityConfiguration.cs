using Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class RecipeEntityConfiguration : IEntityTypeConfiguration<RecipeEntity>
{
    public void Configure(EntityTypeBuilder<RecipeEntity> builder)
    {
        builder
            .HasOne(x => x.Author)
            .WithMany(x => x.CreatedRecipes)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .HasIndex(x => x.Title)
            .HasMethod("gin")
            .HasOperators("gin_trgm_ops");

        builder.HasIndex(x => x.MainText)
            .HasMethod("gin")
            .HasOperators("gin_trgm_ops");

        builder
            .Property(x => x.Title)
            .HasMaxLength(200);

        builder
            .Property(x => x.MainImage)
            .HasMaxLength(500);

        builder
            .Property(x => x.MainText)
            .HasMaxLength(2000);
    }
}