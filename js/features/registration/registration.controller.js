// /js/features/registration/registration.controller.js

/**
 * Registration Controller - Handles all registration form logic
 * 
 * Responsibilities:
 * 1. Form validation
 * 2. Form submission
 * 3. OTP verification
 * 4. Document upload handling
 * 5. Communication with backend
 * 6. UI state management
 */

import { showLoading, hideLoading } from '../../utils/loading.utils.js';
import { sanitizeInput, validateEmail, validatePhone } from '../../utils/validation.utils.js';
import { showSuccessAlert, showErrorAlert } from '../../utils/notification.utils.js';
import { ApiService } from '../../modules/api/api.service.js';
import { OtpService } from '../../modules/auth/otp.service.js';
import { SessionService } from '../../modules/auth/session.service.js';

export class RegistrationController {
  constructor() {
    this.apiService = new ApiService();
    this.otpService = new OtpService();
    this.sessionService = new SessionService();
    this.csrfToken = null;
    this.formData = {};
    this.initialize();
  }

  /**
   * Initialize controller and set up event listeners
   */
  initialize() {
    this.getCsrfToken();
    this.setupFormListeners();
    this.setupFileUploadListeners();
    this.setupSameAddressToggle();
    this.setupOtpHandlers();
  }

  /**
   * Get CSRF token from backend
   */
  async getCsrfToken() {
    try {
      const response = await this.apiService.get('/getCsrfToken');
      if (response.success) {
        this.csrfToken = response.csrfToken;
      }
    } catch (error) {
      console.error('Failed to get CSRF token:', error);
    }
  }

  /**
   * Set up form event listeners
   */
  setupFormListeners() {
    // Same as current address toggle
    document.getElementById('sameAsCurrent').addEventListener('change', (e) => {
      this.togglePermanentAddress(!e.target.checked);
    });

    // Form submission
    document.getElementById('submitBtn').addEventListener('click', (e) => {
      e.preventDefault();
      this.handleFormSubmission();
    });

    // Real-time validation
    document.getElementById('dob').addEventListener('change', this.calculateAge.bind(this));
    
    // Enable submit button when all required fields are filled
    document.getElementById('membershipForm').addEventListener('input', this.validateForm.bind(this));
  }

  /**
   * Set up file upload listeners
   */
  setupFileUploadListeners() {
    const fileInputs = {
      'aadharFront': 'aadharFrontName',
      'aadharBack': 'aadharBackName',
      'profilePhoto': 'profilePhotoName',
      'casteCertificate': 'casteCertificateName'
    };

    Object.entries(fileInputs).forEach(([inputId, nameSpanId]) => {
      const input = document.getElementById(inputId);
      if (input) {
        input.addEventListener('change', (e) => {
          const fileName = e.target.files[0]?.name || 'No file selected';
          document.getElementById(nameSpanId).textContent = fileName;
        });
      }
    });
  }

  /**
   * Set up OTP verification handlers
   */
  setupOtpHandlers() {
    // Mobile OTP
    document.getElementById('sendMobileOtp').addEventListener('click', this.sendMobileOtp.bind(this));
    document.getElementById('verifyMobileOtp').addEventListener('click', this.verifyMobileOtp.bind(this));
    
    // Email OTP
    document.getElementById('sendEmailOtp').addEventListener('click', this.sendEmailOtp.bind(this));
    document.getElementById('verifyEmailOtp').addEventListener('click', this.verifyEmailOtp.bind(this));
  }

  /**
   * Toggle permanent address fields
   */
  togglePermanentAddress(show) {
    const fields = [
      'permanentAddress1', 'permanentAddress2', 
      'permanentCity', 'permanentState',
      'permanentPincode', 'permanentCountry'
    ];

    fields.forEach(id => {
      const field = document.getElementById(id);
      if (field) {
        field.required = show;
        field.disabled = !show;
        field.parentElement.style.display = show ? 'block' : 'none';
      }
    });

    if (!show) {
      this.copyCurrentToPermanentAddress();
    }
  }

