// utils/fcmHttpV1.js
import fs from "fs";
import path from "path";
import { GoogleAuth } from "google-auth-library";

const serviceAccountPath =
  process.env.FIREBASE_SERVICE_ACCOUNT_PATH ||
  path.join(process.cwd(), "config", "firebase-service-account.json");

let sa;
try {
  sa = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));
} catch (err) {
  console.error("fcmHttpV1: failed to read service account JSON at", serviceAccountPath, err);
  throw err;
}

const projectId = sa.project_id;
if (!projectId) throw new Error("service account JSON missing project_id");

const auth = new GoogleAuth({
  credentials: sa,
  scopes: ["https://www.googleapis.com/auth/cloud-platform"],
});

async function getAccessToken() {
  const client = await auth.getClient();
  const tokenResponse = await client.getAccessToken();
  // tokenResponse may be { token: 'xxx' } or string; normalize:
  const token = tokenResponse?.token || tokenResponse;
  if (!token) throw new Error("Failed to obtain access token for FCM HTTP v1");
  return token;
}

// sends a batch of tokens sequentially (you can adapt to parallel if desired)
export async function sendViaHttpV1(tokens = [], title = "", body = "") {
  if (!Array.isArray(tokens)) tokens = [tokens];
  if (tokens.length === 0) return [];

  const accessToken = await getAccessToken();
  const url = `https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`;

  const results = [];
  for (const token of tokens) {
    const payload = {
      message: {
        token,
        notification: { title, body },
        // optionally add data:
        // data: { type: 'daily_reminder' }
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    let json;
    try {
      json = await res.json();
    } catch (e) {
      json = null;
    }

    results.push({
      token,
      status: res.status,
      ok: res.ok,
      data: json,
    });
  }

  return results;
}
