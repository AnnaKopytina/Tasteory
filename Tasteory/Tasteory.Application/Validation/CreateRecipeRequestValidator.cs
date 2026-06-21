using Application.DTO.Requests;
using FluentValidation;

namespace Application.Validation;

public class CreateRecipeRequestValidator : AbstractValidator<CreateRecipeRequest>
{
    public CreateRecipeRequestValidator()
    {
        RuleFor(x => x.Title)
            .NotEmpty()
            .WithMessage("Title is required.");
        //     .MaximumLength(200)
        //     .WithMessage("Title is too long.");
        //
        // RuleFor(x => x.BasePortions)
        //     .GreaterThan(0)
        //     .WithMessage("Base portions must be greater than zero.");
        //
        // RuleFor(x => x.TimeMinutes)
        //     .GreaterThanOrEqualTo(0)
        //     .WithMessage("Time cannot be negative.");
        //
        // RuleForEach(x => x.Ingredients).SetValidator(new IngredientDtoValidator());
        // RuleForEach(x => x.Steps).SetValidator(new StepDtoValidator());
    }
}
