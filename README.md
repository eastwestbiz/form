/public
├── assets/
│   ├── css/
│   └── images/
└── js/
     ├── core/                # Core application functionality
     │   ├── main.js          # Main application entry point
     │   ├── config.js        # Configuration constants
     │   └── error-handler.js # Global error handling
     │
     ├── modules/             # Reusable application modules
     │   ├── auth/
     │   │   ├── auth.service.js
     │   │   ├── otp.service.js
     │   │   └── session.service.js
     │   │
     │   ├── form/
     │   │   ├── form.service.js
     │   │   ├── form-validation.service.js
     │   │   ├── form-submit.service.js
     │   │   └── form-autosave.service.js
     │   │
     │   └── api/
     │       ├── api.service.js
     │       ├── api-endpoints.js
     │       ├── api-interceptors.js
     │       └── api-mocks.js
     │
     ├── utils/               # Utility functions
     │   ├── dom.utils.js
     │   ├── loading.utils.js
     │   ├── format.utils.js
     │   ├── lazy-load.utils.js
     │   └── suggestions.utils.js  # New for suggestion      functionality
     │   └── file-upload.utils.js   
     │
     ├── vendors/             # Third-party code      wrappers/adapters
     │   ├── sweetalert.js    # Local wrapper for SweetAlert2
     │   ├── recaptcha.js     # Local wrapper for reCAPTCHA
     │   └── firebase.js      # Local wrapper for Firebase
     │
     ├── features/            # Feature-specific code
     │   ├── registration/
     │   │   ├── registration.controller.js
     │   │   └── registration.view.js
     │   └── dashboard/
     │
     └── components/          # New - for reusable UI components
         ├── address-input/
         ├── file-upload/
         └── otp-verification/




