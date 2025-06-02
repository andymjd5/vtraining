import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { UserRole } from '../types';

const serviceAccount = {
  "type": "service_account",
  "project_id": "vtproject-ee916",
  "private_key_id": "your-private-key-id",
  "private_key": "your-private-key",
  "client_email": "firebase-adminsdk-xxxxx@vtproject-ee916.iam.gserviceaccount.com",
  "client_id": "your-client-id",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "your-cert-url"
};

// Initialize Firebase Admin
const app = initializeApp({
  credential: cert(serviceAccount)
});

const auth = getAuth(app);
const db = getFirestore(app);

const users = [
  {
    email: 'superadmin@visiontraining.cd',
    password: 'Huaweiy300!',
    role: UserRole.SUPER_ADMIN,
    name: 'Super Administrator'
  },
  {
    email: 'admin.fonarev@visiontraining.cd',
    password: 'Huaweiy300!',
    role: UserRole.COMPANY_ADMIN,
    companyId: 'fonarev',
    name: 'FONAREV Administrator'
  },
  // Add all other users here...
];

const createUsers = async () => {
  for (const user of users) {
    try {
      // Create user in Firebase Auth
      const userRecord = await auth.createUser({
        email: user.email,
        password: user.password,
        displayName: user.name,
      });

      // Create user document in Firestore
      await db.collection('users').doc(userRecord.uid).set({
        email: user.email,
        name: user.name,
        role: user.role,
        companyId: user.companyId,
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      });

      console.log(`Created user: ${user.email}`);
    } catch (error) {
      console.error(`Error creating user ${user.email}:`, error);
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