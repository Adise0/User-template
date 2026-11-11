import { NextFunction, Request, Response } from "express";
import { getTwoFactorAlreadyEnabledError } from "../../../data/errorObjects/twoFactorErrors";
import { getUserNotFoundForIdError } from "../../../data/errorObjects/userErrors";
import { twoFactorIssuer } from "../../../data/serverConfig/server-config";
import Users from "../../../database/models/Users";
import { generateTotpSecret, getOtpAuthUrl } from "../../utils/twoFactor/totp";
import { encryptTwoFactorSecret } from "../../utils/twoFactor/twoFactorSecret";

// Step 1 of turning 2FA on (fresh session only): makes a new secret and hands it to the frontend,
// to show as a QR code (otpauthUrl) or as text (secret). Nothing changes for the login until
// POST /auth/twoFactor/enable proves the app was set up. Calling it again replaces the secret.
const setupTwoFactor = async (req: Request, res: Response, next: NextFunction) => {
  const { userId } = res.locals; // Grab the userId left by the tokenValidator.

  try {
    const foundUser = await Users.findById(userId);

    if (!foundUser) {
      next(getUserNotFoundForIdError(userId));
      return;
    }

    if (foundUser.twoFactor.enabledAt) {
      next(getTwoFactorAlreadyEnabledError(userId));
      return;
    }

    const secret = generateTotpSecret();

    foundUser.set("twoFactor.pendingSecret", encryptTwoFactorSecret(secret));
    await foundUser.save();

    res.status(200).json({
      secret,
      otpauthUrl: getOtpAuthUrl(secret, twoFactorIssuer, foundUser.credentials.email),
    });
  } catch (error) {
    next(error);
  }
};

export default setupTwoFactor;
