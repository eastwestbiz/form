// /js/core/main.js - Main application entry point

/**
 * BKJS Community Application - Core Module
 * 
 * This file serves as the main entry point for the application,
 * initializing all core components and managing the application lifecycle.
 */

// Import core dependencies
import { Config } from './config.js';
import { ErrorHandler } from './error-handler.js';
import { AuthService } from '../modules/auth/auth.service.js';
import { FormService } from '../modules/form/form.service.js';
import { ApiService } from '../modules/api/api.service.js';
import { DomUtils } from '../utils/dom.utils.js';
import { LoadingUtils } from '../utils/loading.utils.js';

// Main Application Class
class BkjsApplication {
  constructor() {
    // Initialize configuration
    this.config = new Config();
    
    // Initialize error handler
    this.errorHandler = new ErrorHandler();
    
    // Initialize services
    this.authService = new AuthService(this);
    this.formService = new FormService(this);
    this.apiService = new ApiService(this);
    
    // Initialize utils
    this.domUtils = new DomUtils();
    this.loadingUtils = new LoadingUtils();
    
    // Application state
    this.state = {
      isAuthenticated: false,
      currentUser: null,
      csrfToken: null,
      activeForm: null
    };
    
    // Bind methods
    this.init = this.init.bind(this);
    this.handleError = this.handleError.bind(this);
    this.showView = this.showView.bind(this);
    this.getCsrfToken = this.getCsrfToken.bind(this);
  }
  
  /**
   * Initialize the application
   */
  async init() {
    try {
      // Show loading state
      this.loadingUtils.showFullPageLoader('Initializing application...');
      
      // Get CSRF token
      await this.getCsrfToken();
      
      // Check for existing session
      const session = this.authService.getSession();
      if (session) {
        this.state.isAuthenticated = true;
        this.state.currentUser = session.user;
        this.showView('update');
      } else {
        this.showView('login');
      }
      
      // Set up global error handling
      window.addEventListener('error', this.handleError);
      window.addEventListener('unhandledrejection', this.handleError);
      
      // Hide loading state
      this.loadingUtils.hideFullPageLoader();
      
    } catch (error) {
      this.handleError(error);
    }
  }
  
  /**
   * Handle application errors
   * @param {Error|Event|PromiseRejectionEvent} error 
   */
  handleError(error) {
    // Extract error information
    let errorMessage = 'An unexpected error occurred';
    let errorDetails = null;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      errorDetails = error.stack;
    } else if (error instanceof PromiseRejectionEvent) {
      errorMessage = error.reason.message;
      errorDetails = error.reason.stack;
    } else if (error instanceof Event) {
      errorMessage = error.message || 'Unknown error event';
    }
    
    // Log to console
    console.error('Application Error:', errorMessage, errorDetails);
    
    // Show user-friendly error message
    this.errorHandler.displayError(errorMessage);
    
    // Report to error tracking service in production
    if (this.config.environment === 'production') {
      this.apiService.logError({
        message: errorMessage,
        details: errorDetails,
        url: window.location.href,
        user: this.state.currentUser?.uniqueId || 'anonymous'
      });
    }
  }
  
  /**
   * Show a specific view in the application
   * @param {string} viewName - Name of the view to show (login, register, update)
   */
  showView(viewName) {
    try {
      // Hide all views first
      this.domUtils.hideElement('loginSection');
      this.domUtils.hideElement('registrationSection');
      this.domUtils.hideElement('updateSection');
      
      // Show the requested view
      switch(viewName) {
        case 'login':
          this.domUtils.showElement('loginSection');
          this.state.activeForm = 'login';
          break;
          
        case 'register':
          this.domUtils.showElement('registrationSection');
          this.state.activeForm = 'register';
          break;
          
        case 'update':
          this.domUtils.showElement('updateSection');
          this.state.activeForm = 'update';
          break;
          
        default:
          throw new Error(`Unknown view: ${viewName}`);
      }
      
      // Reset any form errors
      this.errorHandler.clearErrors();
      
    } catch (error) {
      this.handleError(error);
    }
  }
  
  /**
   * Get CSRF token from server
   */
  async getCsrfToken() {
    try {
      const response = await this.apiService.request({
        action: 'getCsrfToken'
      });
      
      if (response.success) {
        this.state.csrfToken = response.csrfToken;
      } else {
        throw new Error('Failed to get CSRF token');
      }
    } catch (error) {
      this.handleError(error);
    }
  }
  
  /**
   * Submit form data to the server
   * @param {string} formType - Type of form (register, update)
   * @param {object} formData - Form data to submit
   */
  async submitForm(formType, formData) {
    try {
      // Show loading state
      this.loadingUtils.showButtonLoader(`#${formType}SubmitBtn`);
      
      // Add CSRF token to the data
      formData.csrfToken = this.state.csrfToken;
      
      // Determine the API action
      const action = formType === 'register' ? 'submitApplication' : 'updateUserData';
      
      // Make the API request
      const response = await this.apiService.request({
        action,
        ...formData
      });
      
      if (response.success) {
        // Handle success response
        if (formType === 'register') {
          this.showSuccessModal('Application submitted successfully!', response.applicationId);
        } else {
          this.showSuccessModal('Update submitted successfully!', this.state.currentUser.uniqueId);
        }
      } else {
        throw new Error(response.message || 'Submission failed');
      }
      
    } catch (error) {
      this.handleError(error);
    } finally {
      this.loadingUtils.hideButtonLoader(`#${formType}SubmitBtn`);
    }
  }
  
  /**
   * Show success modal
   * @param {string} message - Success message
   * @param {string} referenceId - Application or Unique ID
   */
  showSuccessModal(message, referenceId) {
    try {
      const modal = this.domUtils.getElement('successModal');
      const messageEl = this.domUtils.getElement('successMessage');
      const idEl = this.domUtils.getElement('successAppId');
      
      messageEl.textContent = message;
      idEl.textContent = referenceId;
      
      this.domUtils.showModal(modal);
    } catch (error) {
      this.handleError(error);
    }
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  const app = new BkjsApplication();
  app.init();
  
  // Make app instance available globally for debugging
  if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
    window.app = app;
  }
});

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BkjsApplication;
}