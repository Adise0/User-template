import bcrypt from "bcrypt";
import { saltRounds } from "../../../data/serverConfig/server-config";

// This function hashes the passed string using bcrypt with using as many saltRounds as specified in server-config
const hashPassword = async (unhashedPassword: string): Promise<string> => {
  const salt = await bcrypt.genSalt(saltRounds);
  const hashedPassword = await bcrypt.hash(unhashedPassword, salt);

  return hashedPassword;
};

export default hashPassword;
