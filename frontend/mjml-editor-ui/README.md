# Frontend

The frontend is a React + TypeScript application that provides the template library, authentication flow, template editor, visual builder, and preview experience.

## Stack

- React
- TypeScript
- Vite
- Tailwind CSS

## Frontend structure

### Core files

- `src\App.tsx` - main application shell, route handling, template loading/saving, editor state, preview flow, and builder actions
- `src\lib\api.ts` - frontend contract types and HTTP request helpers
- `src\main.tsx` - app entry point

### Builder files

- `src\features\builder\builderModel.ts` - shared builder model, palette metadata, defaults, presets, and pure helpers
- `src\features\builder\BuilderSidebar.tsx` - sidebar tabs for blocks, sections, presets, styles, and layers; image upload and crop controls
- `src\features\builder\BuilderCanvas.tsx` - canvas rendering, block previews, drag/drop targets, undo/redo controls, and inline editing
- `src\features\builder\ImageCropModal.tsx` - in-browser crop modal built on react-easy-crop; uploads the cropped result to R2 on confirm
- `src\features\builder\LinkedSectionEditor.tsx` - sub-canvas for editing saved sections with apply-to-all vs apply-here semantics

### Other feature files

- `src\features\brandlibrary\BrandLibraryPage.tsx` - brand library editor (colors, typography, button styles) with a live email preview panel

## UI model

The visual builder works with a structured `EditorDocument`:

- document
  - sections
    - columns
      - blocks
        - optional repeatable `items`

That model is shared with the backend through `src\lib\api.ts`.

## Builder behavior

The builder currently supports:

- section/column layouts
- block insertion and drag/drop
- duplicate/delete for sections and blocks
- undo/redo
- keyboard shortcuts
- inline editing for key text content
- presets and block palette browsing
- layers navigation
- rich text editing (Tiptap) for text-oriented blocks
- saved sections library with linked editing (apply to all vs apply here)
- brand library with live preview
- image upload to Cloudflare R2 with in-browser crop (react-easy-crop)

## Local development

Install dependencies:

```powershell
Set-Location 'E:\MjmlEditor\frontend\mjml-editor-ui'
npm install
```

Run the dev server:

```powershell
npm run dev
```

Lint:

```powershell
npm run lint
```

Test:

```powershell
npm run test
```

Build:

```powershell
npm run build
```

The frontend expects the API base URL in `VITE_API_BASE_URL`. In Docker development it points at `http://localhost:5261`.

## Extension docs

- Add styling options to blocks: [`docs\adding-style-options.md`](docs/adding-style-options.md)

## Documentation conventions

- Update frontend docs when builder data shapes, extension seams, or workflows change.
- Prefer documenting the extension path for blocks, sections, presets, and styles rather than restating obvious React code.
- Add inline comments only where UI state coordination, drag/drop behavior, or rendering logic would otherwise be hard to follow.
