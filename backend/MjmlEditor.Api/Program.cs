using System.Text.Json.Serialization;
using MjmlEditor.Api.Endpoints;
using MjmlEditor.Application;
using MjmlEditor.Infrastructure;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddApplication();
builder.AddInfrastructure();
builder.Services.AddHttpClient();
builder.Services.AddOpenApi();
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

var app = builder.Build();

app.UseInfrastructure();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.MapGet("/health", () => TypedResults.Ok(new { status = "ok" }))
    .WithName("GetHealth");

app.MapAuthEndpoints();
app.MapTenantEndpoints();
app.MapEmailTemplateEndpoints();
app.MapBrandLibraryEndpoints();
app.MapSavedSectionsEndpoints();
app.MapMediaEndpoints();

app.Run();
