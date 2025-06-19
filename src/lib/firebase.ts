import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Set custom claims for user roles
export const setUserRole = async (uid: string, role: string) => {
  try {
    // This would typically be done through a Cloud Function
    console.log(`Setting role ${role} for user ${uid}`);
    // In a real implementation, you would call a Cloud Function here
  } catch (error) {
    console.error('Error setting user role:', error);
    throw error;
  }
};

// Initialize collections with security rules
export const initializeFirebaseRules = async () => {
  // This is just a placeholder - in a real app, you would set up security rules in the Firebase console
  console.log('Initializing Firebase security rules');
};