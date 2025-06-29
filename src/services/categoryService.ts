import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, query, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';

export interface Category {
    id: string;
    name: string;
    description?: string;
    createdAt: Date;
    updatedAt?: Date;
}

class CategoryService {
    private collectionName = 'categories';

    /**
     * Récupère toutes les catégories
     */
    async getAllCategories(): Promise<Category[]> {
        try {
            const categoriesSnapshot = await getDocs(
                query(collection(db, this.collectionName), orderBy('name'))
            );

            return categoriesSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate()
            } as Category));
        } catch (error) {
            console.error('Erreur lors de la récupération des catégories:', error);
            throw new Error('Impossible de charger les catégories');
        }
    }

    /**
     * Crée une nouvelle catégorie
     */
    async createCategory(name: string, description?: string): Promise<string> {
        try {
            // Vérifier si la catégorie existe déjà
            const existingCategories = await this.getAllCategories();
            const categoryExists = existingCategories.some(
                cat => cat.name.toLowerCase().trim() === name.toLowerCase().trim()
            );

            if (categoryExists) {
                throw new Error('Une catégorie avec ce nom existe déjà');
            }

            const categoryData = {
                name: name.trim(),
                description: description?.trim() || '',
                createdAt: new Date()
            };

            const docRef = await addDoc(collection(db, this.collectionName), categoryData);
            return docRef.id;
        } catch (error) {
            console.error('Erreur lors de la création de la catégorie:', error);
            if (error instanceof Error) {
                throw error;
            }
            throw new Error('Impossible de créer la catégorie');
        }
    }

    /**
     * Met à jour une catégorie
     */
    async updateCategory(id: string, name: string, description?: string): Promise<void> {
        try {
            const categoryRef = doc(db, this.collectionName, id);
            await updateDoc(categoryRef, {
                name: name.trim(),
                description: description?.trim() || '',
                updatedAt: new Date()
            });
        } catch (error) {
            console.error('Erreur lors de la mise à jour de la catégorie:', error);
            throw new Error('Impossible de mettre à jour la catégorie');
        }
    }

    /**
     * Supprime une catégorie
     */
    async deleteCategory(id: string): Promise<void> {
        try {
            const categoryRef = doc(db, this.collectionName, id);
            await deleteDoc(categoryRef);
        } catch (error) {
            console.error('Erreur lors de la suppression de la catégorie:', error);
            throw new Error('Impossible de supprimer la catégorie');
        }
    }

    /**
     * Recherche des catégories par nom
     */
    async searchCategories(searchTerm: string): Promise<Category[]> {
        try {
            const allCategories = await this.getAllCategories();

            if (!searchTerm.trim()) {
                return allCategories;
            }

            return allCategories.filter(category =>
                category.name.toLowerCase().includes(searchTerm.toLowerCase().trim())
            );
        } catch (error) {
            console.error('Erreur lors de la recherche de catégories:', error);
            throw new Error('Impossible de rechercher les catégories');
        }
    }

    /**
     * Vérifie si une catégorie est utilisée par des cours
     */
    async isCategoryInUse(categoryId: string): Promise<boolean> {
        try {
            const coursesSnapshot = await getDocs(collection(db, 'courses'));
            return coursesSnapshot.docs.some(doc => doc.data().categoryId === categoryId);
        } catch (error) {
            console.error('Erreur lors de la vérification d\'utilisation:', error);
            return false;
        }
    }
}

export const categoryService = new CategoryService();
export default categoryService;
