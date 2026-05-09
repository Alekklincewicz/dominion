// firebase-config.js — Fill in your Firebase project credentials
// Get these from: Firebase Console (console.firebase.google.com)
// → Your Project → Project Settings → Your Apps → Web App → SDK Setup
//
// After filling in, deploy to Vercel. The config is safe to expose publicly —
// Firebase security comes from Firestore Security Rules, not hiding this file.

const FIREBASE_CONFIG = {
  apiKey: "REPLACE_WITH_YOUR_FIREBASE_API_KEY",
  authDomain: "REPLACE_WITH_YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "REPLACE_WITH_YOUR_PROJECT_ID",
  storageBucket: "REPLACE_WITH_YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "REPLACE_WITH_YOUR_SENDER_ID",
  appId: "REPLACE_WITH_YOUR_APP_ID"
};

// Initialize Firebase (only if credentials have been filled in)
if (FIREBASE_CONFIG.apiKey && !FIREBASE_CONFIG.apiKey.startsWith('REPLACE_')) {
  try {
    firebase.initializeApp(FIREBASE_CONFIG);
    window.FIREBASE_CONFIG_READY = true;
  } catch (e) {
    console.warn('Firebase init failed:', e.message);
    window.FIREBASE_CONFIG_READY = false;
  }
} else {
  window.FIREBASE_CONFIG_READY = false;
}

// Firestore Security Rules to paste into Firebase Console → Firestore → Rules:
//
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     match /users/{uid}/{document=**} {
//       allow read, write: if request.auth != null && request.auth.uid == uid;
//     }
//   }
// }
