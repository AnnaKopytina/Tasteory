namespace Application.Interfaces.Services;

public interface IFileStorageService
{
    public Task<string> UploadAsync(Stream stream, string fileName);
    public Task DeleteAsync(string url);
}