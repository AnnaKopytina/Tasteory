namespace Infrastructure.Media;

public class S3Options
{
    public const string SectionName = "YandexS3";
    public string BucketName { get; set; } = string.Empty;
    public string AccessKey { get; set; } = string.Empty;
    public string SecretKey { get; set; } = string.Empty;
    public string Endpoint { get; set; } = "https://storage.yandexcloud.net";
    public bool UsePublicUrls { get; set; } = true;
    public string MediaPrefix { get; set; } = "media/";
}