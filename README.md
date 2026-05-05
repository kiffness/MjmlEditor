# MJML Editor

MJML Editor is a full-stack email template builder built around a **section-and-column editor** rather than a freeform canvas. The product is aimed at repeatable, branded marketing emails where safe MJML generation, predictable rendering, and structured editing matter more than unlimited layout freedom.

## Project overview

The repository is split into two main applications:

- `backend\` - ASP.NET Core minimal API, application/domain logic, MongoDB persistence, MJML generation, tenancy/authentication, and seed tooling
- `frontend\mjml-editor-ui\` - React + TypeScript builder UI, template library, preview flow, and editor state management

The editor supports two authoring modes:

- **Visual builder mode** backed by `editorDocument`
- **Raw MJML mode** backed by `mjmlBody`

When an `editorDocument` is present, the backend treats it as the canonical source and generates MJML from it.

## Architecture at a glance

### Backend

- `MjmlEditor.Api` exposes HTTP endpoints and wires middleware
- `MjmlEditor.Application` owns validation, DTO mapping, services, and MJML generation
- `MjmlEditor.Domain` owns the core template/editor model and invariants
- `MjmlEditor.Database` stores templates and revisions in MongoDB
- `MjmlEditor.Infrastructure` provides auth, tenancy, rendering, diagnostics, R2/S3 media upload, and app wiring
- `MjmlEditor.Seed` seeds local tenants/templates for development

### Frontend

- `src\App.tsx` holds the main application flow, routes, data loading, and editor state
- `src\lib\api.ts` defines the frontend API contract and request helpers
- `src\features\builder\builderModel.ts` holds builder types, palette metadata, defaults, and pure helper logic
- `src\features\builder\BuilderSidebar.tsx` contains block/style/layer editing UI, image upload, and crop controls
- `src\features\builder\BuilderCanvas.tsx` renders the visual canvas, drag/drop interactions, and inline block editing
- `src\features\builder\ImageCropModal.tsx` provides the in-browser crop UI (react-easy-crop) with R2 upload on confirm
- `src\features\brandlibrary\BrandLibraryPage.tsx` provides the standalone brand library editor with live email preview

## Local development

### Run the stack with Docker

```powershell
docker compose -f .\docker-compose.dev.yml up -d --build
```

Services:

- frontend: `http://localhost:5173`
- API: `http://localhost:5261`
- Seq: `http://localhost:8081`
- MongoDB: `mongodb://localhost:27017`

Rebuild the full stack after backend/editor schema changes so the running API stays in sync with the code.

### Run the frontend directly

```powershell
Set-Location 'E:\MjmlEditor\frontend\mjml-editor-ui'
npm install
npm run dev
```

### Run the backend directly

```powershell
Set-Location 'E:\MjmlEditor'
dotnet build .\MjmlEditor.slnx
dotnet run --project .\backend\MjmlEditor.Api
```

### Seed development data

```powershell
dotnet run --project .\backend\MjmlEditor.Seed
```

## Common development commands

### Frontend

```powershell
Set-Location 'E:\MjmlEditor\frontend\mjml-editor-ui'
npm run test
npm run lint
npm run build
```

### Backend

```powershell
Set-Location 'E:\MjmlEditor'
dotnet test .\MjmlEditor.slnx
dotnet build .\MjmlEditor.slnx
```

## Extension docs

- Backend overview: [`backend\README.md`](backend/README.md)
- Frontend overview: [`frontend\mjml-editor-ui\README.md`](frontend/mjml-editor-ui/README.md)
- Add a new backend block: [`backend\docs\adding-new-blocks.md`](backend/docs/adding-new-blocks.md)
- Add frontend styling options: [`frontend\mjml-editor-ui\docs\adding-style-options.md`](frontend/mjml-editor-ui/docs/adding-style-options.md)

## Documentation and code comment conventions

- Keep docs updated as features land; documentation is part of the feature, not follow-up work.
- Backend methods should use XML documentation comments where the API or behavior benefits from explanation.
- Inline comments should be added only for tricky logic, non-obvious constraints, or email-client-specific behavior.
- Prefer documenting extension seams and cross-layer wiring over repeating what code already says.
