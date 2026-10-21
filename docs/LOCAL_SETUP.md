# Local development setup (Milestone 0)

This document records the untouched Postiz baseline, the normal local setup, and
the fallback used to validate the application in the constrained macOS
environment available on 2026-09-30. Milestone 0 did not add Author Studio,
change the Prisma schema, or remove existing Postiz features.

## Baseline

- Repository: `https://github.com/gitroomhq/postiz-app.git`
- Baseline branch: `main`
- Baseline commit: `2a46d88cf3b037ffefcf983118d7e55ebd40e3be`
- Commit date: `2026-09-30T08:17:33Z`
- Commit subject: `Merge pull request #2184 from gitroomhq/chore/claude-md-shared-data-rules-main`
- Local checkout: `/Users/tiffanybray/Documents/Codex/postiz-app`

The canonical repository is configured as `upstream`:

```bash
git remote -v
# upstream https://github.com/gitroomhq/postiz-app.git (fetch)
# upstream https://github.com/gitroomhq/postiz-app.git (push)
```

There is deliberately no `origin`: no user-fork URL was supplied. After a fork
exists, add it without changing `upstream`:

```bash
git remote add origin git@github.com:<owner>/postiz-app.git
git fetch --all --prune
```

To refresh a future work branch:

```bash
git fetch upstream
git switch main
git merge --ff-only upstream/main
git switch -c <work-branch>
```

## Prerequisites

The versions below come from the repository rather than global defaults.

| Dependency | Required/tested | Purpose |
| --- | --- | --- |
| Node.js | `>=22.12.0 <23.0.0`; tested `22.20.0` | application runtime |
| pnpm | exactly `10.6.1` via Corepack | workspace dependencies/scripts |
| PostgreSQL | repository Compose image `17-alpine` | primary database |
| Redis | repository Compose image `7-alpine`; tested `7.4.0` | queues/cache |
| Temporal | repository Compose image `1.28.1`; fallback CLI `1.9.1` / server `1.32.0` | workflows |
| Docker + Compose | recommended | starts PostgreSQL, Redis, Temporal, Elasticsearch and local admin UIs |
| Git | tested `2.50.1` | source control |

Expected local ports are frontend `4200`, backend `3000`, orchestrator health
`3002`, PostgreSQL `5432`, Redis `6379`, and Temporal `7233`. The normal
Compose file additionally exposes pgAdmin `8085`, RedisInsight `5540`, and
Temporal UI `8080`.

## Normal Docker-based setup

```bash
cd /Users/tiffanybray/Documents/Codex/postiz-app

corepack enable
corepack prepare pnpm@10.6.1 --activate
node --version
pnpm --version

cp .env.example .env
# Edit .env using the template below. Never commit it.

pnpm install --frozen-lockfile
pnpm run dev:docker
pnpm run prisma-db-push
pnpm run dev
```

`prisma-db-push` contains `--accept-data-loss`; use it only against a
disposable local database. It was used here without modifying the checked-in
Prisma schema.

Minimal local `.env`:

```dotenv
DATABASE_URL="postgresql://postiz-local:postiz-local-pwd@127.0.0.1:5432/postiz-db-local?sslmode=disable"
REDIS_URL="redis://127.0.0.1:6379"
JWT_SECRET="<generate-a-unique-long-random-value>"

FRONTEND_URL="http://localhost:4200"
NEXT_PUBLIC_BACKEND_URL="http://localhost:3000"
BACKEND_INTERNAL_URL="http://localhost:3000"

TEMPORAL_ADDRESS="127.0.0.1:7233"
TEMPORAL_NAMESPACE="default"

STORAGE_PROVIDER="local"
UPLOAD_DIRECTORY="/absolute/path/to/local/uploads"
NEXT_PUBLIC_UPLOAD_STATIC_DIRECTORY="/absolute/path/to/local/uploads"

IS_GENERAL="true"
DISABLE_REGISTRATION="false"
NOT_SECURED="true"
API_LIMIT="30"
```

Generate the JWT secret without writing it to shell history:

```bash
openssl rand -hex 32
```

`.env` is ignored by Git. Social-provider, mail, storage, payment, and AI keys
are optional for the Milestone 0 login/calendar/local-draft path and were not
added.

## Exact fallback used on this host

The execution host was macOS 26.6.2 on Intel x86_64. Its installed Node
`24.13.1` and pnpm `11.19.0` did not satisfy the repository constraints.
Docker could not be installed or virtualized in the sandbox, so all runtime
components were kept outside the repository under:

