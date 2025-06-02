import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserRole } from '../types';

const firebaseConfig = {
  apiKey: "AIzaSyDppSP-PUxX31lTM_DGezxthpq_oId8Ya0",
  authDomain: "vtproject-ee916.firebaseapp.com",
  projectId: "vtproject-ee916",
  storageBucket: "vtproject-ee916.firebasestorage.app",
  messagingSenderId: "165874074792",
  appId: "1:165874074792:web:6784e9563fc9623c69ee9d"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const users = [
  {
    email: 'superadmin@visiontraining.cd',
    password: 'Huaweiy300!',
    name: 'Super Administrator',
    role: UserRole.SUPER_ADMIN,
  },
  {
    email: 'admin.fonarev@visiontraining.cd',
    password: 'Huaweiy300!',
    name: 'FONAREV Administrator',
    role: UserRole.COMPANY_ADMIN,
    companyId: 'fonarev',
  },
  {
    email: 'admin.unikin@visiontraining.cd',
    password: 'Huaweiy300!',
    name: 'UNIKIN Administrator',
    role: UserRole.COMPANY_ADMIN,
    companyId: 'unikin',
  },
  {
    email: 'admin.vision26@visiontraining.cd',
    password: 'Huaweiy300!',
    name: 'VISION 26 Administrator',
    role: UserRole.COMPANY_ADMIN,
    companyId: 'vision26',
  },
  {
    email: 'admin.pnjt@visiontraining.cd',
    password: 'Huaweiy300!',
    name: 'PNJT Administrator',
    role: UserRole.COMPANY_ADMIN,
    companyId: 'pnjt',
  },
  {
    email: 'admin.besdu@visiontraining.cd',
    password: 'Huaweiy300!',
    name: 'BESDU Administrator',
    role: UserRole.COMPANY_ADMIN,
    companyId: 'besdu',
  },
  {
    email: 'etudiant1.fonarev@visiontraining.cd',
    password: 'Huaweiy300!',
    name: 'FONAREV Student',
    role: UserRole.STUDENT,
    companyId: 'fonarev',
  },
  {
    email: 'etudiant2.unikin@visiontraining.cd',
    password: 'Huaweiy300!',
    name: 'UNIKIN Student',
    role: UserRole.STUDENT,
    companyId: 'unikin',
  },
  {
    email: 'etudiant3.vision26@visiontraining.cd',
    password: 'Huaweiy300!',
    name: 'VISION 26 Student',
    role: UserRole.STUDENT,
    companyId: 'vision26',
  },
  {
    email: 'etudiant4.pnjt@visiontraining.cd',
    password: 'Huaweiy300!',
    name: 'PNJT Student',
    role: UserRole.STUDENT,
    companyId: 'pnjt',
  },
  {
    email: 'etudiant5.besdu@visiontraining.cd',
    password: 'Huaweiy300!',
    name: 'BESDU Student',
    role: UserRole.STUDENT,
    companyId: 'besdu',
  },
];

const createUsers = async () => {
  for (const user of users) {
    try {
      // Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        user.email,
        user.password
      );

      // Create user document in Firestore
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      console.log(`Created user: ${user.email}`);
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        console.log(`User already exists: ${user.email}`);
      } else {
        console.error(`Error creating user ${user.email}:`, error);
      }
    }
  }
};

createUsers().then(() => {
  console.log('Finished creating users');
  process.exit(0);
}).catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});