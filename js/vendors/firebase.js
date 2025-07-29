/**
 * Firebase Service Wrapper
 * Provides a clean interface for Firebase services used in the application
 */

// Firebase configuration (replace with your actual config)
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID",
  measurementId: "G-MEASUREMENT_ID"
};

// Initialize Firebase
let firebaseApp;
let auth;
let storage;
let firestore;
let analytics;

class FirebaseService {
  constructor() {
    try {
      // Initialize Firebase only once
      if (!firebaseApp) {
        firebaseApp = firebase.initializeApp(firebaseConfig);
        auth = firebase.auth();
        storage = firebase.storage();
        firestore = firebase.firestore();
        analytics = firebase.analytics();
        
        // Enable persistence for Firestore
        firestore.enablePersistence()
          .catch((err) => {
            console.error('Firestore persistence failed: ', err);
          });
      }
    } catch (error) {
      console.error('Firebase initialization error:', error);
      throw new Error('Failed to initialize Firebase services');
    }
  }

  // ========================
  // Authentication Methods
  // ========================
  
  /**
   * Send OTP to phone number
   * @param {string} phoneNumber - E.164 format phone number
   * @param {string} recaptchaVerifier - reCAPTCHA verifier instance
   * @returns {Promise<string>} - Verification ID
   */
  async sendPhoneOtp(phoneNumber, recaptchaVerifier) {
    try {
      const confirmation = await auth.signInWithPhoneNumber(
        phoneNumber, 
        recaptchaVerifier
      );
      return confirmation.verificationId;
    } catch (error) {
      console.error('OTP send error:', error);
      throw this._handleAuthError(error);
    }
  }

  /**
   * Verify phone OTP
   * @param {string} verificationId - From sendPhoneOtp
   * @param {string} otp - User entered OTP
   * @returns {Promise<firebase.User>} - Authenticated user
   */
  async verifyPhoneOtp(verificationId, otp) {
    try {
      const credential = firebase.auth.PhoneAuthProvider.credential(
        verificationId,
        otp
      );
      const userCredential = await auth.signInWithCredential(credential);
      return userCredential.user;
    } catch (error) {
      console.error('OTP verification error:', error);
      throw this._handleAuthError(error);
    }
  }

  /**
   * Sign out current user
   */
  async signOut() {
    try {
      await auth.signOut();
    } catch (error) {
      console.error('Sign out error:', error);
      throw this._handleAuthError(error);
    }
  }

  /**
   * Get current authenticated user
   * @returns {firebase.User|null}
   */
  getCurrentUser() {
    return auth.currentUser;
  }

  /**
   * Listen for auth state changes
   * @param {function} callback - Callback function
   */
  onAuthStateChanged(callback) {
    return auth.onAuthStateChanged(callback);
  }

  // ========================
  // Storage Methods
  // ========================

