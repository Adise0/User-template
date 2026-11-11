# Postman collection

[user-template.postman_collection.json](user-template.postman_collection.json) has every endpoint
of the API, in folders that follow the routes.

## Setup

1. In Postman, go to **Import** and pick the collection file.
2. Open the **Vault**, then its settings, and turn on **Enable support in Postman scripts**. Allow
   this collection when Postman asks.
3. In the Vault, add three secrets: `loginEmail` with your email (the address **Register** signs up
   and **Login** uses, a `+` alias such as `you+pm@gmail.com` works), `loginPassword` with your
   password (it's also the password **Register** sends), and `newPassword` with the password that
   **Change password** and **Reset password** switch to. After either of those succeeds, update
   `loginPassword` to match.
4. To create the account, set the collection variable `registerUsername`, then run **Auth >
   Registration > Register**. Paste the token from the activation email into `linkToken` and run
   **Activate**, which also stores the session. Otherwise just run **Auth > Login > Login**.

Fill in the **Current value** of the variables you type in, not the Initial value. Current values
stay on your machine, so they never reach the exported file.

The session token is stored in the Vault as `authToken`. Vault values stay on your machine and are
never exported, so nothing secret ends up in this file.

## How auth works

The collection uses Bearer auth with `{{vault:authToken}}`, and every authed request inherits it.
Public requests are set to No Auth.

Before each request, a script checks the stored token. Once it's past half its life, the script swaps
it for a fresh one, so the session lasts as long as you keep using it. After 2 hours without a
request it expires, and you need to run Login again.

Some requests need a login from the last 5 minutes, and a refresh doesn't count, so run Login right
before them:

- **Auth > Account**: change password, request email change, delete account.
- **Auth > Two-factor**: setup, enable, new backup codes, disable.
- **Auth > OAuth**: link and unlink.
- **Admin**: delete user and change role.

Otherwise they answer `REAUTH_REQUIRED`.

## Variables

| Variable           | What it's for                                                       |
| ------------------ | ------------------------------------------------------------------- |
| `baseUrl`          | The API, `http://localhost:4000` by default                         |
| `registerUsername` | Username for the account you register                               |
| `newEmail`         | Another real address, for **Request email change**                  |
| `linkToken`        | Token from an email link: paste the last part of the link           |
| `otp`              | One-time password from the OTP email                                |
| `targetUserId`     | User the admin requests act on. **Admin > List users** fills it in. |
| `twoFactorCode`    | Current authenticator code, or a backup code                        |
| `twoFactorToken`   | 2FA challenge, filled in by Login when 2FA is on                    |
| `oauthCode`        | The `code` from the provider's redirect, see **Auth > OAuth**       |
| `oauth*` (others)  | Filled in by **Auth > OAuth > Authorization URL** and Login         |

## Two-factor and OAuth

With 2FA on, **Login** stores a challenge in `twoFactorToken` instead of a session. Put the code
from your app in `twoFactorCode` and run **Auth > Two-factor > Verify**.

OAuth needs a browser for the provider's sign-in page. The steps are in the **Auth > OAuth**
folder's description.

For **Health > Metrics**, add your `METRICS_TOKEN` to the Vault as `metricsToken`.

## Admin requests

They need an `ADMIN` or `SUPERUSER` account, so register a second account and promote one of them
(see the main README). **Change role** needs a `SUPERUSER`.

When `targetUserId` is empty, **List users** fills it in with the first user it returns that isn't
you. **Delete user** clears it.
Nobody can act on themselves, admins can only act on regular users, and superusers can't be
targeted at all.
