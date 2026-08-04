import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 10;
export const PASSWORD_MAX_LENGTH = 128;

export const PASSWORD_REQUIREMENTS_HINT =
  "At least 10 characters, with uppercase, lowercase, a number, and a symbol.";

/** Returns an error message, or null if the password meets policy. */
export function getPasswordStrengthError(password: string): string | null {
  if (password.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }
  if (password.length > PASSWORD_MAX_LENGTH) {
    return `Password must be at most ${PASSWORD_MAX_LENGTH} characters.`;
  }
  if (!/[a-z]/.test(password)) {
    return "Password must include a lowercase letter.";
  }
  if (!/[A-Z]/.test(password)) {
    return "Password must include an uppercase letter.";
  }
  if (!/[0-9]/.test(password)) {
    return "Password must include a number.";
  }
  if (!/[^A-Za-z0-9\s]/.test(password)) {
    return "Password must include a symbol (e.g. !@#$%).";
  }
  if (/\s/.test(password)) {
    return "Password cannot contain spaces.";
  }
  return null;
}

export const strongPasswordSchema = z
  .string()
  .max(PASSWORD_MAX_LENGTH)
  .superRefine((value, ctx) => {
    const message = getPasswordStrengthError(value);
    if (message) {
      ctx.addIssue({ code: "custom", message });
    }
  });
