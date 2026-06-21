namespace Domain.Entities;

public class StepNote : Entity
{
    public Guid StepId { get; private set; }
    public Guid UserId { get; private set; }
    public Guid? GroupId { get; private set; }
    public string Text { get; private set; }
    
    public bool IsPrivate => GroupId == null;

    private StepNote(Guid id, Guid stepId, Guid userId, Guid? groupId, string text) : base(id)
    {
        StepId = stepId;
        UserId = userId;
        GroupId = groupId;
        Text = text;
    }
    
    public static StepNote Create(Guid stepId, Guid userId, Guid? groupId, string text)
    {
        return new StepNote(Guid.NewGuid(), stepId, userId, groupId, text.Trim());
    }
    
    public void UpdateText(string newText)
    {
        Text = newText.Trim();
    }
}