```bash
export REPO_ROOT=/Users/tiffanybray/Documents/Codex/postiz-app
export WORK_ROOT=/Users/tiffanybray/Documents/Codex/2026-09-30/d/work
export POSTIZ_NODE="$WORK_ROOT/toolchain/node-v22.20.0-darwin-x64"
export PATH="$POSTIZ_NODE/bin:$WORK_ROOT/toolchain/bin:$PATH"
export COREPACK_HOME="$WORK_ROOT/toolchain/corepack"
export XDG_CACHE_HOME="$WORK_ROOT/cache"
cd "$REPO_ROOT"
```

The official Node.js 22.20.0 Darwin x64 archive was unpacked into
`$POSTIZ_NODE`. With the cache variables above:

```bash
corepack pnpm --version                  # 10.6.1
pnpm install --frozen-lockfile
pnpm run prisma-generate
```

The initial install populated all 4,736 packages, then its postinstall failed
because `pnpm dlx` attempted to write to a sandbox-blocked user cache.
Setting `XDG_CACHE_HOME=$WORK_ROOT/cache` and rerunning
`pnpm run prisma-generate` fixed it.

### Local services

Redis 7.4.0 was built from its official source archive using:

```bash
cd "$WORK_ROOT/toolchain/redis-7.4.0"
make MALLOC=libc BUILD_TLS=no
src/redis-server \
  --bind 127.0.0.1 --port 6379 \
  --dir "$WORK_ROOT/runtime/redis" \
  --save "" --appendonly no
```

Temporal was run with its official CLI:

```bash
"$WORK_ROOT/toolchain/bin/temporal" server start-dev \
  --ip 127.0.0.1 --port 7233 --ui-port 8233 \
  --db-filename "$WORK_ROOT/runtime/temporal.db"
```

A native PostgreSQL 17.6 source build completed, but `initdb` could not create
the small System V shared-memory segment permitted by a normal macOS host
(`shmget: Operation not permitted`). For this sandbox only, an official
PGlite PostgreSQL-protocol server supplied the local database:

```bash
cd "$WORK_ROOT/pglite"
npm install @electric-sql/pglite@0.4.5 @electric-sql/pglite-socket@0.1.5
./node_modules/.bin/pglite-server \
  --db="$WORK_ROOT/runtime/pglite" \
  --host=127.0.0.1 --port=5432 --max-connections=20

cd "$REPO_ROOT"
pnpm run prisma-db-push
```

PGlite is a constrained-host workaround, not the recommended Postiz database.
It reports PostgreSQL 17.5 through the wire protocol, but its socket server
multiplexes connections and is not a full production PostgreSQL substitute.
Use the Compose PostgreSQL 17 service on a normal workstation.

### Application processes

The standard `pnpm run dev` was attempted first. Running four large watch
processes together exceeded this host's open-file allowance
(`EMFILE: too many open files`) and caused the frontend to restart. Isolated
processes were therefore used.

Frontend (Next.js/Turbopack, with polling):

```bash
cd "$REPO_ROOT/apps/frontend"
WATCHPACK_POLLING=true CHOKIDAR_USEPOLLING=true \
  ../../node_modules/.bin/dotenv -e ../../.env -- \
  ../../node_modules/.bin/next dev -p 4200
```

Backend:

```bash
cd "$REPO_ROOT"
TS_NODE_PROJECT="$WORK_ROOT/runtime/tsconfig.backend.runtime.json" \
TS_NODE_TRANSPILE_ONLY=true \
  pnpm exec dotenv -e .env -- \
  node -r ts-node/register -r tsconfig-paths/register apps/backend/src/main.ts
```

Orchestrator:

```bash
cd "$REPO_ROOT"
TS_NODE_PROJECT="$WORK_ROOT/runtime/tsconfig.orchestrator.runtime.json" \
TS_NODE_TRANSPILE_ONLY=true \
  pnpm exec dotenv -e .env -- \
  node -r ts-node/register -r tsconfig-paths/register apps/orchestrator/src/main.ts
```

The two temporary runtime TypeScript configs extend each app's checked-in
`tsconfig.json`, set `baseUrl` to `$REPO_ROOT`, and retain the repository
aliases except the erroneous
`@langchain/langgraph/prebuilt -> node_modules/.../prebuilt.d.ts` mapping.
That explicit declaration-file mapping makes Node 22 try to execute TypeScript
inside `node_modules`; package resolution works when it is omitted. These
configs live under `work/runtime`, not in the repository.

