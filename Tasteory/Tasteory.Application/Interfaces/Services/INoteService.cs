using Application.DTO.Requests;
using Application.DTO.Responses;

namespace Application.Interfaces.Services;

public interface INoteService
{
    public Task<StepNotesResponse> GetNotesForStepAsync(Guid userId, Guid stepId, Guid? groupId);
    public Task SaveNoteAsync(Guid userId, UpdateNoteRequest request);
    public Task DeleteNoteAsync(Guid userId, Guid stepId, bool isPrivate, Guid? groupId);
}