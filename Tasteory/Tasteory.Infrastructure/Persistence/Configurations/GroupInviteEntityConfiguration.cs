using Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class GroupInviteEntityConfiguration : IEntityTypeConfiguration<GroupInviteEntity>
{
    public void Configure(EntityTypeBuilder<GroupInviteEntity> builder)
    {
        builder
            .HasOne(x => x.Group)
            .WithMany(x => x.Invites)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .Property(x => x.Code)
            .HasMaxLength(20);
        builder
            .HasIndex(x => x.Code)
            .IsUnique();
    }
}