// firebase-config.js — Firebase project credentials for Dominion
// Config is safe to expose publicly — security comes from Firestore Rules below.

const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBWgSaob3ZrUk6IOXeG_D3OKJaGQ9pVuW4",
  authDomain: "dominion-f9446.firebaseapp.com",
  projectId: "dominion-f9446",
  storageBucket: "dominion-f9446.firebasestorage.app",
  messagingSenderId: "31061068548",
  appId: "1:31061068548:web:616b61bd84ac266c60de51",
  measurementId: "G-0ZSHT34JQZ"
};

// Initialize Firebase
try {
  firebase.initializeApp(FIREBASE_CONFIG);
  window.FIREBASE_CONFIG_READY = true;
} catch (e) {
  console.warn('Firebase init failed:', e.message);
  window.FIREBASE_CONFIG_READY = false;
}

// ── Firestore Security Rules ──────────────────────────────────────────────────
// Paste these into Firebase Console → Firestore Database → Rules → Publish
//
// rules_version = '2';
// service cloud.firestore {
//   match /databases/{database}/documents {
//     match /users/{uid}/{document=**} {
//       allow read, write: if request.auth != null && request.auth.uid == uid;
//     }
//   }
// }
