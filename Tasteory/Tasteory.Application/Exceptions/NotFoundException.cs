namespace Application.Exceptions;

public class NotFoundException(string message) : BaseException(message, 404);
