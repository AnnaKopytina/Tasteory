namespace Application.Interfaces.Repositories;

public interface IFavoriteRepository
{
    public Task AddAsync(Guid userId, Guid recipeId);
    public Task RemoveAsync(Guid userId, Guid recipeId);
    public Task<bool> IsFavoriteAsync(Guid userId, Guid recipeId);
    public Task<List<Guid>> GetUserFavoriteIdsAsync(Guid userId, List<Guid> recipeIds);
}