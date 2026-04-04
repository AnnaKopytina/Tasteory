using Application.DTO.Requests;
using FluentValidation;

namespace Application.Validation;

public class JoinGroupRequestValidator : AbstractValidator<JoinGroupRequest>
{
    public JoinGroupRequestValidator()
    {
        RuleFor(x => x.InviteCode)
            .NotEmpty()
            .WithMessage("Invite code required")
            .MaximumLength(20)
            .WithMessage("Invite code must not exceed 20 characters");
    }
}