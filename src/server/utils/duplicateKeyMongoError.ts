import ControlledError from "../../data/errorObjects/ControlledError";
import { getDuplicateKeyRegistrationError } from "../../data/errorObjects/userErrors";

type DuplicateKeyMongoError = Error & { code: 11000; keyPattern?: Record<string, number> };

// MongoDB's own error when a write breaks a unique index. Checks that run before a write can always
// be beaten by another request, the index is what really guarantees uniqueness.
export const isDuplicateKeyMongoError = (error: unknown): error is DuplicateKeyMongoError =>
  (error as { code?: number }).code === 11000;

export const getDuplicateKeyErrorFromMongoError = (
  error: DuplicateKeyMongoError,
): ControlledError =>
  getDuplicateKeyRegistrationError({
    email: Boolean(error.keyPattern?.["credentials.email"]),
    username: Boolean(error.keyPattern?.["credentials.username"]),
  });
