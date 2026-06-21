using Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class GroupEntityConfiguration : IEntityTypeConfiguration<GroupEntity>
{
    public void Configure(EntityTypeBuilder<GroupEntity> builder)
    {
        builder
            .HasOne(x => x.Owner)
            .WithMany(x => x.OwnedGroups)
            .OnDelete(DeleteBehavior.Restrict);

        builder
            .Property(x => x.Name)
            .HasMaxLength(100);
    }
}