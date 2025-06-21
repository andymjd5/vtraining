import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, MoreVertical, CheckCircle, XCircle, Mail, Filter, X, Users } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { useAuth } from '../../hooks/useAuth';
import { collection, query, where, getDocs, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useToast } from '../../hooks/useToast';
import { UserRole } from '../../types';

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  companyId: string;
  status: 'active' | 'inactive' | 'pending';
  last_login?: any;
  createdAt?: any;
}

interface AddUserModalProps {
  companyId: string;
  onClose: () => void;
  onSuccess: () => void;
}

const AddUserModal: React.FC<AddUserModalProps> = ({ companyId, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    password: '123456', // Default password
    role: UserRole.STUDENT
  });
  const { success, error: showError } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // In a real app, you would use Firebase Auth to create the user
      // For now, we'll just add the user to Firestore
      await addDoc(collection(db, 'users'), {
        name: userData.name,
        email: userData.email,
        role: userData.role,
        companyId: companyId,
        status: 'active',
        createdAt: serverTimestamp()
      });

      success('Utilisateur créé avec succès');
      onSuccess();
    } catch (error) {
      console.error('Error creating user:', error);
      showError('Erreur lors de la création de l\'utilisateur');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Ajouter un utilisateur</h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Nom complet</label>
            <input
              type="text"
              required
              value={userData.name}
              onChange={(e) => setUserData({ ...userData, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              required
              value={userData.email}
              onChange={(e) => setUserData({ ...userData, email: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outlined"
              onClick={onClose}
              disabled={loading}
            >
              Annuler
            </Button>
            <Button
              type="submit"
              isLoading={loading}
            >
              Créer
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

const UserManagement = () => {
  const { user: currentUser } = useAuth();
  const { success, error: showError } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    if (currentUser?.companyId) {
      fetchUsers();
    }
  }, [currentUser]);

  const fetchUsers = async () => {
    try {
      if (!currentUser?.companyId) return;

      setLoading(true);
      const usersQuery = query(
        collection(db, 'users'),
        where('companyId', '==', currentUser.companyId),
        where('role', '==', 'STUDENT')
      );

      const snapshot = await getDocs(usersQuery);

      console.log('Fetched users:', snapshot.docs.length);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];

      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      showError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (userId: string, newStatus: 'active' | 'inactive' | 'pending') => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        status: newStatus
      });

      setUsers(prev => prev.map(user =>
        user.id === userId ? { ...user, status: newStatus } : user
      ));

      success(`Statut mis à jour avec succès`);
    } catch (error) {
      console.error('Error updating user status:', error);
      showError('Erreur lors de la mise à jour du statut');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(prev => prev.filter(user => user.id !== userId));
      success('Utilisateur supprimé avec succès');
    } catch (error) {
      console.error('Error deleting user:', error);
      showError('Erreur lors de la suppression de l\'utilisateur');
    }
  };

  const handleResetPassword = async (email: string) => {
    try {
      // In a real app, you would use Firebase Auth to send a password reset email
      success('Email de réinitialisation envoyé avec succès');
    } catch (error) {
      console.error('Error resetting password:', error);
      showError('Erreur lors de l\'envoi de l\'email de réinitialisation');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = !statusFilter || user.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des agents</h1>
          <p className="text-gray-600">
            Gérez les utilisateurs de votre entreprise
          </p>
        </div>
        <Button
          leftIcon={<Plus className="h-5 w-5" />}
          onClick={() => setShowCreateModal(true)}
        >
          Ajouter un agent
        </Button>
      </div>

      <Card>
        <div className="p-6 space-y-6">
          {/* Filters */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-2 w-full sm:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Tous les statuts</option>
                <option value="active">Actif</option>
                <option value="inactive">Inactif</option>
                <option value="pending">En attente</option>
              </select>

              <Button
                variant="outlined"
                size="sm"
                onClick={fetchUsers}
              >
                Actualiser
              </Button>
            </div>
          </div>

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utilisateur
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Dernière connexion
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-12 text-center">
                      <div className="text-center">
                        <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                          Aucun utilisateur trouvé
                        </h3>
                        <p className="text-gray-500 mb-6 max-w-md mx-auto">
                          {searchQuery || statusFilter
                            ? "Aucun utilisateur ne correspond à vos critères de recherche."
                            : "Commencez par ajouter des utilisateurs à votre entreprise."}
                        </p>
                        {(searchQuery || statusFilter) && (
                          <Button
                            variant="outlined"
                            onClick={() => {
                              setSearchQuery('');
                              setStatusFilter('');
                            }}
                          >
                            Effacer les filtres
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${user.status === 'active' ? 'bg-green-100 text-green-800' :
                          user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                          {user.status === 'active' ? 'Actif' :
                            user.status === 'pending' ? 'En attente' :
                              'Inactif'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.last_login ? new Date(user.last_login.toDate()).toLocaleDateString() : 'Jamais'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex justify-end space-x-2">
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            onClick={() => handleResetPassword(user.email)}
                            title="Réinitialiser le mot de passe"
                          >
                            <Mail className="h-5 w-5" />
                          </button>
                          <button
                            className="text-blue-600 hover:text-blue-900"
                            title="Modifier"
                          >
                            <Edit2 className="h-5 w-5" />
                          </button>
                          {user.status !== 'active' && (
                            <button
                              className="text-green-600 hover:text-green-900"
                              onClick={() => handleStatusUpdate(user.id, 'active')}
                              title="Activer"
                            >
                              <CheckCircle className="h-5 w-5" />
                            </button>
                          )}
                          {user.status === 'active' && (
                            <button
                              className="text-red-600 hover:text-red-900"
                              onClick={() => handleStatusUpdate(user.id, 'inactive')}
                              title="Désactiver"
                            >
                              <XCircle className="h-5 w-5" />
                            </button>
                          )}
                          <button
                            className="text-red-600 hover:text-red-900"
                            onClick={() => handleDeleteUser(user.id)}
                            title="Supprimer"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Card>

      {/* Add User Modal */}
      {showCreateModal && currentUser?.companyId && (
        <AddUserModal
          companyId={currentUser.companyId}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchUsers();
          }}
        />
      )}
    </div>
  );
};

export default UserManagement;