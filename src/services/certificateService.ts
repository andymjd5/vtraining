import { 
  collection, 
  addDoc, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  DocumentData 
} from 'firebase/firestore';
import { db } from '../lib/firebase';

// Interface pour les données du certificat
export interface CertificateData {
  id?: string;
  userId: string;
  userName: string;
  userEmail: string;
  courseId: string;
  courseName: string;
  chapterId: string;
  chapterName: string;
  instructorName: string;
  completionDate: Timestamp;
  certificateNumber: string;
  quizScore: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Interface pour les données nécessaires à la génération du certificat
export interface GenerateCertificateData {
  userId: string;
  userName: string;
  userEmail: string;
  courseId: string;
  courseName: string;
  chapterId: string;
  chapterName: string;
  instructorName: string;
  quizScore: number;
}

class CertificateService {
  private certificatesCollection = 'certificates';

  /**
   * Génère un numéro de certificat unique
   * Format: UNIKIN-VT-YYYY-NNNNNN
   */
  private generateCertificateNumber(): string {
    const year = new Date().getFullYear();
    const randomSuffix = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    return `UNIKIN-VT-${year}-${randomSuffix}`;
  }

  /**
   * Génère et enregistre un certificat après la réussite d'un quiz
   */
  async generateCertificate(data: GenerateCertificateData): Promise<string> {
    try {
      console.log('Génération du certificat pour:', data.userName);

      // Vérifier si un certificat existe déjà pour ce chapitre et cet utilisateur
      const existingCertificateQuery = query(
        collection(db, this.certificatesCollection),
        where('userId', '==', data.userId),
        where('chapterId', '==', data.chapterId),
        where('courseId', '==', data.courseId)
      );

      const existingCertificates = await getDocs(existingCertificateQuery);
      
      if (!existingCertificates.empty) {
        console.log('Certificat existant trouvé, mise à jour...');
        // Si un certificat existe déjà, on pourrait le mettre à jour
        // Pour l'instant, on retourne l'ID existant
        return existingCertificates.docs[0].id;
      }

      // Créer les données du certificat
      const certificateData: Omit<CertificateData, 'id'> = {
        userId: data.userId,
        userName: data.userName,
        userEmail: data.userEmail,
        courseId: data.courseId,
        courseName: data.courseName,
        chapterId: data.chapterId,
        chapterName: data.chapterName,
        instructorName: data.instructorName,
        completionDate: Timestamp.now(),
        certificateNumber: this.generateCertificateNumber(),
        quizScore: data.quizScore,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now()
      };

      // Enregistrer le certificat dans Firestore
      const docRef = await addDoc(collection(db, this.certificatesCollection), certificateData);
      
      console.log('Certificat généré avec succès:', docRef.id);
      return docRef.id;
    } catch (error) {
      console.error('Erreur lors de la génération du certificat:', error);
      throw new Error('Impossible de générer le certificat');
    }
  }

  /**
   * Récupère un certificat par son ID
   */
  async getCertificateById(certificateId: string): Promise<CertificateData | null> {
    try {
      const certificateDoc = await getDoc(doc(db, this.certificatesCollection, certificateId));
      
      if (certificateDoc.exists()) {
        return {
          id: certificateDoc.id,
          ...certificateDoc.data()
        } as CertificateData;
      }
      
      return null;
    } catch (error) {
      console.error('Erreur lors de la récupération du certificat:', error);
      throw new Error('Impossible de récupérer le certificat');
    }
  }

  /**
   * Récupère tous les certificats d'un utilisateur
   */
  async getUserCertificates(userId: string): Promise<CertificateData[]> {
    try {
      const certificatesQuery = query(
        collection(db, this.certificatesCollection),
        where('userId', '==', userId),
        orderBy('completionDate', 'desc')
      );

      const certificatesSnapshot = await getDocs(certificatesQuery);
      
      return certificatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CertificateData));
    } catch (error) {
      console.error('Erreur lors de la récupération des certificats utilisateur:', error);
      throw new Error('Impossible de récupérer les certificats');
    }
  }

  /**
   * Récupère tous les certificats pour un cours donné
   */
  async getCourseCertificates(courseId: string): Promise<CertificateData[]> {
    try {
      const certificatesQuery = query(
        collection(db, this.certificatesCollection),
        where('courseId', '==', courseId),
        orderBy('completionDate', 'desc')
      );

      const certificatesSnapshot = await getDocs(certificatesQuery);
      
      return certificatesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as CertificateData));
    } catch (error) {
      console.error('Erreur lors de la récupération des certificats du cours:', error);
      throw new Error('Impossible de récupérer les certificats du cours');
    }
  }

  /**
   * Vérifie si un utilisateur a un certificat pour un chapitre donné
   */
  async hasCertificateForChapter(userId: string, chapterId: string, courseId: string): Promise<boolean> {
    try {
      const certificateQuery = query(
        collection(db, this.certificatesCollection),
        where('userId', '==', userId),
        where('chapterId', '==', chapterId),
        where('courseId', '==', courseId)
      );

      const certificateSnapshot = await getDocs(certificateQuery);
      return !certificateSnapshot.empty;
    } catch (error) {
      console.error('Erreur lors de la vérification du certificat:', error);
      return false;
    }
  }

  /**
   * Formate une date Timestamp pour l'affichage sur le certificat
   */
  formatCertificateDate(timestamp: Timestamp): string {
    const date = timestamp.toDate();
    return date.toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /**
   * Obtient les statistiques des certificats
   */
  async getCertificateStats(): Promise<{
    totalCertificates: number;
    certificatesThisMonth: number;
    certificatesThisYear: number;
  }> {
    try {
      // Récupérer tous les certificats
      const allCertificatesSnapshot = await getDocs(collection(db, this.certificatesCollection));
      const totalCertificates = allCertificatesSnapshot.size;

      // Calculer les dates pour ce mois et cette année
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const startOfYear = new Date(now.getFullYear(), 0, 1);

      // Compter les certificats de ce mois
      const thisMonthQuery = query(
        collection(db, this.certificatesCollection),
        where('completionDate', '>=', Timestamp.fromDate(startOfMonth))
      );
      const thisMonthSnapshot = await getDocs(thisMonthQuery);
      const certificatesThisMonth = thisMonthSnapshot.size;

      // Compter les certificats de cette année
      const thisYearQuery = query(
        collection(db, this.certificatesCollection),
        where('completionDate', '>=', Timestamp.fromDate(startOfYear))
      );
      const thisYearSnapshot = await getDocs(thisYearQuery);
      const certificatesThisYear = thisYearSnapshot.size;

      return {
        totalCertificates,
        certificatesThisMonth,
        certificatesThisYear
      };
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
      throw new Error('Impossible de récupérer les statistiques des certificats');
    }
  }
}

// Export d'une instance unique du service
export const certificateService = new CertificateService();