using Bogus;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Hosting;
using MjmlEditor.Database.Configuration;
using MjmlEditor.Database.Params;
using MjmlEditor.Database.Templates;
using MjmlEditor.Database.Tenants;
using MjmlEditor.Database.Users;
using MjmlEditor.Domain.Templates;
using MjmlEditor.Seed.Configuration;
using MongoDB.Driver;

if (args.Any(static arg =>
        string.Equals(arg, "--help", StringComparison.OrdinalIgnoreCase)
        || string.Equals(arg, "-h", StringComparison.OrdinalIgnoreCase)
        || string.Equals(arg, "/?", StringComparison.OrdinalIgnoreCase)))
{
    PrintUsage();
    return;
}

var builder = Host.CreateApplicationBuilder(args);
builder.Configuration.Sources.Clear();
builder.Configuration
    .SetBasePath(AppContext.BaseDirectory)
    .AddJsonFile("appsettings.json", optional: false, reloadOnChange: false)
    .AddEnvironmentVariables()
    .AddCommandLine(args);

var mongoOptions = builder.Configuration
    .GetRequiredSection(MongoDbOptions.SectionName)
    .Get<MongoDbOptions>()
    ?? throw new InvalidOperationException("MongoDb configuration is required.");

var seedOptions = builder.Configuration
    .GetRequiredSection(SeedOptions.SectionName)
    .Get<SeedOptions>()
    ?? throw new InvalidOperationException("Seed configuration is required.");

ValidateMongoOptions(mongoOptions);
ValidateSeedOptions(seedOptions);

Randomizer.Seed = new Random(20260422);

PrintConfigurationSummary(mongoOptions, seedOptions);

var client = new MongoClient(mongoOptions.ConnectionString);
var database = client.GetDatabase(mongoOptions.DatabaseName);
var tenantsCollection = database.GetCollection<TenantDocument>(mongoOptions.TenantsCollectionName);
var templatesCollection = database.GetCollection<EmailTemplateDocument>(mongoOptions.TemplatesCollectionName);
var usersCollection = database.GetCollection<UserAccountDocument>(mongoOptions.UsersCollectionName);
var tenantParamsCollection = database.GetCollection<TenantParamsDocument>(mongoOptions.TenantParamsCollectionName);
var faker = new Faker();
var tenants = CreateTenants(seedOptions.TenantIds, faker);
var passwordHasher = new PasswordHasher<object>();
var users = CreateUsers(seedOptions.TenantIds, passwordHasher);

if (seedOptions.ReplaceExistingTenantData)
{
    var deleteTenantResult = await tenantsCollection.DeleteManyAsync(
        tenant => seedOptions.TenantIds.Contains(tenant.Id));
    var deleteResult = await templatesCollection.DeleteManyAsync(
        template => seedOptions.TenantIds.Contains(template.TenantId));
    await tenantParamsCollection.DeleteManyAsync(
        p => seedOptions.TenantIds.Contains(p.TenantId));

    Console.WriteLine($"Removed {deleteTenantResult.DeletedCount} existing seeded tenants.");
    Console.WriteLine($"Removed {deleteResult.DeletedCount} existing seeded templates.");
}

var templates = seedOptions.TenantIds
    .SelectMany(tenantId => CreateTemplatesForTenant(tenantId, seedOptions.TemplatesPerTenant, faker))
    .ToArray();

if (templates.Length == 0)
{
    Console.WriteLine("No templates were generated. Check the seed configuration.");
    return;
}

var tenantWrites = tenants
    .Select(tenant => new ReplaceOneModel<TenantDocument>(
        Builders<TenantDocument>.Filter.Eq(document => document.Id, tenant.Id),
        tenant)
    {
        IsUpsert = true
    })
    .ToArray();
var userWrites = users
    .Select(user => new ReplaceOneModel<UserAccountDocument>(
        Builders<UserAccountDocument>.Filter.Eq(document => document.Id, user.Id),
        user)
    {
        IsUpsert = true
    })
    .ToArray();

