# ADMIN-WORKFLOW-HANDOFF-IMPLEMENTATION-001

- VERSION: 1.0.0
- AREA: Admin / AI Registry / Workflow Management
- WORKFLOW: Design System Audit -> Token Unification -> Route Integration -> Full-stack Registry -> Workflow Draft/Publish -> Analytics
- OWNER: A DEFINIR
- STATUS: IMPLEMENTED_ON_BRANCH
- AUTOMATION_LEVEL: A4 (implementation + repository evidence; production verification depends on deployment)

## Decision

`admin/app.css` is the canonical visual Source of Truth. The root workflow no longer owns an independent palette: `src/index.css` imports the admin design system and exposes compatibility aliases for existing workflow semantic classes.

The Anatomy of Memory visual grammar is isolated to diagram tokens (`--diagram-*`). It does not replace the Fluent/admin palette outside diagram canvases.

## Routes

- `/admin/ai`
- `/admin/ai/:entityId`
- `/admin/ai/:entityId/diagram`
- `/admin/workflows`
- `/admin/workflows/:workflowId`
- `/admin/workflows/analytics`

Cloudflare static-asset routing uses `public/_redirects` to proxy `/admin/*` to `/admin/index.html`, preserving real path URLs while keeping the existing multi-entry Vite build.

## Full-stack registry

`scripts/generate-ai-registry.mjs` scans repository agents and skills at build/check/dev time. The generated registry is exposed through authenticated `/api/admin/registry*` endpoints. Missing metadata remains `A DEFINIR`; the generator does not fabricate dependencies or workflow links.

## Workflow storage

Admin workflow drafts are stored in R2 under `admin-workflows/drafts/`. Publishing validates the existing WorkflowDefinition contract and creates an immutable revision through the existing definitions service. The existing `program` field is used as project context, enabling multi-project filtering without introducing a competing schema.

## Analytics limitation

Structural analytics (workflows, drafts, revisions, nodes) are implemented. Runtime totals, success rate, cycle time and bottlenecks remain explicitly `NOT_INDEXED` because the current backend does not expose an enumerable global run index. No runtime metric is invented.

## Acceptance evidence

- Admin tokens are the single visual source for both entries.
- Diagram-specific violet is scoped to `--diagram-*`.
- Registry is repository-derived and authenticated.
- Workflow draft save and publish reuse the existing R2 definition model.
- Path routes are compatible with Cloudflare Workers static assets through the admin proxy rule.