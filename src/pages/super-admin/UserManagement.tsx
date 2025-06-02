import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Edit2, Trash2, MoreVertical, CheckCircle, XCircle } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { userService } from '../../services/userService';
import { User, UserRole } from '../../types';

const AdminUserManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Utilisation du service Firebase
      const data = await userService.getAllUsers();
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Erreur lors du chargement des utilisateurs');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (userId: string, newStatus: 'active' | 'inactive' | 'pending') => {
    try {
      await userService.updateUserStatus(userId, newStatus);
      // Mettre à jour l'état local
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId ? { ...user, status: newStatus } : user
        )
      );
    } catch (error) {
      console.error('Error updating user status:', error);
      setError('Erreur lors de la mise à jour du statut');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      // Note: Firebase Auth nécessite une Cloud Function pour supprimer des utilisateurs
      // Vous devrez implémenter cette fonctionnalité côté serveur
      console.log('Delete user:', userId);
      // await userService.deleteUser(userId);
      // setUsers(prevUsers => prevUsers.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Erreur lors de la suppression de l\'utilisateur');
    }
  };

  const handlePasswordReset = async (email: string) => {
    try {
      await userService.resetUserPassword(email);
      alert('Email de réinitialisation envoyé avec succès !');
    } catch (error) {
      console.error('Error resetting password:', error);
      setError('Erreur lors de l\'envoi de l\'email de réinitialisation');
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedTab === 'all') return matchesSearch;
    return matchesSearch && user.role === selectedTab.toUpperCase();
  });

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'bg-primary-100 text-primary-800';
      case UserRole.COMPANY_ADMIN:
        return 'bg-accent-100 text-accent-800';
      case UserRole.AGENT:
        return 'bg-secondary-100 text-secondary-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'inactive':
        return 'text-red-600';
      case 'pending':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500 mr-1.5" />;
      case 'inactive':
        return <XCircle className="h-5 w-5 text-red-500 mr-1.5" />;
      case 'pending':
        return <div className="h-5 w-5 rounded-full bg-yellow-500 mr-1.5" />;
      default:
        return <div className="h-5 w-5 rounded-full bg-gray-500 mr-1.5" />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Gestion des utilisateurs</h1>
        <Button leftIcon={<Plus className="h-5 w-5" />}>
          Ajouter un utilisateur
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-800">{error}</div>
          <button 
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 underline hover:text-red-800"
          >
            Fermer
          </button>
        </div>
      )}

      <Card>
        <div className="space-y-4">
          {/* Filters and Search */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div className="flex space-x-2">
              <button
                className={`px-4 py-2 text-sm font-medium rounded-md ${
                  selectedTab === 'all'
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setSelectedTab('all')}
              >
                Tous
              </button>
              {Object.values(UserRole).map((role) => (
                <button
                  key={role}
                  className={`px-4 py-2 text-sm font-medium rounded-md ${
                    selectedTab === role.toLowerCase()
                      ? 'bg-primary-100 text-primary-700'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setSelectedTab(role.toLowerCase())}
                >
                  {role === UserRole.SUPER_ADMIN ? 'Super Admin' :
                   role === UserRole.COMPANY_ADMIN ? 'Admin' : 'Agent'}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Rechercher un utilisateur..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
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
                    Rôle
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Entreprise
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <motion.tr
                    key={user.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                          {user.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name || 'Sans nom'}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                        {user.role === UserRole.SUPER_ADMIN ? 'Super Admin' :
                         user.role === UserRole.COMPANY_ADMIN ? 'Admin' : 'Agent'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {user.company?.name || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="flex items-center">
                        {getStatusIcon(user.status || 'pending')}
                        <span className={`text-sm ${getStatusColor(user.status || 'pending')}`}>
                          {user.status === 'active' ? 'Actif' : 
                           user.status === 'inactive' ? 'Inactif' : 'En attente'}
                        </span>
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <button 
                          className="text-primary-600 hover:text-primary-900"
                          onClick={() => console.log('Edit user:', user.id)}
                          title="Modifier"
                        >
                          <Edit2 className="h-5 w-5" />
                        </button>
                        <button 
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => handlePasswordReset(user.email)}
                          title="Réinitialiser le mot de passe"
                        >
                          🔑
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
                            className="text-yellow-600 hover:text-yellow-900"
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
                        <button className="text-gray-400 hover:text-gray-600">
                          <MoreVertical className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Empty State */}
          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <XCircle className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">Aucun utilisateur trouvé</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchQuery ? 'Essayez de modifier vos critères de recherche.' : 'Aucun utilisateur n\'a été créé.'}
              </p>
              <Button 
                className="mt-4"
                onClick={fetchUsers}
                variant="outlined"
              >
                Actualiser
              </Button>
            </div>
          )}

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <Button variant="outlined" size="sm">Précédent</Button>
              <Button variant="outlined" size="sm">Suivant</Button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Affichage de <span className="font-medium">1</span> à{' '}
                  <span className="font-medium">{filteredUsers.length}</span> sur{' '}
                  <span className="font-medium">{users.length}</span> résultats
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <Button variant="outlined" size="sm">Précédent</Button>
                  <Button variant="outlined" size="sm">Suivant</Button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default AdminUserManagement;