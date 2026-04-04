using Application.DTO.Requests;
using FluentValidation;

namespace Application.Validation;

public class UpdateGroupRequestValidator : AbstractValidator<UpdateGroupRequest>
{
    public UpdateGroupRequestValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Group name is required.")
            .MaximumLength(100)
            .WithMessage("Group name must not exceed 100 characters");
    }
}