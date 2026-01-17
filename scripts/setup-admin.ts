/**
 * Script to set up the first admin user
 *
 * Usage:
 *   npx ts-node scripts/setup-admin.ts <userId>
 *
 * Or add to package.json:
 *   "setup-admin": "ts-node scripts/setup-admin.ts"
 *   npm run setup-admin <userId>
 */

import { initializeApp, cert, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// Initialize Firebase Admin with service account
const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || "./service-account.json";

if (!getApps().length) {
  try {
    initializeApp({
      credential: cert(serviceAccountPath),
    });
  } catch (error) {
    console.error("❌ Failed to initialize Firebase Admin.");
    console.error("Make sure you have a service-account.json file or set GOOGLE_APPLICATION_CREDENTIALS");
    process.exit(1);
  }
}

const db = getFirestore();

async function setupAdmin(userId: string) {
  if (!userId) {
    console.error("❌ Please provide a userId");
    console.error("Usage: npx ts-node scripts/setup-admin.ts <userId>");
    process.exit(1);
  }

  console.log(`Setting up admin for user: ${userId}`);

  try {
    await db.collection("subscriptions").doc(userId).set({
      tier: "admin",
      createdAt: new Date(),
      expiresAt: null,
      updatedAt: new Date(),
    });

    console.log("✅ Admin subscription created successfully!");
    console.log(`   User ${userId} is now an admin.`);
  } catch (error) {
    console.error("❌ Failed to create admin subscription:", error);
    process.exit(1);
  }
}

// Get userId from command line arguments
const userId = process.argv[2];
setupAdmin(userId);
