import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Building, Users, BookOpen, Calendar, CheckCircle, XCircle, Edit2, Trash2, UserPlus, FileText, History } from 'lucide-react';
import Button from '../ui/Button';
import { format } from 'date-fns';

interface Company {
  id: string;
  name: string;
  email: string;
  phone?: string;
  logo_url?: string;
  status: 'active' | 'inactive';
  created_at: any;
  agent_count: number;
  course_count: number;
}

interface CompanyDetailsModalProps {
  company: Company;
  onClose: () => void;
  onUpdate: () => void;
}

const CompanyDetailsModal = ({ company, onClose, onUpdate }: CompanyDetailsModalProps) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'agents' | 'courses' | 'history'>('details');

  const handleStatusToggle = async () => {
    setLoading(true);
    setError(null);
    try {
      // Update company status in Firestore
      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this company? This action cannot be undone.')) {
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Delete company from Firestore
      onUpdate();
      onClose();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden"
      >
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            {company.logo_url ? (
              <img
                src={company.logo_url}
                alt={`${company.name} logo`}
                className="h-12 w-12 rounded-lg object-contain"
              />
            ) : (
              <div className="h-12 w-12 rounded-lg bg-gray-100 flex items-center justify-center">
                <Building className="h-6 w-6 text-gray-400" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-semibold text-gray-900">{company.name}</h2>
              <p className="text-sm text-gray-500">{company.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'details'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('agents')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'agents'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Agents
          </button>
          <button
            onClick={() => setActiveTab('courses')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'courses'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Courses
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'history'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            History
          </button>
        </div>

        <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 8rem)' }}>
          {activeTab === 'details' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Status</h3>
                    <div className="mt-1 flex items-center">
                      {company.status === 'active' ? (
                        <CheckCircle className="h-5 w-5 text-success-500 mr-2" />
                      ) : (
                        <XCircle className="h-5 w-5 text-error-500 mr-2" />
                      )}
                      <span className="text-gray-900">
                        {company.status.charAt(0).toUpperCase() + company.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Contact Information</h3>
                    <div className="mt-1">
                      <p className="text-gray-900">{company.email}</p>
                      <p className="text-gray-900">{company.phone || 'No phone number provided'}</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Created</h3>
                    <div className="mt-1 flex items-center">
                      <Calendar className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-gray-900">
                        {format(company.created_at.toDate(), 'PPP')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-medium text-gray-500">Statistics</h3>
                    <div className="mt-2 grid grid-cols-2 gap-4">
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <Users className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-500">Agents</span>
                        </div>
                        <p className="mt-1 text-2xl font-semibold text-gray-900">{company.agent_count}</p>
                      </div>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center">
                          <BookOpen className="h-5 w-5 text-gray-400 mr-2" />
                          <span className="text-sm font-medium text-gray-500">Courses</span>
                        </div>
                        <p className="mt-1 text-2xl font-semibold text-gray-900">{company.course_count}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="flex flex-wrap gap-3">
                  <Button
                    variant={company.status === 'active' ? 'error' : 'success'}
                    onClick={handleStatusToggle}
                    isLoading={loading}
                  >
                    {company.status === 'active' ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button
                    variant="outlined"
                    leftIcon={<Edit2 className="h-4 w-4" />}
                  >
                    Edit Details
                  </Button>
                  <Button
                    variant="outlined"
                    leftIcon={<UserPlus className="h-4 w-4" />}
                  >
                    Manage Admins
                  </Button>
                  <Button
                    variant="outlined"
                    leftIcon={<FileText className="h-4 w-4" />}
                  >
                    View Reports
                  </Button>
                  <Button
                    variant="error"
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    onClick={handleDelete}
                    isLoading={loading}
                  >
                    Delete Company
                  </Button>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-4 bg-error-50 text-error-700 rounded-md">
                  {error}
                </div>
              )}
            </div>
          )}

          {activeTab === 'agents' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Associated Agents</h3>
                <Button leftIcon={<UserPlus className="h-4 w-4" />}>
                  Add Agent
                </Button>
              </div>
              {/* Agents table would go here */}
            </div>
          )}

          {activeTab === 'courses' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Assigned Courses</h3>
                <Button leftIcon={<BookOpen className="h-4 w-4" />}>
                  Assign Course
                </Button>
              </div>
              {/* Courses table would go here */}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-medium text-gray-900">Activity History</h3>
                <Button leftIcon={<History className="h-4 w-4" />}>
                  Export Log
                </Button>
              </div>
              {/* Activity log would go here */}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default CompanyDetailsModal;