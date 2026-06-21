using Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class UserGroupEntityConfiguration : IEntityTypeConfiguration<UserGroupEntity>
{
    public void Configure(EntityTypeBuilder<UserGroupEntity> builder)
    {
        builder
            .HasKey(x => new { x.UserId, x.GroupId });

        builder
            .HasOne(x => x.Group)
            .WithMany(x => x.Users)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .HasOne(x => x.User)
            .WithMany(x => x.UserGroups)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .Property(x => x.Role)
            .HasConversion<string>()
            .HasMaxLength(20);
    }
}