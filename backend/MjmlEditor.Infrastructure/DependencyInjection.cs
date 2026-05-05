using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.IdentityModel.Tokens;
using MjmlEditor.Application.Auth;
using MjmlEditor.Application.Media;
using MjmlEditor.Application.Templates;
using MjmlEditor.Application.Tenancy;
using MjmlEditor.Database;
using MjmlEditor.Infrastructure.Auth;
using MjmlEditor.Infrastructure.Diagnostics;
using MjmlEditor.Infrastructure.Media;
using MjmlEditor.Infrastructure.Templates;
using MjmlEditor.Infrastructure.Tenancy;
using Serilog;

namespace MjmlEditor.Infrastructure;

public static class DependencyInjection
{
    private const string FrontendCorsPolicy = "Frontend";

    public static WebApplicationBuilder AddInfrastructure(this WebApplicationBuilder builder)
    {
        ArgumentNullException.ThrowIfNull(builder);

        var allowedOrigins = builder.Configuration
            .GetSection("Cors:AllowedOrigins")
            .GetChildren()
            .Select(section => section.Value)
            .OfType<string>()
            .Where(origin => !string.IsNullOrWhiteSpace(origin))
            .Select(origin => origin.TrimEnd('/'))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        builder.Host.UseSerilog((context, services, loggerConfiguration) =>
        {
            loggerConfiguration
                .ReadFrom.Configuration(context.Configuration)
                .ReadFrom.Services(services)
                .Enrich.FromLogContext();
        });

        builder.Services
            .AddOptions<JwtOptions>()
            .Bind(builder.Configuration.GetSection(JwtOptions.SectionName))
            .ValidateDataAnnotations()
            .Validate(
                options => !string.IsNullOrWhiteSpace(options.SigningKey) && options.SigningKey.Length >= 32,
                $"{JwtOptions.SectionName}:SigningKey must be at least 32 characters.")
            .ValidateOnStart();

        var jwtOptions = builder.Configuration
            .GetRequiredSection(JwtOptions.SectionName)
            .Get<JwtOptions>()
            ?? throw new InvalidOperationException("Jwt configuration is required.");
        var signingKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtOptions.SigningKey));

        builder.Services.AddHttpContextAccessor();
        builder.Services.AddDatabase(builder.Configuration);
        builder.Services.AddSingleton<IJwtTokenFactory, JwtTokenFactory>();
        builder.Services.AddSingleton<IUserPasswordHasher, PasswordHasherAdapter>();
        builder.Services.AddScoped<ICurrentUserAccessor, ClaimsCurrentUserAccessor>();
        builder.Services.AddScoped<ITenantContextAccessor, HeaderTenantContextAccessor>();
        builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
            .AddJwtBearer(options =>
            {
                options.TokenValidationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidateIssuerSigningKey = true,
                    ValidateLifetime = true,
                    ValidIssuer = jwtOptions.Issuer,
                    ValidAudience = jwtOptions.Audience,
                    IssuerSigningKey = signingKey,
                    ClockSkew = TimeSpan.FromMinutes(1)
                };
            });
        builder.Services.AddAuthorization();
        builder.Services.AddSingleton<IMjmlRenderer, MjmlNetRenderer>();
        builder.Services
            .AddOptions<R2Options>()
            .Bind(builder.Configuration.GetSection(R2Options.SectionName))
            .ValidateDataAnnotations()
            .ValidateOnStart();
        builder.Services.AddScoped<IMediaUploadService, R2MediaUploadService>();
        builder.Services.AddCors(options =>
        {
            options.AddPolicy(FrontendCorsPolicy, policy =>
            {
                if (allowedOrigins.Length == 0)
                {
                    return;
                }

                policy.WithOrigins(allowedOrigins)
                    .AllowAnyHeader()
                    .AllowAnyMethod();
            });
        });
        builder.Services.AddProblemDetails(options =>
        {
            options.CustomizeProblemDetails = context =>
            {
                context.ProblemDetails.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
            };
        });
        builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

        return builder;
    }

    public static WebApplication UseInfrastructure(this WebApplication app)
    {
        ArgumentNullException.ThrowIfNull(app);

        app.UseSerilogRequestLogging();
        app.UseExceptionHandler();
        app.UseCors(FrontendCorsPolicy);
        app.UseAuthentication();
        app.UseAuthorization();

        return app;
    }
}
