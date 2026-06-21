using Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;

namespace Infrastructure.Persistence.Configurations;

public class StepNoteEntityConfiguration : IEntityTypeConfiguration<StepNoteEntity>
{
    public void Configure(EntityTypeBuilder<StepNoteEntity> builder)
    {
        builder
            .HasOne(x => x.Step)
            .WithMany(x => x.Notes)
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .HasOne(x => x.User)
            .WithMany()
            .OnDelete(DeleteBehavior.Cascade);

        builder
            .HasOne(x => x.Group)
            .WithMany()
            .OnDelete(DeleteBehavior.SetNull);

        builder
            .Property(x => x.NoteText)
            .HasMaxLength(1000);
    }
}