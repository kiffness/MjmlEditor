# Copilot Instructions

## After any code change

Always rebuild the dev stack after completing edits:

```powershell
docker compose -f .\docker-compose.dev.yml up -d --build
```

This keeps the running API, frontend, and MongoDB in sync with your changes.

## Installing new npm packages

The frontend container uses a named Docker volume for `node_modules`, isolated from the host. When installing new npm packages you must install them in **both** places:

```powershell
# On the host (keeps package.json and host node_modules in sync)
Set-Location 'E:\MjmlEditor\frontend\mjml-editor-ui'
npm install <package>

# In the running container (updates the named volume the dev server uses)
docker exec mjml-editor-ui-dev npm install <package>
```

## Build, test, and lint commands

### Frontend (`frontend\mjml-editor-ui`)

```powershell
npm run dev          # dev server at http://localhost:5173
npm run build        # production build (also type-checks)
npm run lint         # ESLint
npm run test         # Vitest (watch mode)
```

Run a single test file:
```powershell
npx vitest run src/features/builder/builderModel.test.ts
```

### Backend (repo root)

```powershell
dotnet build .\MjmlEditor.slnx
dotnet test .\MjmlEditor.slnx
```

Run a single test class/method:
```powershell
dotnet test .\MjmlEditor.slnx --filter "FullyQualifiedName~EmailTemplateValidationTests"
```

### Docker dev stack

```powershell
docker compose -f .\docker-compose.dev.yml up -d --build
```

Rebuild the stack after any backend schema or enum changes. Services:
- Frontend: `http://localhost:5173`
- API: `http://localhost:5261`
- MongoDB: `mongodb://localhost:27017`
- Seq: `http://localhost:8081`

---

## Architecture

### Backend layers

```
MjmlEditor.Api           → minimal API endpoints, DI wiring
MjmlEditor.Application   → services, validation, DTOs, MJML generation, mappings
MjmlEditor.Domain        → core model: EmailTemplate, EditorDocument, block types
MjmlEditor.Database      → MongoDB persistence (document models + repository)
MjmlEditor.Infrastructure → auth, tenancy, rendering, middleware
MjmlEditor.Seed          → dev seed data
```

Requests flow: `Endpoint → IEmailTemplateService → validation → domain → repository`.

All services are internal and registered via `AddApplication()` / `AddInfrastructure()`. Endpoints in `MjmlEditor.Api\Endpoints` call the application interfaces directly.

### `editorDocument` is canonical

When a template has an `editorDocument`, the backend **regenerates MJML from it** in `EmailTemplateService` rather than trusting the stored `mjmlBody`. Raw MJML mode is only used when no `editorDocument` is present.

### Frontend state model

- `EditorDocument` (from `src/lib/api.ts`) is the shared contract between frontend and backend — every field name here mirrors the backend DTOs.
- `TemplateDraft` wraps the in-progress editor state. `draftState.ts` handles dirty-checking via JSON signatures.
- `builderModel.ts` is the pure-logic layer: block defaults, palette metadata, preset factories, CSS helpers (`getBlockTextStyle`, `getBlockFrameStyle`). It has no React dependencies.
- `App.tsx` owns all editor state (undo/redo history, selected block/section, active tab, drag state) and passes handlers down to `BuilderSidebar` and `BuilderCanvas`.

### Multi-tenancy

Every data operation is scoped to a `tenantId` obtained from `ITenantContextAccessor`. Services call `tenantContextAccessor.GetRequiredTenantId()` and `currentUserAccessor.GetRequiredUserId()` at the start of write operations.

---

## Key conventions

### Blocks are vertical slices

A block change is not complete until **all nine layers** are updated:

1. `EditorBlockType` union — `src/lib/api.ts`
2. Block defaults + palette metadata — `builderModel.ts`
3. Canvas preview rendering — `BuilderCanvas.tsx`
4. Sidebar editing controls — `BuilderSidebar.tsx`
5. Backend enum — `EmailTemplateEditorBlockType.cs`
6. Validation rules — `EmailTemplateValidation.cs`
7. DTO + mappings (both directions) — `EmailTemplateEditorBlockDto.cs`, `EmailTemplateMappings.cs`
8. MongoDB document + repository mappings — `EmailTemplateEditorBlockDocument.cs`, `MongoEmailTemplateRepository.cs`
9. MJML renderer — `EmailTemplateMjmlGenerator.cs` (`RenderBlock` switch + dedicated renderer method)

The same principle applies to new style fields. See `backend\docs\adding-new-blocks.md` and `frontend\mjml-editor-ui\docs\adding-style-options.md`.

### MJML generator patterns

- Each block type gets its own focused renderer method (e.g., `RenderTextBlock`, `RenderButtonBlock`).
- Shared helpers handle repeated concerns: `AppendTextStyleAttributes`, `AppendBoxAttributes`, `AppendPaddingAttribute`, `AppendWidthAttribute`.
- HTML attribute values are sanitized with `EncodeAttribute` (HTML-encodes); rich text content uses the `HtmlSanitizer` (Ganss.Xss) via `SanitizeBlock`.
- The block sanitizer allows `strong/em/u/a/br/p`; inline sanitizer (badge label, attribution) allows `strong/em/u/a` only.

### Frontend enum values use PascalCase strings

All enums crossing the API boundary are serialized as strings with `JsonStringEnumConverter`. Frontend types mirror this exactly: `'Left' | 'Center' | 'Right'`, `'Vertical' | 'Horizontal'`, etc. Never use numeric values.

### Sidebar ↔ canvas pattern

- The sidebar reads from `selectedBlock` / `selectedSection` passed down from `App.tsx`.
- Updates are sent up via `onUpdateBlock(partial)` / `onUpdateSection(partial)` callbacks.
- Numeric inputs use `toOptionalNumber(event.target.value)` and text inputs use `toOptionalText(value)` from `builderModel.ts` — never set `null` from raw string inputs directly.

### RTE fields

Hero, Text, Footer (primary text), Badge label, Quote text+attribution use Tiptap (`RichTextEditor.tsx`) in the sidebar. Their stored value is sanitized HTML. The canvas renders these fields with `dangerouslySetInnerHTML` after DOMPurify sanitization.

Non-text fields (URLs, alt text, numeric controls) still use `InlineCanvasInput` on the canvas.

### Backend XML comments

Public and internal service/mapping methods use XML documentation comments (`/// <summary>`). Inline comments are reserved for tricky logic, non-obvious constraints, or email-client-specific behavior — not for restating what the code already says.

### ID generation

- Backend: `Guid.NewGuid().ToString("N")` (no hyphens)
- Frontend: `createId(prefix)` — `${prefix}-${Math.random().toString(36).slice(2, 10)}`
