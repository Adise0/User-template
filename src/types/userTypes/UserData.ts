// This is a type for the user you want to manage internally, independent of the database schema
interface UserData {
  id?: string;
  information: {
    firstName: string;
    lastName: string;
    email: string;
    picture: string;
    username: string;
  };

  isDisabled: boolean;
  resetPasswordOnLogin: boolean;
  isVerified: boolean;
}

export interface CreatedUserData {
  _id?: string;
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
}
export default UserData;
