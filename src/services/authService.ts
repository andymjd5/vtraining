import { User, Company, UserRole, LoginCredentials } from '../types';

// Mock users for demonstration
const mockUsers = [
  {
    id: 'agent1',
    name: 'Jean Dupont',
    email: 'agent@vision.com',
    password: 'password',
    role: UserRole.AGENT,
    companyId: 'onarev',
    profilePicture: 'https://images.pexels.com/photos/2379005/pexels-photo-2379005.jpeg?auto=compress&cs=tinysrgb&w=600',
    createdAt: new Date('2023-01-15'),
    updatedAt: new Date('2023-04-20'),
  },
  {
    id: 'admin1',
    name: 'Marie Administrateur',
    email: 'admin@vision.com',
    password: 'password',
    role: UserRole.COMPANY_ADMIN,
    companyId: 'unikin',
    createdAt: new Date('2022-11-10'),
    updatedAt: new Date('2023-03-05'),
  },
  {
    id: 'superadmin1',
    name: 'Robert Super',
    email: 'super@vision.com',
    password: 'password',
    role: UserRole.SUPER_ADMIN,
    createdAt: new Date('2022-10-01'),
    updatedAt: new Date('2023-02-15'),
  },
];

// Mock companies
const mockCompanies: Record<string, Company> = {
  'onarev': {
    id: 'onarev',
    name: 'ONAREV',
    logo: '🏢',
    contactEmail: 'contact@onarev.org',
    contactPhone: '+243 123 456 789',
    active: true,
    createdAt: new Date('2022-01-01'),
    updatedAt: new Date('2023-01-01'),
  },
  'unikin': {
    id: 'unikin',
    name: 'UNIKIN',
    logo: '🎓',
    contactEmail: 'contact@unikin.ac.cd',
    contactPhone: '+243 987 654 321',
    active: true,
    createdAt: new Date('2022-02-01'),
    updatedAt: new Date('2023-02-01'),
  },
  // Additional companies can be added here
};

// Mock login function
export const mockLogin = async (credentials: LoginCredentials): Promise<{ user: User, company: Company | null }> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  const user = mockUsers.find(
    u => u.email === credentials.email && 
         u.password === credentials.password &&
         (credentials.companyId ? u.companyId === credentials.companyId : true)
  );
  
  if (!user) {
    throw new Error('Invalid credentials');
  }
  
  // For demo purposes, omit the password field when returning user data
  const { password, ...userWithoutPassword } = user;
  
  const company = user.companyId ? mockCompanies[user.companyId] : null;
  
  return { 
    user: userWithoutPassword as User,
    company
  };
};

// Mock function to get user by ID
export const getMockUser = async (userId: string): Promise<{ user: User, company: Company | null } | null> => {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  const user = mockUsers.find(u => u.id === userId);
  
  if (!user) {
    return null;
  }
  
  // For demo purposes, omit the password field when returning user data
  const { password, ...userWithoutPassword } = user;
  
  const company = user.companyId ? mockCompanies[user.companyId] : null;
  
  return { 
    user: userWithoutPassword as User,
    company
  };
};