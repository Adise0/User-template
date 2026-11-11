# Security settings

The template's defaults assume a single instance, reached directly with no proxy in front, and
only a minimum length for passwords. This file starts with a checklist for going live, then covers
what to change when those assumptions don't hold, and the trade-offs the template makes for you.

- [Before going live](#before-going-live)
- [Running behind a proxy](#running-behind-a-proxy)
- [Running more than one instance](#running-more-than-one-instance)
- [Password policy](#password-policy)
- [The per-account login limit](#the-per-account-login-limit)
- [Token storage](#token-storage)
- [TOKEN_SECRET and two-factor secrets](#token_secret-and-two-factor-secrets)
- [Resetting someone's 2FA](#resetting-someones-2fa)

## Before going live

- [ ] **Remove the debug routes and the debug links in the emails.** Search for `DEBUG` in `src/`.
      They're plain `GET` links that act as soon as they're opened, and email scanners (Outlook Safe
      Links, Gmail, corporate gateways) open every link in an email: they'd activate accounts,
      cancel registrations and revoke codes on their own. Your frontend's pages for those links
      should also wait for a click before calling the API, for the same reason.
- [ ] **Generate a real `TOKEN_SECRET`**, one per environment, never reused:
      `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`. It signs every
      token and encrypts the 2FA secrets, see
      [TOKEN_SECRET and two-factor secrets](#token_secret-and-two-factor-secrets).
- [ ] **Serve both `FRONTEND_URL` and `BACKEND_URL` over HTTPS.** Tokens, codes and passwords
      travel in every request.
- [ ] **Check `FRONTEND_URL` (or `CORS_ORIGINS`) is only your real frontend.** It's the only
      browser origin allowed to call the API, so no `localhost` entries in production.
- [ ] **Behind a proxy or a platform router?** Set `trust proxy`, see
      [Running behind a proxy](#running-behind-a-proxy). Otherwise every user shares one rate limit.
- [ ] **More than one instance?** Move the rate limits to Redis, see
      [Running more than one instance](#running-more-than-one-instance).
- [ ] **Decide on a password policy**, see [Password policy](#password-policy). The default only
      checks the length.
- [ ] **OAuth:** use separate production clients from your development ones, and register the exact
      production redirect URIs (`FRONTEND_URL/auth/oauth/google/callback`,
      `BACKEND_URL/auth/oauth/apple/callback`).
- [ ] **Metrics:** only set `METRICS_TOKEN` if something scrapes it, and if you can, keep
      `/metrics` reachable from your monitoring network only.
- [ ] **Superusers:** set them in the database (see the README), and keep there as few as possible.
      Nothing in the API can remove one.

## Running behind a proxy

**Applies if** anything sits between the client and the API: Nginx, a load balancer, Cloudflare,
or a platform router (Render, Railway, Fly, Heroku, ...).

**What breaks:** every rate limit keys on `req.ip`. Behind a proxy that's the proxy's IP, so every
user shares one budget. A single user failing 10 logins then blocks login for everyone for 15
minutes.

**Fix:** tell Express how many proxies to trust, in [src/server/index.ts](src/server/index.ts),
right after `const app = express();`:

```ts
// One proxy in front (the usual case). Express then takes the client IP from the last entry
// that proxy added to X-Forwarded-For.
app.set("trust proxy", 1);
```

Use the exact number of hops, for example `2` for Cloudflare in front of a load balancer. You can
also use your proxies' addresses (`"loopback"`, `"10.0.0.0/8"`). **Never** use `true`. It trusts
whatever `X-Forwarded-For` the client sends, so anyone can pick a new IP on every request and get
round every limit. If the setting is wrong, express-rate-limit logs a validation warning at
startup.

To check it, log `req.ip` on a request coming through the proxy. It should be your own public IP,
not the proxy's.

## Running more than one instance

**Applies if** you run the API on more than one process or machine: several replicas, PM2 cluster
mode, autoscaling.

**What breaks:** the rate limit counts live in each process's memory. With 3 instances an attacker
gets 3× every limit, and every restart resets them.

Everything else already works with several instances. The email cooldowns, OTP attempts, sessions
and revocations are all stored in MongoDB.

**Fix:** move the counts to Redis.

```sh
npm install rate-limit-redis redis
```

```ts
// src/server/middlewares/rateLimiters.ts
import { RedisStore } from "rate-limit-redis";
import { createClient } from "redis";

const redisClient = createClient({ url: process.env.REDIS_URL });
redisClient.connect(); // Connect it at startup next to the database, so a failure stops the server.

// Each limiter needs its own prefix, or they'd share one count.
const buildStore = (prefix: string) =>
  new RedisStore({
    prefix: `rl:${prefix}:`,
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  });
```

Then pass `store: buildStore("login")`, `buildStore("email")` and so on into each `rateLimit({...})`,
including `accountLoginRateLimiter`. Add `REDIS_URL` to
[validateEnv.ts](src/data/serverConfig/validateEnv.ts) and `.env.example`.

## Password policy

**Current rule:** 8 to 72 bytes ([joiTypes.ts](src/data/joiObjects/joiTypes.ts)). The 72 is a
bcrypt limit and has to stay. Under this rule `password1` is accepted.

Current advice (NIST SP 800-63B) is length plus a check against known breached passwords, with no
composition rules like "one symbol, one number". There are two ways to do it, and they work
together:

**1. Reject breached passwords** with the Have I Been Pwned range API. It's free and needs no key.
Only the first 5 characters of the password's SHA-1 hash are sent (k-anonymity), so neither the
password nor its full hash leaves the server.

```ts
// src/server/utils/auth/isPasswordBreached.ts
import { createHash } from "node:crypto";

const isPasswordBreached = async (password: string): Promise<boolean> => {
  const hash = createHash("sha1").update(password).digest("hex").toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  try {
    const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
      headers: { "Add-Padding": "true" },
      signal: AbortSignal.timeout(3000),
    });

    if (!response.ok) {
      return false; // Fail open: an outage there shouldn't block signups here.
    }

    const body = await response.text();
    return body.split("\n").some((line) => line.split(":")[0] === suffix);
  } catch {
    return false;
  }
};

export default isPasswordBreached;
```

**2. Reject weak passwords** with [`@zxcvbn-ts/core`](https://zxcvbn-ts.github.io/zxcvbn/). It
scores how guessable a password is and works offline. Require a score of 3 or more.

**Where to plug it in:** Joi validation is synchronous, so add an async middleware right after the
body validator on the three routes that set a password, in
[routers/auth.ts](src/server/routers/auth.ts): `register`, `resetPassword` and `changePassword`.
Reject with a validation error so the frontend gets `fields.password`, for example a new
`FieldErrorCode.TOO_WEAK`.

## The per-account login limit

`accountLoginRateLimiter` ([rateLimiters.ts](src/server/middlewares/rateLimiters.ts)) allows **20
failed logins per account every 15 minutes**, whatever IP they come from. It closes the gap the
per-IP limit leaves: a botnet trying one password per IP against the same account.

**The trade-off:** anyone who knows a username or email can use up that budget on purpose and lock
the real owner out of password login until the window resets. The template limits the damage:

- Only **failed** attempts count, so the owner logging in normally never uses it up.
- The limit is twice the per-IP one, so a single attacker IP hits its own limit first.
- **OTP login and password reset aren't affected**, so the owner always has a way in.
- It sends no `RateLimit` headers, so an attacker can't see how much budget is left.

**Things to know:**

- It keys on the identifier as typed (lowercased). The same account's email and its username are
  counted separately, so the real ceiling is 40. That avoids a database lookup before the limiter
  runs.
- It's in memory, like the others. See
  [Running more than one instance](#running-more-than-one-instance).
- Tune it with `accountLoginFailureLimitMax` in
  [server-config.ts](src/data/serverConfig/server-config.ts). To turn it off, remove it from the
  login route.

**If lockouts become a real problem,** the usual next step is to stop blocking and ask for a
CAPTCHA (Cloudflare Turnstile, hCaptcha) after N failures for an account. Bots get stopped and the
owner never gets locked out.

## Token storage

**Current design:** login returns the session JWT in the response body. The frontend keeps it in
`localStorage`, so a page reload doesn't log the user out, and sends it as
`Authorization: Bearer <token>`. It refreshes the token with `GET /auth/refreshToken` before it
expires.

**The trade-off:** any JavaScript running on the frontend can read `localStorage`. That includes an
attacker's script if an XSS bug ever lands, for example through a compromised npm package. The
script can send the token to the attacker, who can then use and refresh it from their own machine
until the session is ended (`signOutEverywhere`, a password reset, or an admin action). By default
sessions can be refreshed forever (`userSessionMaxAgeInHours = null`), so setting a hard limit
there is a cheap way to cap that window.

The upside is that there are no cookies, so there's no CSRF to deal with. It also works whatever
domains the frontend and API end up on, and the backend stays simple. Plenty of production apps
make this same choice. It's fine as long as the frontend takes XSS seriously: no
`dangerouslySetInnerHTML` or `v-html` with user content, a strict CSP, and its dependencies kept up
to date.

**Upgrade path, if XSS-resistant sessions are needed:**

1. Split the session into a **short access token** (around 15 minutes) and a **refresh token**.
2. Return the access token in the body, and have the frontend keep it **in memory only**, never in
   storage.
3. Set the refresh token as a cookie: `httpOnly; Secure; SameSite=Strict; Path=/auth/refresh`.
   JavaScript can't read it, and the browser only sends it to that one endpoint.
4. On page load, the frontend calls `POST /auth/refresh`. The browser attaches the cookie and the
   response is a new access token, so reloads still don't log the user out.
5. Store refresh tokens hashed in their own collection, and **swap in a new one on every refresh**.
   If an old one is presented again, it was stolen: revoke the whole session.
6. **CSRF:** cookies are sent automatically, so check the `Origin` header on `/auth/refresh` and
   `/auth/logout`. The CORS setup already limits browsers to `FRONTEND_URL`, and `SameSite` does
   the rest.
7. The frontend and the API must be on the **same site** (`app.example.com` and `api.example.com`,
   or `localhost` on two ports), otherwise `SameSite` cookies aren't sent.

XSS can still act while the tab is open, but it can no longer take the session away with it.

## TOKEN_SECRET and two-factor secrets

Authenticator secrets have to be read back to check codes, so unlike every other credential they
can't be hashed. They're stored encrypted (AES-256-GCM) with a key derived from `TOKEN_SECRET`, so a
database dump alone doesn't hand out working second factors.

**The catch:** changing `TOKEN_SECRET` makes every stored secret unreadable. It already ends every
session and invalidates every email link, and on top of that every user with 2FA can no longer log
in until an admin resets it (`POST /admin/users/:userId/resetTwoFactor`). Only rotate it if it has
leaked, and plan the resets.

If you'd rather rotate it freely, give the encryption its own key: a new `TWO_FACTOR_KEY` variable
(32+ random bytes) used in [twoFactorSecret.ts](src/server/utils/twoFactor/twoFactorSecret.ts)
instead of `TOKEN_SECRET`.

## Resetting someone's 2FA

`POST /admin/users/:userId/resetTwoFactor` exists because people lose their phone and their backup
codes. It's also exactly what someone taking over an account would ask support for, after getting
hold of the password. Before using it, check who's asking through something the attacker wouldn't
have, for example a reply from the account's email address plus a detail only the owner knows. The
owner gets an email whenever it's used, and it's in the audit log.
