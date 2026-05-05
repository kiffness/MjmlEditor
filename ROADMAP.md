# MJML Editor roadmap

## Product direction

The editor is being built as a **section-and-column-based email builder** rather than a fully freeform canvas. The goal is to replace Brevo for the team's real workflow by making common marketing emails faster, safer, and more repeatable to build.

The current direction is:

- Keep **sections and column layouts** as the core structure.
- Use **simple reusable blocks** as the main building pieces.
- Treat more complex marketing compositions as **presets/accelerators**, not the foundation of the editor.
- Add flexibility through **configurable internals**, not unrestricted drag-anything-anywhere design.

This is especially aimed at structured use cases like estate-agent emails, where repeatability, brand consistency, and safe MJML output matter more than unlimited layout freedom.

## Status

### Version 1

Version 1 is complete and tagged as `v1`.

Delivered in V1:

- Core section/column/block builder
- Basic content blocks
- Marketing blocks:
  - Property card
  - Feature card
  - Icon + text
  - Promo banner
- Configurable composed block layout and CTA placement
- Better canvas ergonomics:
  - duplicate/delete
  - drag/drop improvements
  - selection improvements
- Advanced editor UX:
  - undo/redo
  - keyboard shortcuts
  - inline canvas editing for key text content
  - layers panel
- Backend support kept in sync across:
  - validation
  - DTOs/domain
  - persistence
  - MJML generation

### Post-v1 foundations completed

Completed after `v1`:

- project-level documentation
- backend and frontend READMEs
- backend and frontend extension guides
- initial backend XML documentation comments and targeted tricky-code comments
- unit testing foundation in both stacks
  - xUnit coverage in the backend
  - Vitest coverage in the frontend
- advanced style controls (typography, spacing, surfaces, media, brand library)
- explodable presets and preset internal layout controls
- RTE link text preserved in backend-rendered preview (stale-draft race condition fixed)

## Roadmap principles

### 1. Build in vertical slices

Every meaningful editor change should be implemented across all affected layers together:

- frontend editor model
- builder controls and canvas UI
- backend validation
- persistence
- MJML generation

Avoid large one-shot expansions. Small vertical slices are safer and easier to validate.

### 2. Prefer structured composition over freeform layout

Users should be able to:

- choose a section or column layout
- drag blocks into columns
- style those blocks more deeply
- use presets when they accelerate common layouts

The editor should not try to become a pixel-precise, arbitrary canvas builder.

### 3. Presets should accelerate, not trap users

Complex preset-style compositions should become more flexible over time:

- expose more internal controls
- allow internal element rearrangement where sensible
- support exploding a preset into simpler editable blocks when needed

## Next priorities

Immediate execution order:

1. ~~Expand advanced style controls.~~
2. ~~Add explodable presets and improve preset internal layout controls.~~
3. ~~Add rich text editing.~~
4. ~~Add brand library page.~~
5. ~~Add saved sections library.~~

Documentation and tests should now be updated continuously as new features and architectural changes land.

### ~~1. Expand advanced style controls~~ ✓

### ~~2. Add explodable presets~~ ✓

### ~~3. Improve preset internal layout controls~~ ✓

### ~~4. Add rich text editing~~ ✓

Tiptap-based RTE for text-oriented blocks (Hero, Text, Footer, Badge, Quote). Formatting is MJML-safe and consistent across preview, persistence, and backend generation.

### ~~5. Add brand library page~~ ✓

Standalone brand library page with live preview. Clients can manage brand colors, typography, and button styles, with changes reflected immediately across their templates.

### ~~6. Add saved sections library~~ ✓

Allow clients to save a section from one template and reuse it in other templates with the same structure and styling. Linked sections are locked in the canvas and must be edited through a dedicated sub-canvas that offers "Apply to all templates" or "Apply to this template only".

## Notes

- The older idea of reclassifying marketing blocks purely as presets is currently **not the chosen direction**. The current plan is to keep the section/column model central and make presets more flexible instead.
- Future content should support token-style placeholders such as `{{ params.price }}` and similar dynamic values.
- Brand-aware styling should prefer guided consistency over strict lock-in: show the brand-library options first, but still allow raw color picking and targeted overrides when needed.
- The brand library lives on its own editor-accessible page with a live preview so users can see brand changes reflected immediately. ✓
- Saved sections should eventually work as a client-scoped content library so commonly used layouts can be reused across templates without rebuilding them each time.
- Saved-section editing should support both local changes and shared changes: update just this template instance or propagate the update to every template linked to the saved section.
- Testing should exist in both stacks so future editor, validation, and rendering changes are safer to ship.
- Documentation should exist at the project, backend, and frontend levels, and backend code should use XML documentation comments with inline comments reserved for tricky logic.
- After backend/editor schema changes, rebuild the Docker dev stack so the running services stay in sync with the code:

```powershell
docker compose -f .\docker-compose.dev.yml up -d --build
```
