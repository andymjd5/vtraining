import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, UserPlus, Eye, EyeOff } from 'lucide-react';
import Button from '../ui/Button';
import { db, auth } from '../../lib/firebase';
import { doc, setDoc, serverTimestamp, collection, getDocs } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useToast } from '../../hooks/useToast';
import { UserRole } from '../../types';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

interface Company {
  id: string;
  name: string;
}

const AddUserModal = ({ isOpen, onClose, onUserAdded }: AddUserModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const { success, error: showError } = useToast();
  const [companies, setCompanies] = useState<Company[]>([]);

  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: '',
    role: UserRole.STUDENT,
    companyId: '',
  });

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const companiesCollection = collection(db, 'companies');
        const companySnapshot = await getDocs(companiesCollection);
        const companyList = companySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Company));
        setCompanies(companyList);
      } catch (err) {
        console.error("Error fetching companies: ", err);
        showError("Erreur lors de la récupération des entreprises.");
      }
    };

    if (isOpen) {
      fetchCompanies();
    }
  }, [isOpen, showError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // 1. Create user in Firebase Auth
      const { user } = await createUserWithEmailAndPassword(
        auth,
        userData.email,
        userData.password
      );

      // 2. Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        companyId: userData.companyId,
        status: 'active',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      success(`Utilisateur ${userData.name} créé avec succès !`);
      onUserAdded();
      onClose();
    } catch (err: any) {
      console.error('Error creating user:', err);
      setError(err.message);
      showError("Erreur lors de la création de l'utilisateur.");
    } finally {
      setLoading(false);
    }
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-primary-100 rounded-lg">
              <UserPlus className="h-6 w-6 text-primary-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Ajouter un nouvel utilisateur</h2>
              <p className="text-sm text-gray-500">Remplissez les informations ci-dessous</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-500 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-6">
            {/* Form fields */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Nom complet *</label>
              <input type="text" required value={userData.name} onChange={(e) => setUserData({ ...userData, name: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="John Doe"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
              <input type="email" required value={userData.email} onChange={(e) => setUserData({ ...userData, email: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="user@example.com"/>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Mot de passe *</label>
              <div className="relative">
                <input type={showPassword ? 'text' : 'password'} required value={userData.password} onChange={(e) => setUserData({ ...userData, password: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500" placeholder="Mot de passe sécurisé" minLength={6}/>
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center">
                  {showPassword ? <EyeOff className="h-5 w-5 text-gray-400" /> : <Eye className="h-5 w-5 text-gray-400" />}
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Rôle *</label>
              <select required value={userData.role} onChange={(e) => setUserData({ ...userData, role: e.target.value as UserRole })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                {Object.values(UserRole).map(role => <option key={role} value={role}>{role}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Entreprise</label>
              <select value={userData.companyId} onChange={(e) => setUserData({ ...userData, companyId: e.target.value })} className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500">
                <option value="">Aucune</option>
                {companies.map(company => <option key={company.id} value={company.id}>{company.name}</option>)}
              </select>
            </div>
          </div>

          {error && <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">{error}</div>}

          <div className="mt-8 flex justify-end space-x-3">
            <Button variant="outlined" onClick={onClose} disabled={loading}>Annuler</Button>
            <Button type="submit" isLoading={loading} className="bg-primary-600 hover:bg-primary-700">Créer l'utilisateur</Button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

export default AddUserModal;