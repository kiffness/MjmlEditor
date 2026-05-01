# Adding new blocks

This guide shows how to add a new editor block end-to-end so the frontend, API contract, validation, persistence, and MJML generation all stay in sync.

The most important rule is: **treat a block as a vertical slice**. A block is not complete until every layer understands it.

## Cross-layer checklist

For a new block type, update all of these areas:

1. Frontend API types
2. Frontend builder metadata and default block creation
3. Frontend canvas rendering
4. Frontend sidebar editing controls
5. Backend enum/domain model
6. Backend request validation
7. Backend DTO mapping
8. Backend MongoDB mapping
9. Backend MJML generation

## Backend files to update

### 1. Add the block enum value

Add the new value to:

- `MjmlEditor.Domain\Templates\EmailTemplateEditorBlockType.cs`

This is the canonical list used by the backend domain.

### 2. Make sure the domain block can carry the required fields

Review:

- `MjmlEditor.Domain\Templates\EmailTemplateEditorBlock.cs`

Most new blocks fit inside the existing shared fields:

- `TextContent`
- `SecondaryText`
- `ImageUrl`
- `AltText`
- `ActionLabel`
- `ActionUrl`
- style fields such as colors, typography, borders, spacing, layout, and width
- `Items` for repeatable links/social-style content

If a new block needs a truly new field, that field must be added across domain, DTOs, persistence, and frontend types.

### 3. Add type-specific validation

Update:

- `MjmlEditor.Application\Templates\EmailTemplateValidation.cs`

This is where request DTOs are checked before the domain model is built. Add:

- required field rules for the new block
- enum checks for any new enums
- numeric range checks for any new numeric settings

Example pattern from existing blocks:

```csharp
case EmailTemplateEditorBlockType.PropertyCard:
case EmailTemplateEditorBlockType.IconText:
    if (string.IsNullOrWhiteSpace(block.TextContent))
    {
        errors.Add(new ValidationError($"{fieldPrefix}.TextContent", "TextContent is required for this block type."));
    }

    if (string.IsNullOrWhiteSpace(block.ImageUrl))
    {
        errors.Add(new ValidationError($"{fieldPrefix}.ImageUrl", "ImageUrl is required for this block type."));
    }

    break;
```

### 4. Keep DTO mapping in sync

Update:

- `MjmlEditor.Application\Contracts\Templates\EmailTemplateEditorBlockDto.cs`
- `MjmlEditor.Application\Templates\EmailTemplateMappings.cs`

The mapping layer must support both directions:

- domain -> DTO
- DTO -> domain

If you add a new field but forget one direction, saves, loads, or preview requests will drift.

### 5. Keep MongoDB mapping in sync

Update:

- `MjmlEditor.Database\Templates\EmailTemplateEditorBlockDocument.cs`
- `MjmlEditor.Database\Templates\MongoEmailTemplateRepository.cs`

If the block stores new fields, wire them in both:

- domain -> document
- document -> domain

For enum fields stored in Mongo documents, follow the existing enum representation approach already used in the project.

### 6. Render the block in MJML

Update:

- `MjmlEditor.Application\Templates\EmailTemplateMjmlGenerator.cs`

There are two parts:

1. Add the new block type to the `RenderBlock` switch.
2. Add a focused renderer method for that block.

Example pattern:

```csharp
private static string RenderBlock(EmailTemplateEditorBlock block)
{
    return block.Type switch
    {
        EmailTemplateEditorBlockType.FeatureCard => RenderFeatureCardBlock(block),
        _ => throw new ArgumentOutOfRangeException(nameof(block), block.Type, "Unsupported editor block type.")
    };
}
```

Keep block renderers small and focused. Reuse shared helpers like:

- text-style helpers
- box/border helpers
- alignment helpers
- optional CTA builders

That keeps new blocks consistent with existing styling behavior.

## Frontend files to update for the same block

Even though this is the backend docs page, a new block is not complete without the frontend pieces:

- `frontend\mjml-editor-ui\src\lib\api.ts`
- `frontend\mjml-editor-ui\src\features\builder\builderModel.ts`
- `frontend\mjml-editor-ui\src\features\builder\BuilderSidebar.tsx`
- `frontend\mjml-editor-ui\src\features\builder\BuilderCanvas.tsx`

See the frontend docs for more detail on styling-related wiring.

## Example: adding a simple text-led block

For a block like `Callout` that only needs text plus optional colors:

1. Add `Callout` to `EmailTemplateEditorBlockType` and the frontend `EditorBlockType`.
2. Add the default block in `builderModel.ts`.
3. Add palette/icon/sidebar support in `BuilderSidebar.tsx`.
4. Add preview rendering in `BuilderCanvas.tsx`.
5. Add validation requiring `TextContent`.
6. Add DTO and Mongo mappings if new fields are involved.
7. Add `RenderCalloutBlock` and wire it into `RenderBlock`.

## Example: when a block needs a new field

If a block needs a new field like `EyebrowText`, update every place that carries block data:

- frontend `EditorBlock` type in `src\lib\api.ts`
- frontend default block creation and editing UI
- backend DTO in `EmailTemplateEditorBlockDto.cs`
- backend domain block in `EmailTemplateEditorBlock.cs`
- backend mappings in `EmailTemplateMappings.cs`
- MongoDB document and repository mappings
- MJML generator rendering logic
- validation rules

If any one of those layers is missed, the block will appear to work in one part of the system and silently disappear or fail in another.

## Validation and verification

After block changes:

```powershell
Set-Location 'E:\MjmlEditor\frontend\mjml-editor-ui'
npm run build
npm run lint
```

```powershell
Set-Location 'E:\MjmlEditor'
dotnet build .\MjmlEditor.slnx
docker compose -f .\docker-compose.dev.yml up -d --build
```

The Docker rebuild matters whenever the running API needs the new enum values or schema shape.
