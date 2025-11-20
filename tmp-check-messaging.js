// tmp-check-messaging.js (ESM)
import adminRaw from './utils/firebaseAdmin.js';

const admin = (adminRaw && adminRaw.default) ? adminRaw.default : adminRaw;

console.log('ADMIN TOP-LEVEL KEYS:', Object.keys(admin || {}));
console.log('admin.messaging type:', typeof (admin && admin.messaging));

try {
  const messaging = admin.messaging();
  console.log('MESSAGING KEYS:', Object.keys(messaging || {}));
} catch (err) {
  console.error('messaging() threw:', err && err.message);
}

console.log('admin.SDK_VERSION:', admin?.SDK_VERSION || '<none>');
