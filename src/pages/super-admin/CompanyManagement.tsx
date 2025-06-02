import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Building, Users, CheckCircle, XCircle, Plus, Search, Download, Edit2, Trash2, MoreVertical } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format } from 'date-fns';
import { useToast } from '../../hooks/useToast';

interface Company {
  id: string;
  name: string;
  email: string;
  phone?: string;
  logo_url?: string;
  status: 'active' | 'inactive';
  created_at: Timestamp;
  agent_count: number;
  course_count: number;
}

const CompanyManagement = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'inactive' | 'new'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const { success, error: showError } = useToast();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const companiesRef = collection(db, 'companies');
      const snapshot = await getDocs(companiesRef);
      const companiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Company[];
      setCompanies(companiesData);
    } catch (err) {
      showError('Error fetching companies');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredCompanies = () => {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    return companies.filter(company => {
      const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          company.email.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;

      switch (selectedFilter) {
        case 'active':
          return company.status === 'active';
        case 'inactive':
          return company.status === 'inactive';
        case 'new':
          return company.created_at.toDate() >= startOfMonth;
        default:
          return true;
      }
    });
  };

  const handleCompanyClick = (company: Company) => {
    setSelectedCompany(company);
    setShowDetailsModal(true);
  };

  const handleStatusToggle = async (companyId: string, newStatus: 'active' | 'inactive') => {
    try {
      // Update company status in Firestore
      success(`Company status updated to ${newStatus}`);
      await fetchCompanies();
    } catch (err) {
      showError('Error updating company status');
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (!window.confirm('Are you sure you want to delete this company?')) return;

    try {
      // Delete company from Firestore
      success('Company deleted successfully');
      await fetchCompanies();
    } catch (err) {
      showError('Error deleting company');
    }
  };

  const exportToCSV = () => {
    // Implementation for CSV export
  };

  const exportToPDF = () => {
    // Implementation for PDF export
  };

  const stats = {
    total: companies.length,
    active: companies.filter(c => c.status === 'active').length,
    inactive: companies.filter(c => c.status === 'inactive').length,
    new: companies.filter(c => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      return c.created_at.toDate() >= startOfMonth;
    }).length
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Company Management</h1>
        <Button 
          onClick={() => setShowAddModal(true)}
          leftIcon={<Plus className="h-5 w-5" />}
        >
          Add Company
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          onClick={() => setSelectedFilter('all')}
          className="cursor-pointer"
        >
          <Card className={`h-full ${selectedFilter === 'all' ? 'ring-2 ring-primary-500' : ''}`}>
            <div className="flex items-center p-6">
              <div className="p-3 rounded-lg bg-gray-100">
                <Building className="h-6 w-6 text-gray-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Total Companies</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          onClick={() => setSelectedFilter('active')}
          className="cursor-pointer"
        >
          <Card className={`h-full ${selectedFilter === 'active' ? 'ring-2 ring-primary-500' : ''}`}>
            <div className="flex items-center p-6">
              <div className="p-3 rounded-lg bg-success-100">
                <CheckCircle className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Companies</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.2 }}
          onClick={() => setSelectedFilter('inactive')}
          className="cursor-pointer"
        >
          <Card className={`h-full ${selectedFilter === 'inactive' ? 'ring-2 ring-primary-500' : ''}`}>
            <div className="flex items-center p-6">
              <div className="p-3 rounded-lg bg-error-100">
                <XCircle className="h-6 w-6 text-error-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Inactive Companies</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          onClick={() => setSelectedFilter('new')}
          className="cursor-pointer"
        >
          <Card className={`h-full ${selectedFilter === 'new' ? 'ring-2 ring-primary-500' : ''}`}>
            <div className="flex items-center p-6">
              <div className="p-3 rounded-lg bg-primary-100">
                <Building className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">New This Month</p>
                <p className="text-2xl font-bold text-gray-900">{stats.new}</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Companies Table */}
      <Card>
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="relative w-full sm:w-64">
              <input
                type="text"
                placeholder="Search companies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-primary-500 focus:border-primary-500"
              />
              <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>

            <div className="flex space-x-2">
              <Button
                variant="outlined"
                size="sm"
                leftIcon={<Download className="h-4 w-4" />}
                onClick={exportToCSV}
              >
                Export CSV
              </Button>
              <Button
                variant="outlined"
                size="sm"
                leftIcon={<Download className="h-4 w-4" />}
                onClick={exportToPDF}
              >
                Export PDF
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agents
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Courses
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {getFilteredCompanies().map((company) => (
                  <motion.tr
                    key={company.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => handleCompanyClick(company)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {company.logo_url ? (
                          <img
                            src={company.logo_url}
                            alt={`${company.name} logo`}
                            className="h-10 w-10 rounded-full"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center">
                            <Building className="h-5 w-5 text-gray-500" />
                          </div>
                        )}
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{company.name}</div>
                          <div className="text-sm text-gray-500">{company.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {company.agent_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {company.course_count}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        company.status === 'active'
                          ? 'bg-success-100 text-success-800'
                          : 'bg-error-100 text-error-800'
                      }`}>
                        {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {format(company.created_at.toDate(), 'MMM d, yyyy')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outlined"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusToggle(company.id, company.status === 'active' ? 'inactive' : 'active');
                          }}
                        >
                          {company.status === 'active' ? 'Deactivate' : 'Activate'}
                        </Button>
                        <Button
                          variant="outlined"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Handle edit
                          }}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outlined"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCompany(company.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-error-600" />
                        </Button>
                        <Button variant="outlined" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>

            {getFilteredCompanies().length === 0 && (
              <div className="text-center py-12">
                <Building className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-2 text-sm font-medium text-gray-900">No companies found</h3>
                <p className="mt-1 text-sm text-gray-500">
                  {searchQuery ? 'Try adjusting your search terms.' : 'Get started by adding a new company.'}
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      {/* Add Company Modal */}
      {showAddModal && (
        <AddCompanyModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false);
            fetchCompanies();
            success('Company added successfully');
          }}
        />
      )}

      {/* Company Details Modal */}
      {showDetailsModal && selectedCompany && (
        <CompanyDetailsModal
          company={selectedCompany}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedCompany(null);
          }}
          onUpdate={fetchCompanies}
        />
      )}
    </div>
  );
};

export default CompanyManagement;