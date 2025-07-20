import { createContext, useState, useEffect, ReactNode, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserRole } from '../types';

interface User {
  id: string;
  uid: string;
  email: string;
  role: UserRole;
  companyId?: string;
  name: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  initializing: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string, expectedRole?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const defaultAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  initializing: true,
  error: null,
};

export const AuthContext = createContext<AuthContextType>({
  ...defaultAuthState,
  login: async () => {},
  logout: async () => {},
  loading: true,
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState);
  const navigate = useNavigate();

  useEffect(() => {
    console.log('AuthProvider: Setting up onAuthStateChanged listener');
    
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      console.log('AuthProvider: onAuthStateChanged triggered', { firebaseUser: firebaseUser?.uid });
      
      if (firebaseUser) {
        console.log('AuthProvider: User found, fetching profile data');
        await fetchUserData(firebaseUser);
      } else {
        console.log('AuthProvider: No user found, setting state to unauthenticated');
        setAuthState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          initializing: false,
          error: null,
        });
      }
    });

    return () => {
      console.log('AuthProvider: Cleaning up onAuthStateChanged listener');
      unsubscribe();
    };
  }, []);

  const fetchUserData = async (firebaseUser: FirebaseUser) => {
    try {
      console.log('DEBUG: fetchUserData called for UID:', firebaseUser.uid);
      
      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);
      console.log('DEBUG: userDoc.id =', userDoc.id, '| exists =', userDoc.exists());

      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }

      const userData = userDoc.data();
      
      // Update last login time
      await setDoc(userDocRef, {
        lastLogin: serverTimestamp()
      }, { merge: true });

      console.log('AuthProvider: User data fetched successfully', userData);

      setAuthState({
        user: {
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          role: userData.role,
          companyId: userData.companyId,
          name: userData.name,
        },
        isAuthenticated: true,
        isLoading: false,
        initializing: false,
        error: null,
      });
    } catch (error) {
      console.error('AuthProvider: Error fetching user data:', error);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        initializing: false,
        error: 'Error fetching user data',
      });
    }
  };

  const redirectBasedOnRole = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        navigate('/super-admin/dashboard');
        break;
      case UserRole.COMPANY_ADMIN:
        navigate('/company-admin/dashboard');
        break;
      case UserRole.STUDENT:
        navigate('/student/dashboard');
        break;
      default:
        navigate('/login');
        break;
    }
  };

  const login = async (email: string, password: string, expectedRole?: UserRole) => {
    console.log('AuthProvider: Login attempt started');
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);

      // DEBUG: Add UID log
      console.log("DEBUG: Login - Firebase UID used:", firebaseUser.uid);

      const userDocRef = doc(db, 'users', firebaseUser.uid);
      const userDoc = await getDoc(userDocRef);

      // DEBUG: Add userDoc log
      console.log("DEBUG: userDoc.id =", userDoc.id, "| exists =", userDoc.exists());

      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }

      const userData = userDoc.data();

      console.log("Données utilisateur récupérées depuis Firestore :", userData);

      if (!userData || !userData.role) {
        throw new Error("User role is undefined in Firestore.");
      }

      if (expectedRole && userData.role !== expectedRole) {
        throw new Error(`Access denied: role mismatch. Expected ${expectedRole}, got ${userData.role}`);
      }

      // Update last login time
      await setDoc(userDocRef, {
        lastLogin: serverTimestamp()
      }, { merge: true });

      setAuthState({
        user: {
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: firebaseUser.email!,
          role: userData.role,
          companyId: userData.companyId,
          name: userData.name,
        },
        isAuthenticated: true,
        isLoading: false,
        initializing: false,
        error: null,
      });

      console.log('AuthProvider: Login successful, redirecting based on role');
      redirectBasedOnRole(userData.role);
    } catch (error: any) {
      console.error('AuthProvider: Login error:', error);
      setAuthState(prev => ({
        ...prev,
        isLoading: false,
        error: error.message || 'An error occurred during login',
      }));
      throw error;
    }
  };

  const logout = async () => {
    try {
      console.log('AuthProvider: Logout started');
      await firebaseSignOut(auth);
      setAuthState({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        initializing: false,
        error: null,
      });
      console.log('AuthProvider: Logout successful');
      navigate('/');
    } catch (error) {
      console.error('AuthProvider: Logout error:', error);
      setAuthState(prev => ({
        ...prev,
        error: 'Error during logout',
      }));
    }
  };

  // Create context value with loading alias
  const contextValue: AuthContextType = {
    ...authState,
    loading: authState.initializing,
    login,
    logout,
  };

  console.log('AuthProvider: Current state', {
    user: authState.user?.uid,
    isAuthenticated: authState.isAuthenticated,
    initializing: authState.initializing,
    loading: authState.initializing
  });

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};