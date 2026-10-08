/* eslint-disable no-param-reassign */

import { model, Schema } from "mongoose";

// This is the user schema used in the mongoDB database, if you change this schema, make sure to also change the types of the user data in the types folder.
const UserSchema = new Schema(
  {
    information: {
      _id: false,
      firstName: String,
      lastName: String,
      username: {
        type: String,
        required: true,
        unique: true,
      },
      email: {
        type: String,
        required: true,
        unique: true,
      },
      picture: String,
    },
    credentials: {
      _id: false,
      email: {
        type: String,
        required: true,
        unique: true,
      },
      username: {
        type: String,
        required: true,
        unique: true,
      },
      otpPassword: String,
      password: String,
    },

    isDisabled: {
      type: Boolean,
      default: false,
    },

    verificationToken: String,

    resetPasswordOnLogin: {
      type: Boolean,
      default: true,
    },
  },
  {
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (doc, ret) => {
        // ret.id = ret._id;
        delete ret._id;
        delete ret.credentials;
      },
    },
  }
);

const Users = model("Users", UserSchema, "users");

export default Users;
