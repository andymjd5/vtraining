import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building, Users, Mail, Phone, MapPin, BarChart } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Company, User, UserRole } from '../../types';

const CompanyDetails = () => {
  const { companyId } = useParams<{ companyId: string }>();
  const [company, setCompany] = useState<Company | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (companyId) {
      fetchCompanyData();
    }
  }, [companyId]);

  const fetchCompanyData = async () => {
    try {
      // Fetch company details
      const companyDoc = await getDoc(doc(db, 'companies', companyId!));
      if (companyDoc.exists()) {
        setCompany({ id: companyDoc.id, ...companyDoc.data() } as Company);
      }

      // Fetch company users
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('companyId', '==', companyId));
      const snapshot = await getDocs(q);
      const usersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching company data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900">Company not found</h2>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">{company.name}</h1>
        <Button variant="outlined" leftIcon={<Building className="h-5 w-5" />}>
          Edit Company
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Company Info */}
        <Card className="lg:col-span-1">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Company Information</h2>
            <div className="space-y-4">
              <div className="flex items-center">
                <Mail className="h-5 w-5 text-gray-400 mr-3" />
                <span className="text-gray-600">{company.contactEmail}</span>
              </div>
              {company.contactPhone && (
                <div className="flex items-center">
                  <Phone className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-600">{company.contactPhone}</span>
                </div>
              )}
              {company.address && (
                <div className="flex items-center">
                  <MapPin className="h-5 w-5 text-gray-400 mr-3" />
                  <span className="text-gray-600">{company.address}</span>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Company Stats */}
        <Card className="lg:col-span-2">
          <div className="p-6">
            <h2 className="text-lg font-semibold mb-4">Company Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-primary-600" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Total Users</p>
                    <p className="text-xl font-semibold">{users.length}</p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <BarChart className="h-8 w-8 text-success-600" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Active Users</p>
                    <p className="text-xl font-semibold">
                      {users.filter(u => u.status === 'active').length}
                    </p>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center">
                  <Users className="h-8 w-8 text-warning-600" />
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Pending Users</p>
                    <p className="text-xl font-semibold">
                      {users.filter(u => u.status === 'pending').length}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* User Management */}
        <Card className="lg:col-span-3">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Users</h2>
              <Button leftIcon={<Users className="h-5 w-5" />}>
                Add User
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <motion.tr
                      key={user.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center">
                            {user.name.charAt(0)}
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-500">{user.email}</p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === UserRole.COMPANY_ADMIN
                            ? 'bg-primary-100 text-primary-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'active'
                            ? 'bg-success-100 text-success-800'
                            : user.status === 'pending'
                            ? 'bg-warning-100 text-warning-800'
                            : 'bg-error-100 text-error-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Button variant="outlined" size="sm">
                          Manage
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default CompanyDetails;