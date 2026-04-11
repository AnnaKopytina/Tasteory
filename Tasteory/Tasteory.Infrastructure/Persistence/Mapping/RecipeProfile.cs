using AutoMapper;
using Domain.Entities;
using Domain.Models;
using Infrastructure.Persistence.Entities;

namespace Infrastructure.Persistence.Mapping;

public class RecipeProfile : Profile
{
    public RecipeProfile()
    {
        CreateMap<RecipeEntity, Recipe>()
            .ForCtorParam("authorId", opt => opt.MapFrom(src => src.AuthorId))
            .ForCtorParam("title", opt => opt.MapFrom(src => src.Title))
            .ForCtorParam("mainImage", opt => opt.MapFrom(src => src.MainImage))
            .ForCtorParam("mainText", opt => opt.MapFrom(src => src.MainText))
            .ForCtorParam("rating", opt => opt.MapFrom(src => src.Rating))
            .ForCtorParam("isPrivate", opt => opt.MapFrom(src => src.IsPrivate))
            .ForCtorParam("timeMinutes", opt => opt.MapFrom(src => src.TimeMinutes))
            .ForCtorParam("basePortions", opt => opt.MapFrom(src => src.BasePortions))
            .ForCtorParam("createdAt", opt => opt.MapFrom(src => src.CreatedAt))
            .ForCtorParam("tags", opt => opt.MapFrom(src => src.Tags))
            .ForCtorParam("ingredients", opt => opt.MapFrom(src => src.Ingredients))
            .ForCtorParam("steps", opt => opt.MapFrom(src => src.Steps));
        
        CreateMap<Recipe, RecipeEntity>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => src.Id))
            .ForMember(dest => dest.AuthorId, opt => opt.MapFrom(src => src.AuthorId))!
            .ForMember(dest => dest.CreatedAt, opt => opt.MapFrom(src => src.CreatedAt))
            .ForMember(dest => dest.Rating, opt => opt.MapFrom(src => src.Rating))
            .ForMember(dest => dest.Author, opt => opt.Ignore())
            .ForMember(dest => dest.Ingredients, opt => opt.Ignore())
            .ForMember(dest => dest.Steps, opt => opt.Ignore());  

        CreateMap<IngredientEntity, Ingredient>();

        CreateMap<StepEntity, Step>()
            .ForCtorParam("mediaType", opt => opt.MapFrom(src => src.MediaType));

        CreateMap<Ingredient, IngredientEntity>();
        CreateMap<Step, StepEntity>();

        CreateMap<RecipeEntity, RecipeSummary>();
    }
}