  /**
   * Copy current address to permanent address
   */
  copyCurrentToPermanentAddress() {
    const fields = [
      { from: 'currentAddress1', to: 'permanentAddress1' },
      { from: 'currentAddress2', to: 'permanentAddress2' },
      { from: 'currentCity', to: 'permanentCity' },
      { from: 'currentState', to: 'permanentState' },
      { from: 'currentPincode', to: 'permanentPincode' },
      { from: 'currentCountry', to: 'permanentCountry' }
    ];

    fields.forEach(({from, to}) => {
      const fromField = document.getElementById(from);
      const toField = document.getElementById(to);
      if (fromField && toField) {
        toField.value = fromField.value;
      }
    });
  }

  /**
   * Calculate age from date of birth
   */
  calculateAge() {
    const dob = new Date(document.getElementById('dob').value);
    if (isNaN(dob.getTime())) return;

    const today = new Date();
    let age = today.getFullYear() - dob.getFullYear();
    const monthDiff = today.getMonth() - dob.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < dob.getDate())) {
      age--;
    }
    
    document.getElementById('age').value = age;
  }

  /**
   * Validate form fields
   */
  validateForm() {
    const requiredFields = [
      'firstName', 'lastName', 'gender', 'dob', 'age',
      'caste', 'surname', 'fatherName', 'motherName',
      'currentAddress1', 'currentCity', 'currentState',
      'currentPincode', 'currentCountry', 'primaryMobile',
      'primaryEmail', 'aadharNumber', 'emergencyName',
      'emergencyRelationship', 'emergencyMobile'
    ];

    const isValid = requiredFields.every(id => {
      const field = document.getElementById(id);
      if (!field) return true;
      
      if (field.type === 'radio' || field.type === 'checkbox') {
        return document.querySelector(`[name="${field.name}"]:checked`) !== null;
      }
      
      return field.value.trim() !== '';
    });

    // Additional validation
    const isMobileValid = validatePhone(document.getElementById('primaryMobile').value);
    const isEmailValid = validateEmail(document.getElementById('primaryEmail').value);
    const isAadharValid = document.getElementById('aadharNumber').value.length === 16;

    document.getElementById('submitBtn').disabled = !(isValid && isMobileValid && isEmailValid && isAadharValid);
    return isValid;
  }

  /**
   * Send mobile OTP
   */
  async sendMobileOtp() {
    const mobileNumber = document.getElementById('primaryMobile').value;
    if (!validatePhone(mobileNumber)) {
      showErrorAlert('Please enter a valid mobile number');
      return;
    }

    try {
      showLoading('Sending OTP...');
      const response = await this.otpService.sendOtp('mobile', mobileNumber);
      hideLoading();
      
      if (response.success) {
        showSuccessAlert('OTP sent to your mobile number');
      } else {
        showErrorAlert(response.message || 'Failed to send OTP');
      }
    } catch (error) {
      hideLoading();
      showErrorAlert('Failed to send OTP. Please try again.');
    }
  }

  /**
   * Verify mobile OTP
   */
  async verifyMobileOtp() {
    const otp = document.getElementById('mobileOtp').value;
    if (!otp || otp.length !== 6) {
      showErrorAlert('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      showLoading('Verifying OTP...');
      const response = await this.otpService.verifyOtp('mobile', otp);
      hideLoading();
      
      if (response.success) {
        this.mobileVerified = true;
        document.getElementById('mobileVerificationStatus').textContent = '✓ Verified';
        document.getElementById('mobileVerificationStatus').className = 'verification-status verification-success';
        showSuccessAlert('Mobile number verified successfully');
      } else {
        showErrorAlert(response.message || 'Invalid OTP');
      }
    } catch (error) {
      hideLoading();
      showErrorAlert('Failed to verify OTP. Please try again.');
    }
  }

  /**
   * Send email OTP
   */
  async sendEmailOtp() {
    const email = document.getElementById('primaryEmail').value;
    if (!validateEmail(email)) {
      showErrorAlert('Please enter a valid email address');
      return;
    }

    try {
      showLoading('Sending OTP...');
      const response = await this.otpService.sendOtp('email', email);
      hideLoading();
      
      if (response.success) {
        showSuccessAlert('OTP sent to your email address');
      } else {
        showErrorAlert(response.message || 'Failed to send OTP');
      }
    } catch (error) {
      hideLoading();
      showErrorAlert('Failed to send OTP. Please try again.');
    }
  }

  /**
   * Verify email OTP
   */
  async verifyEmailOtp() {
    const otp = document.getElementById('emailOtp').value;
    if (!otp || otp.length !== 6) {
      showErrorAlert('Please enter a valid 6-digit OTP');
      return;
    }

    try {
      showLoading('Verifying OTP...');
      const response = await this.otpService.verifyOtp('email', otp);
      hideLoading();
      
      if (response.success) {
        this.emailVerified = true;
        document.getElementById('emailVerificationStatus').textContent = '✓ Verified';
        document.getElementById('emailVerificationStatus').className = 'verification-status verification-success';
        showSuccessAlert('Email address verified successfully');
      } else {
        showErrorAlert(response.message || 'Invalid OTP');
      }
    } catch (error) {
      hideLoading();
      showErrorAlert('Failed to verify OTP. Please try again.');
    }
  }

  /**
   * Prepare form data for submission
   */
  prepareFormData() {
    const form = document.getElementById('membershipForm');
    const formData = new FormData(form);
    
    // Convert FormData to object
    const data = {};
    formData.forEach((value, key) => {
      data[key] = sanitizeInput(value);
    });

    // Add additional fields
    data.csrfToken = this.csrfToken;
    data.action = 'submitApplication';
    
    // Process family members
    data.familyMembers = this.getFamilyMembers();
    
    // Process files (in a real app, these would be uploaded to storage first)
    data.aadharFrontFile = document.getElementById('aadharFront').files[0]?.name || '';
    data.aadharBackFile = document.getElementById('aadharBack').files[0]?.name || '';
    data.profilePhotoFile = document.getElementById('profilePhoto').files[0]?.name || '';
    data.casteCertificateFile = document.getElementById('casteCertificate').files[0]?.name || '';
    
    // Generate application ID
    data.applicationId = this.generateApplicationId();
    
    return data;
  }

  /**
   * Get family members data
   */
  getFamilyMembers() {
    const familyMembers = [];
    
    for (let i = 1; i <= 10; i++) {
      const name = document.getElementById(`familyName${i}`).value.trim();
      const relationship = document.getElementById(`familyRelationship${i}`).value.trim();
      const age = document.getElementById(`familyAge${i}`).value.trim();
      
      if (name && relationship && age) {
        familyMembers.push({
          name: sanitizeInput(name),
          relationship: sanitizeInput(relationship),
          age: sanitizeInput(age)
        });
      }
    }
    
    return familyMembers;
  }

  /**
   * Generate a unique application ID
   */
  generateApplicationId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `APP-${timestamp}-${random}`.toUpperCase();
  }

  /**
   * Handle form submission
   */
  async handleFormSubmission() {
    if (!this.validateForm()) {
      showErrorAlert('Please fill all required fields');
      return;
    }

    if (!this.mobileVerified || !this.emailVerified) {
      showErrorAlert('Please verify your mobile and email before submitting');
      return;
    }

    const formData = this.prepareFormData();
    
    try {
      showLoading('Submitting application...');
      const response = await this.apiService.post('/submitApplication', formData);
      hideLoading();
      
      if (response.success) {
        this.showSuccessModal(response);
        this.sessionService.setApplicationData(response);
      } else {
        showErrorAlert(response.message || 'Failed to submit application');
      }
    } catch (error) {
      hideLoading();
      showErrorAlert('Failed to submit application. Please try again.');
    }
  }

  /**
   * Show success modal with application details
   */
  showSuccessModal(response) {
    document.getElementById('applicationId').textContent = response.applicationId;
    document.getElementById('successModal').style.display = 'block';
    
    // Reset form
    document.getElementById('membershipForm').reset();
    this.mobileVerified = false;
    this.emailVerified = false;
  }
}

// Initialize controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new RegistrationController();
});