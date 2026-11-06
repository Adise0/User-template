# user-template Back

A REST API for user accounts, built with Express 5, TypeScript and MongoDB (Mongoose). It covers
registration with email activation, password and one-time password login, sessions, password
resets, email changes and profile editing.

The full API reference is in [docs/openapi.yaml](docs/openapi.yaml).

## Getting started

You need Node.js 24 or newer, a MongoDB database and an SMTP account.

```sh
npm install
cp .env.example .env   # Then fill it in
npm run dev
```

The API runs on `http://localhost:4000` by default. To check it's up, open `/health`.

The SMTP host is set in [src/server/utils/email/index.ts](src/server/utils/email/index.ts).

## Scripts

| Script                 | What it does                            |
| ---------------------- | --------------------------------------- |
| `npm run dev`          | Runs the API and restarts it on changes |
| `npm run build`        | Compiles TypeScript into `build/`       |
| `npm run lint`         | Runs ESLint                             |
| `npm run format:check` | Checks formatting with Prettier         |

To run a compiled build, use `node build/index.js`.

## Environment variables

The server checks these at startup and refuses to start if one is missing or invalid.

| Variable         | Required | Description                                                                   |
| ---------------- | -------- | ----------------------------------------------------------------------------- |
| `CONN_STRING`    | Yes      | MongoDB connection string                                                     |
| `TOKEN_SECRET`   | Yes      | Secret that signs every token, at least 32 characters                         |
| `EMAIL`          | Yes      | SMTP username                                                                 |
| `EMAIL_PASSWORD` | Yes      | SMTP password                                                                 |
| `FRONTEND_URL`   | Yes      | Base URL for the links in emails                                              |
| `BACKEND_URL`    | Yes      | Base URL for the debug links in emails                                        |
| `EMAIL_ALIAS`    | No       | The "from" address, defaults to `EMAIL`                                       |
| `PORT`           | No       | Defaults to `4000`                                                            |
| `NODE_ENV`       | No       | `production` turns off pretty logs                                            |
| `LOG_LEVEL`      | No       | Defaults to `info`. `debug` also logs expected errors and users               |
| `DNS_SERVERS`    | No       | Comma-separated DNS servers for the database lookup, defaults to the system's |

Everything else, such as session lengths, cooldowns and rate limits, is in
[src/data/serverConfig/server-config.ts](src/data/serverConfig/server-config.ts).

## How it works

### Accounts

Registering creates a pending account and emails an activation link. Pending accounts can't log in,
and MongoDB deletes them automatically after 24 hours.

If someone registers again with the same email, the pending account is replaced, so losing the
confirmation page is never a dead end. A different email can only take a pending username once that
signup's activation link has expired.

Emails and usernames are unique regardless of casing. `credentials` holds the lowercased keys that
logins and uniqueness use, and `information` holds the public profile, with the username as typed.

### Sessions

Logging in returns a JWT, sent as `Authorization: Bearer <token>`. It lasts 2 hours, and the
frontend should refresh it after 1 hour with `GET /auth/refreshToken`.

| To end              | Use                            |
| ------------------- | ------------------------------ |
| The current session | `POST /auth/logout`            |
| Every session       | `POST /auth/signOutEverywhere` |

By default sessions can be refreshed forever. Set `userSessionMaxAgeInHours` to add a hard limit,
counted from the last real login.

Changing a password, changing the email and deleting the account need a login from the last 5
minutes. Otherwise the API answers `REAUTH_REQUIRED`, and the frontend should send the user through
the login again.

### Email links

Each email link is a signed token for one purpose, and it only works on the matching endpoint. The
database stores a SHA-256 hash of it, so a database leak doesn't expose working links. Only the most
recent link of each kind works.

Endpoints that email an account found by email or username always answer `202` straight away, so
the response doesn't reveal whether the account exists.

Failed emails are retried up to 3 times. Retries are kept in memory on purpose, because a stored
queue would keep working codes and links in the database. If the server restarts mid-retry, the
email is lost and the user has to ask for it again.

### Roles

Every user has a `role`: `USER` (the default), `ADMIN` or `SUPERUSER`. To limit a route, put
`roleValidator` after `tokenValidator`:

```ts
router.all(path, method(Methods.GET), tokenValidator, roleValidator(UserRole.admin), controller);
```

No endpoint can grant `SUPERUSER`, so it has to be set directly in the database:

```js
db.users.updateOne({ "credentials.email": "you@example.com" }, { $set: { role: "SUPERUSER" } });
```

## Errors

Every error has the same shape. Switch on `code`, because `message` is only a human-readable
fallback.

```json
{
  "error": true,
  "status": 400,
  "code": "VALIDATION_FAILED",
  "message": "Invalid data: Password must have at least 8 characters",
  "fields": { "password": "TOO_SHORT" }
}
```

`fields` and `details` are only there when they apply. The codes are in
[src/types/errorTypes/ErrorCode.ts](src/types/errorTypes/ErrorCode.ts), which has no dependencies so
it can be copied into the frontend. Once a code is in use, never rename or reuse it.

## Project structure

```text
src/
  data/
    errorObjects/   Error builders
    joiObjects/     Request validation schemas
    serverConfig/   Endpoints, settings and environment validation
  database/         Connection and models
  server/
    controllers/    The final step of each route
    middlewares/    Auth, validation, rate limits and error handling
    routers/        Route definitions
    utils/          Email, logging and auth helpers
  types/            Shared TypeScript types
```

Validators that only check `req.body` live together in
[bodyValidators.ts](src/server/middlewares/requestPayloadValidators/bodyValidators.ts). One that
reads from anywhere else, or leaves data anywhere else, gets its own file.

## Logging

Logs are structured JSON from [pino](https://getpino.io), and pretty-printed in development.

Every request gets an id, returned in the `X-Request-Id` header and included in its logs. Request
headers aren't logged, and tokens in URLs are masked.

## Deploying

Before going live:

- Remove the debug routes and the debug links in the emails. Search for `DEBUG` in `src/`.
- Restrict `cors()` in [src/server/index.ts](src/server/index.ts) to your frontend.
- Set `trust proxy` if you're behind a proxy, otherwise all users share one rate limit.
- Move the rate limiter to a shared store if you run more than one instance.

Stop the server with `SIGTERM` or `SIGINT` so running requests can finish. `GET /health` answers
`503` if the database connection is lost.

## Upgrading an existing database

Run this once when moving a database from before these changes, before starting the new version:

```js
db.users.dropIndex("information.email_1");
db.users.dropIndex("information.username_1");
db.users.updateMany({}, [
  { $set: { "credentials.username": { $toLower: "$credentials.username" } } },
]);
db.users.updateMany({ verificationToken: { $exists: false } }, [
  { $set: { activatedAt: { $toDate: "$_id" } } },
]);
```

The `$toLower` step fails if two users differ only by casing, so resolve those first. Without the
last step, active users are treated as pending and can't log in.

Email links sent before the upgrade stop working, and everyone has to log in again.
