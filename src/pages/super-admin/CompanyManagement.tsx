import { useState, useEffect } from 'react';
import { Building, CheckCircle, XCircle, Plus, Search, Download, Edit2, Trash2, MoreVertical } from 'lucide-react';
import { collection, getDocs, Timestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { format } from 'date-fns';
import { useToast } from '../../hooks/useToast';
import AddCompanyModal from '../../components/modals/AddCompanyModal';
import CompanyDetailsModal from '../../components/modals/CompanyDetailsModal';

// Composants UI de base
const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
  <div className={`bg-white shadow rounded-lg ${className}`}>
    {children}
  </div>
);

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  size = 'md', 
  leftIcon, 
  className = '',
  ...props 
}: {
  children: React.ReactNode;
  onClick?: (e: React.MouseEvent) => void;
  variant?: 'primary' | 'outlined' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: React.ReactNode;
  className?: string;
  [key: string]: any;
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors';
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };
  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    outlined: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500'
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      onClick={onClick}
      {...props}
    >
      {leftIcon && <span className="mr-2">{leftIcon}</span>}
      {children}
    </button>
  );
};

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
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'active' | 'inactive' | 'new'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(false);
  const { success, error: showError } = useToast();

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
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
          return company.created_at && company.created_at.toDate() >= startOfMonth;
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
      const companyRef = doc(db, 'companies', companyId);
      await updateDoc(companyRef, {
        status: newStatus,
        updated_at: Timestamp.now()
      });
      
      success(`Company status updated to ${newStatus}`);
      await fetchCompanies();
    } catch (err) {
      showError('Error updating company status');
      console.error(err);
    }
  };

  const handleDeleteCompany = async (companyId: string) => {
    if (!window.confirm('Are you sure you want to delete this company? This action cannot be undone.')) return;

    try {
      const companyRef = doc(db, 'companies', companyId);
      await deleteDoc(companyRef);
      
      success('Company deleted successfully');
      await fetchCompanies();
    } catch (err) {
      showError('Error deleting company');
      console.error(err);
    }
  };

  const exportToCSV = () => {
    const csvData = companies.map(company => ({
      Name: company.name,
      Email: company.email,
      Phone: company.phone || '',
      Status: company.status,
      Agents: company.agent_count,
      Courses: company.course_count,
      Created: company.created_at ? format(company.created_at.toDate(), 'yyyy-MM-dd') : ''
    }));

    const csvContent = [
      Object.keys(csvData[0]).join(','),
      ...csvData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `companies_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    // Implémentation basique pour PDF - nécessiterait une bibliothèque comme jsPDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      const htmlContent = `
        <html>
          <head>
            <title>Companies Report</title>
            <style>
              body { font-family: Arial, sans-serif; margin: 20px; }
              table { width: 100%; border-collapse: collapse; margin-top: 20px; }
              th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
              th { background-color: #f2f2f2; }
              .header { text-align: center; margin-bottom: 20px; }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>Companies Report</h1>
              <p>Generated on ${format(new Date(), 'MMMM d, yyyy')}</p>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Company Name</th>
                  <th>Email</th>
                  <th>Status</th>
                  <th>Agents</th>
                  <th>Courses</th>
                  <th>Created</th>
                </tr>
              </thead>
              <tbody>
                ${companies.map(company => `
                  <tr>
                    <td>${company.name}</td>
                    <td>${company.email}</td>
                    <td>${company.status}</td>
                    <td>${company.agent_count}</td>
                    <td>${company.course_count}</td>
                    <td>${company.created_at ? format(company.created_at.toDate(), 'MMM d, yyyy') : ''}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </body>
        </html>
      `;
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const stats = {
    total: companies.length,
    active: companies.filter(c => c.status === 'active').length,
    inactive: companies.filter(c => c.status === 'inactive').length,
    new: companies.filter(c => {
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      return c.created_at && c.created_at.toDate() >= startOfMonth;
    }).length
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

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
        <div
          onClick={() => setSelectedFilter('all')}
          className={`cursor-pointer transform transition-all duration-200 hover:scale-105 ${
            selectedFilter === 'all' ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          <Card className="h-full">
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
        </div>

        <div
          onClick={() => setSelectedFilter('active')}
          className={`cursor-pointer transform transition-all duration-200 hover:scale-105 ${
            selectedFilter === 'active' ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          <Card className="h-full">
            <div className="flex items-center p-6">
              <div className="p-3 rounded-lg bg-green-100">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Active Companies</p>
                <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
              </div>
            </div>
          </Card>
        </div>

        <div
          onClick={() => setSelectedFilter('inactive')}
          className={`cursor-pointer transform transition-all duration-200 hover:scale-105 ${
            selectedFilter === 'inactive' ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          <Card className="h-full">
            <div className="flex items-center p-6">
              <div className="p-3 rounded-lg bg-red-100">
                <XCircle className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Inactive Companies</p>
                <p className="text-2xl font-bold text-gray-900">{stats.inactive}</p>
              </div>
            </div>
          </Card>
        </div>

        <div
          onClick={() => setSelectedFilter('new')}
          className={`cursor-pointer transform transition-all duration-200 hover:scale-105 ${
            selectedFilter === 'new' ? 'ring-2 ring-blue-500' : ''
          }`}
        >
          <Card className="h-full">
            <div className="flex items-center p-6">
              <div className="p-3 rounded-lg bg-blue-100">
                <Building className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">New This Month</p>
                <p className="text-2xl font-bold text-gray-900">{stats.new}</p>
              </div>
            </div>
          </Card>
        </div>
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
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
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
                  <tr
                    key={company.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors duration-150"
                    onClick={() => handleCompanyClick(company)}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {company.logo_url ? (
                          <img
                            src={company.logo_url}
                            alt={`${company.name} logo`}
                            className="h-10 w-10 rounded-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                          />
                        ) : null}
                        <div className={`h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center ${company.logo_url ? 'hidden' : ''}`}>
                          <Building className="h-5 w-5 text-gray-500" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{company.name}</div>
                          <div className="text-sm text-gray-500">{company.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {company.agent_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {company.course_count || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        company.status === 'active'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {company.created_at ? format(company.created_at.toDate(), 'MMM d, yyyy') : 'N/A'}
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
                            setSelectedCompany(company);
                            setShowDetailsModal(true);
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
                          className="text-red-600 hover:text-red-700 hover:border-red-300"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outlined" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Menu contextuel pour actions supplémentaires
                          }}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
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
                {!searchQuery && (
                  <div className="mt-6">
                    <Button onClick={() => setShowAddModal(true)} leftIcon={<Plus className="h-4 w-4" />}>
                      Add your first company
                    </Button>
                  </div>
                )}
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