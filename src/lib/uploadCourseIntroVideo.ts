import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { storage } from './firebase';

export interface VideoUploadResult {
    url: string;
    path: string;
}

/**
 * Upload a course intro video to Firebase Storage (not company-specific)
 * @param file Video file
 * @param onProgress Optional progress callback (0-100)
 */
export const uploadCourseIntroVideo = async (
    file: File,
    onProgress?: (progress: number) => void
): Promise<VideoUploadResult> => {
    const timestamp = Date.now();
    const fileName = `${timestamp}_${file.name}`;
    const filePath = `course-intro-videos/${fileName}`;
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
                reject(error);
            },
            async () => {
                const url = await getDownloadURL(uploadTask.snapshot.ref);
                resolve({ url, path: filePath });
            }
        );
    });
};
