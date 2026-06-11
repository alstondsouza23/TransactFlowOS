/**
 * src/lib/firestore.js — Employee_Admin-Desktop
 *
 * Thin re-export of the Firestore `db` instance from the existing
 * firebaseConfig.js so there is exactly ONE Firebase app initialisation
 * across the whole Employee/Admin desktop bundle.
 *
 * Import this file whenever you need direct Firestore access in a page
 * or hook — never call initializeApp() again elsewhere.
 *
 * @example
 *   import { db } from '../lib/firestore';
 *   import { collection, onSnapshot } from 'firebase/firestore';
 */
export { db } from '../firebase/firebaseConfig';
