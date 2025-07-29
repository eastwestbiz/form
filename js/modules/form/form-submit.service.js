/**
 * Form Submission Service for Bhavsar Kshatriya Community Application
 * Handles all form submission, validation, and communication with backend
 */
// /js/modules/form/form-submit.service.js

import { apiEndpoints } from '../api/api-endpoints.js';

export class FormSubmitService {
  static async submitRegistrationForm(formData) {
    // Validate form data
    // Prepare payload
    // Call apiEndpoints.submitApplication()
    // Handle response
  }

  static async submitUpdateForm(formData) {
    // Similar to above but for updates
  }
}

class FormSubmitService {
  constructor() {
    // Initialize with default values
    this.scriptUrl = 'https://script.google.com/macros/s/1xN-HNeKqNo5I7Mo5uF_M0f1j3j40kPA4SpSoTVCvS750Q0UrJhXH0dca/exec';
    this.csrfToken = null;
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.allowedFileTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    this.initialize();
  }

  /**
   * Initialize the service
   */
  async initialize() {
    try {
      // Get CSRF token from server
      this.csrfToken = await this.fetchCsrfToken();
    } catch (error) {
      console.error('Failed to initialize FormSubmitService:', error);
      throw error;
    }
  }

  /**
   * Fetch CSRF token from backend
   */
  async fetchCsrfToken() {
    try {
      const response = await fetch(`${this.scriptUrl}?action=getCsrfToken`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'getCsrfToken' }),
      });

      const data = await response.json();

      if (!data.success || !data.csrfToken) {
        throw new Error('Failed to get CSRF token');
      }

      return data.csrfToken;
    } catch (error) {
      console.error('Error fetching CSRF token:', error);
      throw error;
    }
  }

  /**
   * Submit the main application form
   * @param {Object} formData - Form data to submit
   */
  async submitApplication(formData) {
    try {
      // Validate form data before submission
      this.validateFormData(formData);

      // Process file uploads first
      const processedData = await this.processFileUploads(formData);

      // Submit to backend
      const response = await fetch(this.scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'submitApplication',
          csrfToken: this.csrfToken,
          ...processedData,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to submit application');
      }

      return result;
    } catch (error) {
      console.error('Application submission failed:', error);
      throw error;
    }
  }

  /**
   * Update existing member record
   * @param {Object} formData - Updated form data
   */
  async updateMemberRecord(formData) {
    try {
      // Validate form data
      this.validateFormData(formData, true);

      // Process file uploads
      const processedData = await this.processFileUploads(formData, true);

      // Submit to backend
      const response = await fetch(this.scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'updateUserData',
          csrfToken: this.csrfToken,
          ...processedData,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Failed to update member record');
      }

      return result;
    } catch (error) {
      console.error('Member record update failed:', error);
      throw error;
    }
  }

  /**
   * Verify member credentials
   * @param {String} uniqueId - Member's unique ID
   * @param {String} email - Member's registered email
   */
  async verifyMemberCredentials(uniqueId, email) {
    try {
      const response = await fetch(this.scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verifyMember',
          csrfToken: this.csrfToken,
          uniqueId,
          email,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.message || 'Verification failed');
      }

      return result;
    } catch (error) {
      console.error('Member verification failed:', error);
      throw error;
    }
  }

  /**
   * Process file uploads and return file references
   * @param {Object} formData - Form data containing file inputs
   * @param {Boolean} isUpdate - Whether this is an update operation
   */
  async processFileUploads(formData, isUpdate = false) {
    const processedData = { ...formData };
    const fileFields = [
      'aadharFront',
      'aadharBack',
      'profilePhoto',
      'casteCertificate',
    ];

    for (const field of fileFields) {
      const fileInput = document.getElementById(
        isUpdate ? `update${this.capitalizeFirstLetter(field)}` : field
      );

      if (fileInput && fileInput.files.length > 0) {
        const file = fileInput.files[0];
        this.validateFile(file);
        processedData[`${field}File`] = await this.uploadFile(file);
      } else if (isUpdate) {
        // For updates, mark as 'No change' if file not provided
        processedData[`${field}File`] = 'No change';
      }
    }

    return processedData;
  }

  /**
   * Validate file before upload
   * @param {File} file - File to validate
   */
  validateFile(file) {
    if (!this.allowedFileTypes.includes(file.type)) {
      throw new Error(
        `Invalid file type: ${file.type}. Only JPEG, PNG, and PDF files are allowed.`
      );
    }

    if (file.size > this.maxFileSize) {
      throw new Error(
        `File too large: ${(file.size / (1024 * 1024)).toFixed(
          2
        )}MB. Maximum size is 5MB.`
      );
    }
  }

  /**
   * Simulate file upload (to be implemented with actual storage solution)
   * @param {File} file - File to upload
   */
  async uploadFile(file) {
    // In a real implementation, this would upload to Google Drive or another storage
    // For demo purposes, we'll just return a mock file reference
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(`file_${Date.now()}_${file.name}`);
      }, 500);
    });
  }

  /**
   * Validate form data structure and required fields
   * @param {Object} formData - Form data to validate
   * @param {Boolean} isUpdate - Whether this is an update operation
   */
  validateFormData(formData, isUpdate = false) {
    const requiredFields = [
      'firstName',
      'lastName',
      'gender',
      'dob',
      'age',
      'caste',
      'surname',
      'fatherName',
      'motherName',
      'maritalStatus',
      'currentAddress1',
      'currentCity',
      'currentState',
      'currentPincode',
      'currentCountry',
      'permanentAddress1',
      'permanentCity',
      'permanentState',
      'permanentPincode',
      'permanentCountry',
      'primaryMobile',
      'primaryEmail',
      'aadharNumber',
      'emergencyName',
      'emergencyRelationship',
      'emergencyMobile',
    ];

    // Check required fields
    for (const field of requiredFields) {
      if (!formData[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate email format
    if (!this.validateEmail(formData.primaryEmail)) {
      throw new Error('Invalid primary email format');
    }

    // Validate mobile number
    if (!this.validateMobile(formData.primaryMobile)) {
      throw new Error('Invalid primary mobile number');
    }

    // For new applications, check if files are provided
    if (!isUpdate) {
      if (!formData.aadharFrontFile || !formData.aadharBackFile || !formData.profilePhotoFile) {
        throw new Error('Required documents are missing');
      }
    }
  }

  /**
   * Validate email format
   * @param {String} email - Email to validate
   */
  validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  }

  /**
   * Validate mobile number format (Indian)
   * @param {String} mobile - Mobile number to validate
   */
  validateMobile(mobile) {
    const re = /^[6-9]\d{9}$/;
    return re.test(mobile);
  }

  /**
   * Helper function to capitalize first letter
   * @param {String} string - String to capitalize
   */
  capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
  }
}

// Export as singleton instance
export const formSubmitService = new FormSubmitService();