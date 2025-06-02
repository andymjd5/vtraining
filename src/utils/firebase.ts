import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDocs, 
  query, 
  where, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { UserRole } from '../types';

export const createTestUsers = async () => {
  const users = [
    {
      email: 'superadmin@visiontraining.cd',
      role: UserRole.SUPER_ADMIN,
      name: 'Super Administrator',
      password: 'Huaweiy300!',
    },
    {
      email: 'admin.fonarev@visiontraining.cd',
      role: UserRole.COMPANY_ADMIN,
      companyId: 'fonarev',
      name: 'FONAREV Administrator',
      password: 'Huaweiy300!',
    },
    {
      email: 'admin.unikin@visiontraining.cd',
      role: UserRole.COMPANY_ADMIN,
      companyId: 'unikin',
      name: 'UNIKIN Administrator',
      password: 'Huaweiy300!',
    },
    {
      email: 'admin.vision26@visiontraining.cd',
      role: UserRole.COMPANY_ADMIN,
      companyId: 'vision26',
      name: 'VISION 26 Administrator',
      password: 'Huaweiy300!',
    },
    {
      email: 'admin.pnjt@visiontraining.cd',
      role: UserRole.COMPANY_ADMIN,
      companyId: 'pnjt',
      name: 'PNJT Administrator',
      password: 'Huaweiy300!',
    },
    {
      email: 'admin.besdu@visiontraining.cd',
      role: UserRole.COMPANY_ADMIN,
      companyId: 'besdu',
      name: 'BESDU Administrator',
      password: 'Huaweiy300!',
    },
    {
      email: 'etudiant1.fonarev@visiontraining.cd',
      role: UserRole.STUDENT,
      companyId: 'fonarev',
      name: 'FONAREV Student',
      password: 'Huaweiy300!',
    },
    {
      email: 'etudiant2.unikin@visiontraining.cd',
      role: UserRole.STUDENT,
      companyId: 'unikin',
      name: 'UNIKIN Student',
      password: 'Huaweiy300!',
    },
    {
      email: 'etudiant3.vision26@visiontraining.cd',
      role: UserRole.STUDENT,
      companyId: 'vision26',
      name: 'VISION 26 Student',
      password: 'Huaweiy300!',
    },
    {
      email: 'etudiant4.pnjt@visiontraining.cd',
      role: UserRole.STUDENT,
      companyId: 'pnjt',
      name: 'PNJT Student',
      password: 'Huaweiy300!',
    },
    {
      email: 'etudiant5.besdu@visiontraining.cd',
      role: UserRole.STUDENT,
      companyId: 'besdu',
      name: 'BESDU Student',
      password: 'Huaweiy300!',
    },
  ];

  for (const user of users) {
    try {
      // Check if user already exists
      const q = query(collection(db, 'users'), where('email', '==', user.email));
      const querySnapshot = await getDocs(q);
      
      if (querySnapshot.empty) {
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, user.email, user.password);
        
        // Create user document in Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email: user.email,
          role: user.role,
          companyId: user.companyId,
          name: user.name,
          status: 'active',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });

        console.log(`Created user: ${user.email}`);
      } else {
        console.log(`User already exists: ${user.email}`);
      }
    } catch (error) {
      console.error(`Error creating user ${user.email}:`, error);
    }
  }
};

export const loginWithRole = async (
  email: string, 
  password: string, 
  expectedRole?: UserRole
) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  const userDoc = await getDocs(
    query(collection(db, 'users'), where('email', '==', email))
  );

  if (userDoc.empty) {
    throw new Error('User not found');
  }

  const userData = userDoc.docs[0].data();
  
  if (expectedRole && userData.role !== expectedRole) {
    await signOut(auth);
    throw new Error(`Access denied for role ${userData.role}`);
  }

  return {
    user: userCredential.user,
    role: userData.role,
    companyId: userData.companyId,
  };
};

export const createCompany = async (
  name: string,
  urlSlug: string,
  contactEmail: string,
  logoUrl?: string,
  contactPhone?: string,
  address?: string
) => {
  const companyRef = doc(db, 'companies', urlSlug);
  await setDoc(companyRef, {
    name,
    urlSlug,
    logoUrl,
    contactEmail,
    contactPhone,
    address,
    active: true,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
};