export const ADMIN_EMAIL = "shane.kronstedt@bcm.edu";

export function isAdminEmail(email: string | null | undefined) {
  return (email ?? "").trim().toLowerCase() === ADMIN_EMAIL;
}
