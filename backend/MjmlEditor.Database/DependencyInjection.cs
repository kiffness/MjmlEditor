using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using MjmlEditor.Application.Auth;
using MjmlEditor.Application.Templates;
using MjmlEditor.Application.Tenancy;
using MjmlEditor.Database.Configuration;
using MjmlEditor.Database.Templates;
using MjmlEditor.Database.Tenants;
using MjmlEditor.Database.Users;
using MongoDB.Driver;

namespace MjmlEditor.Database;

public static class DependencyInjection
{
    public static IServiceCollection AddDatabase(this IServiceCollection services, IConfiguration configuration)
    {
        ArgumentNullException.ThrowIfNull(services);
        ArgumentNullException.ThrowIfNull(configuration);

        services
            .AddOptions<MongoDbOptions>()
            .Bind(configuration.GetSection(MongoDbOptions.SectionName))
            .ValidateDataAnnotations()
            .Validate(
                options => !string.IsNullOrWhiteSpace(options.ConnectionString),
                $"{MongoDbOptions.SectionName}:ConnectionString is required.")
            .Validate(
                options => !string.IsNullOrWhiteSpace(options.DatabaseName),
                $"{MongoDbOptions.SectionName}:DatabaseName is required.")
            .Validate(
                options => !string.IsNullOrWhiteSpace(options.TenantsCollectionName),
                $"{MongoDbOptions.SectionName}:TenantsCollectionName is required.")
            .Validate(
                options => !string.IsNullOrWhiteSpace(options.TemplatesCollectionName),
                $"{MongoDbOptions.SectionName}:TemplatesCollectionName is required.")
            .Validate(
                options => !string.IsNullOrWhiteSpace(options.UsersCollectionName),
                $"{MongoDbOptions.SectionName}:UsersCollectionName is required.")
            .ValidateOnStart();

        services.AddSingleton(sp => sp.GetRequiredService<IOptions<MongoDbOptions>>().Value);
        services.AddSingleton<IMongoClient>(sp => new MongoClient(sp.GetRequiredService<MongoDbOptions>().ConnectionString));
        services.AddSingleton<IMongoDatabase>(sp =>
            sp.GetRequiredService<IMongoClient>().GetDatabase(sp.GetRequiredService<MongoDbOptions>().DatabaseName));
        services.AddScoped<IUserAccountRepository, MongoUserAccountRepository>();
        services.AddScoped<IEmailTemplateRepository, MongoEmailTemplateRepository>();
        services.AddScoped<ITenantRepository, MongoTenantRepository>();

        return services;
    }
}
