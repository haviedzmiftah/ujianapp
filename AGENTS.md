## Ujian App implementation guidelines

Before every code-writing or code-modification task:

- Read and follow `.kiro/steering/clean-architecture.md`.
- Review the applicable requirements in `.kiro/specs/ujian-app/requirements.md` and design/architecture in `.kiro/specs/ujian-app/design.md`; keep implementation aligned with the product scope, acceptance criteria, data model, and architecture.
- Preserve the layered, feature-based structure: presentation calls business services, services use repositories for data access, and pure business logic remains side-effect free. Do not query Prisma directly from route handlers, Server Actions, or UI components.
- When a requested change conflicts with the spec or architecture, explain the conflict and ask before making an incompatible change.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
