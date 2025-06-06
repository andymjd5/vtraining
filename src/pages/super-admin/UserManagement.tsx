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
      console.log('Données récupérées:', data); // Debug
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
      console.log('Delete user:', userId);
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

  // FIX 1: Améliorer la logique de filtrage pour gérer les différents formats de noms
  const filteredUsers = users.filter(user => {
    // Gérer les différents formats de noms (name, fullName, displayName)
    const userName = user.name || user.fullName || user.displayName || '';
    const userEmail = user.email || '';
    
    const matchesSearch = 
      userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      userEmail.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (selectedTab === 'all') return matchesSearch;
    
    // FIX 2: Vérifier le rôle correctement (gérer les cas où le rôle peut être en minuscules ou majuscules)
    const userRole = user.role?.toUpperCase();
    const selectedRole = selectedTab.toUpperCase();
    
    return matchesSearch && userRole === selectedRole;
  });

  const getRoleColor = (role: UserRole) => {
    // FIX 3: Gérer les rôles même s'ils sont en minuscules
    const normalizedRole = role?.toUpperCase();
    switch (normalizedRole) {
      case 'SUPER_ADMIN':
        return 'bg-primary-100 text-primary-800';
      case 'COMPANY_ADMIN':
        return 'bg-accent-100 text-accent-800';
      case 'AGENT':
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

  // FIX 4: Fonction pour normaliser l'affichage du rôle
  const getRoleDisplayName = (role: string) => {
    const normalizedRole = role?.toUpperCase();
    switch (normalizedRole) {
      case 'SUPER_ADMIN':
        return 'Super Admin';
      case 'COMPANY_ADMIN':
        return 'Admin';
      case 'AGENT':
        return 'Agent';
      default:
        return role || 'Non défini';
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
        <Button leftIcon={<Plus className="h-5 w-5" />} onClick={fetchUsers}>
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
                Tous ({users.length})
              </button>
              {Object.values(UserRole).map((role) => {
                // FIX 5: Compter les utilisateurs par rôle correctement
                const roleCount = users.filter(user => 
                  user.role?.toUpperCase() === role.toUpperCase()
                ).length;
                
                return (
                  <button
                    key={role}
                    className={`px-4 py-2 text-sm font-medium rounded-md ${
                      selectedTab === role.toLowerCase()
                        ? 'bg-primary-100 text-primary-700'
                        : 'text-gray-500 hover:text-gray-700'
                    }`}
                    onClick={() => setSelectedTab(role.toLowerCase())}
                  >
                    {getRoleDisplayName(role)} ({roleCount})
                  </button>
                );
              })}
            </div>

            <div className="flex items-center space-x-2">
              <Button 
                onClick={fetchUsers}
                variant="outlined"
                size="sm"
              >
                Actualiser
              </Button>
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
          </div>

          {/* Debug Info */}
          <div className="bg-blue-50 border border-blue-200 rounded-md p-3 text-sm">
            <p>Debug: {users.length} utilisateurs dans la base, {filteredUsers.length} affichés</p>
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
                {filteredUsers.map((user) => {
                  // FIX 6: Gérer les différents formats de noms
                  const displayName = user.name || user.fullName || user.displayName || 'Sans nom';
                  const displayEmail = user.email || 'Email non défini';
                  
                  return (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            {displayName.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{displayName}</div>
                            <div className="text-sm text-gray-500">{displayEmail}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getRoleColor(user.role)}`}>
                          {getRoleDisplayName(user.role)}
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
                            onClick={() => handlePasswordReset(displayEmail)}
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
                  );
                })}
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