The orchestrator also revealed two genuine portability defects in its
checked-in `.swcrc`: `jsc.baseUrl` was hard-coded to
`/Users/nevodavid/Projects/gitroom`, and the
`@gitroom/orchestrator/*` path was absent. Milestone 0 changes the base URL to
`../..` and adds the missing alias. Its workflow bundle then compiled and all
workers reached `RUNNING`; warnings that some queues have no registered
workflows are expected.

## Local functional verification

The following was exercised in the unmodified application UI:

| Check | Result |
| --- | --- |
| Local registration | Passed; with no mail provider configured, the local account was active immediately |
| Login through `/auth/login` | Passed; redirected to `/launches` |
| Calendar | Passed; weekly calendar rendered for 2026-09-28 through 2026-10-04 |
| Native post composer | Passed; opened with **Create Post** |
| Draft creation | Passed; **Save as draft** added the draft to the calendar |

No real social credentials were available. To exercise Postiz's native
composer and draft persistence without publishing, one local test integration
was inserted into the disposable database for the current organization:

```sql
INSERT INTO "Integration"
  ("id", "name", "picture", "type", "internalId", "token",
   "refreshToken", "disabled", "organizationId", "providerIdentifier")
VALUES
  ('milestone0-local-x', 'Local X Draft Channel', '', 'social',
   'milestone0-local-x', 'local-draft-only-never-publish', '',
   false, '<local organization id>', 'x');
```

The composer selected **Local X Draft Channel**, entered
`Milestone 0 local draft verification — no external publish.`, and saved it
as a draft. The calendar then displayed the same text with the `Draft:`
label. No publish action or external provider call was made. The test account
password and application JWT secret are intentionally not recorded.

## Validation results

Run-time checks on 2026-09-30:

```text
GET http://127.0.0.1:4200/                 307 (expected auth redirect)
GET http://127.0.0.1:3000/                 200
GET http://127.0.0.1:3002/health/status    200 {"status":"ok"}
GET http://127.0.0.1:8233/                 200
redis-cli -h 127.0.0.1 -p 6379 ping        PONG
psql ... 'select version()'                 PostgreSQL 17.5 (PGlite)
latest local verification post              DRAFT | Local X Draft Channel
```

`pnpm run prisma-generate` passed. `pnpm run prisma-db-push` passed and
reported the database in sync; the Prisma schema has no diff from
`upstream/main`. Frontend development compilation completed for the login,
calendar, and composer routes. The orchestrator workflow bundle compiled and
its health endpoint passed. A clean `pnpm run build:orchestrator` also passed.
`git diff --check` passed, the edited SWC file parses as JSON, and
`git check-ignore .env` confirms that local secrets remain ignored.
The database contains the composer-created post in `DRAFT` state with the
expected channel and content.

The full `pnpm run build` was attempted. The frontend's production
optimization made no error but remained CPU-bound under unusually heavy shared
host load and was manually interrupted, so a complete production build is
unresolved rather than passed. The UI runtime checks above provide Milestone 0
coverage but do not replace a full build in CI.

## Failures and unresolved constraints

| Attempt/failure | Resolution or current status |
| --- | --- |
| Homebrew Node/Docker/Colima install had no Intel macOS 26 bottles | Used official native archives |
| Docker Desktop DMG mount failed with `Device not configured`; package install needed protected `/Library` writes | Docker remains unavailable in this sandbox |
| Colima/Lima VZ reported virtualization unavailable | Nested virtualization is unavailable |
| Native PostgreSQL `initdb` hit sandbox-denied System V shared memory | Used disposable PGlite; use real PostgreSQL 17 outside the sandbox |
| Dependency postinstall could not write the user cache | Set `XDG_CACHE_HOME` inside the writable work directory |
| Combined watch mode hit `EMFILE` | Ran services independently with frontend polling |
| Backend runtime followed a declaration-file-only LangGraph alias | Used an outside-repository runtime tsconfig that lets Node resolve the package |
| Orchestrator SWC used a developer-specific absolute path and lacked its own alias | Applied the two portable local-development config fixes described above |
| Full production build did not finish within the shared-host window | Rerun `pnpm run build` on a normally provisioned host or CI |
| External provider connection and publishing | Not tested: no credentials, and publishing is outside Milestone 0 |

## Milestone boundary

Milestone 0 stops here. No Author Studio implementation has begun, the Prisma
schema is unchanged, no Postiz feature was removed, and no secret is committed.
