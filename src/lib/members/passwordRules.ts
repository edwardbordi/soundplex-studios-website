/**
 * Password rules for member accounts (Ed, 2026-10-30), ported from the Visibility Tracker: each
 * rule lights up as it's met while the member types (ProfileForm), and all must pass to save.
 */
export interface PasswordRule {
  id: string;
  label: string;
  test: (password: string, confirm: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  { id: "min-length", label: "At least 8 characters", test: (p) => p.length >= 8 },
  { id: "case", label: "Uppercase and lowercase letters", test: (p) => /[A-Z]/.test(p) && /[a-z]/.test(p) },
  { id: "number", label: "At least one number", test: (p) => /[0-9]/.test(p) },
  { id: "special", label: "At least one special character (e.g. !@#$)", test: (p) => /[^A-Za-z0-9]/.test(p) },
  { id: "match", label: "Passwords match", test: (p, c) => p.length > 0 && p === c },
];

export const passwordOk = (password: string, confirm: string) => PASSWORD_RULES.every((r) => r.test(password, confirm));
