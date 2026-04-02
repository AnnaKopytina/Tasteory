namespace Infrastructure.Persistence.Entities;

public class StepNoteEntity
{
    public Guid Id { get; set; }
    public Guid StepId { get; set; }
    public StepEntity Step { get; set; }
    public Guid UserId { get; set; }
    public UserEntity User { get; set; }
    public Guid? GroupId { get; set; }
    public GroupEntity? Group { get; set; }
    public string NoteText { get; set; } = string.Empty;
}