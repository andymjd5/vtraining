import { 
  ref, 
  uploadBytesResumable, 
  getDownloadURL, 
  deleteObject, 
  listAll, 
  getMetadata 
} from 'firebase/storage';
import { storage } from './firebase';
import { doc, setDoc, deleteDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from './firebase';

interface CompanyFile {
  name: string;
  size: number;
  created_at: string;
  url: string;
  path: string;
}

interface UploadResult {
  url: string;
  path: string;
  name: string;
  size: number;
}

/**
 * Upload a file to Firebase Storage for a specific company
 */
export const uploadFileToFirebase = async (
  file: File, 
  companyId: string,
  onProgress?: (progress: number) => void
): Promise<UploadResult> => {
  try {
    // Create a unique filename to prevent conflicts
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `companies/${companyId}/files/${fileName}`;
    
    // Create storage reference
    const storageRef = ref(storage, filePath);
    
    // Create upload task
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Calculate progress
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress?.(progress);
        },
        (error) => {
          console.error('Upload error:', error);
          reject(new Error('Failed to upload file'));
        },
        async () => {
          try {
            // Get download URL
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            
            // Save file metadata to Firestore
            const fileDoc = {
              name: file.name,
              originalName: file.name,
              size: file.size,
              type: file.type,
              companyId,
              path: filePath,
              url: downloadURL,
              uploadedAt: new Date().toISOString(),
              uploadedBy: null // You might want to add user ID here
            };

            // Save to Firestore collection
            const fileRef = doc(collection(db, 'companyFiles'));
            await setDoc(fileRef, fileDoc);
            
            resolve({
              url: downloadURL,
              path: filePath,
              name: file.name,
              size: file.size
            });
          } catch (error) {
            console.error('Error saving file metadata:', error);
            reject(new Error('Failed to save file metadata'));
          }
        }
      );
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
};

/**
 * Get all files for a specific company
 */
export const getCompanyFiles = async (companyId: string): Promise<CompanyFile[]> => {
  try {
    // Get files from Firestore
    const filesQuery = query(
      collection(db, 'companyFiles'),
      where('companyId', '==', companyId)
    );
    
    const querySnapshot = await getDocs(filesQuery);
    const files: CompanyFile[] = [];
    
    for (const doc of querySnapshot.docs) {
      const fileData = doc.data();
      
      try {
        // Verify the file still exists in storage
        const storageRef = ref(storage, fileData.path);
        await getMetadata(storageRef);
        
        files.push({
          name: fileData.name,
          size: fileData.size,
          created_at: fileData.uploadedAt,
          url: fileData.url,
          path: fileData.path
        });
      } catch (storageError) {
        // File doesn't exist in storage, remove from Firestore
        console.warn(`File ${fileData.name} not found in storage, removing from database`);
        await deleteDoc(doc.ref);
      }
    }
    
    // Sort by upload date (newest first)
    return files.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  } catch (error) {
    console.error('Error fetching company files:', error);
    throw new Error('Failed to fetch company files');
  }
};

/**
 * Delete a file from Firebase Storage and Firestore
 */
export const deleteFile = async (filePath: string): Promise<void> => {
  try {
    // Delete from Firebase Storage
    const storageRef = ref(storage, filePath);
    await deleteObject(storageRef);
    
    // Delete from Firestore
    const filesQuery = query(
      collection(db, 'companyFiles'),
      where('path', '==', filePath)
    );
    
    const querySnapshot = await getDocs(filesQuery);
    const deletePromises = querySnapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
    
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
};

/**
 * Delete all files for a company (useful when deleting a company)
 */
export const deleteAllCompanyFiles = async (companyId: string): Promise<void> => {
  try {
    // Get all files for the company
    const files = await getCompanyFiles(companyId);
    
    // Delete all files
    const deletePromises = files.map(file => deleteFile(file.path));
    await Promise.all(deletePromises);
    
  } catch (error) {
    console.error('Error deleting company files:', error);
    throw new Error('Failed to delete company files');
  }
};

/**
 * Get file download URL by path
 */
export const getFileDownloadURL = async (filePath: string): Promise<string> => {
  try {
    const storageRef = ref(storage, filePath);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error('Error getting download URL:', error);
    throw new Error('Failed to get file URL');
  }
};

/**
 * Check if a file exists in storage
 */
export const fileExists = async (filePath: string): Promise<boolean> => {
  try {
    const storageRef = ref(storage, filePath);
    await getMetadata(storageRef);
    return true;
  } catch (error) {
    return false;
  }
};