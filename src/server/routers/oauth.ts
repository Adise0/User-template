import express from "express";
import { endpoints } from "../../data/serverConfig/endpoints";
import completeOAuthSignup from "../controllers/oauth/completeOAuthSignup";
import getOAuthAuthorizationUrl from "../controllers/oauth/getOAuthAuthorizationUrl";
import getOAuthProviders from "../controllers/oauth/getOAuthProviders";
import linkOAuthProvider from "../controllers/oauth/linkOAuthProvider";
import oauthLogin from "../controllers/oauth/oauthLogin";
import relayOAuthCallback from "../controllers/oauth/relayOAuthCallback";
import unlinkOAuthProvider from "../controllers/oauth/unlinkOAuthProvider";
import sendToken from "../controllers/auth/sendToken";
import freshAuthValidator from "../middlewares/auth/freshAuthValidator";
import tokenValidator from "../middlewares/auth/tokenValidator";
import twoFactorChallenge from "../middlewares/auth/twoFactorChallenge";
import method, { Methods } from "../middlewares/method";
import oauthIdentityResolver from "../middlewares/oauth/oauthIdentityResolver";
import oauthProviderValidator from "../middlewares/oauth/oauthProviderValidator";
import { loginRateLimiter } from "../middlewares/rateLimiters";
import { oauthSignupDataValidator } from "../middlewares/requestPayloadValidators/bodyValidators";
import oauthAuthorizationUrlDataValidator from "../middlewares/requestPayloadValidators/oauthAuthorizationUrlDataValidator";
import oauthCodeDataValidator from "../middlewares/requestPayloadValidators/oauthCodeDataValidator";

// The flow, for the frontend:
//  1. GET  /providers                      Which buttons to show.
//  2. GET  /:provider/authorizationUrl     With a state, a nonce and (if supportsPkce) a PKCE
//                                          challenge, all generated and kept by the frontend.
//                                          Redirect the user to the URL it answers.
//  3. The provider sends the user back to FRONTEND_URL/auth/oauth/:provider/callback?code&state
//     (through POST /:provider/callback first for Apple). Check the state matches.
//  4. POST /:provider/login                With the code, the nonce and the PKCE verifier. Answers
//                                          a session token, a 2FA challenge, or a signup token.
//  5. POST /completeSignup                 First sign-in only: the signup token plus a username.
const oauthRouter = express.Router();

const routerEndpoints = endpoints.oauth;

oauthRouter.all(routerEndpoints.providers, method(Methods.GET), getOAuthProviders);

oauthRouter.all(
  routerEndpoints.authorizationUrl,
  method(Methods.GET),
  oauthProviderValidator,
  oauthAuthorizationUrlDataValidator,
  getOAuthAuthorizationUrl,
);

// The only route that reads a form instead of JSON: Apple can't send anything else. Kept to this
// route, so the rest of the API can't be reached by a cross-site form post.
oauthRouter.all(
  routerEndpoints.callback,
  method(Methods.POST),
  express.urlencoded({ extended: false, limit: "10kb" }),
  oauthProviderValidator,
  relayOAuthCallback,
);

oauthRouter.all(
  routerEndpoints.login,
  method(Methods.POST),
  loginRateLimiter,
  oauthProviderValidator,
  oauthCodeDataValidator,
  oauthIdentityResolver,
  oauthLogin,
  twoFactorChallenge,
  sendToken,
);

oauthRouter.all(
  routerEndpoints.completeSignup,
  method(Methods.POST),
  loginRateLimiter,
  oauthSignupDataValidator,
  completeOAuthSignup,
  sendToken,
);

// Linking and unlinking are sensitive: they change how the account can be signed in to.
oauthRouter
  .route(routerEndpoints.link)
  .all(
    method(Methods.POST, Methods.DELETE),
    tokenValidator,
    freshAuthValidator,
    oauthProviderValidator,
  )
  .post(oauthCodeDataValidator, oauthIdentityResolver, linkOAuthProvider)
  .delete(unlinkOAuthProvider);

export default oauthRouter;
