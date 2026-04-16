// ─────────────────────────────────────────────────────────────────
//  Role Resolver — strict email + UID based role mapping
//
//  HOW IT WORKS:
//    • Admin: Must match BOTH email AND UID in ADMIN_USERS.
//    • Employee: Must match BOTH email AND UID in EMPLOYEE_USERS.
//    • Every other user: Categorized as "client" (Access Denied).
//    • Emails are matched case-insensitively.
// ─────────────────────────────────────────────────────────────────

/**
 * Admin users — must match BOTH email AND uid.
 * @type {Array<{ uid: string, email: string }>}
 */
const ADMIN_USERS = [
  {
    uid:   't5NfFm9NfOhgWpDHQg7C5LlYe4q1',
    email: 'admin@ac.in',
  },
];

/**
 * Employee users — must match BOTH email AND uid.
 * @type {Array<{ uid: string, email: string }>}
 */
const EMPLOYEE_USERS = [
  {
    uid:   'LSGBwob5COY39I7wuQZSJUHlWaY2',
    email: 'employee@ac.in',
  },
];

/**
 * Resolves the role of a Firebase user.
 * 
 * @param {string | null} email - The authenticated user's email.
 * @param {string | null} uid   - The authenticated user's Firebase UID.
 * @returns {"admin" | "employee" | "client"}
 */
export function resolveRole(email, uid) {
  if (!email || !uid) return 'client';

  const normalizedEmail = email.toLowerCase().trim();

  // 1. Check for Admin
  const isAdmin = ADMIN_USERS.some(
    (u) => u.uid === uid && u.email.toLowerCase() === normalizedEmail
  );
  if (isAdmin) return 'admin';

  // 2. Check for Employee
  const isEmployee = EMPLOYEE_USERS.some(
    (u) => u.uid === uid && u.email.toLowerCase() === normalizedEmail
  );
  if (isEmployee) return 'employee';

  // 3. Fallback for everyone else
  return 'client';
}
