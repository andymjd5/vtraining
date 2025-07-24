import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { sendPasswordResetEmail } from 'firebase/auth';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// Définir une interface pour les données utilisateur plus détaillées
interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phoneNumber?: string;
  photoURL?: string;
  lastLogin?: Date;
  language?: string;
  theme?: 'light' | 'dark';
  notifications?: {
    email: boolean;
    push: boolean;
  };
}

const StudentProfile = () => {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);

          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserProfile({
              uid: user.uid,
              name: data.name || 'Non défini',
              email: data.email || 'Non défini',
              phoneNumber: data.phoneNumber,
              photoURL: data.photoURL,
              lastLogin: data.lastLogin?.toDate(),
              language: data.preferences?.language || 'Français',
              theme: data.preferences?.theme || 'light',
              notifications: data.preferences?.notifications || { email: true, push: false },
            });
          } else {
            setError("Profil utilisateur introuvable.");
          }
        } catch (err) {
          setError("Erreur lors du chargement du profil.");
          console.error(err);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserProfile();
  }, [user]);

  const handlePasswordReset = async () => {
    if (user?.email) {
      try {
        await sendPasswordResetEmail(auth, user.email);
        alert("Un email de réinitialisation de mot de passe a été envoyé.");
      } catch (error) {
        console.error("Erreur lors de l'envoi de l'email de réinitialisation:", error);
        alert("Une erreur s'est produite. Veuillez réessayer.");
      }
    }
  };

  const handleProfileImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    const storage = getStorage();
    const storageRef = ref(storage, `profile_images/${user.uid}`);

    try {
      setLoading(true);
      await uploadBytes(storageRef, file);
      const photoURL = await getDownloadURL(storageRef);
      
      // Mettre à jour l'URL dans Firestore
      const userDocRef = doc(db, 'users', user.uid);
      await getDoc(userDocRef).then(doc => {
        if (doc.exists()) {
          // Note: setDoc with merge is safer if the doc might not exist
          // but here we assume it does.
          const existingData = doc.data();
          const updatedData = { ...existingData, photoURL };
          setDoc(userDocRef, updatedData);
        }
      });


      setUserProfile(prev => prev ? { ...prev, photoURL } : null);
      alert("Photo de profil mise à jour !");
    } catch (error) {
      console.error("Erreur lors de l'upload de l'image:", error);
      alert("Erreur lors de la mise à jour de la photo.");
    } finally {
      setLoading(false);
    }
  };


  if (loading) {
    return <div className="flex justify-center items-center h-screen"><div className="animate-spin rounded-full h-32 w-32 border-t-2 border-b-2 border-blue-500"></div></div>;
  }

  if (error) {
    return <div className="text-center mt-10 text-red-500">{error}</div>;
  }

  if (!userProfile) {
    return <div className="text-center mt-10">Aucun profil à afficher.</div>;
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Mon Profil</h1>

          {/* Section Informations Personnelles */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">Informations Personnelles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Nom complet</p>
                <p className="text-lg text-gray-900">{userProfile.name}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Email</p>
                <p className="text-lg text-gray-900">{userProfile.email}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Téléphone</p>
                <p className="text-lg text-gray-900">{userProfile.phoneNumber || 'Non renseigné'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Identifiant Firebase (UID)</p>
                <p className="text-lg text-gray-900 truncate">{userProfile.uid}</p>
              </div>
            </div>
          </div>

          {/* Section Photo de profil */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">Photo de Profil</h2>
            <div className="flex items-center gap-6">
              <img 
                src={userProfile.photoURL || 'https://via.placeholder.com/150'} 
                alt="Profil" 
                className="w-24 h-24 rounded-full object-cover"
              />
              <div>
                <label htmlFor="profile-upload" className="cursor-pointer bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 transition">
                  Mettre à jour
                </label>
                <input id="profile-upload" type="file" className="hidden" onChange={handleProfileImageUpload} accept="image/*" />
              </div>
            </div>
          </div>

          {/* Section Sécurité */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">Mot de passe et Sécurité</h2>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between">
              <button 
                onClick={handlePasswordReset}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition mb-2 sm:mb-0"
              >
                Changer mon mot de passe
              </button>
              {userProfile.lastLogin && (
                <p className="text-sm text-gray-500">
                  Dernière connexion : {new Date(userProfile.lastLogin).toLocaleString()}
                </p>
              )}
            </div>
          </div>

          {/* Section Préférences */}
          <div>
            <h2 className="text-xl font-semibold text-gray-700 border-b pb-2 mb-4">Préférences</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Langue</p>
                <p className="text-lg text-gray-900">{userProfile.language}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Thème</p>
                <p className="text-lg text-gray-900 capitalize">{userProfile.theme}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Notifications</p>
                <div className="text-lg text-gray-900">
                  <p>Email: {userProfile.notifications?.email ? 'Activé' : 'Désactivé'}</p>
                  <p>Push: {userProfile.notifications?.push ? 'Activé' : 'Désactivé'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentProfile;