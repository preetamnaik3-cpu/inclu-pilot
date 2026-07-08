export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** Comma-separated manager Google emails allowed to run the manager portal. */
export function getAllowedManagerEmails(): string[] {
  return (process.env.ALLOWED_MANAGER_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isAllowedManagerEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  const allowed = getAllowedManagerEmails();
  return allowed.length > 0 && allowed.includes(normalized);
}
