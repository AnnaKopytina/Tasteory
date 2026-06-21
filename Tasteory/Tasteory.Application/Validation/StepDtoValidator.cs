using Application.DTO;
using FluentValidation;

namespace Application.Validation;

public class StepDtoValidator : AbstractValidator<StepDto>
{
    public StepDtoValidator()
    {
        RuleFor(x => x.Content)
            .NotEmpty()
            .WithMessage("Step content is required.");

        RuleFor(x => x.SortOrder)
            .GreaterThan(0)
            .WithMessage("Sort order must be positive.");
    }
}