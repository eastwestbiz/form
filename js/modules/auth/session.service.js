/**
 * Session Service - Handles user authentication and session management
 */
class SessionService {
  constructor() {
    this.currentUser = null;
    this.csrfToken = null;
    this.sessionTimeout = 30 * 60 * 1000; // 30 minutes
    this.sessionTimer = null;
    this.storageKey = 'bks_session';
    this.scriptUrl = 'https://script.google.com/macros/s/1xN-HNeKqNo5I7Mo5uF_M0f1j3j40kPA4SpSoTVCvS750Q0UrJhXH0dca/exec';
  }

  /**
   * Initialize session service
   */
  init() {
    this._loadSession();
    this._setupEventListeners();
  }

  /**
   * Load session from storage if available
   */
  _loadSession() {
    try {
      const sessionData = localStorage.getItem(this.storageKey);
      if (sessionData) {
        const { user, token, expires } = JSON.parse(sessionData);
        if (expires > Date.now()) {
          this.currentUser = user;
          this.csrfToken = token;
          this._startSessionTimer();
        } else {
          this.clearSession();
        }
      }
    } catch (error) {
      console.error('Failed to load session:', error);
      this.clearSession();
    }
  }

  /**
   * Save session to storage
   */
  _saveSession() {
    const sessionData = {
      user: this.currentUser,
      token: this.csrfToken,
      expires: Date.now() + this.sessionTimeout
    };
    localStorage.setItem(this.storageKey, JSON.stringify(sessionData));
  }

  /**
   * Start session timer
   */
  _startSessionTimer() {
    this._clearSessionTimer();
    this.sessionTimer = setTimeout(() => {
      this.clearSession();
      this._showSessionTimeoutAlert();
    }, this.sessionTimeout);
  }

  /**
   * Clear session timer
   */
  _clearSessionTimer() {
    if (this.sessionTimer) {
      clearTimeout(this.sessionTimer);
      this.sessionTimer = null;
    }
  }

  /**
   * Show session timeout alert
   */
  _showSessionTimeoutAlert() {
    Swal.fire({
      title: 'Session Expired',
      text: 'Your session has expired. Please login again.',
      icon: 'warning',
      confirmButtonText: 'OK'
    }).then(() => {
      window.location.reload();
    });
  }

  /**
   * Setup event listeners for session management
   */
  _setupEventListeners() {
    // Reset session timer on user activity
    document.addEventListener('mousemove', () => this._startSessionTimer());
    document.addEventListener('keydown', () => this._startSessionTimer());
    document.addEventListener('click', () => this._startSessionTimer());
  }

  /**
   * Get CSRF token from server
   */
  async getCsrfToken() {
    try {
      const response = await fetch(`${this.scriptUrl}?action=getCsrfToken`);
      const data = await response.json();
      
      if (data.success && data.csrfToken) {
        this.csrfToken = data.csrfToken;
        return data.csrfToken;
      }
      throw new Error('Failed to get CSRF token');
    } catch (error) {
      console.error('Error getting CSRF token:', error);
      throw error;
    }
  }

  /**
   * Login user with credentials
   */
  async login(uniqueId, email, otp) {
    try {
      const token = this.csrfToken || await this.getCsrfToken();
      
      const response = await fetch(this.scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          action: 'verifyMember',
          uniqueId,
          email,
          csrfToken: token
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        this.currentUser = data.data;
        this._saveSession();
        this._startSessionTimer();
        return true;
      }
      
      throw new Error(data.message || 'Login failed');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Logout current user
   */
  logout() {
    this.clearSession();
    window.location.reload();
  }

  /**
   * Clear current session
   */
  clearSession() {
    this.currentUser = null;
    this.csrfToken = null;
    this._clearSessionTimer();
    localStorage.removeItem(this.storageKey);
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return !!this.currentUser;
  }

  /**
   * Get current user
   */
  getUser() {
    return this.currentUser;
  }

  /**
   * Get CSRF token
   */
  getToken() {
    return this.csrfToken;
  }
}

// Export singleton instance
export const sessionService = new SessionService();