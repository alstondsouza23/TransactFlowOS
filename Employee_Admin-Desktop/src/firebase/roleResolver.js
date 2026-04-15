// ─────────────────────────────────────────────────────────────────
//  Role Resolver — email + UID based role mapping (no backend needed)
//
//  HOW IT WORKS:
//    • An admin must match BOTH their email AND their Firebase UID
//    • If either doesn't match → treated as "employee"
//    • Every other Firebase user is automatically "employee"
//    • Emails are matched case-insensitively
//
//  HOW TO ADD AN ADMIN:
//    1. Get their email and UID from Firebase Console
//       → Authentication → Users → click the user → copy UID
//    2. Add an entry to ADMIN_USERS below
//    3. Save the file — done!
//
//  HOW TO ADD AN EMPLOYEE:
//    1. Create the user in Firebase Console → Authentication → Users
//    2. Do NOT add them here — employees are the default role
// ─────────────────────────────────────────────────────────────────

/**
 * Admin users — must match BOTH email AND uid.
 * uid:   Firebase Auth UID (from Console → Authentication → Users)
 * email: Registered Firebase email address
 *
 * @type {Array<{ uid: string, email: string }>}
 */
const ADMIN_USERS = [
  {
    uid:   't5NfFm9NfOhgWpDHQg7C5LlYe4q1',
    email: 'admin@ac.in',
  },
  // Add more admins here if needed:
  // { uid: 'ANOTHER_UID', email: 'another@admin.com' },
];

/**
 * Resolves the role of a Firebase user.
 * Checks BOTH email and UID — both must match for "admin" access.
 *
 * @param {string | null} email - The authenticated user's email.
 * @param {string | null} uid   - The authenticated user's Firebase UID.
 * @returns {"admin" | "employee"} The resolved role.
 */
export function resolveRole(email, uid) {
  if (!email || !uid) return 'employee';

  const normalizedEmail = email.toLowerCase().trim();

  const isAdmin = ADMIN_USERS.some(
    (admin) =>
      admin.uid === uid &&
      admin.email.toLowerCase() === normalizedEmail,
  );

  return isAdmin ? 'admin' : 'employee';
}
