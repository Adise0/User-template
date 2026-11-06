import { NextFunction, Request, Response } from "express";
import Users from "../../../database/models/Users";
import { userSessionDurationInHours } from "../../../data/serverConfig/server-config";

// Signs out of the current session only, the user's other devices stay logged in. A token can't be
// taken back once issued, so its session goes on a revoked list, which the tokenValidator checks.
const logout = async (req: Request, res: Response, next: NextFunction) => {
  const { userId, sessionId } = res.locals; // Grab what the tokenValidator left from the token.

  try {
    const now = Date.now();

    // Any token of a session is expired after this long, so older entries aren't needed anymore.
    await Users.updateOne(
      { _id: userId },
      { $pull: { revokedSessions: { expiresAt: { $lte: new Date(now) } } } },
    );

    await Users.updateOne(
      { _id: userId },
      {
        $push: {
          revokedSessions: {
            sessionId,
            expiresAt: new Date(now + userSessionDurationInHours * 60 * 60 * 1000),
          },
        },
      },
    );

    res.status(200).json({
      message: "Signed out",
    });
  } catch (error) {
    next(error);
  }
};

export default logout;
