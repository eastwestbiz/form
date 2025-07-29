/**
 * Form Service Module
 * Handles all form-related operations including:
 * - Form data management
 * - Field validation
 * - Submission handling
 * - Progress tracking
 */

import { ApiService } from '../api/api.service';
import { showLoading, hideLoading } from '../../utils/loading.utils';
import { displayError, displaySuccess } from '../../utils/dom.utils';
import { generateCsrfToken, validateCsrfToken } from '../auth/auth.service';

// Constants
const FORM_SECTIONS = [
  'personal-info',
  'address-info',
  'contact-info',
  'identity-verification',
  'family-details',
  'declaration'
];

class FormService {
  constructor() {
    this.currentSection = 0;
    this.formData = {};
    this.fileUploads = {};
    this.csrfToken = '';
  }

  /**
   * Initialize form service
   */
  async init() {
    try {
      this.csrfToken = await generateCsrfToken();
      this.setupEventListeners();
      this.updateProgressBar();
    } catch (error) {
      console.error('FormService initialization failed:', error);
      displayError('Failed to initialize form. Please refresh the page.');
    }
  }

  /**
   * Setup form event listeners
   */
  setupEventListeners() {
    // Same as current address toggle
    document.getElementById('sameAsCurrent').addEventListener('change', (e) => {
      this.toggleSameAsCurrentAddress(e.target.checked);
    });

    // File upload handlers
    this.setupFileUpload('aadharFront', 'aadharFrontName');
    this.setupFileUpload('aadharBack', 'aadharBackName');
    this.setupFileUpload('profilePhoto', 'profilePhotoName');
    this.setupFileUpload('casteCertificate', 'casteCertificateName');

    // Caste certificate radio toggle
    document.querySelectorAll('input[name="hasCasteCertificate"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        document.getElementById('casteCertificateUpload').classList.toggle('hidden', e.target.value !== 'yes');
      });
    });

    // Form submission
    document.getElementById('submitBtn').addEventListener('click', () => this.submitForm());
  }

  /**
   * Setup file upload with preview
   * @param {string} inputId - File input ID
   * @param {string} displayId - Element ID to display file name
   */
  setupFileUpload(inputId, displayId) {
    const input = document.getElementById(inputId);
    const display = document.getElementById(displayId);

    input.addEventListener('change', () => {
      if (input.files.length > 0) {
        display.textContent = input.files[0].name;
        this.fileUploads[inputId] = input.files[0];
      } else {
        display.textContent = 'No file selected';
        delete this.fileUploads[inputId];
      }
    });
  }

  /**
   * Toggle same as current address
   * @param {boolean} checked - Whether checkbox is checked
   */
  toggleSameAsCurrentAddress(checked) {
    const permanentFields = [
      'permanentAddress1', 'permanentAddress2',
      'permanentCity', 'permanentState',
      'permanentPincode', 'permanentCountry'
    ];

    permanentFields.forEach(field => {
      const element = document.getElementById(field);
      if (checked) {
        const currentField = field.replace('permanent', 'current');
        element.value = document.getElementById(currentField).value;
        element.readOnly = true;
      } else {
        element.readOnly = false;
      }
    });
  }

  /**
   * Collect form data
   */
  collectFormData() {
    this.formData = {
      // Personal Information
      firstName: document.getElementById('firstName').value,
      middleName: document.getElementById('middleName').value,
      lastName: document.getElementById('lastName').value,
      gender: document.querySelector('input[name="gender"]:checked')?.value,
      dob: document.getElementById('dob').value,
      age: document.getElementById('age').value,
      caste: document.getElementById('caste').value,
      surname: document.getElementById('surname').value,
      gothra: document.getElementById('gothra').value,
      vamsha: document.getElementById('vamsha').value,
      veda: document.getElementById('veda').value,
      kuldevi: document.getElementById('kuldevi').value,
      kuldevata: document.getElementById('kuldevata').value,
      fatherName: document.getElementById('fatherName').value,
      motherName: document.getElementById('motherName').value,
      maritalStatus: document.querySelector('input[name="maritalStatus"]:checked')?.value,

      // Address Information
      currentAddress1: document.getElementById('currentAddress1').value,
      currentAddress2: document.getElementById('currentAddress2').value,
      currentCity: document.getElementById('currentCity').value,
      currentState: document.getElementById('currentState').value,
      currentPincode: document.getElementById('currentPincode').value,
      currentCountry: document.getElementById('currentCountry').value,
      permanentAddress1: document.getElementById('permanentAddress1').value,
      permanentAddress2: document.getElementById('permanentAddress2').value,
      permanentCity: document.getElementById('permanentCity').value,
      permanentState: document.getElementById('permanentState').value,
      permanentPincode: document.getElementById('permanentPincode').value,
      permanentCountry: document.getElementById('permanentCountry').value,

      // Contact Information
      primaryMobile: document.getElementById('primaryMobile').value,
      alternateMobile: document.getElementById('alternateMobile').value,
      primaryEmail: document.getElementById('primaryEmail').value,
      alternateEmail: document.getElementById('alternateEmail').value,

      // Identity Verification
      aadharNumber: document.getElementById('aadharNumber').value,
      hasCasteCertificate: document.querySelector('input[name="hasCasteCertificate"]:checked')?.value === 'yes',

      // Family Details
      familyMembers: this.collectFamilyMembers(),
      emergencyName: document.getElementById('emergencyName').value,
      emergencyRelationship: document.getElementById('emergencyRelationship').value,
      emergencyMobile: document.getElementById('emergencyMobile').value,

      // Declaration
      declarationSignature: document.getElementById('declarationSignature').value,
      declarationDate: document.getElementById('declarationDate').value,

      // Security
      csrfToken: this.csrfToken
    };
  }

  /**
   * Collect family members data
   */
  collectFamilyMembers() {
    const familyMembers = [];
    for (let i = 1; i <= 10; i++) {
      const name = document.getElementById(`familyName${i}`).value;
      const relationship = document.getElementById(`familyRelationship${i}`).value;
      const age = document.getElementById(`familyAge${i}`).value;

      if (name && relationship && age) {
        familyMembers.push({ name, relationship, age });
      }
    }
    return familyMembers;
  }

  /**
   * Validate form data
   */
  validateForm() {
    // Basic required field validation
    const requiredFields = [
      'firstName', 'lastName', 'gender', 'dob', 'age',
      'caste', 'surname', 'fatherName', 'motherName',
      'maritalStatus', 'currentAddress1', 'currentCity',
      'currentState', 'currentPincode', 'currentCountry',
      'primaryMobile', 'primaryEmail', 'aadharNumber',
      'emergencyName', 'emergencyRelationship', 'emergencyMobile',
      'declarationSignature', 'declarationDate'
    ];

    for (const field of requiredFields) {
      if (!this.formData[field]) {
        throw new Error(`Please fill in all required fields. Missing: ${field}`);
      }
    }

    // Validate at least one family member
    if (this.formData.familyMembers.length === 0) {
      throw new Error('Please add at least one family member');
    }

    // Validate mobile number format
    if (!/^[0-9]{10}$/.test(this.formData.primaryMobile)) {
      throw new Error('Please enter a valid 10-digit mobile number');
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.formData.primaryEmail)) {
      throw new Error('Please enter a valid email address');
    }

    // Validate Aadhar number format
    if (!/^[0-9]{16}$/.test(this.formData.aadharNumber)) {
      throw new Error('Please enter a valid 16-digit Aadhar number');
    }

    return true;
  }

  /**
   * Submit form data to backend
   */
  async submitForm() {
    try {
      showLoading('Submitting your application...');
      
      // Collect and validate form data
      this.collectFormData();
      this.validateForm();

      // Prepare form data with files
      const formData = new FormData();
      for (const key in this.formData) {
        formData.append(key, this.formData[key]);
      }

      // Append files if they exist
      for (const [key, file] of Object.entries(this.fileUploads)) {
        formData.append(key, file);
      }

      // Submit to backend
      const response = await ApiService.post('submitApplication', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
          'X-CSRF-Token': this.csrfToken
        }
      });

      if (response.success) {
        displaySuccess('Application submitted successfully!');
        this.showSuccessModal(response.applicationId);
      } else {
        throw new Error(response.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Form submission error:', error);
      displayError(error.message || 'An error occurred while submitting the form');
    } finally {
      hideLoading();
    }
  }

  /**
   * Show success modal with application ID
   * @param {string} applicationId - The generated application ID
   */
  showSuccessModal(applicationId) {
    document.getElementById('applicationId').textContent = applicationId;
    document.getElementById('successModal').classList.remove('hidden');
  }

  /**
   * Update progress bar based on completed sections
   */
  updateProgressBar() {
    let completedSections = 0;
    
    // Check each section for completion
    FORM_SECTIONS.forEach((section, index) => {
      if (this.isSectionComplete(index)) {
        completedSections++;
      }
    });

    const progress = (completedSections / FORM_SECTIONS.length) * 100;
    document.getElementById('formProgress').style.width = `${progress}%`;
  }

  /**
   * Check if a section is complete
   * @param {number} sectionIndex - Index of the section to check
   */
  isSectionComplete(sectionIndex) {
    // Implementation would check required fields in each section
    // Simplified for example purposes
    return true;
  }
}

// Export singleton instance
export const formService = new FormService();
