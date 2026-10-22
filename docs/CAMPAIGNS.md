# Author Studio campaigns: Milestone 2

Milestone 2 adds manual campaign planning above Postiz's existing author
library. It does not call an AI provider, generate content, send anything to the
native composer, publish posts, or add `CampaignPublication`.

## Domain model

The campaign domain adds five organization-scoped models:

| Model                   | Purpose                                                                                              |
| ----------------------- | ---------------------------------------------------------------------------------------------------- |
| `Campaign`              | A dated brief for one pen name and optional book/series, with target platforms and lifecycle status  |
| `CampaignContentPillar` | Organization-scoped join between a campaign and one active pillar owned by the same pen name         |
| `CampaignAudienceAngle` | Organization-scoped join between a campaign and one active audience angle owned by the same pen name |
| `CampaignIdea`          | A manual or future generated core concept nested beneath a campaign                                  |
| `CampaignVariant`       | Editable platform execution nested beneath an idea                                                   |

Every record stores `organizationId`. Campaign, idea, and variant reads and
writes include the authenticated organization and exclude soft-deleted records.
Direct idea and variant access also requires a non-archived parent campaign.
The API never accepts an organization identifier from the browser.

Campaign type values are `LAUNCH`, `PREORDER`, `BACKLIST`, `READER_MAGNET`,
`SALE`, `EVERGREEN`, and `CUSTOM`. Campaign lifecycle values are `DRAFT`,
`GENERATING`, `REVIEW`, `ACTIVE`, `COMPLETE`, and `ARCHIVED`; manual campaigns
must begin as `DRAFT`, and archival uses the dedicated delete action.

Manual variants start as `EDITED`. Saving an edit returns a reviewable variant
to `EDITED` without erasing future generation provenance. Explicit review
actions move eligible variants to `APPROVED` or `REJECTED`. The future
`SENT_TO_COMPOSER` and `SCHEDULED` states cannot be edited by this milestone.

## Authenticated API

The feature-flagged campaign controller extends `/author-studio` with:

- `GET|POST /campaigns`
- `GET|PUT|DELETE /campaigns/:id`
- `POST /campaigns/:campaignId/ideas`
- `GET|PUT|DELETE /campaign-ideas/:id`
- `POST /campaign-ideas/:ideaId/variants`
- `GET|PUT|DELETE /campaign-variants/:id`
- `POST /campaign-variants/:id/approve`
- `POST /campaign-variants/:id/reject`

Campaign create/update validates that the selected pen name, optional book and
series, content pillars, and audience angles all belong to the authenticated
organization. A selected book and series must also belong to the campaign pen
name, and a selected book must belong to the selected series when both are set.
Missing and cross-organization records both produce 404 responses.

## Interface

`/author-studio/campaigns` provides campaign create, view, edit, lifecycle, and
archive controls. The brief captures the pen name, optional book and series,
type, objective, dates, target platforms, content pillars, and audience angles.

`/author-studio/campaigns/:id` provides manual idea and platform-variant
creation, editing, archival, shortlisting/rejection, and variant
approval/rejection. AI controls and native composer handoff are deliberately
absent.

## Data safety

The schema was applied only to the disposable local PGlite database:

```bash
./node_modules/.bin/prisma db push \
  --schema libraries/nestjs-libraries/src/database/prisma/schema.prisma
```

`--accept-data-loss` was not used. Before storing real campaign data, establish
database backups and adopt a reviewed Prisma/SQL migration workflow (or at
minimum generate and inspect a schema diff for every deployment).

No campaign records are seeded automatically. The disposable local database
contains one manually created smoke-test campaign, idea, and variant.

## Validation

Milestone 2 uses the same focused Author Studio validation entry points:

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

The campaign tests cover DTO validation, organization and parent scoping,
cross-organization relationship rejection, CRUD delegation, date validation,
campaign transitions, manual variant review transitions, protection of
post-handoff states, and preservation of future generation provenance.

Final Milestone 2 results on 2026-10-22:

| Validation                                     | Result                                     |
| ---------------------------------------------- | ------------------------------------------ |
| Prisma schema validation and client generation | Passed                                     |
| Schema application to disposable PGlite        | Passed without `--accept-data-loss`        |
| Focused backend TypeScript check               | Passed                                     |
| Full frontend TypeScript check                 | Passed                                     |
| Next.js route type generation                  | Passed                                     |
| Focused Author Studio Jest suite               | Passed: 6 suites, 30 tests                 |
| Backend production build                       | Passed                                     |
| Frontend production build                      | Passed; both campaign routes were included |
| Browser campaign workflow                      | Passed                                     |
| Whitespace/error check                         | Passed                                     |

The manual browser smoke test created and edited a campaign, moved it from
`DRAFT` to `REVIEW`, created and reviewed an idea, created and edited an
Instagram variant, and exercised:

```text
EDITED → APPROVED → REJECTED → EDITED → APPROVED
```

The final `/approve` and `/reject` API actions were rechecked against the
production frontend build and the reloaded backend.