  /**
   * Upload file to Firebase Storage
   * @param {File} file - File to upload
   * @param {string} path - Storage path
   * @param {object} metadata - File metadata
   * @returns {Promise<{url: string, ref: firebase.storage.Reference}>}
   */
  async uploadFile(file, path, metadata = {}) {
    try {
      const storageRef = storage.ref(path);
      const uploadTask = storageRef.put(file, metadata);
      
      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          null,
          (error) => reject(this._handleStorageError(error)),
          async () => {
            const downloadURL = await uploadTask.snapshot.ref.getDownloadURL();
            resolve({
              url: downloadURL,
              ref: uploadTask.snapshot.ref
            });
          }
        );
      });
    } catch (error) {
      console.error('File upload error:', error);
      throw this._handleStorageError(error);
    }
  }

  /**
   * Delete file from storage
   * @param {string} path - File path
   */
  async deleteFile(path) {
    try {
      const storageRef = storage.ref(path);
      await storageRef.delete();
    } catch (error) {
      console.error('File delete error:', error);
      throw this._handleStorageError(error);
    }
  }

  // ========================
  // Firestore Methods
  // ========================

  /**
   * Add document to collection
   * @param {string} collection - Collection name
   * @param {object} data - Document data
   * @returns {Promise<string>} - Document ID
   */
  async addDocument(collection, data) {
    try {
      const docRef = await firestore.collection(collection).add(data);
      return docRef.id;
    } catch (error) {
      console.error('Add document error:', error);
      throw this._handleFirestoreError(error);
    }
  }

  /**
   * Update document
   * @param {string} collection - Collection name
   * @param {string} docId - Document ID
   * @param {object} data - Update data
   */
  async updateDocument(collection, docId, data) {
    try {
      await firestore.collection(collection).doc(docId).update(data);
    } catch (error) {
      console.error('Update document error:', error);
      throw this._handleFirestoreError(error);
    }
  }

  /**
   * Get document by ID
   * @param {string} collection - Collection name
   * @param {string} docId - Document ID
   * @returns {Promise<object|null>} - Document data
   */
  async getDocument(collection, docId) {
    try {
      const doc = await firestore.collection(collection).doc(docId).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } catch (error) {
      console.error('Get document error:', error);
      throw this._handleFirestoreError(error);
    }
  }

  /**
   * Query documents
   * @param {string} collection - Collection name
   * @param {Array} queries - Array of query conditions [field, operator, value]
   * @param {number} limit - Maximum number of documents to return
   * @returns {Promise<Array>} - Array of documents
   */
  async queryDocuments(collection, queries = [], limit = 10) {
    try {
      let query = firestore.collection(collection);
      
      queries.forEach(([field, operator, value]) => {
        query = query.where(field, operator, value);
      });
      
      if (limit) {
        query = query.limit(limit);
      }
      
      const snapshot = await query.get();
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Query documents error:', error);
      throw this._handleFirestoreError(error);
    }
  }

  // ========================
  // Analytics Methods
  // ========================

  /**
   * Log an analytics event
   * @param {string} eventName - Event name
   * @param {object} eventParams - Event parameters
   */
  logEvent(eventName, eventParams = {}) {
    try {
      analytics.logEvent(eventName, eventParams);
    } catch (error) {
      console.error('Analytics error:', error);
    }
  }

  // ========================
  // Error Handling
  // ========================

  _handleAuthError(error) {
    const errorMap = {
      'auth/invalid-phone-number': 'Invalid phone number format',
      'auth/missing-verification-code': 'Please enter the verification code',
      'auth/invalid-verification-code': 'Invalid verification code',
      'auth/code-expired': 'Verification code expired',
      'auth/too-many-requests': 'Too many attempts. Please try again later.',
      'auth/network-request-failed': 'Network error. Please check your connection.',
      'auth/user-disabled': 'This account has been disabled',
      'auth/operation-not-allowed': 'Phone authentication is not enabled'
    };
    
    return new Error(errorMap[error.code] || 'Authentication failed. Please try again.');
  }

  _handleStorageError(error) {
    const errorMap = {
      'storage/unauthorized': 'You do not have permission to access this file',
      'storage/canceled': 'Upload canceled',
      'storage/unknown': 'Unknown storage error occurred',
      'storage/invalid-argument': 'Invalid file or path specified',
      'storage/object-not-found': 'File not found',
      'storage/quota-exceeded': 'Storage quota exceeded'
    };
    
    return new Error(errorMap[error.code] || 'File operation failed. Please try again.');
  }

  _handleFirestoreError(error) {
    const errorMap = {
      'permission-denied': 'You do not have permission to perform this operation',
      'not-found': 'Document not found',
      'already-exists': 'Document already exists',
      'resource-exhausted': 'Too many requests. Please try again later.',
      'failed-precondition': 'Operation cannot be completed in current state',
      'aborted': 'Operation aborted',
      'unavailable': 'Service unavailable. Please try again later.'
    };
    
    return new Error(errorMap[error.code] || 'Database operation failed. Please try again.');
  }
}

// Export as singleton instance
const firebaseService = new FirebaseService();
export default firebaseService;
