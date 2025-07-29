/**
 * File Upload Utility Module
 * Handles all file upload operations including validation, preview, and processing
 */

// Constants
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];
const ALLOWED_DOC_TYPES = ['application/pdf', ...ALLOWED_IMAGE_TYPES];

class FileUploadUtils {
  constructor() {
    this.uploadedFiles = {};
    this.csrfToken = '';
  }

  /**
   * Initialize file upload handlers for all upload fields
   * @param {string} csrfToken - CSRF token for secure uploads
   */
  init(csrfToken) {
    this.csrfToken = csrfToken;
    
    // Initialize all file upload fields
    this._initUploadField('aadharFront', 'aadharFrontName', ALLOWED_DOC_TYPES);
    this._initUploadField('aadharBack', 'aadharBackName', ALLOWED_DOC_TYPES);
    this._initUploadField('profilePhoto', 'profilePhotoName', ALLOWED_IMAGE_TYPES);
    this._initUploadField('casteCertificate', 'casteCertificateName', ALLOWED_DOC_TYPES);
    
    // Initialize update form fields
    this._initUploadField('updateAadharFront', 'updateAadharFrontName', ALLOWED_DOC_TYPES);
    this._initUploadField('updateAadharBack', 'updateAadharBackName', ALLOWED_DOC_TYPES);
    this._initUploadField('updateProfilePhoto', 'updateProfilePhotoName', ALLOWED_IMAGE_TYPES);
  }

  /**
   * Initialize a single file upload field
   * @private
   */
  _initUploadField(inputId, displayId, allowedTypes) {
    const input = document.getElementById(inputId);
    const display = document.getElementById(displayId);
    
    if (!input || !display) return;

    input.addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      // Validate file
      const validation = this._validateFile(file, allowedTypes);
      if (!validation.valid) {
        this._showError(displayId, validation.message);
        input.value = '';
        return;
      }

      // Process file
      try {
        display.textContent = 'Uploading...';
        const fileData = await this._processFile(file, inputId);
        
        this.uploadedFiles[inputId] = fileData;
        display.textContent = file.name;
        this._showSuccess(displayId);
        
        // Update form validation state
        this._updateFormValidation();
      } catch (error) {
        console.error('Upload failed:', error);
        this._showError(displayId, 'Upload failed. Please try again.');
        input.value = '';
      }
    });
  }

  /**
   * Validate a file before upload
   * @private
   */
  _validateFile(file, allowedTypes) {
    if (file.size > MAX_FILE_SIZE) {
      return {
        valid: false,
        message: 'File too large (max 5MB)'
      };
    }

    if (!allowedTypes.includes(file.type)) {
      return {
        valid: false,
        message: 'Invalid file type'
      };
    }

    return { valid: true };
  }

  /**
   * Process and upload a file
   * @private
   */
  async _processFile(file, fieldName) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = async (e) => {
        try {
          const base64Data = e.target.result.split(',')[1];
          const fileData = {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified,
            data: base64Data
          };

          // For demo purposes, we're just storing locally
          // In production, you would upload to server here
          resolve(fileData);
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => {
        reject(new Error('File reading failed'));
      };
      
      reader.readAsDataURL(file);
    });
  }

  /**
   * Show upload success state
   * @private
   */
  _showSuccess(displayId) {
    const display = document.getElementById(displayId);
    if (display) {
      display.style.color = 'green';
      display.classList.add('upload-success');
    }
  }

  /**
   * Show upload error
   * @private
   */
  _showError(displayId, message) {
    const display = document.getElementById(displayId);
    if (display) {
      display.textContent = message;
      display.style.color = 'red';
      display.classList.add('upload-error');
      
      // Reset after 3 seconds
      setTimeout(() => {
        display.textContent = 'No file selected';
        display.style.color = '';
        display.classList.remove('upload-error');
      }, 3000);
    }
  }

  /**
   * Update form validation state based on uploads
   * @private
   */
  _updateFormValidation() {
    // Check if all required files are uploaded
    const requiredUploads = [
      'aadharFront',
      'aadharBack',
      'profilePhoto'
    ];
    
    const allUploaded = requiredUploads.every(id => this.uploadedFiles[id]);
    
    // Enable/disable submit button based on upload status
    const submitBtn = document.getElementById('submitBtn');
    if (submitBtn) {
      submitBtn.disabled = !allUploaded;
    }
  }

  /**
   * Get all uploaded files data for form submission
   */
  getUploadedFiles() {
    return this.uploadedFiles;
  }

  /**
   * Clear all uploaded files
   */
  clearUploads() {
    this.uploadedFiles = {};
    
    // Reset all file input fields
    const fileInputs = document.querySelectorAll('input[type="file"]');
    fileInputs.forEach(input => {
      input.value = '';
    });
    
    // Reset all display names
    const fileDisplays = document.querySelectorAll('.file-name');
    fileDisplays.forEach(display => {
      if (display.id !== 'casteCertificateName') {
        display.textContent = 'No file selected';
        display.style.color = '';
        display.classList.remove('upload-success', 'upload-error');
      }
    });
  }

  /**
   * Prepare file data for API submission
   */
  prepareFileData() {
    const filesData = {};
    
    for (const [field, file] of Object.entries(this.uploadedFiles)) {
      filesData[`${field}File`] = {
        name: file.name,
        type: file.type,
        data: file.data
      };
    }
    
    return filesData;
  }
}

// Export as singleton
export const fileUploadUtils = new FileUploadUtils();