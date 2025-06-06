import { useState } from 'react';
<<<<<<< HEAD
import { motion } from 'framer-motion';
import { X, Upload, Eye, EyeOff } from 'lucide-react';
import Button from '../ui/Button';
import { storage, db, auth } from '../../lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
=======
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Building, 
  User, 
  Mail, 
  Phone, 
  Image as ImageIcon, 
  Eye, 
  EyeOff,
  Upload,
  Loader2
} from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { collection, addDoc, Timestamp, doc, setDoc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, auth, storage } from '../../lib/firebase';
import { useToast } from '../../hooks/useToast';
>>>>>>> 28836c0 (Mise à jour du projet local avec la dernière version)

interface AddCompanyModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

<<<<<<< HEAD
const AddCompanyModal = ({ onClose, onSuccess }: AddCompanyModalProps) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [companyData, setCompanyData] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active' as const
  });

  const [adminData, setAdminData] = useState({
    name: '',
=======
interface CompanyFormData {
  name: string;
  email: string;
  phone: string;
  status: 'active' | 'inactive';
  logo?: File;
}

interface AdminFormData {
  fullName: string;
  email: string;
  password: string;
}

const AddCompanyModal: React.FC<AddCompanyModalProps> = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState<'company' | 'admin'>('company');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const { success, error: showError } = useToast();

  const [companyData, setCompanyData] = useState<CompanyFormData>({
    name: '',
    email: '',
    phone: '',
    status: 'active'
  });

  const [adminData, setAdminData] = useState<AdminFormData>({
    fullName: '',
>>>>>>> 28836c0 (Mise à jour du projet local avec la dernière version)
    email: '',
    password: ''
  });

<<<<<<< HEAD
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
=======
  const [errors, setErrors] = useState<{[key: string]: string}>({});

  // Validation functions
  const validateCompanyData = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!companyData.name.trim()) {
      newErrors.name = 'Le nom de l\'entreprise est obligatoire';
    }

    if (!companyData.email.trim()) {
      newErrors.email = 'L\'email est obligatoire';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(companyData.email)) {
      newErrors.email = 'Format d\'email invalide';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAdminData = (): boolean => {
    const newErrors: {[key: string]: string} = {};

    if (!adminData.fullName.trim()) {
      newErrors.fullName = 'Le nom complet est obligatoire';
    }

    if (!adminData.email.trim()) {
      newErrors.adminEmail = 'L\'email administrateur est obligatoire';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(adminData.email)) {
      newErrors.adminEmail = 'Format d\'email invalide';
    }

    if (!adminData.password) {
      newErrors.password = 'Le mot de passe est obligatoire';
    } else if (adminData.password.length < 6) {
      newErrors.password = 'Le mot de passe doit contenir au moins 6 caractères';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle logo upload
  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        showError('Veuillez sélectionner un fichier image valide');
        return;
      }

      // Validate file size (max 2MB)
      if (file.size > 2 * 1024 * 1024) {
        showError('La taille du fichier ne doit pas dépasser 2MB');
        return;
      }

      setCompanyData(prev => ({ ...prev, logo: file }));

      // Create preview
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
>>>>>>> 28836c0 (Mise à jour du projet local avec la dernière version)
      };

      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.ChangeEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (step === 1) {
      setStep(2);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Upload logo if provided
      let logoUrl = null;
      if (logoFile) {
        const logoRef = ref(storage, `company-logos/${Date.now()}-${logoFile.name}`);
        await uploadBytes(logoRef, logoFile);
        logoUrl = await getDownloadURL(logoRef);
      }

      // Create company in Firestore
      const companyRef = doc(collection(db, 'companies'));
      await setDoc(companyRef, {
        ...companyData,
        logo_url: logoUrl,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      // Create admin user in Firebase Auth
      const { user } = await createUserWithEmailAndPassword(
        auth,
        adminData.email,
        adminData.password
      );
<<<<<<< HEAD

      // Create admin profile in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name: adminData.name,
        email: adminData.email,
        role: 'COMPANY_ADMIN',
        company_id: companyRef.id,
        status: 'active',
        created_at: serverTimestamp(),
        updated_at: serverTimestamp()
      });

      onSuccess();
    } catch (err: any) {
      setError(err.message);
=======
      
      const newAdminUser = userCredential.user;
      console.log('✅ Compte Firebase Auth créé avec UID:', newAdminUser.uid);

      // 5. Créer le document utilisateur dans Firestore
      console.log('📄 Création du document utilisateur dans Firestore...');
      await setDoc(doc(db, 'users', newAdminUser.uid), {
        uid: newAdminUser.uid,
        email: adminData.email,
        fullName: adminData.fullName,
        role: 'COMPANY_ADMIN',
        companyId: companyId,
        status: 'active',
        created_at: Timestamp.now()
      });
      console.log('✅ Document utilisateur créé dans Firestore');

      // 6. Déconnecter le nouvel admin et reconnecter le Super Admin
      await signOut(auth);
      
      // Si un Super Admin était connecté, le reconnecter
      if (currentUser) {
        // Note: Vous devrez peut-être ajuster cette partie selon votre système d'auth
        console.log('🔄 Reconnexion du Super Admin...');
      }

      console.log('🎉 Création terminée avec succès !');
      success('Entreprise et administrateur créés avec succès');
      onSuccess();

    } catch (error: any) {
      console.error('❌ Erreur lors de la création:', error);
      console.error('Code d\'erreur:', error.code);
      console.error('Message d\'erreur:', error.message);
      
      // Gestion des erreurs spécifiques Firebase Auth
      if (error.code === 'auth/email-already-in-use') {
        showError('Cet email est déjà utilisé pour un autre compte');
      } else if (error.code === 'auth/weak-password') {
        showError('Le mot de passe est trop faible (minimum 6 caractères)');
      } else if (error.code === 'auth/invalid-email') {
        showError('Format d\'email invalide');
      } else if (error.code === 'auth/operation-not-allowed') {
        showError('La création de compte est désactivée. Contactez l\'administrateur.');
      } else if (error.code === 'auth/too-many-requests') {
        showError('Trop de tentatives. Veuillez réessayer plus tard.');
      } else {
        showError(`Erreur lors de la création: ${error.message}`);
      }
    } finally {
>>>>>>> 28836c0 (Mise à jour du projet local avec la dernière version)
      setLoading(false);
    }
  };

<<<<<<< HEAD
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-xl mx-4"
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {step === 1 ? 'Add New Company' : 'Create Company Admin'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {step === 1 ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Name *
                </label>
                <input
                  type="text"
                  required
                  value={companyData.name}
                  onChange={(e) => setCompanyData({ ...companyData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Email *
                </label>
                <input
                  type="email"
                  required
                  value={companyData.email}
                  onChange={(e) => setCompanyData({ ...companyData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={companyData.phone}
                  onChange={(e) => setCompanyData({ ...companyData, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Company Logo
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                  <div className="space-y-1 text-center">
                    {logoPreview ? (
                      <div className="flex flex-col items-center">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="h-20 w-20 object-contain mb-4"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setLogoFile(null);
                            setLogoPreview(null);
                          }}
                          className="text-sm text-red-600 hover:text-red-500"
                        >
                          Remove
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="flex text-sm text-gray-600">
                          <label className="relative cursor-pointer rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                            <span>Upload a file</span>
                            <input
                              type="file"
                              className="sr-only"
                              accept="image/*"
                              onChange={handleLogoChange}
                            />
                          </label>
                          <p className="pl-1">or drag and drop</p>
                        </div>
                        <p className="text-xs text-gray-500">PNG, JPG up to 10MB</p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Status
                </label>
                <select
                  value={companyData.status}
                  onChange={(e) => setCompanyData({ ...companyData, status: e.target.value as 'active' | 'inactive' })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Name *
                </label>
                <input
                  type="text"
                  required
                  value={adminData.name}
                  onChange={(e) => setAdminData({ ...adminData, name: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Admin Email *
                </label>
                <input
                  type="email"
                  required
                  value={adminData.email}
                  onChange={(e) => setAdminData({ ...adminData, email: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={adminData.password}
                    onChange={(e) => setAdminData({ ...adminData, password: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
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
              </div>
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 bg-error-50 text-error-700 rounded-md">
              {error}
            </div>
          )}

          <div className="mt-6 flex justify-end space-x-3">
            <Button
              variant="outlined"
              onClick={step === 1 ? onClose : () => setStep(1)}
              disabled={loading}
            >
              {step === 1 ? 'Cancel' : 'Back'}
            </Button>
            <Button
              type="submit"
              isLoading={loading}
            >
              {step === 1 ? 'Next' : 'Create Company'}
            </Button>
          </div>
        </form>
      </motion.div>
    </div>
=======
  const handleNext = () => {
    if (validateCompanyData()) {
      setStep('admin');
    }
  };

  const handleBack = () => {
    setStep('company');
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="w-full max-w-2xl max-h-screen overflow-y-auto"
        >
          <Card>
            <div className="p-6">
              {/* Header */}
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Ajouter une entreprise
                  </h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {step === 'company' ? 'Informations de l\'entreprise' : 'Compte administrateur'}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  disabled={loading}
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Progress indicator */}
              <div className="flex items-center mb-8">
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step === 'company' ? 'bg-primary-600 text-white' : 'bg-primary-100 text-primary-600'
                }`}>
                  <Building className="h-4 w-4" />
                </div>
                <div className="flex-1 h-0.5 bg-gray-200 mx-4">
                  <div className={`h-full bg-primary-600 transition-all duration-300 ${
                    step === 'admin' ? 'w-full' : 'w-0'
                  }`} />
                </div>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                  step === 'admin' ? 'bg-primary-600 text-white' : 'bg-gray-200 text-gray-400'
                }`}>
                  <User className="h-4 w-4" />
                </div>
              </div>

              {/* Company Information Step */}
              {step === 'company' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Company Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom de l'entreprise *
                    </label>
                    <input
                      type="text"
                      value={companyData.name}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, name: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                        errors.name ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Nom de l'entreprise"
                    />
                    {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email de contact *
                    </label>
                    <input
                      type="email"
                      value={companyData.email}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                        errors.email ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="contact@entreprise.com"
                    />
                    {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={companyData.phone}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, phone: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                      placeholder="+33 1 23 45 67 89"
                    />
                  </div>

                  {/* Logo Upload */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Logo de l'entreprise
                    </label>
                    <div className="flex items-center space-x-4">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Preview"
                          className="h-16 w-16 rounded-lg object-cover border"
                        />
                      ) : (
                        <div className="h-16 w-16 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoChange}
                          className="hidden"
                          id="logo-upload"
                        />
                        <label
                          htmlFor="logo-upload"
                          className="cursor-pointer bg-white border border-gray-300 rounded-md px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                          <Upload className="h-4 w-4 inline mr-2" />
                          Choisir un fichier
                        </label>
                        <p className="text-xs text-gray-500 mt-1">PNG, JPG jusqu'à 2MB</p>
                      </div>
                    </div>
                  </div>

                  {/* Status */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Statut
                    </label>
                    <select
                      value={companyData.status}
                      onChange={(e) => setCompanyData(prev => ({ ...prev, status: e.target.value as 'active' | 'inactive' }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
                    >
                      <option value="active">Actif</option>
                      <option value="inactive">Inactif</option>
                    </select>
                  </div>

                  {/* Next Button */}
                  <div className="flex justify-end">
                    <Button onClick={handleNext}>
                      Suivant
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* Admin Information Step */}
              {step === 'admin' && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  {/* Admin Full Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nom complet de l'administrateur *
                    </label>
                    <input
                      type="text"
                      value={adminData.fullName}
                      onChange={(e) => setAdminData(prev => ({ ...prev, fullName: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                        errors.fullName ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="Jean Dupont"
                    />
                    {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
                  </div>

                  {/* Admin Email */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email administrateur *
                    </label>
                    <input
                      type="email"
                      value={adminData.email}
                      onChange={(e) => setAdminData(prev => ({ ...prev, email: e.target.value }))}
                      className={`w-full px-3 py-2 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                        errors.adminEmail ? 'border-red-300' : 'border-gray-300'
                      }`}
                      placeholder="admin@entreprise.com"
                    />
                    {errors.adminEmail && <p className="mt-1 text-sm text-red-600">{errors.adminEmail}</p>}
                  </div>

                  {/* Password */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Mot de passe *
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={adminData.password}
                        onChange={(e) => setAdminData(prev => ({ ...prev, password: e.target.value }))}
                        className={`w-full px-3 py-2 pr-20 border rounded-md focus:ring-primary-500 focus:border-primary-500 ${
                          errors.password ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Mot de passe sécurisé"
                      />
                      <div className="absolute inset-y-0 right-0 flex items-center">
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="px-2 py-1 text-gray-400 hover:text-gray-600"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>
                    {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                    <div className="mt-2">
                      <Button
                        variant="outlined"
                        size="sm"
                        onClick={generatePassword}
                        type="button"
                      >
                        Générer un mot de passe
                      </Button>
                    </div>
                  </div>

                  {/* Role Info */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Rôle :</strong> COMPANY_ADMIN<br />
                      <strong>Entreprise associée :</strong> {companyData.name}<br />
                      <strong>Statut :</strong> Actif
                    </p>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-between">
                    <Button
                      variant="outlined"
                      onClick={handleBack}
                      disabled={loading}
                    >
                      Retour
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={loading}
                      leftIcon={loading ? <Loader2 className="h-4 w-4 animate-spin" /> : undefined}
                    >
                      {loading ? 'Création...' : 'Créer l\'entreprise'}
                    </Button>
                  </div>
                </motion.div>
              )}
            </div>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
>>>>>>> 28836c0 (Mise à jour du projet local avec la dernière version)
  );
};

export default AddCompanyModal;