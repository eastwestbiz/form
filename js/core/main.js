// /js/core/main.js - Main application entry point

/**
 * BKJS Community Application - Core Module
 * 
 * This file serves as the main entry point for the application,
 * initializing all core components and managing the application lifecycle.
 */

// Main Application Class
class BkjsApplication {
  constructor() {
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
      this.showFullPageLoader('Initializing application...');
      
      // Get CSRF token
      await this.getCsrfToken();
      
      // Check for existing session in localStorage
      const session = this.getSession();
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
      this.hideFullPageLoader();
      
    } catch (error) {
      this.handleError(error);
    }
  }
  
  /**
   * Get session from localStorage
   */
  getSession() {
    try {
      const sessionData = localStorage.getItem('bkjs_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        // Check if session is still valid (not expired)
        if (session.expires && new Date(session.expires) > new Date()) {
          return session;
        } else {
          // Remove expired session
          localStorage.removeItem('bkjs_session');
        }
      }
    } catch (error) {
      console.error('Error getting session:', error);
    }
    return null;
  }
  
  /**
   * Show full page loader
   */
  showFullPageLoader(message = 'Loading...') {
    const loader = document.createElement('div');
    loader.id = 'globalLoader';
    loader.className = 'global-loader';
    loader.innerHTML = `
      <div class="loader-spinner"></div>
      <div class="loader-text">${message}</div>
    `;
    document.body.appendChild(loader);
  }
  
  /**
   * Hide full page loader
   */
  hideFullPageLoader() {
    const loader = document.getElementById('globalLoader');
    if (loader) {
      loader.remove();
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
    
    // Show user-friendly error message using SweetAlert
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        icon: 'error',
        title: 'Error',
        text: errorMessage
      });
    } else {
      alert(errorMessage);
    }
    
    // Report to error tracking service in production
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      this.logError({
        message: errorMessage,
        details: errorDetails,
        url: window.location.href,
        user: this.state.currentUser?.uniqueId || 'anonymous'
      });
    }
  }
  
  /**
   * Log error to server
   */
  async logError(errorData) {
    try {
      await fetch(`${scriptUrl}?action=logError`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(errorData)
      });
    } catch (e) {
      console.error('Failed to log error to server:', e);
    }
  }
  
  /**
   * Show a specific view in the application
   * @param {string} viewName - Name of the view to show (login, register, update)
   */
  showView(viewName) {
    try {
      // Hide all views first
      this.hideElement('loginSection');
      this.hideElement('registrationSection');
      this.hideElement('updateSection');
      
      // Show the requested view
      switch(viewName) {
        case 'login':
          this.showElement('loginSection');
          this.state.activeForm = 'login';
          break;
          
        case 'register':
          this.showElement('registrationSection');
          this.state.activeForm = 'register';
          break;
          
        case 'update':
          this.showElement('updateSection');
          this.state.activeForm = 'update';
          break;
          
        default:
          throw new Error(`Unknown view: ${viewName}`);
      }
      
      // Clear any existing error messages
      this.clearErrors();
      
    } catch (error) {
      this.handleError(error);
    }
  }
  
  /**
   * Helper method to show element
   */
  showElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.remove('hidden');
    }
  }
  
  /**
   * Helper method to hide element
   */
  hideElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
      element.classList.add('hidden');
    }
  }
  
  /**
   * Clear error messages
   */
  clearErrors() {
    const errorElements = document.querySelectorAll('.alert-error');
    errorElements.forEach(el => {
      el.classList.add('hidden');
      el.textContent = '';
    });
  }
  
  /**
   * Get CSRF token from server
   */
  async getCsrfToken() {
    try {
      const response = await fetch(`${scriptUrl}?action=getCsrfToken`);
      const data = await response.json();
      
      if (data.success) {
        this.state.csrfToken = data.csrfToken;
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
      this.showButtonLoader(`#${formType}SubmitBtn`);
      
      // Add CSRF token to the data
      formData.csrfToken = this.state.csrfToken;
      
      // Determine the API action
      const action = formType === 'register' ? 'submitApplication' : 'updateUserData';
      
      // Make the API request
      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action,
          ...formData
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Handle success response
        if (formType === 'register') {
          this.showSuccessModal('Application submitted successfully!', data.applicationId);
        } else {
          this.showSuccessModal('Update submitted successfully!', this.state.currentUser.uniqueId);
        }
      } else {
        throw new Error(data.message || 'Submission failed');
      }
      
    } catch (error) {
      this.handleError(error);
    } finally {
      this.hideButtonLoader(`#${formType}SubmitBtn`);
    }
  }
  
  /**
   * Show button loader
   */
  showButtonLoader(buttonSelector) {
    const button = document.querySelector(buttonSelector);
    if (button) {
      button.disabled = true;
      const originalText = button.textContent;
      button.setAttribute('data-original-text', originalText);
      button.innerHTML = `${originalText} <span class="element-spinner"></span>`;
    }
  }
  
  /**
   * Hide button loader
   */
  hideButtonLoader(buttonSelector) {
    const button = document.querySelector(buttonSelector);
    if (button) {
      button.disabled = false;
      const originalText = button.getAttribute('data-original-text');
      if (originalText) {
        button.textContent = originalText;
      }
    }
  }
  
  /**
   * Show success modal
   * @param {string} message - Success message
   * @param {string} referenceId - Application or Unique ID
   */
  showSuccessModal(message, referenceId) {
    try {
      if (typeof Swal !== 'undefined') {
        Swal.fire({
          icon: 'success',
          title: 'Success!',
          text: message,
          footer: `Reference ID: ${referenceId}`
        });
      } else {
        alert(`${message}\nReference ID: ${referenceId}`);
      }
    } catch (error) {
      this.handleError(error);
    }
  }
}

// Initialize the application when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  // Make sure global variables are available
  if (typeof scriptUrl === 'undefined') {
    window.scriptUrl = window.AppConfig?.API?.BASE_URL || 'https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec';
  }
  
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
