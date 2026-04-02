using Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class IngredientEntityConfiguration : IEntityTypeConfiguration<IngredientEntity>
{
    public void Configure(EntityTypeBuilder<IngredientEntity> builder)
    {
        builder
            .HasOne(x => x.Recipe)
            .WithMany(x => x.Ingredients)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .Property(x => x.Name)
            .HasMaxLength(100);

        builder
            .Property(x => x.Measure)
            .HasMaxLength(50);
    }
}