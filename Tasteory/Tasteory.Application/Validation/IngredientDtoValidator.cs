using Application.DTO;
using FluentValidation;

namespace Application.Validation;

public class IngredientDtoValidator : AbstractValidator<IngredientDto>
{
    public IngredientDtoValidator()
    {
        RuleFor(x => x.Name)
            .NotEmpty()
            .WithMessage("Ingredient name is required.");
        
        RuleFor(x => x.Amount)
            .GreaterThan(0)
            .WithMessage("Amount must be greater than zero.");
        
        RuleFor(x => x.SortOrder)
            .GreaterThan(0)
            .WithMessage("Sort order must be positive.");
    }
}