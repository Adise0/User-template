# Postman collection

[user-template.postman_collection.json](user-template.postman_collection.json) has every endpoint
of the API, in folders that follow the routes.

## Setup

1. In Postman, go to **Import** and pick the collection file.
2. Open the **Vault**, then its settings, and turn on **Enable support in Postman scripts**. Allow
   this collection when Postman asks.
3. In the Vault, add a secret named `loginPassword` with your password.
4. In the collection's **Variables**, set `loginEmail` to your email or username.
5. Run **Auth > Login > Login**.

The session token is stored in the Vault as `authToken`. Vault values stay on your machine and are
never exported, so nothing secret ends up in this file.

## How auth works

The collection uses Bearer auth with `{{vault:authToken}}`, and every authed request inherits it.
Public requests are set to No Auth.

Before each request, a script checks the stored token. Once it's past half its life, the script swaps
it for a fresh one, so the session lasts as long as you keep using it. After 2 hours without a
request it expires, and you need to run Login again.

Changing your password, changing your email, deleting your account, deleting a user and changing a
role need a login from the last 5 minutes. A refresh doesn't count, so run Login right before them.

## Variables

| Variable       | What it's for                                                       |
| -------------- | ------------------------------------------------------------------- |
| `baseUrl`      | The API, `http://localhost:4000` by default                         |
| `loginEmail`   | Email or username to log in with                                    |
| `linkToken`    | Token from an email link: paste the last part of the link           |
| `otp`          | One-time password from the OTP email                                |
| `targetUserId` | User the admin requests act on. **Admin > List users** fills it in. |

## Admin requests

They need an `ADMIN` or `SUPERUSER` account. Nobody can act on themselves, admins can only act on
regular users, and superusers can't be targeted at all.
