import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getStorage } from 'firebase/storage';
import { getFunctions } from 'firebase/functions';

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDppSP-PUxX31lTM_DGezxthpq_oId8Ya0",
  authDomain: "vtproject-ee916.firebaseapp.com",
  projectId: "vtproject-ee916",
  storageBucket: "vtproject-ee916.firebasestorage.app",
  messagingSenderId: "165874074792",
  appId: "1:165874074792:web:6784e9563fc9623c69ee9d"
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