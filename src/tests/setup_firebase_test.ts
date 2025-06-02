import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock Firebase modules
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({})),
  getApps: vi.fn(() => []),
  getApp: vi.fn(() => ({}))
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({
    currentUser: null,
    onAuthStateChanged: vi.fn(() => vi.fn()), // Returns unsubscribe function
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signOut: vi.fn(),
    sendPasswordResetEmail: vi.fn(),
    updateProfile: vi.fn()
  })),
  connectAuthEmulator: vi.fn(),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(() => vi.fn()),
  sendPasswordResetEmail: vi.fn(),
  updateProfile: vi.fn()
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({
    _delegate: {
      _databaseId: {
        isDefaultDatabase: true
      }
    }
  })),
  connectFirestoreEmulator: vi.fn(),
  collection: vi.fn(),
  doc: vi.fn(),
  getDocs: vi.fn(() => Promise.resolve({
    docs: [],
    size: 0,
    empty: true
  })),
  getDoc: vi.fn(() => Promise.resolve({
    exists: () => false,
    data: () => ({}),
    id: 'mock-id'
  })),
  setDoc: vi.fn(() => Promise.resolve()),
  addDoc: vi.fn(() => Promise.resolve({ id: 'mock-id' })),
  updateDoc: vi.fn(() => Promise.resolve()),
  deleteDoc: vi.fn(() => Promise.resolve()),
  query: vi.fn(),
  where: vi.fn(),
  orderBy: vi.fn(),
  limit: vi.fn(),
  onSnapshot: vi.fn(() => vi.fn()), // Returns unsubscribe function
  serverTimestamp: vi.fn(() => ({}))
}));

vi.mock('firebase/storage', () => ({
  getStorage: vi.fn(() => ({})),
  connectStorageEmulator: vi.fn(),
  ref: vi.fn(),
  uploadBytesResumable: vi.fn(() => ({
    on: vi.fn((event, progress, error, complete) => {
      // Simulate successful upload
      setTimeout(() => {
        progress?.({ bytesTransferred: 100, totalBytes: 100 });
        complete?.();
      }, 100);
    }),
    snapshot: {
      ref: {}
    }
  })),
  getDownloadURL: vi.fn(() => Promise.resolve('https://mock-url.com')),
  deleteObject: vi.fn(() => Promise.resolve()),
  listAll: vi.fn(() => Promise.resolve({ items: [], prefixes: [] })),
  getMetadata: vi.fn(() => Promise.resolve({
    name: 'mock-file.pdf',
    size: 1024,
    timeCreated: '2023-01-01T00:00:00.000Z'
  }))
}));

vi.mock('firebase/functions', () => ({
  getFunctions: vi.fn(() => ({})),
  connectFunctionsEmulator: vi.fn(),
  httpsCallable: vi.fn(() => vi.fn(() => Promise.resolve({ data: {} })))
}));

// Mock our Firebase config
vi.mock('../lib/firebase', () => ({
  app: {},
  db: {},
  auth: {
    currentUser: null,
    onAuthStateChanged: vi.fn(() => vi.fn()),
    signInWithEmailAndPassword: vi.fn(),
    createUserWithEmailAndPassword: vi.fn(),
    signOut: vi.fn()
  },
  storage: {},
  functions: {}
}));

// Mock Firebase Auth hook
vi.mock('../hooks/useAuth', () => ({
  useAuth: vi.fn(() => ({
    user: null,
    loading: false,
    signIn: vi.fn(),
    signUp: vi.fn(),
    signOut: vi.fn(),
    resetPassword: vi.fn()
  }))
}));

// Mock window.scrollTo
Object.defineProperty(window, 'scrollTo', {
  value: vi.fn(),
  writable: true
});

// Mock window.open
Object.defineProperty(window, 'open', {
  value: vi.fn(),
  writable: true
});

// Mock console.error to avoid test noise
const originalError = console.error;
beforeAll(() => {
  console.error = vi.fn();
});

afterAll(() => {
  console.error = originalError;
});

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn()
}));

// Mock File API
global.File = vi.fn().mockImplementation((bits, name, options) => ({
  name,
  size: bits.reduce((acc: number, bit: any) => acc + bit.length, 0),
  type: options?.type || 'application/octet-stream',
  lastModified: Date.now()
}));

// Mock FileReader
global.FileReader = vi.fn().mockImplementation(() => ({
  readAsDataURL: vi.fn(),
  readAsText: vi.fn(),
  result: '',
  onload: null,
  onerror: null
}));