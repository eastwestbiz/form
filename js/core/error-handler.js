/**
 * Global Error Handler for BKJS Community Application
 * Handles both UI display and logging of errors
 */

class ErrorHandler {
  constructor() {
    this.errorConfig = {
      // Standard error types
      NETWORK_ERROR: {
        title: 'Connection Error',
        message: 'Unable to connect to the server. Please check your internet connection.',
        type: 'error'
      },
      VALIDATION_ERROR: {
        title: 'Validation Error',
        message: 'Please check your input and try again.',
        type: 'warning'
      },
      AUTH_ERROR: {
        title: 'Authentication Error',
        message: 'Your session has expired or you are not authorized.',
        type: 'error'
      },
      SERVER_ERROR: {
        title: 'Server Error',
        message: 'An unexpected error occurred on the server.',
        type: 'error'
      },
      RATE_LIMIT_ERROR: {
        title: 'Too Many Requests',
        message: 'Please wait a moment before trying again.',
        type: 'warning'
      },
      CSRF_ERROR: {
        title: 'Security Error',
        message: 'Invalid security token. Please refresh the page.',
        type: 'error'
      },
      DEFAULT_ERROR: {
        title: 'Error',
        message: 'An unexpected error occurred.',
        type: 'error'
      }
    };

    // Initialize error logging
    this.initErrorLogging();
  }

  /**
   * Initialize error logging and global handlers
   */
  initErrorLogging() {
    // Log unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError('Unhandled Rejection', event.reason);
      this.displayError(event.reason);
      event.preventDefault();
    });

    // Log window errors
    window.addEventListener('error', (event) => {
      this.logError('Window Error', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno
      });
      event.preventDefault();
    });
  }

  /**
   * Display user-friendly error message
   * @param {Error|Object} error - Error object or error response
   * @param {Object} [options] - Additional options
   */
  displayError(error, options = {}) {
    const errorType = this.determineErrorType(error);
    const config = this.errorConfig[errorType] || this.errorConfig.DEFAULT_ERROR;
    
    // Use error-specific message if available
    const message = error.message || error.Message || config.message;

    // Show appropriate UI notification
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: config.title,
        text: message,
        icon: config.type === 'warning' ? 'warning' : 'error',
        ...options
      });
    } else {
      // Fallback to basic alert
      alert(`${config.title}: ${message}`);
    }

    // Update UI error displays if needed
    this.updateErrorUI(error);
  }

  /**
   * Determine error type from error object
   * @param {Error|Object} error 
   * @returns {string} Error type key
   */
  determineErrorType(error) {
    if (!error) return 'DEFAULT_ERROR';
    
    // Handle HTTP error responses
    if (error.statusCode) {
      switch(error.statusCode) {
        case 400: return 'VALIDATION_ERROR';
        case 401: return 'AUTH_ERROR';
        case 403: return 'AUTH_ERROR';
        case 404: return 'DEFAULT_ERROR';
        case 429: return 'RATE_LIMIT_ERROR';
        case 500: return 'SERVER_ERROR';
      }
    }
    
    // Handle specific error codes from backend
    if (error.errorCode) {
      switch(error.errorCode) {
        case 'AUTH_FAILED': return 'AUTH_ERROR';
        case 'RATE_LIMITED': return 'RATE_LIMIT_ERROR';
        case 'INVALID_CSRF': return 'CSRF_ERROR';
      }
    }
    
    // Handle network errors
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      return 'NETWORK_ERROR';
    }
    
    return 'DEFAULT_ERROR';
  }

  /**
   * Log error to console and/or external service
   * @param {string} context 
   * @param {Error|Object} error 
   */
  logError(context, error) {
    const errorData = {
      timestamp: new Date().toISOString(),
      context,
      message: error.message || String(error),
      stack: error.stack,
      ...(error.response && { response: error.response }),
      ...(error.config && { request: error.config })
    };

    // Log to console
    console.error(`[${context}]`, errorData);

    // TODO: Add external error logging (Sentry, etc.)
    // this.logToExternalService(errorData);
  }

  /**
   * Update UI elements to reflect errors
   * @param {Error|Object} error 
   */
  updateErrorUI(error) {
    // Handle form validation errors
    if (error.errors) {
      Object.entries(error.errors).forEach(([field, message]) => {
        const input = document.getElementById(field);
        if (input) {
          input.classList.add('error');
          const errorElement = document.createElement('div');
          errorElement.className = 'error-message';
          errorElement.textContent = message;
          input.parentNode.appendChild(errorElement);
        }
      });
    }

    // Handle specific error cases
    switch(this.determineErrorType(error)) {
      case 'AUTH_ERROR':
        // Redirect to login or show login modal
        if (window.location.pathname !== '/login') {
          window.location.href = '/login?error=auth';
        }
        break;
        
      case 'CSRF_ERROR':
        // Refresh CSRF token
        this.refreshCsrfToken();
        break;
    }
  }

  /**
   * Refresh CSRF token after error
   */
  async refreshCsrfToken() {
    try {
      const response = await fetch(`${window.scriptUrl}?action=getCsrfToken`);
      const data = await response.json();
      if (data.success && data.csrfToken) {
        window.csrfToken = data.csrfToken;
      }
    } catch (e) {
      this.logError('CSRF Refresh Failed', e);
    }
  }
}

// Initialize and export singleton instance
const errorHandler = new ErrorHandler();
export default errorHandler;