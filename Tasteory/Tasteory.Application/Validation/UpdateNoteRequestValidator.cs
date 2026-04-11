using Application.DTO.Requests;
using FluentValidation;

namespace Application.Validation;

public class UpdateNoteRequestValidator : AbstractValidator<UpdateNoteRequest>
{
    public UpdateNoteRequestValidator()
    {
        RuleFor(x => x.StepId)
            .NotEmpty()
            .WithMessage("StepId is required");
        
        RuleFor(x => x.Text)
            .MaximumLength(1000)
            .WithMessage("Note text must not exceed 1000 characters");
        
        RuleFor(x => x.GroupId)
            .Null()
            .When(x => x.IsPrivate)
            .WithMessage("For personal notes, GroupId must be absent");
        
        RuleFor(x => x.GroupId)
            .NotNull()
            .When(x => !x.IsPrivate)
            .WithMessage("GroupId is required for family notes");
    }
}