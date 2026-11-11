import { model, Schema } from "mongoose";
import DatabaseUserData from "../../types/userTypes/DatabaseUserData";
import UserRole from "../../types/userTypes/UserRole";

// This is the user schema used in the mongoDB database, if you change this schema, make sure to also change the types of the user data in the types folder.
const UserSchema = new Schema<DatabaseUserData>(
  {
    // Public profile data. The username here keeps the casing the user typed, for display.
    information: {
      _id: false,
      firstName: String,
      lastName: String,
      username: {
        type: String,
        required: true,
      },
      email: {
        type: String,
        required: true,
      },
    },
    // Source of truth for logins and uniqueness. Both keys are stored lowercased.
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
      otpExpiresAt: Date,
      // Counts every OTP login attempt against the current OTP, it's wiped once the limit is reached.
      otpAttempts: {
        type: Number,
        default: 0,
      },
      // Survives the OTP being wiped, so burning through the attempts doesn't skip the cooldown.
      otpLastSentAt: Date,
      password: String,
    },

    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.user,
    },

    isDisabled: {
      type: Boolean,
      default: false,
    },

    // Set when the account is activated, an account without it is still pending.
    activatedAt: Date,

    // The tokens below are stored as SHA-256 hashes (see hashToken), never raw.
    verificationToken: String,

    otpRevokeToken: String,

    resetPasswordToken: String,

    emailChangeToken: String,

    activationLastSentAt: Date,

    resetPasswordLastSentAt: Date,

    emailChangeLastSentAt: Date,

    // The new address of an email change, until the link sent to it is used.
    pendingEmail: String,

    // Sessions signed out one by one. An entry can go once every token of that session has expired.
    revokedSessions: [
      {
        _id: false,
        sessionId: String,
        expiresAt: Date,
      },
    ],

    // Only set on pending accounts: MongoDB deletes the account once this date passes (TTL index).
    // Activation has to unset it, or the account would be deleted anyway.
    pendingExpiresAt: {
      type: Date,
      expires: 0,
    },

    // Only set on accounts their owner deleted: MongoDB deletes the account once this date passes
    // (TTL index). Logging in before then unsets it, which cancels the deletion.
    scheduledDeletionAt: {
      type: Date,
      expires: 0,
    },

    // Sign-in providers (Google, Apple...) linked to the account. providerId is the provider's own
    // id for the user, which never changes, unlike the email.
    oauthAccounts: [
      {
        _id: false,
        provider: { type: String, required: true },
        providerId: { type: String, required: true },
        email: String,
        linkedAt: { type: Date, required: true },
      },
    ],

    // Time-based one-time codes (authenticator apps). On once enabledAt is set.
    twoFactor: {
      _id: false,
      secret: String,
      pendingSecret: String,
      enabledAt: Date,
      backupCodes: { type: [String], default: [] },
      lastUsedStep: Number,
      challengeId: String,
      challengeAttempts: { type: Number, default: 0 },
    },

    // Stamped into every session token; bumping it invalidates all previously issued sessions.
    tokenVersion: {
      type: Number,
      default: 0,
    },

    // Set by an admin forcing a password reset: login is refused until the password is changed.
    resetPasswordOnLogin: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform: (_doc, ret) => {
        const json: Record<string, unknown> = ret;

        delete json._id;
        delete json.credentials;
        delete json.tokenVersion;
        delete json.verificationToken;
        delete json.activationLastSentAt;
        delete json.pendingExpiresAt;
        delete json.otpRevokeToken;
        delete json.resetPasswordToken;
        delete json.resetPasswordLastSentAt;
        delete json.pendingEmail;
        delete json.emailChangeToken;
        delete json.emailChangeLastSentAt;
        delete json.revokedSessions;
        delete json.twoFactor;
      },
    },
  },
);

// One provider account can only ever be linked to one user. Partial, so the many users without any
// linked account don't all clash on a missing value.
UserSchema.index(
  { "oauthAccounts.provider": 1, "oauthAccounts.providerId": 1 },
  { unique: true, partialFilterExpression: { "oauthAccounts.providerId": { $exists: true } } },
);

const Users = model<DatabaseUserData>("Users", UserSchema, "users");

export default Users;
