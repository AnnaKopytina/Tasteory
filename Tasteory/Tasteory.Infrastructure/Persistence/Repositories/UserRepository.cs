using AutoMapper;
using Domain.Entities;
using Domain.Interfaces;
using Infrastructure.Persistence.Context;
using Infrastructure.Persistence.Entities;
using Microsoft.EntityFrameworkCore;

namespace Infrastructure.Persistence.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public UserRepository(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        var userEntity = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == email);

        return userEntity is null ? null : _mapper.Map<User>(userEntity);
    }


    public async Task<User?> GetByIdAsync(Guid id)
    {
        var userEntity = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == id);

        return userEntity is null ? null : _mapper.Map<User>(userEntity);
    }

    public async Task AddAsync(User user)
    {
        var userEntity = _mapper.Map<UserEntity>(user);

        await _context.Users.AddAsync(userEntity);
        await _context.SaveChangesAsync();
    }


    public async Task UpdateAsync(User user, string newUserName)
    {
        var userEntity = await _context.Users.FindAsync(user.Id);

        if (userEntity is null)
        {
            return;
        }

        userEntity.UserName = newUserName;

        await _context.SaveChangesAsync();
    }

    public async Task RemoveByIdAsync(Guid id)
    {
        var userEntity = await _context.Users.FindAsync(id);

        if (userEntity is null)
        {
            return;
        }

        _context.Users.Remove(userEntity);
        await _context.SaveChangesAsync();
    }
}