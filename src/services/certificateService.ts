import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Certificate } from '../types';

export const certificateService = {
  // Generate a certificate for a completed course
  async generateCertificate(data: {
    userId: string;
    userName: string;
    courseId: string;
    courseName: string;
    companyId: string;
  }): Promise<string> {
    try {
      // Check if certificate already exists
      const certificateQuery = query(
        collection(db, 'certificates'),
        where('userId', '==', data.userId),
        where('courseId', '==', data.courseId)
      );
      
      const certificateSnapshot = await getDocs(certificateQuery);
      
      if (!certificateSnapshot.empty) {
        return certificateSnapshot.docs[0].id;
      }
      
      // Generate certificate number
      const certificateNumber = `CERT-${Date.now().toString().slice(-8)}`;
      
      // Create certificate
      const certificateRef = doc(collection(db, 'certificates'));
      
      await setDoc(certificateRef, {
        ...data,
        certificateNumber,
        issueDate: new Date(),
        createdAt: serverTimestamp()
      });
      
      return certificateRef.id;
    } catch (error) {
      console.error('Error generating certificate:', error);
      throw error;
    }
  },
  
  // Get a certificate by ID
  async getCertificate(certificateId: string): Promise<Certificate> {
    try {
      const certificateDoc = await getDoc(doc(db, 'certificates', certificateId));
      
      if (!certificateDoc.exists()) {
        throw new Error('Certificate not found');
      }
      
      return { id: certificateDoc.id, ...certificateDoc.data() } as Certificate;
    } catch (error) {
      console.error('Error getting certificate:', error);
      throw error;
    }
  },
  
  // Get certificates by user
  async getCertificatesByUser(userId: string): Promise<Certificate[]> {
    try {
      const certificatesQuery = query(
        collection(db, 'certificates'),
        where('userId', '==', userId)
      );
      
      const certificatesSnapshot = await getDocs(certificatesQuery);
      
      return certificatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Certificate[];
    } catch (error) {
      console.error('Error getting certificates by user:', error);
      throw error;
    }
  },
  
  // Get certificates by company
  async getCertificatesByCompany(companyId: string): Promise<Certificate[]> {
    try {
      const certificatesQuery = query(
        collection(db, 'certificates'),
        where('companyId', '==', companyId)
      );
      
      const certificatesSnapshot = await getDocs(certificatesQuery);
      
      return certificatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Certificate[];
    } catch (error) {
      console.error('Error getting certificates by company:', error);
      throw error;
    }
  },
  
  // Get certificates by course
  async getCertificatesByCourse(courseId: string): Promise<Certificate[]> {
    try {
      const certificatesQuery = query(
        collection(db, 'certificates'),
        where('courseId', '==', courseId)
      );
      
      const certificatesSnapshot = await getDocs(certificatesQuery);
      
      return certificatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Certificate[];
    } catch (error) {
      console.error('Error getting certificates by course:', error);
      throw error;
    }
  },
  
  // Verify certificate by number
  async verifyCertificate(certificateNumber: string): Promise<Certificate | null> {
    try {
      const certificatesQuery = query(
        collection(db, 'certificates'),
        where('certificateNumber', '==', certificateNumber)
      );
      
      const certificatesSnapshot = await getDocs(certificatesQuery);
      
      if (certificatesSnapshot.empty) {
        return null;
      }
      
      return { 
        id: certificatesSnapshot.docs[0].id, 
        ...certificatesSnapshot.docs[0].data() 
      } as Certificate;
    } catch (error) {
      console.error('Error verifying certificate:', error);
      throw error;
    }
  }
};