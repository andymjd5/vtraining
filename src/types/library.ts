export interface LibraryResource {
  id: string;
  fileName: string;
  fileType: string;
  filePath: string;
  uploadedBy: string;
  createdAt: any; // ou Timestamp de firebase
  assignedToCompanies: string[];
}

export interface CompanyLibrary {
  id: string;
  companyId: string;
  resourceId: string;
  assignedToStudents: string[];
  assignedBy: string;
  assignedAt: any; // ou Timestamp de firebase
}