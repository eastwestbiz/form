/**
 * Authentication Service for BKJS Community Application
 * Handles user login, registration, session management, and token handling
 */

import { SessionService } from './session.service.js';
import { ApiService } from '../../modules/api/api.service.js';
import { showError, showSuccess } from '../../utils/dom.utils.js';
import { showLoading, hideLoading } from '../../utils/loading.utils.js';

class AuthService {
  constructor() {
    this.apiService = new ApiService();
    this.sessionService = new SessionService();
    this.csrfToken = null;
  }

  /**
   * Initialize authentication service
   */
  async init() {
    await this.getCsrfToken();
  }

  /**
   * Get CSRF token from server
   */
  async getCsrfToken() {
    try {
      const response = await this.apiService.get('/auth/csrf-token');
      if (response.success) {
        this.csrfToken = response.csrfToken;
        return true;
      }
      throw new Error('Failed to get CSRF token');
    } catch (error) {
      console.error('CSRF Token Error:', error);
      showError('Security initialization failed. Please refresh the page.');
      return false;
    }
  }

  /**
   * Login user with credentials
   * @param {Object} credentials - { uniqueId, email, otp }
   */
  async login(credentials) {
    showLoading('Authenticating...');
    try {
      const response = await this.apiService.post('/auth/login', {
        ...credentials,
        csrfToken: this.csrfToken
      });

      if (response.success) {
        this.sessionService.createSession(response.data);
        showSuccess('Login successful!');
        return true;
      }
      throw new Error(response.message || 'Login failed');
    } catch (error) {
      console.error('Login Error:', error);
      showError(error.message || 'Login failed. Please try again.');
      return false;
    } finally {
      hideLoading();
    }
  }

  /**
   * Logout current user
   */
  async logout() {
    showLoading('Logging out...');
    try {
      await this.apiService.post('/auth/logout', { csrfToken: this.csrfToken });
      this.sessionService.clearSession();
      showSuccess('Logged out successfully');
      return true;
    } catch (error) {
      console.error('Logout Error:', error);
      showError('Logout failed. Please try again.');
      return false;
    } finally {
      hideLoading();
    }
  }

  /**
   * Send OTP to user's email or mobile
   * @param {string} type - 'email' or 'mobile'
   * @param {string} recipient - email address or phone number
   */
  async sendOtp(type, recipient) {
    showLoading(`Sending OTP to ${type}...`);
    try {
      const response = await this.apiService.post('/auth/send-otp', {
        type,
        recipient,
        csrfToken: this.csrfToken
      });

      if (response.success) {
        showSuccess(`OTP sent to your ${type}`);
        return response.otp; // In dev, return OTP for testing
      }
      throw new Error(response.message || 'Failed to send OTP');
    } catch (error) {
      console.error('OTP Error:', error);
      showError(error.message || 'Failed to send OTP. Please try again.');
      return null;
    } finally {
      hideLoading();
    }
  }

  /**
   * Verify OTP for login or registration
   * @param {string} type - 'email' or 'mobile'
   * @param {string} recipient - email or phone number
   * @param {string} otp - OTP code
   */
  async verifyOtp(type, recipient, otp) {
    showLoading('Verifying OTP...');
    try {
      const response = await this.apiService.post('/auth/verify-otp', {
        type,
        recipient,
        otp,
        csrfToken: this.csrfToken
      });

      if (response.success) {
        showSuccess(`${type.charAt(0).toUpperCase() + type.slice(1)} verified successfully`);
        return true;
      }
      throw new Error(response.message || 'OTP verification failed');
    } catch (error) {
      console.error('OTP Verification Error:', error);
      showError(error.message || 'Invalid OTP. Please try again.');
      return false;
    } finally {
      hideLoading();
    }
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    return this.sessionService.isValid();
  }

  /**
   * Get current user data
   */
  getCurrentUser() {
    return this.sessionService.getUser();
  }
}

// Export singleton instance
export const authService = new AuthService();

// Initialize when imported
authService.init().catch(console.error);
