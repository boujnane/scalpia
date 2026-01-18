export const ALLOWED_EMAILS = ["ady.boujnane@gmail.com"];

export function isAllowedAdminEmail(email?: string | null): boolean {
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.toLowerCase());
}
