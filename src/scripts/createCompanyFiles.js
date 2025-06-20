import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, getDocs, query, where, serverTimestamp } from 'firebase/firestore';

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDppSP-PUxX31lTM_DGezxthpq_oId8Ya0",
  authDomain: "vtproject-ee916.firebaseapp.com",
  projectId: "vtproject-ee916",
  storageBucket: "vtproject-ee916.firebasestorage.app",
  messagingSenderId: "165874074792",
  appId: "1:165874074792:web:6784e9563fc9623c69ee9d"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Create company files
const createCompanyFiles = async () => {
  try {
    // Get companies
    const companiesQuery = query(collection(db, 'companies'));
    const companiesSnapshot = await getDocs(companiesQuery);
    const companies = companiesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Sample file data
    const fileTypes = [
      { name: 'Guide de formation.pdf', type: 'application/pdf', size: 2500000 },
      { name: 'Calendrier des cours.xlsx', type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', size: 1200000 },
      { name: 'Manuel utilisateur.docx', type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', size: 1800000 },
      { name: 'Présentation entreprise.pptx', type: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', size: 3000000 }
    ];

    // Create files for each company
    for (const company of companies) {
      // Add 2-3 files per company
      const numFiles = 2 + Math.floor(Math.random() * 2);
      
      for (let i = 0; i < numFiles; i++) {
        const fileType = fileTypes[Math.floor(Math.random() * fileTypes.length)];
        const fileRef = doc(collection(db, 'companyFiles'));
        
        await setDoc(fileRef, {
          name: fileType.name,
          originalName: fileType.name,
          size: fileType.size,
          type: fileType.type,
          companyId: company.id,
          path: `companies/${company.id}/files/${Date.now()}-${fileType.name}`,
          url: `https://example.com/files/${company.id}/${fileType.name}`, // Mock URL
          uploadedAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000)), // Random date in the last month
          uploadedBy: null
        });
      }
    }

    console.log('✅ Company files created successfully');
  } catch (error) {
    console.error('❌ Error creating company files:', error);
  }
};

// Run the initialization
createCompanyFiles();