import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Company } from '../types';
import { companies as staticCompanies } from '../lib/companies';

// Pour l'instant, on utilise les données statiques en les adaptant au type complet.
// TODO: Remplacer par un appel direct à une collection 'companies' dans Firestore.
export const getCompanies = async (): Promise<Company[]> => {
  // Simule un appel async
  await new Promise(resolve => setTimeout(resolve, 100));

  return staticCompanies.map(c => ({
    ...c,
    contactEmail: `${c.id}@example.com`,
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));
};

export const getCompanyById = async (companyId: string): Promise<Company | null> => {
    const companies = await getCompanies();
    const company = companies.find(c => c.id === companyId);
    return company || null;
}

export const getCompanyBySlug = async (slug: string): Promise<Company | null> => {
  const q = query(collection(db, 'companies'), where('urlSlug', '==', slug));
  const snapshot = await getDocs(q);
  if (snapshot.empty) {
    return null;
  }
  return { id: snapshot.docs[0].id, ...snapshot.docs[0].data() } as Company;
};