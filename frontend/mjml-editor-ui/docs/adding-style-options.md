# Adding styling options to blocks

This guide explains how to add a new style option to editor blocks without breaking the contract between the frontend builder, the backend validation layer, and MJML generation.

## First principle

A styling option is not just a new sidebar field. It has to exist consistently in:

1. the frontend block type
2. the builder controls
3. the canvas preview
4. the API contract
5. backend validation
6. backend persistence
7. backend MJML generation

If one layer is skipped, styling will either not persist, not preview, or not render in the final email.

## Frontend files to update

### 1. Extend the shared API type

Update:

- `src\lib\api.ts`

Add the new property to `EditorBlock`, or to `EditorSection` / `EditorColumn` if the style belongs there.

Examples already in use:

- `fontFamily`
- `fontWeight`
- `fontSize`
- `lineHeight`
- `letterSpacing`
- `textTransform`
- `textDecoration`
- `backgroundColor`
- `borderColor`
- `borderWidth`
- `borderRadius`
- `widthPercentage`

### 2. Add defaults in the builder model if needed

Update:

- `src\features\builder\builderModel.ts`

This is usually where you:

- add default values in `createDefaultBlock`
- add option lists for selects
- add helper functions used by the sidebar or canvas

If the style needs fixed choices, define them next to the other option arrays such as:

- `fontFamilyOptions`
- `fontWeightOptions`
- `textTransformOptions`
- `textDecorationOptions`

### 3. Expose the control in the sidebar

Update:

- `src\features\builder\BuilderSidebar.tsx`

This is where the editor actually lets the user modify the style. Follow the existing pattern:

- read from `selectedBlock`
- convert text inputs with helpers like `toOptionalNumber` and `toOptionalText`
- call the update callback with a partial block change

Example pattern:

```tsx
onChange={(event) => onUpdateBlock({
  lineHeight: toOptionalNumber(event.target.value),
})}
```

### 4. Reflect the style on the canvas

Update:

- `src\features\builder\BuilderCanvas.tsx`

Most block previews use shared builder helpers from `builderModel.ts`, especially:

- `getBlockTextStyle`
- `getBlockFrameStyle`
- alignment/layout helpers

If the style should change preview appearance, wire it into the preview renderer. If it should affect inline editing layout, update that too.

## Backend files that must also change

Even though this page is frontend-focused, style fields must stay aligned with the backend:

- `backend\MjmlEditor.Application\Contracts\Templates\EmailTemplateEditorBlockDto.cs`
- `backend\MjmlEditor.Domain\Templates\EmailTemplateEditorBlock.cs`
- `backend\MjmlEditor.Application\Templates\EmailTemplateValidation.cs`
- `backend\MjmlEditor.Application\Templates\EmailTemplateMappings.cs`
- `backend\MjmlEditor.Database\Templates\EmailTemplateEditorBlockDocument.cs`
- `backend\MjmlEditor.Database\Templates\MongoEmailTemplateRepository.cs`
- `backend\MjmlEditor.Application\Templates\EmailTemplateMjmlGenerator.cs`

## Example: adding a new block text style

Say you want to add a new text styling field.

### Frontend

1. Add the field to `EditorBlock` in `src\lib\api.ts`.
2. Add a default or option list in `builderModel.ts` if the feature needs one.
3. Add the editing control in `BuilderSidebar.tsx`.
4. Update `getBlockTextStyle` or the relevant block preview logic in `BuilderCanvas.tsx` / `builderModel.ts`.

### Backend

1. Add the field to `EmailTemplateEditorBlockDto.cs`.
2. Add the field to `EmailTemplateEditorBlock.Create` / `Restore` if needed.
3. Validate the field in `EmailTemplateValidation.cs`.
4. Map it in `EmailTemplateMappings.cs`.
5. Persist it in MongoDB documents and repository mappings.
6. Emit it in MJML generation if the style affects output.

## Color controls and future brand-library behavior

When adding new color-editable surfaces:

- expose a normal color input so any valid color can still be entered
- surface brand-library colors first when that feature lands
- keep the raw stored value on the block until token-based brand references are introduced

This keeps the UI flexible now while staying compatible with the planned brand-library workflow.

## Verification

After styling changes:

```powershell
Set-Location 'E:\MjmlEditor\frontend\mjml-editor-ui'
npm run lint
npm run build
```

```powershell
Set-Location 'E:\MjmlEditor'
dotnet build .\MjmlEditor.slnx
docker compose -f .\docker-compose.dev.yml up -d --build
```

The Docker rebuild is important when the API contract or editor schema shape has changed.
