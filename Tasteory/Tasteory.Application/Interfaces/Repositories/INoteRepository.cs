using Domain.Entities;

namespace Application.Interfaces.Repositories;


public interface INoteRepository
{
    public Task<StepNote?> GetPrivateNoteAsync(Guid stepId, Guid userId);
    public Task<List<StepNote>> GetGroupNotesAsync(Guid stepId, Guid groupId);
    public Task<bool> NoteExistsAsync(Guid stepId, Guid userId, Guid? groupId);
    public Task<bool> HasGroupNotesAsync(Guid stepId, Guid groupId);
    public Task AddNoteAsync(StepNote note);
    public Task UpdateNoteTextAsync(Guid stepId, Guid userId, Guid? groupId, string newText);
    public Task DeleteNoteByKeysAsync(Guid stepId, Guid userId, Guid? groupId);
}