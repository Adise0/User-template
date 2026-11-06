import { Types } from "mongoose";
import Users from "../../../database/models/Users";

type EmailSlotField =
  | "activationLastSentAt"
  | "credentials.otpLastSentAt"
  | "emailChangeLastSentAt"
  | "resetPasswordLastSentAt";

// Atomically stamps the "last sent at" field unless the cooldown is still running, and tells if
// the caller won. Doing the check and the stamp in one step, BEFORE sending, means parallel
// requests can't all see an expired cooldown and send an email each. If the email then fails the
// slot stays used, so the retry has to wait for the cooldown.
const claimEmailSlot = async (
  userId: Types.ObjectId,
  field: EmailSlotField,
  cooldownInSeconds: number,
): Promise<boolean> => {
  const cooldownStart = new Date(Date.now() - cooldownInSeconds * 1000);

  const claimedUser = await Users.findOneAndUpdate(
    {
      _id: userId,
      $or: [{ [field]: null }, { [field]: { $lte: cooldownStart } }],
    },
    { $set: { [field]: new Date() } },
  );

  return Boolean(claimedUser);
};

export default claimEmailSlot;
