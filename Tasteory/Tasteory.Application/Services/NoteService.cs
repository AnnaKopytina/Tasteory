using Application.DTO.Requests;
using Application.DTO.Responses;
using Application.Exceptions;
using Application.Interfaces.Repositories;
using Application.Interfaces.Services;
using Domain.Entities;

namespace Application.Services;

public class NoteService : INoteService
{
    private readonly INoteRepository _noteRepository;
    private readonly IGroupRepository _groupRepository;
    private readonly IUserRepository _userRepository;

    public NoteService(INoteRepository noteRepository, IGroupRepository groupRepository, IUserRepository userRepository)
    {
        _noteRepository = noteRepository;
        _groupRepository = groupRepository;
        _userRepository = userRepository;
    }

    public async Task<StepNotesResponse> GetNotesForStepAsync(Guid userId, Guid stepId, Guid? groupId)
    {
        var privateNote = await _noteRepository.GetPrivateNoteAsync(stepId, userId);
        var groupNotes = new List<NoteResponse>();

        if (groupId.HasValue)
        {
            var role = await _groupRepository.GetUserRoleInGroupAsync(userId, groupId.Value);

            if (role is null)
            {
                throw new NotFoundException("You are not a member of this group.");
            }

            if (await _noteRepository.HasGroupNotesAsync(stepId, groupId.Value))
            {
                var dbNotes = await _noteRepository.GetGroupNotesAsync(stepId, groupId.Value);
                var authorIds = dbNotes.Select(n => n.UserId).Distinct().ToList();
                var authorNames = await _userRepository.GetUserNamesByIdsAsync(authorIds);

                groupNotes = dbNotes.Select(n => new NoteResponse
                {
                    Id = n.Id,
                    AuthorId = n.UserId,
                    AuthorName = authorNames.GetValueOrDefault(n.UserId, "Unknown"),
                    Text = n.Text
                }).ToList();
            }
        }

        return new StepNotesResponse
        {
            StepId = stepId,
            MyPrivateNote = privateNote != null ? MapToResponse(privateNote) : null,
            GroupNotes = groupNotes
        };
    }

    public async Task SaveNoteAsync(Guid userId, UpdateNoteRequest request)
    {
        if (!request.IsPrivate && request.GroupId.HasValue)
        {
            var role = await _groupRepository.GetUserRoleInGroupAsync(userId, request.GroupId.Value);

            if (role is null)
            {
                throw new NotFoundException("You are not a member of this group.");
            }
        }

        var targetGroupId = request.IsPrivate ? null : request.GroupId;
        var exists = await _noteRepository.NoteExistsAsync(request.StepId, userId, targetGroupId);

        if (exists)
        {
            await _noteRepository.UpdateNoteTextAsync(request.StepId, userId, targetGroupId, request.Text);
        }
        else
        {
            var note = StepNote.Create(request.StepId, userId, targetGroupId, request.Text);
            await _noteRepository.AddNoteAsync(note);
        }
    }

    public async Task DeleteNoteAsync(Guid userId, Guid stepId, bool isPrivate, Guid? groupId)
    {
        var targetGroupId = isPrivate ? null : groupId;
        var exists = await _noteRepository.NoteExistsAsync(stepId, userId, targetGroupId);

        if (!exists)
        {
            throw new NotFoundException("Note is not found.");
        }

        await _noteRepository.DeleteNoteByKeysAsync(stepId, userId, targetGroupId);
    }
    
    //TODO: сделать маппинг нормальный
    private static NoteResponse MapToResponse(StepNote note) =>
        new() { Id = note.Id, AuthorId = note.UserId, Text = note.Text };
}