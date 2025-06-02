import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Building, Users, BarChart, Settings } from 'lucide-react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Company, UserRole } from '../../types';

const CompanyManagement = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const companiesRef = collection(db, 'companies');
      const snapshot = await getDocs(companiesRef);
      const companiesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Company[];
      setCompanies(companiesData);
    } catch (error) {
      console.error('Error fetching companies:', error);
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Company Management</h1>
        <Button leftIcon={<Building className="h-5 w-5" />}>
          Add Company
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {companies.map((company) => (
          <motion.div
            key={company.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Card className="h-full">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  {company.logoUrl ? (
                    <img
                      src={company.logoUrl}
                      alt={`${company.name} logo`}
                      className="h-12 w-12 object-contain rounded"
                    />
                  ) : (
                    <div className="h-12 w-12 bg-gray-100 rounded flex items-center justify-center">
                      <Building className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">{company.name}</h3>
                    <p className="text-sm text-gray-500">{company.contactEmail}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-6">
                  <div className="flex items-center text-sm">
                    <Users className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">12 Users</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <BarChart className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">85% Activity Rate</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Settings className="h-4 w-4 text-gray-400 mr-2" />
                    <span className="text-gray-600">Active</span>
                  </div>
                </div>

                <Link to={`/super-admin/companies/${company.id}`}>
                  <Button variant="outlined" className="w-full">
                    Manage Company
                  </Button>
                </Link>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CompanyManagement;