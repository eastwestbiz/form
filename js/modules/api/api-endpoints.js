// /js/modules/api/api-endpoints.js

import { ApiService } from './api.service.js';
import { showLoading, hideLoading } from '../../utils/loading.utils.js';
import { displayError } from '../../core/error-handler.js';

/**
 * API Endpoints Service
 * Centralized management of all API endpoints and their configurations
 */
class ApiEndpoints {
  constructor() {
    this.api = new ApiService();
    this.baseUrl = 'https://script.google.com/macros/s/1xN-HNeKqNo5I7Mo5uF_M0f1j3j40kPA4SpSoTVCvS750Q0UrJhXH0dca/exec';
    this.csrfToken = null;
  }

  /**
   * Initialize API service with CSRF token
   */
  async init() {
    try {
      const response = await this.api.get(`${this.baseUrl}?action=getCsrfToken`);
      if (response.success) {
        this.csrfToken = response.csrfToken;
        return true;
      }
      throw new Error('Failed to initialize CSRF token');
    } catch (error) {
      displayError(error);
      return false;
    }
  }

  /**
   * Submit new membership application
   * @param {Object} formData - Application form data
   * @returns {Promise<Object>} - Response from server
   */
  async submitApplication(formData) {
    try {
      showLoading('Submitting application...');
      
      const payload = {
        action: 'submitApplication',
        csrfToken: this.csrfToken,
        ...formData
      };

      const response = await this.api.post(this.baseUrl, payload);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to submit application');
      }

      return response;
    } catch (error) {
      displayError(error);
      throw error;
    } finally {
      hideLoading();
    }
  }

  /**
   * Update existing member record
   * @param {Object} formData - Updated member data
   * @returns {Promise<Object>} - Response from server
   */
  async updateMemberRecord(formData) {
    try {
      showLoading('Updating member record...');
      
      const payload = {
        action: 'updateUserData',
        csrfToken: this.csrfToken,
        ...formData
      };

      const response = await this.api.post(this.baseUrl, payload);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to update record');
      }

      return response;
    } catch (error) {
      displayError(error);
      throw error;
    } finally {
      hideLoading();
    }
  }

  /**
   * Verify member credentials
   * @param {string} uniqueId - Member's unique ID
   * @param {string} email - Member's registered email
   * @returns {Promise<Object>} - Member data if successful
   */
  async verifyMember(uniqueId, email) {
    try {
      showLoading('Verifying credentials...');
      
      const payload = {
        action: 'verifyMember',
        csrfToken: this.csrfToken,
        uniqueId,
        email
      };

      const response = await this.api.post(this.baseUrl, payload);
      
      if (!response.success) {
        throw new Error(response.message || 'Verification failed');
      }

      return response.data;
    } catch (error) {
      displayError(error);
      throw error;
    } finally {
      hideLoading();
    }
  }

  /**
   * Generate unique ID for approved application
   * @param {string} applicationId - Application ID to approve
   * @returns {Promise<Object>} - Response with generated ID
   */
  async generateUniqueId(applicationId) {
    try {
      showLoading('Generating unique ID...');
      
      const payload = {
        action: 'generateUniqueId',
        csrfToken: this.csrfToken,
        applicationId
      };

      const response = await this.api.post(this.baseUrl, payload);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to generate ID');
      }

      return response;
    } catch (error) {
      displayError(error);
      throw error;
    } finally {
      hideLoading();
    }
  }

  /**
   * Send OTP to member's mobile/email
   * @param {string} type - 'mobile' or 'email'
   * @param {string} recipient - Mobile number or email address
   * @param {string} otp - OTP to send
   * @returns {Promise<Object>} - Response from server
   */
  async sendOtp(type, recipient, otp) {
    try {
      showLoading(`Sending ${type} OTP...`);
      
      const payload = {
        action: 'sendOtp',
        csrfToken: this.csrfToken,
        type,
        recipient,
        otp
      };

      const response = await this.api.post(this.baseUrl, payload);
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to send OTP');
      }

      return response;
    } catch (error) {
      displayError(error);
      throw error;
    } finally {
      hideLoading();
    }
  }

  /**
   * Get suggestions for form fields
   * @param {string} field - Field name to get suggestions for
   * @param {string} query - Search query
   * @returns {Promise<Array>} - Array of suggestions
   */
  async getSuggestions(field, query) {
    try {
      const response = await this.api.get(
        `${this.baseUrl}?action=suggest&field=${encodeURIComponent(field)}&q=${encodeURIComponent(query)}`
      );
      
      if (!response.success) {
        throw new Error('Failed to get suggestions');
      }

      return response.suggestions || [];
    } catch (error) {
      console.error('Error getting suggestions:', error);
      return [];
    }
  }

  /**
   * Get address suggestions
   * @param {string} field - Field type ('city', 'state', 'pincode')
   * @param {string} query - Search query
   * @returns {Promise<Array>} - Array of suggestions
   */
  async getAddressSuggestions(field, query) {
    try {
      const response = await this.api.get(
        `${this.baseUrl}?action=suggestAddress&field=${encodeURIComponent(field)}&q=${encodeURIComponent(query)}`
      );
      
      if (!response.success) {
        throw new Error('Failed to get address suggestions');
      }

      return response.suggestions || [];
    } catch (error) {
      console.error('Error getting address suggestions:', error);
      return [];
    }
  }
}

// Export singleton instance
export const apiEndpoints = new ApiEndpoints();