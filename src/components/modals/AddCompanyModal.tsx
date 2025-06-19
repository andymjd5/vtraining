import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Upload, Eye, EyeOff, Building } from 'lucide-react';
import Button from '../ui/Button';
import { storage, db, auth } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection } from 'firebase/firestore';
import { useToast } from '../../hooks/useToast';

interface AddCompanyModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

const AddCompanyModal = ({ onClose, onSuccess }: AddCompanyModalProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  const [companyData, setCompanyData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active' as 'active' | 'inactive'
  });

  const [adminData, setAdminData] = useState({
    name: '',
    email: '',
    password: ''
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateCompanySlug = (name: string) => {
    return name.toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  };

  const updateCompaniesFile = async (companyData: any) => {
    try {
      // This would typically be done server-side
      // For now, we'll just log the data that should be added
      console.log('Company data to add to companies.ts:', {
        id: companyData.id,
        name: companyData.name,
        logoUrl: companyData.logoUrl || '/partners/default-company.png'
      });
      
      // In a real implementation, you would:
      // 1. Copy the logo to public/partners/
      // 2. Update the companies.ts file
      // 3. Or better yet, make this dynamic from Firebase
    } catch (error) {
      console.error('Error updating companies file:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create company document first
      const companyRef = doc(collection(db, 'companies'));
      const companyId = companyRef.id;

      let logoUrl = null;
      if (logoFile) {
        const logoRef = ref(storage, `company-logos/${companyId}-${logoFile.name}`);
        await uploadBytes(logoRef, logoFile);
        logoUrl = await getDownloadURL(logoRef);
      }

      const companyDocData = {
        name: companyData.name,
        email: companyData.email,
        phone: companyData.phone,
        logoUrl: logoUrl,
        isActive: true,
        status: companyData.status,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      };

      await setDoc(companyRef, companyDocData);

      // Create admin user
      const { user } = await createUserWithEmailAndPassword(
        auth,
        adminData.email,
        adminData.password
      );

      // Create admin profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name: adminData.name,
        email: adminData.email,
        role: 'COMPANY_ADMIN',
        companyId: companyId,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Update companies file for dynamic loading
      await updateCompaniesFile({
        id: companyId,
        name: companyData.name,
        logoUrl: logoUrl
      });

      success(`Entreprise ${companyData.name} créée avec succès !`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Error creating company:', err);
      setError(err.message);
      showError('Erreur lors de la création de l\'entreprise');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {step === 1 ? 'Ajouter une nouvelle entreprise' : 'Créer l\'administrateur'}
              </h2>
              <p className="text-sm text-gray-500">
                Étape {step} sur 2
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {step === 1 ? (
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'entreprise *
                </label>
                <input
                  type="text"
                  required
                  value={companyData.name}
                  onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: BESDU, FONAREV..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email de contact *
                </label>
                <input
                  type="email"
                  required
                  value={companyData.email}
                  onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="contact@entreprise.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Téléphone
                </label>
                <input
                  type="tel"
                  value={companyData.phone}
                  onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+243 123 456 789"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Logo de l'entreprise
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-blue-400 transition-colors">
                  <div className="space-y-1 text-center">
                    {logoPreview ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="h-20 w-20 object-contain mb-4 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setLogoFile(null);
                            setLogoPreview(null);
                          }}
                          className="text-sm text-red-600 hover:text-red-500"
                        >
                          Supprimer
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                            <span>Télécharger un fichier</span>
                            <input
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleLogoChange}
                            />
                          </label>
                          <p className="pl-1">ou glisser-déposer</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG jusqu'à 10MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-1">
                  Entreprise: {companyData.name}
                </h3>
                <p className="text-sm text-blue-700">
                  Créez maintenant le compte administrateur pour cette entreprise
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom de l'administrateur *
                </label>
                <input
                  type="text"
                  required
                  value={adminData.name}
                  onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Nom complet de l'administrateur"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email de l'administrateur *
                </label>
                <input
                  type="email"
                  required
                  value={adminData.email}
                  onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="admin@entreprise.com"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={adminData.password}
                    onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Mot de passe sécurisé"
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Minimum 6 caractères
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="mt-8 flex justify-end space-x-3">
            <Button
              variant="outlined"
              onClick={step === 1 ? onClose : () => setStep(1)}
              disabled={loading}
            >
              {step === 1 ? 'Annuler' : 'Retour'}
            </Button>
            <Button
              type="submit"
              isLoading={loading}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {step === 1 ? 'Suivant' : 'Créer l\'entreprise'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddCompanyModal;