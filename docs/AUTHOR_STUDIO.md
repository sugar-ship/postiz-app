# Author Studio: Milestone 1

Milestone 1 adds the feature-flagged Author Library to Postiz. It intentionally
stops at library records: Campaign, CampaignIdea, CampaignVariant, AI generation,
and changes to Postiz's existing publishing features are not included.

## Enable locally

Author Studio is disabled by default. Add this only to the ignored local `.env`
when working on the feature:

```dotenv
AUTHOR_STUDIO_ENABLED="true"
```

The same server-side variable gates both the frontend navigation/routes and the
backend controller. When disabled, the navigation item is absent, frontend
routes return a 404, and the API guard returns a 404.

No Author Library records are seeded automatically.

## Domain model

All seven models have an `organizationId`, timestamps, and a nullable
`deletedAt`. Repository reads exclude archived rows, and writes always include
the authenticated organization in their lookup or update predicate.

| Model           | Purpose and principal relationships                                                                   |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| `PenName`       | Author identity; owns one optional brand profile and many series, books, pillars, and audience angles |
| `BrandProfile`  | Versioned voice, language, formatting, example, and boundary data for exactly one pen name            |
| `Series`        | Pen-name-owned series metadata and ordering notes; has many books                                     |
| `Book`          | Book metadata, lifecycle status, positioning fields, and optional series membership                   |
| `BookSource`    | Book-owned source text or notes, classified by kind and status                                        |
| `ContentPillar` | Pen-name-owned content theme, examples, active state, and display order                               |
| `AudienceAngle` | Pen-name-owned reader need, desired reaction, objections, and platform notes                          |

`BookStatus` is `IDEA`, `PREORDER`, `LIVE`, `BACKLIST`, or `ARCHIVED`.
`BookSourceKind` is `EXCERPT`, `MANUSCRIPT`, `REVIEW`, `CHARACTER_NOTE`,
`WORLD_NOTE`, or `OTHER`. `BookSourceStatus` is `ACTIVE` or `ARCHIVED`.

## API

The authenticated controller is mounted at `/author-studio` and uses Postiz's
existing organization request decorator. CRUD endpoints are available for:

- `/pen-names` and `/pen-names/:id`
- `/pen-names/:id/brand-profile`
- `/series` and `/series/:id`
- `/books` and `/books/:id`
- `/books/:bookId/sources` and `/books/:bookId/sources/:id`
- `/content-pillars` and `/content-pillars/:id`
- `/audience-angles` and `/audience-angles/:id`

Create uses `POST`, reads use `GET`, updates use `PUT`, and archive uses
`DELETE`. Archive operations are soft deletes. A missing record and a record
owned by another organization both return 404, avoiding cross-organization
existence disclosure. Nested series, pen-name, book, and source relationships
are also checked within the authenticated organization.

## Interface

When enabled, **Author Studio** appears in the main Postiz navigation. The shell
provides these screens:

- `/author-studio` — milestone overview and explicit exclusions
- `/author-studio/pen-names` — pen-name and brand-profile create/view/edit/archive
- `/author-studio/books` — series and book create/view/edit/archive
- `/author-studio/books/:id` — selected book detail and source create/view/edit/archive
- `/author-studio/content-pillars` — content-pillar create/view/edit/archive
- `/author-studio/audience-angles` — audience-angle create/view/edit/archive

The feature code is isolated under `components/author-studio`, the corresponding
frontend route directory, the Author Studio controller, DTO directory, and
Prisma Author Studio repository/service directory.

## Local database application

Generate the client and validate the schema first:

```bash
pnpm run prisma-generate
./node_modules/.bin/prisma validate \
  --schema libraries/nestjs-libraries/src/database/prisma/schema.prisma
```

Apply the schema only to a disposable development database:

```bash
./node_modules/.bin/prisma db push \
  --schema libraries/nestjs-libraries/src/database/prisma/schema.prisma
```

Do not use `--accept-data-loss` against a non-disposable database. A reviewed
migration should be produced before this schema is deployed to a persistent or
shared environment.

The constrained-host PGlite adapter used during local validation can reuse
prepared-statement names across multiplexed connections. For that fallback only,
the backend was launched with `connection_limit=1&pgbouncer=true` appended to
the in-memory `DATABASE_URL`. No secret or rewritten connection string was
printed or committed. Standard PostgreSQL 17 via the repository's Compose setup
does not require this workaround.

## Validation commands

The Milestone 1 validation set is:

```bash
pnpm run prisma-generate
./node_modules/.bin/prisma validate \
  --schema libraries/nestjs-libraries/src/database/prisma/schema.prisma
./node_modules/.bin/tsc -p tsconfig.author-studio.json --noEmit
./node_modules/.bin/tsc -p apps/frontend/tsconfig.json --noEmit
(cd apps/frontend && ../../node_modules/.bin/next typegen)
./node_modules/.bin/jest --config jest.author-studio.config.cjs --runInBand
pnpm run build:backend
pnpm run build:frontend
git diff --check
```

The focused Jest configuration covers DTO validation, organization scoping,
cross-organization 404 behavior, soft archive behavior, and CRUD delegation.

Final Milestone 1 results on 2026-10-22:

| Validation                                  | Result                                             |
| ------------------------------------------- | -------------------------------------------------- |
| Prisma schema validation                    | Passed                                             |
| Prisma client generation (`6.5.0`)          | Passed                                             |
| Focused backend TypeScript check            | Passed                                             |
| Full frontend TypeScript check              | Passed                                             |
| Next.js route type generation               | Passed                                             |
| Focused Jest suite                          | Passed: 3 suites, 15 tests                         |
| Backend production build                    | Passed                                             |
| Frontend production build                   | Passed; all six Author Studio routes were included |
| Whitespace/error check (`git diff --check`) | Passed                                             |

The frontend production build completed on the constrained host, so no
resource-bound build exception is being claimed for this milestone.

## Manual verification

The enabled local interface was exercised with a disposable local account.
Navigation and the Author Studio overview loaded. Create, view, edit, and
archive were verified for pen names, series, books, book sources, content
pillars, and audience angles; brand-profile create and update were also
verified. Test records were archived after the smoke test.

The existing development console also reports an unrelated CopilotKit request
failure for `GET /copilot/chat/info`; Postiz currently exposes that local route
as `POST`. It did not block Author Library CRUD.
