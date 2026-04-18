using Application.DTO.Requests;
using FluentValidation;

namespace Application.Validation;

public class AddMemberByUsernameRequestValidator : AbstractValidator<AddMemberByUserNameRequest>
{
    public AddMemberByUsernameRequestValidator()
    {
        RuleFor(x => x.UserName)
            .NotEmpty()
            .WithMessage("UserName is required.")
            .MaximumLength(30)
            .WithMessage("UserName is too long.");
    }
}