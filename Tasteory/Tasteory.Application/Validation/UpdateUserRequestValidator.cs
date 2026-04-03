using Application.DTO.Responses;
using FluentValidation;

namespace Application.Validation;

public class UpdateUserRequestValidator : AbstractValidator<UpdateUserRequest>
{
    public UpdateUserRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Name cannot be empty.")
            .MaximumLength(100)
            .WithMessage("Name is too long.");
    }
}