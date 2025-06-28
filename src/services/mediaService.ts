// src/services/mediaService.ts
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from '../lib/firebase';
import { uuidv4 } from '@firebase/util';

/**
 * Service pour la gestion des médias (images, vidéos)
 */
export const mediaService = {
    /**
     * Télécharge une vidéo d'introduction de cours
     * @param file Fichier vidéo
     * @param courseId ID du cours
     * @param onProgress Callback de progression
     * @returns URL de la vidéo téléchargée et URL de la miniature
     */
    async uploadCourseIntroVideo(
        file: File,
        courseId: string,
        onProgress?: (progress: number) => void
    ): Promise<{ url: string; thumbnailUrl?: string }> {
        try {
            const fileExt = file.name.split('.').pop()?.toLowerCase() || 'mp4';
            const fileName = `courses/${courseId}/intro_${Date.now()}.${fileExt}`;
            const storageRef = ref(storage, fileName);

            const uploadTask = uploadBytesResumable(storageRef, file);

            return new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        if (onProgress) onProgress(progress);
                    },
                    (error) => {
                        console.error('Error uploading video:', error);
                        reject(error);
                    },
                    async () => {
                        const url = await getDownloadURL(uploadTask.snapshot.ref);
                        // On pourrait ici générer une miniature avec une fonction Cloud Function
                        resolve({ url });
                    }
                );
            });
        } catch (error) {
            console.error('Error in uploadCourseIntroVideo:', error);
            throw error;
        }
    },

    /**
     * Télécharge une photo de profil d'instructeur
     * @param file Fichier image
     * @param instructorId ID de l'instructeur
     * @param onProgress Callback de progression
     * @returns URL de l'image téléchargée
     */
    async uploadInstructorPhoto(
        file: File,
        instructorId: string,
        onProgress?: (progress: number) => void
    ): Promise<string> {
        try {
            const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
            const fileName = `instructors/${instructorId}/profile_${Date.now()}.${fileExt}`;
            const storageRef = ref(storage, fileName);

            const uploadTask = uploadBytesResumable(storageRef, file);

            return new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        if (onProgress) onProgress(progress);
                    },
                    (error) => {
                        console.error('Error uploading instructor photo:', error);
                        reject(error);
                    },
                    async () => {
                        const url = await getDownloadURL(uploadTask.snapshot.ref);
                        resolve(url);
                    }
                );
            });
        } catch (error) {
            console.error('Error in uploadInstructorPhoto:', error);
            throw error;
        }
    },

    /**
     * Télécharge une image ou vidéo pour le contenu d'un cours
     * @param file Fichier média
     * @param courseId ID du cours
     * @param chapterId ID du chapitre
     * @param sectionId ID de la section
     * @param type Type de média ('image' ou 'video')
     * @param onProgress Callback de progression
     * @returns URL du média téléchargé et autres métadonnées
     */
    async uploadCourseMedia(
        file: File,
        courseId: string,
        chapterId: string,
        sectionId: string,
        type: 'image' | 'video',
        onProgress?: (progress: number) => void
    ): Promise<{ url: string; thumbnailUrl?: string; type: 'image' | 'video'; id: string }> {
        try {
            const fileExt = file.name.split('.').pop()?.toLowerCase() || (type === 'image' ? 'jpg' : 'mp4');
            const mediaId = uuidv4();
            const fileName = `courses/${courseId}/chapters/${chapterId}/sections/${sectionId}/${mediaId}.${fileExt}`;
            const storageRef = ref(storage, fileName);

            const uploadTask = uploadBytesResumable(storageRef, file);

            return new Promise((resolve, reject) => {
                uploadTask.on(
                    'state_changed',
                    (snapshot) => {
                        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                        if (onProgress) onProgress(progress);
                    },
                    (error) => {
                        console.error('Error uploading course media:', error);
                        reject(error);
                    },
                    async () => {
                        const url = await getDownloadURL(uploadTask.snapshot.ref);
                        // Pour les vidéos, on pourrait générer une miniature
                        const result = { url, type, id: mediaId };

                        if (type === 'video') {
                            // Logique pour générer une miniature - à implémenter avec une Cloud Function
                            // Pour l'instant, on ne fait rien de spécial
                        }

                        resolve(result);
                    }
                );
            });
        } catch (error) {
            console.error('Error in uploadCourseMedia:', error);
            throw error;
        }
    },

    /**
     * Supprime un média
     * @param url URL du média à supprimer
     */
    async deleteMedia(url: string): Promise<void> {
        try {
            const storageRef = ref(storage, url);
            await deleteObject(storageRef);
        } catch (error) {
            console.error('Error deleting media:', error);
            throw error;
        }
    },

    /**
     * Génère une URL signée temporaire pour un média
     * @param url URL du média
     * @param expirationTimeMinutes Durée de validité en minutes
     * @returns URL signée
     */
    async getSignedUrl(url: string, expirationTimeMinutes: number = 60): Promise<string> {
        try {
            // Cette fonctionnalité nécessite une Cloud Function
            // Pour l'instant, on retourne simplement l'URL telle quelle
            return url;
        } catch (error) {
            console.error('Error getting signed URL:', error);
            throw error;
        }
    }
};
