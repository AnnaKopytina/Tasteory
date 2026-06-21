using Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class StepEntityConfiguration : IEntityTypeConfiguration<StepEntity>
{
    public void Configure(EntityTypeBuilder<StepEntity> builder)
    {
        builder
            .HasOne(x => x.Recipe)
            .WithMany(x => x.Steps)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .Property(x => x.Content)
            .HasMaxLength(2000);

        builder
            .Property(x => x.MediaUrl)
            .HasMaxLength(500);

        builder
            .Property(x => x.MediaType)
            .HasConversion<string>()
            .HasMaxLength(20);
    }
}