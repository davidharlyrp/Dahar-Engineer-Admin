import PocketBase from 'pocketbase';

// Connect to the PocketBase instance defined in .env
export const pb = new PocketBase(import.meta.env.VITE_PB_URL || 'http://127.0.0.1:8090');
pb.autoCancellation(false);

// Example: Authenticate as an admin or user if needed
// await pb.admins.authWithPassword('admin@example.com', 'password');

// Useful constants for collection names
export const COLLECTIONS = {
    USERS: 'users',
    COURSES: 'courses',
    FILES: 'files',
    PORTFOLIO: 'portfolio',
    CASHFLOW: 'cashflow',
};
