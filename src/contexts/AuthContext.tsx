import { createContext, useState, useEffect, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User as FirebaseUser,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserRole } from '../types';

interface User {
  id: string;
  email: string;
  role: UserRole;
  companyId?: string;
  name: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string, expectedRole?: UserRole) => Promise<void>;
  logout: () => Promise<void>;
}

const defaultAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

export const AuthContext = createContext<AuthContextType>({
  ...defaultAuthState,
  login: async () => {},
  logout: async () => {},
});

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [authState, setAuthState] = useState<AuthState>(defaultAuthState);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await fetchUserData(firebaseUser);
      } else {
        setAuthState({
          ...defaultAuthState,
          isLoading: false,
        });
      }
    });

    return () => unsubscribe();
  }, []);

  const fetchUserData = async (firebaseUser: FirebaseUser) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }

      const rawData = userDoc.data();
      const userData = {
        ...rawData,
        role: String(rawData.role),
      } as User;

      setAuthState({
        user: {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          role: userData.role,
          companyId: userData.companyId,
          name: userData.name,
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching user data:', error);
      setAuthState({
        ...defaultAuthState,
        isLoading: false,
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
        navigate('/dashboard');
        break;
      default:
        navigate('/login');
        break;
    }
  };

  const login = async (email: string, password: string, expectedRole?: UserRole) => {
    setAuthState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const { user: firebaseUser } = await signInWithEmailAndPassword(auth, email, password);
      const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));

      if (!userDoc.exists()) {
        throw new Error('User profile not found');
      }

      const rawData = userDoc.data();
      const userData = {
        ...rawData,
        role: String(rawData.role),
      } as User;

      console.log("Données utilisateur récupérées depuis Firestore :", userData);

      if (!userData || !userData.role) {
        throw new Error("User role is undefined in Firestore.");
      }

      if (expectedRole && userData.role !== expectedRole) {
        throw new Error(`Access denied: role mismatch. Expected ${expectedRole}, got ${userData.role}`);
      }

      setAuthState({
        user: {
          id: firebaseUser.uid,
          email: firebaseUser.email!,
          role: userData.role,
          companyId: userData.companyId,
          name: userData.name,
        },
        isAuthenticated: true,
        isLoading: false,
        error: null,
      });

      redirectBasedOnRole(userData.role);
    } catch (error: any) {
      console.error('Login error:', error);
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
      await firebaseSignOut(auth);
      setAuthState({
        ...defaultAuthState,
        isLoading: false,
      });
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      setAuthState(prev => ({
        ...prev,
        error: 'Error during logout',
      }));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...authState,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