await tenantsCollection.BulkWriteAsync(tenantWrites);
await usersCollection.BulkWriteAsync(userWrites);
await templatesCollection.InsertManyAsync(templates);

var now = DateTime.UtcNow;
var tenantParamDocs = seedOptions.TenantIds
    .Select(tenantId => CreateParamsForTenant(tenantId, now))
    .ToArray();

var paramWrites = tenantParamDocs
    .Select(doc => new ReplaceOneModel<TenantParamsDocument>(
        Builders<TenantParamsDocument>.Filter.Eq(p => p.TenantId, doc.TenantId),
        doc)
    {
        IsUpsert = true
    })
    .ToArray();

await tenantParamsCollection.BulkWriteAsync(paramWrites);

Console.WriteLine(
    $"Seeded {templates.Length} templates across {seedOptions.TenantIds.Length} tenants into '{mongoOptions.DatabaseName}'.");

foreach (var tenantCount in templates
             .GroupBy(template => template.TenantId)
             .OrderBy(group => group.Key))
{
    Console.WriteLine($"- {tenantCount.Key}: {tenantCount.Count()} templates");
}

Console.WriteLine($"Seeded {tenantParamDocs.Length} tenant param sets ({tenantParamDocs[0].Params.Length} params each).");

Console.WriteLine("Seeded demo users:");

foreach (var user in users)
{
    Console.WriteLine($"- {user.Email} / Password123! ({string.Join(", ", user.Memberships.Select(m => m.TenantId))})");
}

Console.WriteLine("Open http://localhost:5173, sign in with a demo user, then use Refresh data in the UI after reseeding.");

static IReadOnlyList<TenantDocument> CreateTenants(IReadOnlyList<string> tenantIds, Faker faker)
{
    var tenants = new List<TenantDocument>(tenantIds.Count);

    foreach (var tenantId in tenantIds)
    {
        var createdAt = faker.Date.RecentOffset(120, DateTimeOffset.UtcNow.AddDays(-30)).ToUniversalTime();
        var updatedAt = faker.Date.BetweenOffset(createdAt, DateTimeOffset.UtcNow).ToUniversalTime();

        tenants.Add(new TenantDocument
        {
            Id = tenantId,
            Name = faker.Company.CompanyName(),
            CreatedAtUtc = createdAt.UtcDateTime,
            UpdatedAtUtc = updatedAt.UtcDateTime
        });
    }

    return tenants;
}

