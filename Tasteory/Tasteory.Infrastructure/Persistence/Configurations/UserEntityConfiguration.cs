using Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class UserEntityConfiguration : IEntityTypeConfiguration<UserEntity>
{
    public void Configure(EntityTypeBuilder<UserEntity> builder)
    {
        builder.Property(x => x.DisplayName)
            .HasMaxLength(100);
        
        builder.Property(x => x.UserName)
            .HasMaxLength(30);
        
        builder.Property(x => x.Email)
            .HasMaxLength(255);

        builder.HasIndex(x => x.Email)
            .IsUnique();
        
        builder.HasIndex(x => x.UserName)
            .IsUnique();
    }
}