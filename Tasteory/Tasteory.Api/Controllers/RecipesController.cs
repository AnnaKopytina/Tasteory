using Application.DTO;
using Application.DTO.Requests;
using Application.DTO.Responses;
using Application.Metrics;
using Microsoft.AspNetCore.Mvc;

namespace Tasteory.Controllers;

[ApiController]
[Route("api/recipes")]
public class RecipesController : ControllerBase
{
    [HttpGet]
    public ActionResult<PagedResponse<RecipeSummaryResponse>> GetAll(
        [FromQuery] string? searchTerm = null, 
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10)
    {
        var allMockRecipes = Enumerable.Range(1, 100)
            .Select(i => GetMockSummary(Guid.NewGuid())).ToList();

        var filtered = string.IsNullOrWhiteSpace(searchTerm) 
            ? allMockRecipes 
            : allMockRecipes.Where(r => r.Title.Contains(searchTerm, StringComparison.OrdinalIgnoreCase)).ToList();

        // Логика пагинации
        var items = filtered
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToList();

        return Ok();
    }
    
    [HttpGet("suggest")]
    public ActionResult<List<RecipeSuggestionResponse>> GetSuggestions([FromQuery] string query)
    {
        if (string.IsNullOrWhiteSpace(query) || query.Length < 2) 
            return Ok(new List<RecipeSuggestionResponse>());

        var suggestions = new List<RecipeSuggestionResponse>
        {
            new (Guid.NewGuid(), "Мамин кляр"),
            new (Guid.NewGuid(), "Кляр на минералке"),
            new (Guid.NewGuid(), "Рыба в кляре")
        }.Where(s => s.Title.Contains(query, StringComparison.OrdinalIgnoreCase)).ToList();

        return Ok(suggestions);
    }

    [HttpGet("{id:guid}")]
    public ActionResult<RecipeResponse> GetById(Guid id)
    {
        return Ok(GetFullMockRecipe(id));
    }

    [HttpGet("user/{userId:guid}")]
    public ActionResult<PagedResponse<RecipeSummaryResponse>> GetByUserId(
        Guid userId, 
        [FromQuery] int page = 1, 
        [FromQuery] int pageSize = 10)
    {
        var mockItems = new List<RecipeSummaryResponse> { GetMockSummary(Guid.NewGuid()) };
        return Ok();
    }

    [HttpPost]
    public IActionResult Create([FromBody] CreateRecipeRequest request)
    {
        if (string.IsNullOrEmpty(request.Title)) 
            return BadRequest(new { message = "Заголовок обязателен" });
        
        var visibility = request.IsPrivate ? "private" : "public";
        TasteoryMetrics.RecipesCreatedTotal.WithLabels(visibility).Inc();
        var response = GetFullMockRecipe(Guid.NewGuid());
        return StatusCode(201, response);    
    }

    [HttpPut("{id:guid}")]
    public IActionResult Update(Guid id, [FromBody] CreateRecipeRequest request)
    {
        return Ok(GetFullMockRecipe(id));
    }

    [HttpDelete("{id:guid}")]
    public IActionResult Delete(Guid id)
    {
        return NoContent(); 
    }
    
    private RecipeSummaryResponse GetMockSummary(Guid id)
    {
        return new RecipeSummaryResponse(
            Id: id,
            Title: "Мамин кляр",
            MainImage: "/assets/icons/pie_white.png",
            MainText: "Это краткое описание, которое быстро грузится...",
            Author: "Воландеморт",
            Rating: 4.8,
            IsPrivate: false,
            Tags: new List<string> { "Обед", "Торт" }
            );
    }

    private RecipeResponse GetFullMockRecipe(Guid id)
    {
        return new RecipeResponse(
            Id: id,
            Tags: new List<string> { "Обед", "Торт" },
            Rating: 4.8,
            IsPrivate: false,
            Title: "Мамин кляр",
            MainImage: "/assets/icons/pie_white.png",
            MainText: "Это первый абзац текста, краткое описание семейного рецепта от Тёмного Лорда...",
            Author: "Воландеморт",
            Time: new TimeDto(15, "мин."),
            Ingredients: new List<IngredientDto>
            {
                new IngredientDto("Мука", 1, "ст.(250мл.)"),
                new IngredientDto("Яйцо", 2, "шт.")
            },
            Steps: new List<StepDto>
            {
                new StepDto(
                    Id: Guid.NewGuid(), 
                    Order: 1, 
                    Field: new MediaFieldDto("https://example.com/video.mp4", "video"), 
                    Text: "Смешать 2 яйца и стакан муки. вылить звлить кипятком притушить и пожарить 5 минут на среднем огне, подойти к окну потушить волосы о раин. Закрыть окно (по желанию) потом постучать по батарее, потопать ногами, достать спички из шкафа и поджечь туалетку (Над раковиной!) Золу добавить в мамин любимый горшок (удобрение)",
                    MyPrivateNote: "У ля ля. Какие пончики",
                    GroupNote: "Утопись и в воду"
                ),
                new StepDto(
                    Id: Guid.NewGuid(), 
                    Order: 2, 
                    Field: new MediaFieldDto("/assets/images/step2.jpg", "photo"), 
                    Text: "Взбить до однородной массы остатки рассудка", 
                    MyPrivateNote: null,
                    GroupNote: "Лучше выбросить этот рецепт к чёрту"
                )
            }
        );
    }
}