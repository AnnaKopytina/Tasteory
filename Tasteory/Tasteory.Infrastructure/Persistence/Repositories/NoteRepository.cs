using Application.Interfaces.Repositories;
using AutoMapper;
using Domain.Entities;
using Infrastructure.Persistence.Context;
using Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class NoteRepository : INoteRepository
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public NoteRepository(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<StepNote?> GetPrivateNoteAsync(Guid stepId, Guid userId)
    {
        var entity = await _context.StepNotes
            .AsNoTracking()
            .FirstOrDefaultAsync(n => n.StepId == stepId && n.UserId == userId && n.GroupId == null);

        return entity is null ? null : _mapper.Map<StepNote>(entity);
    }

    public async Task<List<StepNote>> GetGroupNotesAsync(Guid stepId, Guid groupId)
    {
        var entities = await _context.StepNotes
            .AsNoTracking()
            .Where(n => n.StepId == stepId && n.GroupId == groupId)
            .OrderByDescending(n => n.Id)
            .ToListAsync();

        return _mapper.Map<List<StepNote>>(entities);
    }

    public async Task<bool> HasGroupNotesAsync(Guid stepId, Guid groupId)
    {
        return await _context.StepNotes.AnyAsync(n => n.StepId == stepId && n.GroupId == groupId);
    }

    public async Task AddNoteAsync(StepNote note)
    {
        var entity = _mapper.Map<StepNoteEntity>(note);

        await _context.StepNotes.AddAsync(entity);
        await _context.SaveChangesAsync();
    }

    public async Task<bool> NoteExistsAsync(Guid stepId, Guid userId, Guid? groupId)
    {
        return await _context.StepNotes.AnyAsync(n => n.StepId == stepId && n.UserId == userId && n.GroupId == groupId);
    }

    public async Task UpdateNoteTextAsync(Guid stepId, Guid userId, Guid? groupId, string newText)
    {
        await _context.StepNotes
            .Where(n => n.StepId == stepId && n.UserId == userId && n.GroupId == groupId)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.NoteText, newText));
    }

    public async Task DeleteNoteByKeysAsync(Guid stepId, Guid userId, Guid? groupId)
    {
        await _context.StepNotes
            .Where(n => n.StepId == stepId && n.UserId == userId && n.GroupId == groupId)
            .ExecuteDeleteAsync();
    }
}