static IReadOnlyList<EmailTemplateDocument> CreateTemplatesForTenant(string tenantId, int templatesPerTenant, Faker faker)
{
    List<EmailTemplateDocument> templates = [];

    for (var index = 0; index < templatesPerTenant; index++)
    {
        var status = faker.PickRandom(
            EmailTemplateStatus.Draft,
            EmailTemplateStatus.Published,
            EmailTemplateStatus.Archived);

        var createdAt = faker.Date.RecentOffset(60, DateTimeOffset.UtcNow.AddDays(-14)).ToUniversalTime();
        var updatedAt = faker.Date.BetweenOffset(createdAt, DateTimeOffset.UtcNow).ToUniversalTime();
        var campaignName = faker.Commerce.ProductAdjective() + " " + faker.Commerce.ProductMaterial() + " Campaign";
        var heading = faker.Company.CatchPhrase();
        var summary = faker.Lorem.Sentence(8);
        var ctaText = faker.PickRandom("Shop now", "Learn more", "Get offer", "Explore deal");
        var templateId = Guid.NewGuid().ToString("N");
        var mjmlBody = $$"""
            <mjml>
              <mj-body background-color="#f5f7fb">
                <mj-section background-color="#ffffff" padding="24px">
                  <mj-column>
                    <mj-text font-size="24px" font-weight="700" color="#1f2937">{{heading}}</mj-text>
                    <mj-text font-size="16px" color="#4b5563">{{summary}}</mj-text>
                    <mj-button background-color="#2563eb" color="#ffffff">{{ctaText}}</mj-button>
                  </mj-column>
                </mj-section>
              </mj-body>
            </mjml>
            """;
        var revisionId = Guid.NewGuid().ToString("N");
        var name = $"{campaignName} #{index + 1}";
        var subject = faker.Commerce.ProductAdjective() + " offers for " + faker.Company.CompanyName();
        var editorDocument = CreateEditorDocument(heading, summary, ctaText);

        templates.Add(new EmailTemplateDocument
        {
            Id = templateId,
            TenantId = tenantId,
            Name = name,
            Subject = subject,
            MjmlBody = mjmlBody,
            Status = status.ToString(),
            EditorDocument = editorDocument,
            PublishedRevisionId = status == EmailTemplateStatus.Published ? revisionId : null,
            Revisions =
            [
                new EmailTemplateRevisionDocument
                {
                    Id = revisionId,
                    RevisionNumber = 1,
                    Name = name,
                    Subject = subject,
                    MjmlBody = mjmlBody,
                    Status = status.ToString(),
                    EventType = status == EmailTemplateStatus.Published ? "Published" : "Created",
                    ActorUserId = "seeded-user-admin",
                    EditorDocument = editorDocument,
                    CreatedAtUtc = createdAt.UtcDateTime
                }
            ],
            CreatedAtUtc = createdAt.UtcDateTime,
            UpdatedAtUtc = updatedAt.UtcDateTime
        });
    }

    return templates;
}

static MjmlEditor.Database.Templates.EmailTemplateEditorDocument CreateEditorDocument(string heading, string summary, string ctaText)
{
    return new MjmlEditor.Database.Templates.EmailTemplateEditorDocument
    {
        Version = 1,
        Sections =
        [
            new EmailTemplateEditorSectionDocument
            {
                Id = Guid.NewGuid().ToString("N"),
                BackgroundColor = "#ffffff",
                Padding = 24,
                Columns =
                [
                    new EmailTemplateEditorColumnDocument
                    {
                        Id = Guid.NewGuid().ToString("N"),
                        WidthPercentage = 100,
                        Blocks =
                        [
                            new EmailTemplateEditorBlockDocument
                            {
                                Id = Guid.NewGuid().ToString("N"),
                                Type = EmailTemplateEditorBlockType.Hero.ToString(),
                                TextContent = heading,
                                BackgroundColor = "#ffffff",
                                TextColor = "#1f2937",
                                Alignment = EmailTemplateEditorAlignment.Left,
                                FontSize = 24
                            },
                            new EmailTemplateEditorBlockDocument
                            {
                                Id = Guid.NewGuid().ToString("N"),
                                Type = EmailTemplateEditorBlockType.Text.ToString(),
                                TextContent = summary,
                                TextColor = "#4b5563",
                                Alignment = EmailTemplateEditorAlignment.Left,
                                FontSize = 16
                            },
                            new EmailTemplateEditorBlockDocument
                            {
                                Id = Guid.NewGuid().ToString("N"),
                                Type = EmailTemplateEditorBlockType.Button.ToString(),
                                ActionLabel = ctaText,
                                ActionUrl = "https://example.com/offers",
                                BackgroundColor = "#2563eb",
                                TextColor = "#ffffff",
                                Alignment = EmailTemplateEditorAlignment.Left
                            }
                        ]
                    }
                ]
            }
        ]
    };
}

