/**
 * Application Configuration
 * Centralized configuration for the Bhavsar Kshatriya Community application
 */

const AppConfig = {
  // API Configuration
  API: {
    BASE_URL: 'https://script.google.com/macros/s/1xN-HNeKqNo5I7Mo5uF_M0f1j3j40kPA4SpSoTVCvS750Q0UrJhXH0dca/exec',
    ENDPOINTS: {
      SUBMIT_APPLICATION: 'submitApplication',
      UPDATE_RECORD: 'updateUserData',
      VERIFY_MEMBER: 'verifyMember',
      GENERATE_ID: 'generateUniqueId',
      GET_CSRF: 'getCsrfToken',
      SEND_OTP: 'sendOtp',
      SUGGEST: 'suggest',
      SUGGEST_ADDRESS: 'suggestAddress'
    },
    DEFAULT_HEADERS: {
      'Content-Type': 'application/json'
    },
    TIMEOUT: 30000, // 30 seconds
    RETRY_ATTEMPTS: 3
  },

  // Security Configuration
  SECURITY: {
    CSRF_TOKEN_EXPIRY: 1800000, // 30 minutes in ms
    RATE_LIMIT: {
      REQUESTS_PER_MINUTE: 10,
      WINDOW_MS: 60000 // 1 minute
    }
  },

  // Form Configuration
  FORM: {
    MAX_FAMILY_MEMBERS: 10,
    REQUIRED_DOCUMENTS: ['aadharFront', 'aadharBack', 'profilePhoto'],
    OPTIONAL_DOCUMENTS: ['casteCertificate'],
    FILE_TYPES: {
      IMAGE: ['image/jpeg', 'image/png', 'image/gif'],
      PDF: ['application/pdf'],
      MAX_SIZE: 5 * 1024 * 1024 // 5MB
    }
  },

  // Validation Rules
  VALIDATION: {
    NAME: {
      MIN_LENGTH: 2,
      MAX_LENGTH: 50,
      REGEX: /^[a-zA-Z\s\-']+$/
    },
    MOBILE: {
      LENGTH: 10,
      REGEX: /^[0-9]{10}$/
    },
    EMAIL: {
      REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    },
    AADHAR: {
      LENGTH: 16,
      REGEX: /^[0-9]{16}$/
    }
  },

  // UI Configuration
  UI: {
    LOADING_DELAY: 300, // ms before showing loading indicator
    AUTO_SAVE_INTERVAL: 30000, // 30 seconds
    SUGGESTION_DELAY: 300 // ms after typing before showing suggestions
  },

  // Error Messages
  ERROR_MESSAGES: {
    NETWORK_ERROR: 'Network error occurred. Please check your connection.',
    SERVER_ERROR: 'Server error occurred. Please try again later.',
    VALIDATION_ERROR: 'Please fill all required fields correctly.',
    FILE_UPLOAD_ERROR: 'File upload failed. Please try again.',
    OTP_ERROR: 'OTP verification failed. Please try again.'
  },

  // Success Messages
  SUCCESS_MESSAGES: {
    SUBMISSION: 'Application submitted successfully!',
    UPDATE: 'Information updated successfully!',
    OTP_SENT: 'OTP sent successfully!',
    OTP_VERIFIED: 'OTP verified successfully!'
  },

  // Default Values
  DEFAULTS: {
    COUNTRY: 'India',
    STATE: 'Maharashtra',
    CITIES: ['Pune', 'Mumbai', 'Nagpur', 'Nashik', 'Aurangabad'],
    PINCODES: ['411001', '411002', '411003', '411004', '411005']
  }
};

export default AppConfig;
