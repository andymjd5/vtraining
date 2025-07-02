// src/services/mediaService.ts
import { ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { storage } from '../lib/firebase';

export interface MediaUploadResult {
    id: string;
    url: string;
    thumbnailUrl?: string;
    duration?: number;
    fileSize: number;
    mimeType: string;
}

/**
 * Service pour la gestion des médias (images, vidéos)
 */
export const mediaService = {
    /**
     * Upload d'un fichier média avec progression
     */
    async uploadMedia(
        file: File,
        type: 'image' | 'video' | 'audio',
        onProgress?: (progress: number) => void
    ): Promise<MediaUploadResult> {
        const fileId = `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const fileName = `${fileId}.${file.name.split('.').pop()}`;
        const filePath = `course-media/${type}s/${fileName}`;

        const storageRef = ref(storage, filePath);
        const uploadTask = uploadBytesResumable(storageRef, file);

        return new Promise((resolve, reject) => {
            uploadTask.on(
                'state_changed',
                (snapshot) => {
                    const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                    onProgress?.(progress);
                },
                (error) => {
                    console.error('Erreur upload:', error);
                    reject(error);
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);

                        let duration: number | undefined;
                        let thumbnailUrl: string | undefined;

                        // Pour les vidéos et audios, on pourrait extraire la durée
                        if (type === 'video' || type === 'audio') {
                            duration = await this.getMediaDuration(file);
                        }

                        // Pour les vidéos, on pourrait générer une miniature
                        if (type === 'video') {
                            thumbnailUrl = await this.generateVideoThumbnail(file);
                        }

                        resolve({
                            id: fileId,
                            url: downloadURL,
                            thumbnailUrl,
                            duration,
                            fileSize: file.size,
                            mimeType: file.type
                        });
                    } catch (error) {
                        reject(error);
                    }
                }
            );
        });
    },

    /**
     * Obtenir la durée d'un fichier média
     */
    async getMediaDuration(file: File): Promise<number | undefined> {
        return new Promise((resolve) => {
            const url = URL.createObjectURL(file);

            if (file.type.startsWith('video/')) {
                const video = document.createElement('video');
                video.src = url;
                video.onloadedmetadata = () => {
                    URL.revokeObjectURL(url);
                    resolve(Math.round(video.duration));
                };
                video.onerror = () => {
                    URL.revokeObjectURL(url);
                    resolve(undefined);
                };
            } else if (file.type.startsWith('audio/')) {
                const audio = document.createElement('audio');
                audio.src = url;
                audio.onloadedmetadata = () => {
                    URL.revokeObjectURL(url);
                    resolve(Math.round(audio.duration));
                };
                audio.onerror = () => {
                    URL.revokeObjectURL(url);
                    resolve(undefined);
                };
            } else {
                URL.revokeObjectURL(url);
                resolve(undefined);
            }
        });
    },

    /**
     * Générer une miniature pour une vidéo
     */
    async generateVideoThumbnail(file: File): Promise<string | undefined> {
        return new Promise((resolve) => {
            const url = URL.createObjectURL(file);
            const video = document.createElement('video');
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');

            video.src = url;
            video.currentTime = 1; // Prendre la miniature à 1 seconde

            video.onloadeddata = () => {
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;

                ctx?.drawImage(video, 0, 0);

                canvas.toBlob(async (blob) => {
                    if (blob) {
                        try {
                            // Upload de la miniature
                            const thumbnailRef = ref(storage, `course-media/thumbnails/${Date.now()}_thumbnail.jpg`);
                            await uploadBytes(thumbnailRef, blob);
                            const thumbnailUrl = await getDownloadURL(thumbnailRef);
                            resolve(thumbnailUrl);
                        } catch (error) {
                            console.error('Erreur génération miniature:', error);
                            resolve(undefined);
                        }
                    } else {
                        resolve(undefined);
                    }
                }, 'image/jpeg', 0.8);

                URL.revokeObjectURL(url);
            };

            video.onerror = () => {
                URL.revokeObjectURL(url);
                resolve(undefined);
            };
        });
    }
};