static IReadOnlyList<UserAccountDocument> CreateUsers(IReadOnlyList<string> tenantIds, PasswordHasher<object> passwordHasher)
{
    var now = DateTime.UtcNow;
    var adminMemberships = tenantIds
        .Select(tenantId => new TenantMembershipDocument
        {
            TenantId = tenantId,
            Role = "Owner"
        })
        .ToArray();
    var firstTenantId = tenantIds[0];

    return
    [
        new UserAccountDocument
        {
            Id = "seeded-user-admin",
            Email = "admin@demo.local",
            NormalizedEmail = "ADMIN@DEMO.LOCAL",
            DisplayName = "Demo Admin",
            PasswordHash = passwordHasher.HashPassword(new object(), "Password123!"),
            Memberships = adminMemberships,
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        },
        new UserAccountDocument
        {
            Id = "seeded-user-editor",
            Email = "editor@demo.local",
            NormalizedEmail = "EDITOR@DEMO.LOCAL",
            DisplayName = "Tenant Editor",
            PasswordHash = passwordHasher.HashPassword(new object(), "Password123!"),
            Memberships =
            [
                new TenantMembershipDocument
                {
                    TenantId = firstTenantId,
                    Role = "Editor"
                }
            ],
            CreatedAtUtc = now,
            UpdatedAtUtc = now
        }
    ];
}

static TenantParamsDocument CreateParamsForTenant(string tenantId, DateTime now)
{
    var propertyParams = new[]
    {
        new ParamDefinitionDocument { Key = "address",         Label = "Property Address",    Category = "Property", ExampleValue = "14 Ashford Lane, London, SW12 9BT" },
        new ParamDefinitionDocument { Key = "price",           Label = "Asking Price",         Category = "Property", ExampleValue = "£525,000" },
        new ParamDefinitionDocument { Key = "bedrooms",        Label = "Bedrooms",             Category = "Property", ExampleValue = "4" },
        new ParamDefinitionDocument { Key = "bathrooms",       Label = "Bathrooms",            Category = "Property", ExampleValue = "2" },
        new ParamDefinitionDocument { Key = "property_type",   Label = "Property Type",        Category = "Property", ExampleValue = "Semi-detached house" },
        new ParamDefinitionDocument { Key = "tenure",          Label = "Tenure",               Category = "Property", ExampleValue = "Freehold" },
        new ParamDefinitionDocument { Key = "epc_rating",      Label = "EPC Rating",           Category = "Property", ExampleValue = "C" },
        new ParamDefinitionDocument { Key = "floor_area",      Label = "Floor Area",           Category = "Property", ExampleValue = "112 sqm" },
        new ParamDefinitionDocument { Key = "council_tax_band",Label = "Council Tax Band",     Category = "Property", ExampleValue = "E" },
        new ParamDefinitionDocument { Key = "description",     Label = "Property Description", Category = "Property", ExampleValue = "A beautifully presented family home set within a quiet residential street, offering generous living space and a south-facing rear garden." },
    };

    var agentParams = new[]
    {
        new ParamDefinitionDocument { Key = "agent_name",      Label = "Agent Name",           Category = "Agent", ExampleValue = "Sarah Collins" },
        new ParamDefinitionDocument { Key = "agent_phone",     Label = "Agent Phone",          Category = "Agent", ExampleValue = "020 7123 4567" },
        new ParamDefinitionDocument { Key = "agent_email",     Label = "Agent Email",          Category = "Agent", ExampleValue = "sarah.collins@prestige.co.uk" },
        new ParamDefinitionDocument { Key = "branch_name",     Label = "Branch Name",          Category = "Agent", ExampleValue = "Prestige Properties – Clapham" },
    };

    var vendorParams = new[]
    {
        new ParamDefinitionDocument { Key = "vendor_name",     Label = "Vendor Name",          Category = "Vendor", ExampleValue = "Mr & Mrs Thompson" },
    };

    var dateParams = new[]
    {
        new ParamDefinitionDocument { Key = "viewing_date",    Label = "Viewing Date",         Category = "Dates", ExampleValue = "Saturday 17th May" },
        new ParamDefinitionDocument { Key = "viewing_time",    Label = "Viewing Time",         Category = "Dates", ExampleValue = "10:00am – 12:00pm" },
        new ParamDefinitionDocument { Key = "offer_expiry",    Label = "Offer Expiry",         Category = "Dates", ExampleValue = "31 May 2026" },
    };

    return new TenantParamsDocument
    {
        Id = tenantId,
        TenantId = tenantId,
        Params = [.. propertyParams, .. agentParams, .. vendorParams, .. dateParams],
        CreatedAtUtc = now,
        UpdatedAtUtc = now
    };
}

