import { Types } from "mongoose";
import Users from "../../../database/models/Users";

// Turns 2FA off and wipes everything tied to it, for the user doing it themselves or an admin.
const clearTwoFactor = async (userId: Types.ObjectId) => {
  await Users.updateOne(
    { _id: userId },
    { $set: { twoFactor: { backupCodes: [], challengeAttempts: 0 } } },
  );
};

export default clearTwoFactor;
