import { db, storage } from '../lib/firebase';
import {
  collection,
  addDoc,
  getDocs,
  doc,
  updateDoc,
  serverTimestamp,
  query,
  where,
  getDoc,
  setDoc,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { LibraryResource, CompanyLibrary } from '../types/library';

const resourcesCollection = collection(db, 'library_resources');
const companyLibraryCollection = collection(db, 'company_library');

export const uploadResource = async (file: File, uploaderId: string): Promise<LibraryResource> => {
  if (!file) throw new Error('Aucun fichier sélectionné.');

  const fileType = file.name.split('.').pop() || '';
  const filePath = `library/${Date.now()}_${file.name}`;
  const storageRef = ref(storage, filePath);

  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  const docRef = await addDoc(resourcesCollection, {
    fileName: file.name,
    fileType: fileType,
    filePath: downloadURL, // On stocke l'URL de téléchargement pour un accès facile
    uploadedBy: uploaderId,
    createdAt: serverTimestamp(),
    assignedToCompanies: [],
  });

  return {
    id: docRef.id,
    fileName: file.name,
    fileType: fileType,
    filePath: downloadURL,
    uploadedBy: uploaderId,
    createdAt: new Date(),
    assignedToCompanies: [],
  };
};

export const getLibraryResources = async (): Promise<LibraryResource[]> => {
  const snapshot = await getDocs(resourcesCollection);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LibraryResource));
};

export const assignResourceToCompanies = async (resourceId: string, companyIds: string[]) => {
  const resourceRef = doc(db, 'library_resources', resourceId);
  await updateDoc(resourceRef, {
    assignedToCompanies: companyIds,
  });
};
export const getCompanyAssignedResources = async (companyId: string): Promise<LibraryResource[]> => {
  const companySpecificQuery = query(resourcesCollection, where('assignedToCompanies', 'array-contains', companyId));
  const allCompaniesQuery = query(resourcesCollection, where('assignedToCompanies', '==', ['all']));

  const [companySpecificSnapshot, allCompaniesSnapshot] = await Promise.all([
    getDocs(companySpecificQuery),
    getDocs(allCompaniesQuery)
  ]);

  const resourcesMap = new Map<string, LibraryResource>();

  companySpecificSnapshot.docs.forEach(doc => {
    resourcesMap.set(doc.id, { id: doc.id, ...doc.data() } as LibraryResource);
  });

  allCompaniesSnapshot.docs.forEach(doc => {
    resourcesMap.set(doc.id, { id: doc.id, ...doc.data() } as LibraryResource);
  });

  return Array.from(resourcesMap.values());
};

export const assignResourceToStudents = async (resourceId: string, studentIds: string[], companyId: string, adminId: string) => {
  const q = query(companyLibraryCollection, where('resourceId', '==', resourceId), where('companyId', '==', companyId));
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    await addDoc(companyLibraryCollection, {
      resourceId,
      companyId,
      assignedToStudents: studentIds,
      assignedBy: adminId,
      assignedAt: serverTimestamp(),
    });
  } else {
    const docRef = snapshot.docs[0].ref;
    await updateDoc(docRef, {
      assignedToStudents: studentIds,
    });
  }

  // Ensure the resource is marked as assigned to the company
  const resourceRef = doc(db, 'library_resources', resourceId);
  const resourceDoc = await getDoc(resourceRef);
  if (resourceDoc.exists()) {
    const resourceData = resourceDoc.data();
    const assignedToCompanies = resourceData.assignedToCompanies || [];
    if (!assignedToCompanies.includes(companyId)) {
      await updateDoc(resourceRef, {
        assignedToCompanies: [...assignedToCompanies, companyId]
      });
    }
  }
};

export const getStudentAssignedResources = async (studentId: string, companyId: string): Promise<LibraryResource[]> => {
  const q = query(
    companyLibraryCollection,
    where('companyId', '==', companyId),
    where('assignedToStudents', 'array-contains', studentId)
  );
  const companyLibrarySnapshot = await getDocs(q);
  if (companyLibrarySnapshot.empty) return [];

  const resourceIds = companyLibrarySnapshot.docs.map(doc => doc.data().resourceId);
  if (resourceIds.length === 0) return [];
  
  const resourcesQuery = query(resourcesCollection, where('__name__', 'in', resourceIds));
  const resourcesSnapshot = await getDocs(resourcesQuery);
  
  return resourcesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LibraryResource));
};

export const getResourceAssignmentsForCompany = async (resourceId: string, companyId: string): Promise<string[]> => {
    const q = query(companyLibraryCollection, where('resourceId', '==', resourceId), where('companyId', '==', companyId));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        return [];
    }
    return snapshot.docs[0].data().assignedToStudents || [];
}

export const getCompanyResourcesWithAssignments = async (companyId: string): Promise<{
  resource: LibraryResource;
  assignedStudents: string[];
}[]> => {
  try {
    // Récupérer toutes les ressources assignées à cette entreprise
    const companyResources = await getCompanyAssignedResources(companyId);
    
    // Récupérer les assignations pour chaque ressource
    const assignmentsPromises = companyResources.map(async (resource) => {
      const assignedStudents = await getResourceAssignmentsForCompany(resource.id, companyId);
      return {
        resource,
        assignedStudents
      };
    });
    
    return await Promise.all(assignmentsPromises);
  } catch (error) {
    console.error('Erreur lors de la récupération des ressources avec assignations:', error);
    throw error;
  }
};