static void ValidateMongoOptions(MongoDbOptions options)
{
    if (string.IsNullOrWhiteSpace(options.ConnectionString))
    {
        throw new InvalidOperationException("MongoDb:ConnectionString is required.");
    }

    if (string.IsNullOrWhiteSpace(options.DatabaseName))
    {
        throw new InvalidOperationException("MongoDb:DatabaseName is required.");
    }

    if (string.IsNullOrWhiteSpace(options.TenantsCollectionName))
    {
        throw new InvalidOperationException("MongoDb:TenantsCollectionName is required.");
    }

    if (string.IsNullOrWhiteSpace(options.TemplatesCollectionName))
    {
        throw new InvalidOperationException("MongoDb:TemplatesCollectionName is required.");
    }

    if (string.IsNullOrWhiteSpace(options.UsersCollectionName))
    {
        throw new InvalidOperationException("MongoDb:UsersCollectionName is required.");
    }
}

static void ValidateSeedOptions(SeedOptions options)
{
    if (options.TemplatesPerTenant <= 0)
    {
        throw new InvalidOperationException("Seed:TemplatesPerTenant must be greater than zero.");
    }

    if (options.TenantIds.Length == 0 || options.TenantIds.Any(string.IsNullOrWhiteSpace))
    {
        throw new InvalidOperationException("Seed:TenantIds must contain at least one tenant id.");
    }
}

static void PrintConfigurationSummary(MongoDbOptions mongoOptions, SeedOptions seedOptions)
{
    Console.WriteLine("Seeding MJML Editor dev data with the resolved configuration:");
    Console.WriteLine($"- Database: {mongoOptions.DatabaseName}");
    Console.WriteLine($"- Tenants collection: {mongoOptions.TenantsCollectionName}");
    Console.WriteLine($"- Templates collection: {mongoOptions.TemplatesCollectionName}");
    Console.WriteLine($"- Users collection: {mongoOptions.UsersCollectionName}");
    Console.WriteLine($"- Tenant params collection: {mongoOptions.TenantParamsCollectionName}");
    Console.WriteLine($"- Templates per tenant: {seedOptions.TemplatesPerTenant}");
    Console.WriteLine($"- Replace existing tenant data: {seedOptions.ReplaceExistingTenantData}");
    Console.WriteLine($"- Tenant ids: {string.Join(", ", seedOptions.TenantIds)}");
    Console.WriteLine();
}

static void PrintUsage()
{
    Console.WriteLine("Seed the local MJML Editor MongoDB with tenant-aware fake data and demo users.");
    Console.WriteLine();
    Console.WriteLine("Usage:");
    Console.WriteLine(@"  dotnet run --project backend\MjmlEditor.Seed");
    Console.WriteLine(@"  dotnet run --project backend\MjmlEditor.Seed -- --Seed:TemplatesPerTenant=12");
    Console.WriteLine(@"  dotnet run --project backend\MjmlEditor.Seed -- --Seed:ReplaceExistingTenantData=false");
    Console.WriteLine(@"  dotnet run --project backend\MjmlEditor.Seed -- --MongoDb:DatabaseName=mjml-editor-dev");
    Console.WriteLine();
    Console.WriteLine("Configuration sources:");
    Console.WriteLine("- appsettings.json");
    Console.WriteLine("- environment variables");
    Console.WriteLine("- command-line overrides");
}
