# Vision Training Platform

A multi-tenant e-learning platform built with React, Firebase, and TypeScript.

## 🏗️ Architecture

### User Roles

- **Super Admin**: Platform-wide administration
- **Company Admin**: Company-specific administration
- **Student**: Course access and progression

### Database Schema

#### Core Collections (Firestore)

- `companies`: Organization profiles
- `users`: User accounts with role-based access
- `courses`: Training content containers
- `modules`: Course subdivisions
- `lessons`: Individual learning units

#### Progress Tracking

- `enrollments`: Course participation records
- `progressTracking`: Lesson completion status
- `certificates`: Course completion certificates

#### Supporting Features

- `notifications`: User notifications
- `companyFiles`: Course materials metadata
- `activityLogs`: User activity tracking

## 🔒 Security

### Firestore Security Rules

- Company isolation: Users can only access their company's data
- Role-based access: Permissions aligned with user roles
- Data protection: Secure file access and user data

### Authentication

- Email/password authentication via Firebase Auth
- Automatic user profile creation
- Role-based routing and access control

### Storage Security Rules

- Company-specific file access
- Role-based upload/download permissions
- File type and size restrictions

## 🚀 Development

### Prerequisites

- Node.js 18+
- npm 9+
- Firebase project

### Setup

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables:
   ```
   VITE_FIREBASE_API_KEY=your_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id
   VITE_FIREBASE_MEASUREMENT_ID=your_measurement_id
   ```
4. Start development server:
   ```bash
   npm run dev
   ```

### Firebase Configuration

#### Firestore Rules (`firestore.rules`)

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own profile
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // Company data access based on user's companyId
    match /companies/{companyId} {
      allow read: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.companyId == companyId;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'COMPANY_ADMIN' &&
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.companyId == companyId;
    }
    
    // Course access based on company membership
    match /courses/{courseId} {
      allow read: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.companyId == resource.data.companyId;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['COMPANY_ADMIN', 'SUPER_ADMIN'];
    }
    
    // Enrollment access
    match /enrollments/{enrollmentId} {
      allow read, write: if request.auth != null && 
                            (resource.data.userId == request.auth.uid || 
                             get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['COMPANY_ADMIN', 'SUPER_ADMIN']);
    }
    
    // Company files access
    match /companyFiles/{fileId} {
      allow read: if request.auth != null && 
                     get(/databases/$(database)/documents/users/$(request.auth.uid)).data.companyId == resource.data.companyId;
      allow write: if request.auth != null && 
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'COMPANY_ADMIN' &&
                      get(/databases/$(database)/documents/users/$(request.auth.uid)).data.companyId == resource.data.companyId;
    }
  }
}
```

#### Storage Rules (`storage.rules`)

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /companies/{companyId}/files/{allPaths=**} {
      allow read: if request.auth != null && 
                     getUserCompanyId() == companyId;
      allow write: if request.auth != null && 
                      getUserRole() == 'COMPANY_ADMIN' &&
                      getUserCompanyId() == companyId &&
                      request.resource.size < 10 * 1024 * 1024 && // 10MB limit
                      request.resource.contentType.matches('application/(pdf|msword|vnd\\.openxmlformats-officedocument\\.(wordprocessingml\\.document|spreadsheetml\\.sheet))|application/vnd\\.ms-excel');
      allow delete: if request.auth != null && 
                       getUserRole() == 'COMPANY_ADMIN' &&
                       getUserCompanyId() == companyId;
    }
    
    function getUserCompanyId() {
      return firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.companyId;
    }
    
    function getUserRole() {
      return firestore.get(/databases/(default)/documents/users/$(request.auth.uid)).data.role;
    }
  }
}
```

### Firebase Emulators

For local development, start the Firebase emulators:

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Initialize emulators (run once)
firebase init emulators

# Start emulators
firebase emulators:start
```

### Testing

```bash
npm run test        # Run unit tests
npm run test:e2e    # Run end-to-end tests
```

## 📦 Deployment

### Firebase Hosting

1. Build the project:
   ```bash
   npm run build
   ```
2. Deploy to Firebase:
   ```bash
   firebase deploy
   ```

### Environment Variables

Required variables for production:
- `VITE_FIREBASE_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`  
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_APP_ID`
- `VITE_FIREBASE_MEASUREMENT_ID`

## 📚 Features

- Multi-tenant architecture
- Role-based access control
- Course management
- Progress tracking
- Certificate generation
- File management with Firebase Storage
- Activity logging
- Real-time notifications
- Offline support (PWA ready)

## 🔧 Maintenance

### Logging

- Activity logs stored in Firestore
- Error logging with Firebase Crashlytics
- Analytics with Firebase Analytics

### Backups

- Automatic Firestore backups via Firebase
- Storage file backups
- Export capabilities for data portability

### Monitoring

- Firebase Performance Monitoring
- Real-time database monitoring
- User analytics and insights

## 🚀 Firebase Services Used

- **Authentication**: User management and authentication
- **Firestore**: NoSQL document database
- **Storage**: File storage and management
- **Functions**: Server-side logic (optional)
- **Hosting**: Web app hosting
- **Analytics**: User behavior tracking

## 📝 License

MIT License