# Backend

The backend is an ASP.NET Core minimal API that stores templates in MongoDB and renders MJML-backed email previews. It is responsible for validating editor documents, generating canonical MJML from structured builder data, and maintaining template revision history.

## Projects

- `MjmlEditor.Api` - HTTP host, endpoint registration, OpenAPI in development, middleware bootstrapping
- `MjmlEditor.Application` - services, validation, DTO mapping, rendering orchestration, and MJML generation
- `MjmlEditor.Domain` - template, editor-document, revision, tenancy, and user domain models
- `MjmlEditor.Database` - MongoDB repositories and document mapping
- `MjmlEditor.Infrastructure` - auth, tenancy, exception handling, MJML renderer integration, and dependency wiring
- `MjmlEditor.Seed` - local seed utility for tenants/users/templates

## Request flow

For template editing and previewing, the usual flow is:

1. API endpoints in `MjmlEditor.Api\Endpoints\EmailTemplateEndpoints.cs`
2. Application services such as `MjmlEditor.Application\Templates\EmailTemplateService.cs`
3. Request validation in `MjmlEditor.Application\Templates\EmailTemplateValidation.cs`
4. DTO/domain mapping in `MjmlEditor.Application\Templates\EmailTemplateMappings.cs`
5. Persistence in `MjmlEditor.Database\Templates\MongoEmailTemplateRepository.cs`
6. MJML generation in `MjmlEditor.Application\Templates\EmailTemplateMjmlGenerator.cs`

When `editorDocument` is present, the service regenerates canonical MJML from the document instead of trusting the incoming MJML body.

## Important backend concepts

### Tenancy

Template endpoints require authentication and tenant context. The API group for templates is protected with authorization and `TenantContextEndpointFilter`, and the frontend sends the active tenant in the `X-Tenant` header.

### Builder-backed templates

The visual editor uses a structured `EditorDocument` made of:

- sections
- columns
- blocks
- block items for repeatable link/social collections

That model exists in:

- domain types in `MjmlEditor.Domain\Templates\`
- DTOs in `MjmlEditor.Application\Contracts\Templates\`
- MongoDB documents in `MjmlEditor.Database\Templates\`

### MJML generation

`EmailTemplateMjmlGenerator` turns the domain `EmailTemplateEditorDocument` into a full MJML document. This keeps preview rendering and persisted MJML output aligned with the visual builder model.

## Local development

Build:

```powershell
Set-Location 'E:\MjmlEditor'
dotnet build .\MjmlEditor.slnx
```

Run tests:

```powershell
dotnet test .\MjmlEditor.slnx
```

Run the API:

```powershell
dotnet run --project .\backend\MjmlEditor.Api
```

Seed data:

```powershell
dotnet run --project .\backend\MjmlEditor.Seed
```

If the running Docker API falls out of sync after backend/editor schema changes, rebuild the dev stack:

```powershell
docker compose -f .\docker-compose.dev.yml up -d --build
```

## Backend extension docs

- Add a new block end-to-end: [`docs\adding-new-blocks.md`](docs/adding-new-blocks.md)

## Documentation conventions

- Add XML documentation comments to backend methods when their behavior, constraints, or integration role is not obvious from the signature alone.
- Add inline comments only for tricky logic, cross-layer assumptions, legacy compatibility behavior, or email/MJML quirks.
- Keep the extension guides current when block types, validation rules, or rendering seams change.
