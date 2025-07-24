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
import { User, UserRole, Company } from '../types';

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
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Must be authenticated to create users');
      }
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
      const userCredential = await createUserWithEmailAndPassword(
        auth, 
        userData.email, 
        userData.password
      );
      await updateProfile(userCredential.user, {
        displayName: userData.name
      });
      const userDoc = {
        id: userCredential.user.uid,
        email: userData.email,
        name: userData.name,
        fullName: userData.name,
        displayName: userData.name,
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

  // Get students by company
  async getStudentsByCompany(companyId: string): Promise<User[]> {
    try {
      const usersRef = collection(db, 'users');
      const q = query(
        usersRef,
        where('companyId', '==', companyId),
        where('role', 'in', [UserRole.STUDENT, UserRole.AGENT]),
        orderBy('name', 'asc')
      );
      const querySnapshot = await getDocs(q);
      const users: User[] = [];
      querySnapshot.forEach((doc) => {
        users.push({ id: doc.id, ...doc.data() } as User);
      });
      return users;
    } catch (error) {
      console.error('Error getting students by company:', error);
      throw error;
    }
  },

  // Get all users
  async getAllUsers() {
    try {
      const usersRef = collection(db, 'users');
      const querySnapshot = await getDocs(usersRef);
      const users: User[] = [];

      for (const docSnapshot of querySnapshot.docs) {
        const userData = { id: docSnapshot.id, ...docSnapshot.data() } as User;
        
        if (!userData.name && userData.fullName) {
          userData.name = userData.fullName;
        }
        if (!userData.name && userData.displayName) {
          userData.name = userData.displayName;
        }
        
        if (!userData.status) {
          userData.status = 'pending';
        }

        if (userData.companyId) {
          try {
            const companyDoc = await getDoc(doc(db, 'companies', userData.companyId));
            if (companyDoc.exists()) {
              userData.company = { id: companyDoc.id, ...companyDoc.data() } as Company;
            }
          } catch (companyError) {
            console.warn('Erreur lors de la récupération de l\'entreprise:', companyError);
          }
        }

        if (userData.createdBy) {
          try {
            const creatorDoc = await getDoc(doc(db, 'users', userData.createdBy));
            if (creatorDoc.exists()) {
              userData.createdByUser = { id: creatorDoc.id, ...creatorDoc.data() };
            }
          } catch (creatorError) {
            console.warn('Erreur lors de la récupération du créateur:', creatorError);
          }
        }
        users.push(userData);
      }

      // Tri robuste qui gère Firebase Timestamps, strings ISO, et undefined
      users.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        
        // Vérifier que les dates sont valides
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) {
          return 0; // Garde l'ordre actuel si les dates sont invalides
        }
        
        return dateB.getTime() - dateA.getTime();
      });

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
      const updateData: Partial<User> & { updatedAt: Date } = {
        ...updates,
        updatedAt: new Date()
      };
      
      if (updates.name) {
        updateData.fullName = updates.name;
        updateData.displayName = updates.name;
      }
      
      await updateDoc(userRef, updateData as { [x: string]: any });

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