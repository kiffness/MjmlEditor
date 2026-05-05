using Microsoft.Extensions.DependencyInjection;
using MjmlEditor.Application.Auth;
using MjmlEditor.Application.BrandLibrary;
using MjmlEditor.Application.SavedSections;
using MjmlEditor.Application.Templates;
using MjmlEditor.Application.Tenancy;

namespace MjmlEditor.Application;

public static class DependencyInjection
{
    public static IServiceCollection AddApplication(this IServiceCollection services)
    {
        ArgumentNullException.ThrowIfNull(services);

        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IEmailTemplateService, EmailTemplateService>();
        services.AddScoped<IEmailTemplateMjmlGenerator, EmailTemplateMjmlGenerator>();
        services.AddScoped<IMjmlTemplateService, MjmlTemplateService>();
        services.AddScoped<ITenantService, TenantService>();
        services.AddScoped<IBrandLibraryService, BrandLibraryService>();
        services.AddScoped<ISavedSectionService, SavedSectionService>();

        return services;
    }
}
