// lib/firebase-admin.ts
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

function getServiceAccount() {
  // Option A: JSON complet en env (recommandé sur Vercel)
  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT_JSON");
  return JSON.parse(json);
}

export function adminApp() {
  if (!getApps().length) {
    const sa = getServiceAccount();
    initializeApp({
      credential: cert(sa),
    });
  }
  return;
}

export const adminAuth = () => {
  adminApp();
  return getAuth();
};

export const adminDb = () => {
  adminApp();
  return getFirestore();
};
