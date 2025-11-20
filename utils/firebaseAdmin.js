// utils/firebaseAdmin.js
import adminImported from 'firebase-admin';
import fs from 'fs';
import path from 'path';

const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  path.join(process.cwd(), 'config', 'firebase-service-account.json');

let serviceAccount;
try {
  const raw = fs.readFileSync(serviceAccountPath, 'utf8');
  serviceAccount = JSON.parse(raw);
} catch (err) {
  console.error("firebaseAdmin: failed to read service account JSON at", serviceAccountPath, err);
  throw err;
}

// Normalize import (handles ESM default wrapper)
const admin = (adminImported && adminImported.default) ? adminImported.default : adminImported;

if (!admin.apps?.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),

    // <-- CRITICAL: enable legacy FCM API so sendMulticast/sendAll/sendToDevice exist
    messaging: {
      useLegacyFCM: true
    }
  });
}

console.log("firebase-admin initialized. SDK_VERSION=", admin.SDK_VERSION || "(unknown)");

export default admin;
export const getMessaging = () => {
  if (!admin || typeof admin.messaging !== 'function') throw new Error('admin.messaging() not available');
  return admin.messaging();
};
