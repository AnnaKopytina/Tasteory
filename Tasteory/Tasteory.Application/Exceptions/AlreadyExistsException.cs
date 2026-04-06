namespace Application.Exceptions;

public class AlreadyExistsException(string message) : BaseException(message, 409);
