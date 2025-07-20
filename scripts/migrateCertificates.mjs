import { readFile } from 'fs/promises';
import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(await readFile(new URL('./serviceAccountKey.json', import.meta.url)));

initializeApp({
  credential: cert(serviceAccount),
});

const db = getFirestore();

async function importCertificates() {
  try {
    const data = await readFile('./certificates.json', 'utf-8');
    const certificates = JSON.parse(data);

    if (!Array.isArray(certificates)) {
      throw new Error('Le fichier certificates.json doit contenir un tableau');
    }

    for (const cert of certificates) {
      const docRef = db.collection('certificates').doc();
      await docRef.set({
        participantName: cert.participantName,
        moduleName: cert.moduleName,
        completionDate: cert.completionDate,
        instructorName: cert.instructorName,
        certificateNumber: cert.certificateNumber,
        createdAt: new Date().toISOString(),
      });
      console.log(`✅ Certificat ajouté pour ${cert.participantName}`);
    }

    console.log('🎉 Importation terminée avec succès !');
  } catch (error) {
    console.error('❌ Erreur lors de l\'importation :', error);
    process.exit(1);
  }
}

importCertificates();
