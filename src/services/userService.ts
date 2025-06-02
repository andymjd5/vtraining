import { 
  getAuth, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  updateProfile 
} from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  updateDoc, 
  getDoc 
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { User, UserRole } from '../types';

const auth = getAuth();
const db = getFirestore();
const functions = getFunctions();

export const userService = {
  // Create a new user
  async createUser(userData: {
    email: string;
    name: string;
    role: UserRole;
    companyId?: string;
  }) {
    try {
      // Get current user (the one creating this user)
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Must be authenticated to create users');
      }

      // For creating users with different emails, you'll need to use Firebase Admin SDK
      // through a Cloud Function. Here's the client-side call:
      const createUserFunction = httpsCallable(functions, 'createUser');
      const result = await createUserFunction({
        email: userData.email,
        name: userData.name,
        role: userData.role,
        companyId: userData.companyId,
      });

      return result.data;
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  // Alternative method if you want to create users directly (they need to sign up themselves)
  async registerUser(userData: {
    email: string;
    password: string;
    name: string;
    role: UserRole;
    companyId?: string;
  }) {
    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );

      // Update display name
      await updateProfile(userCredential.user, {
        displayName: userData.name
      });

      // Create user profile in Firestore
      const userDoc = {
        id: userCredential.user.uid,
        email: userData.email,
        name: userData.name,
        role: userData.role,
        companyId: userData.companyId,
        createdBy: auth.currentUser?.uid || null,
        status: 'pending',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userDoc);

      return userDoc;
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  },

  // Get users by company
  async getUsersByCompany(companyId: string) {
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('companyId', '==', companyId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const users: any[] = [];

      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() });
      });

      return users;
    } catch (error) {
      console.error('Error getting users by company:', error);
      throw error;
    }
  },

  // Get all users (super admin only)
  async getAllUsers() {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, orderBy('createdAt', 'desc'));

      const querySnapshot = await getDocs(q);
      const users: any[] = [];

      // Get users with company and creator information
      for (const docSnapshot of querySnapshot.docs) {
        const userData = { id: docSnapshot.id, ...docSnapshot.data() };
        
        // Get company information if companyId exists
        if (userData.companyId) {
          const companyDoc = await getDoc(doc(db, 'companies', userData.companyId));
          if (companyDoc.exists()) {
            userData.company = { id: companyDoc.id, ...companyDoc.data() };
          }
        }

        // Get creator information if createdBy exists
        if (userData.createdBy) {
          const creatorDoc = await getDoc(doc(db, 'users', userData.createdBy));
          if (creatorDoc.exists()) {
            userData.createdByUser = { id: creatorDoc.id, ...creatorDoc.data() };
          }
        }

        users.push(userData);
      }

      return users;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  },

  // Update user status
  async updateUserStatus(userId: string, status: 'active' | 'inactive' | 'pending') {
    try {
      const userRef = doc(db, 'users', userId);
      
      await updateDoc(userRef, {
        status,
        updatedAt: new Date()
      });

      // Get updated user data
      const updatedDoc = await getDoc(userRef);
      if (updatedDoc.exists()) {
        return { id: updatedDoc.id, ...updatedDoc.data() };
      }
      
      throw new Error('User not found after update');
    } catch (error) {
      console.error('Error updating user status:', error);
      throw error;
    }
  },

  // Reset user password
  async resetUserPassword(email: string) {
    try {
      await sendPasswordResetEmail(auth, email, {
        url: `${window.location.origin}/reset-password`,
      });
    } catch (error) {
      console.error('Error sending password reset email:', error);
      throw error;
    }
  },

  // Get current user profile
  async getCurrentUserProfile() {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('No authenticated user');
      }

      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      if (userDoc.exists()) {
        return { id: userDoc.id, ...userDoc.data() };
      }
      
      return null;
    } catch (error) {
      console.error('Error getting current user profile:', error);
      throw error;
    }
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: Partial<User>) {
    try {
      const userRef = doc(db, 'users', userId);
      
      await updateDoc(userRef, {
        ...updates,
        updatedAt: new Date()
      });

      // Get updated user data
      const updatedDoc = await getDoc(userRef);
      if (updatedDoc.exists()) {
        return { id: updatedDoc.id, ...updatedDoc.data() };
      }
      
      throw new Error('User not found after update');
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }
};