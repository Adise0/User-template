import { Document } from "mongoose";

// This is a type for the expected object received from the database
interface DatabaseUserData extends Document {
  _id?: string;
  id?: string;
  information: {
    firstName?: string;
    lastName?: string;
    email: string;
    picture?: string;
    username: string;
  };

  credentials: {
    email: string;
    password?: string;
    otpPassword?: string;
    username: string;
  };

  isDisabled: boolean;
  resetPasswordOnLogin: boolean;
  verificationToken?: string;
}

export default DatabaseUserData;
