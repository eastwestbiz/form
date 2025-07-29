/**
 * Form Auto-Save Service
 * Handles automatic saving of form data to prevent data loss
 * and provide a better user experience.
 */

class FormAutoSaveService {
  constructor() {
    this.STORAGE_KEY = 'form_autosave_data';
    this.SAVE_INTERVAL = 30000; // 30 seconds
    this.MAX_RETRIES = 3;
    this.retryCount = 0;
    this.saveTimer = null;
    this.currentFormId = null;
    this.csrfToken = null;
    this.enabled = true;
    this.initialize();
  }

  /**
   * Initialize the service
   */
  initialize() {
    // Load CSRF token for API requests
    this.loadCsrfToken();
    
    // Set up event listeners for form changes
    document.addEventListener('DOMContentLoaded', () => {
      this.setupFormListeners();
      this.restoreSavedData();
    });

    // Save before unload
    window.addEventListener('beforeunload', (e) => {
      if (this.hasUnsavedChanges()) {
        this.saveFormData(true); // Force immediate sync
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    });
  }

  /**
   * Set up form change listeners
   */
  setupFormListeners() {
    const forms = document.querySelectorAll('form[id^="membershipForm"], form[id^="updateForm"]');
    
    forms.forEach(form => {
      this.currentFormId = form.id;
      
      // Input change listeners
      form.querySelectorAll('input, select, textarea').forEach(element => {
        element.addEventListener('change', () => this.handleFormChange());
        element.addEventListener('input', () => this.handleFormChange());
      });
      
      // File upload listeners
      form.querySelectorAll('input[type="file"]').forEach(fileInput => {
        fileInput.addEventListener('change', () => this.handleFileUpload(fileInput));
      });
    });
  }

  /**
   * Handle form changes
   */
  handleFormChange() {
    if (!this.enabled) return;
    
    // Debounce the save operation
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => {
      this.saveFormData();
    }, 2000); // 2 second debounce
  }

  /**
   * Handle file uploads
   */
  async handleFileUpload(fileInput) {
    if (!this.enabled) return;
    
    const file = fileInput.files[0];
    if (!file) return;

    try {
      // Show uploading indicator
      const fileNameSpan = document.getElementById(`${fileInput.id}Name`);
      if (fileNameSpan) {
        fileNameSpan.textContent = 'Uploading...';
        fileNameSpan.classList.add('loading');
      }

      // Upload file to server
      const fileUrl = await this.uploadFile(file);
      
      // Update the form data with the file URL
      const formData = this.getFormData();
      formData[fileInput.id] = fileUrl;
      this.saveToLocalStorage(formData);

      // Update UI
      if (fileNameSpan) {
        fileNameSpan.textContent = file.name;
        fileNameSpan.classList.remove('loading');
      }
    } catch (error) {
      console.error('File upload failed:', error);
      // Show error to user
      const fileNameSpan = document.getElementById(`${fileInput.id}Name`);
      if (fileNameSpan) {
        fileNameSpan.textContent = 'Upload failed - try again';
        fileNameSpan.classList.remove('loading');
      }
    }
  }

  /**
   * Upload file to server
   */
  async uploadFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('action', 'uploadFile');
    formData.append('csrfToken', this.csrfToken);

    const response = await fetch(scriptUrl, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      throw new Error('File upload failed');
    }

    const data = await response.json();
    return data.fileUrl;
  }

  /**
   * Save form data (local and optionally to server)
   */
  async saveFormData(forceSync = false) {
    if (!this.enabled) return;
    
    const formData = this.getFormData();
    this.saveToLocalStorage(formData);

    // Sync to server periodically or when forced
    if (forceSync || Date.now() - (this.lastSyncTime || 0) > this.SAVE_INTERVAL) {
      await this.syncToServer(formData);
    }
  }

  /**
   * Get current form data
   */
  getFormData() {
    const form = document.getElementById(this.currentFormId);
    if (!form) return {};
    
    const formData = {};
    const elements = form.elements;

    for (let element of elements) {
      if (element.name || element.id) {
        const key = element.name || element.id;
        
        if (element.type === 'checkbox' || element.type === 'radio') {
          formData[key] = element.checked ? element.value : '';
        } else if (element.type === 'file') {
          // File URLs are handled separately in handleFileUpload
          continue;
        } else {
          formData[key] = element.value;
        }
      }
    }

    // Add metadata
    formData._timestamp = Date.now();
    formData._formId = this.currentFormId;

    return formData;
  }

  /**
   * Save data to local storage
   */
  saveToLocalStorage(data) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
      this.showAutoSaveIndicator();
    } catch (error) {
      console.error('Local storage save failed:', error);
    }
  }

  /**
   * Sync data to server
   */
  async syncToServer(formData) {
    if (!this.csrfToken) {
      await this.loadCsrfToken();
      if (!this.csrfToken) return;
    }

    try {
      const response = await fetch(scriptUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'autoSaveForm',
          formData: formData,
          csrfToken: this.csrfToken
        })
      });

      const data = await response.json();
      
      if (data.success) {
        this.lastSyncTime = Date.now();
        this.retryCount = 0;
        return true;
      } else {
        throw new Error(data.message || 'Auto-save failed');
      }
    } catch (error) {
      console.error('Auto-save error:', error);
      this.retryCount++;
      
      if (this.retryCount < this.MAX_RETRIES) {
        setTimeout(() => this.syncToServer(formData), 5000);
      } else {
        this.showError('Auto-save failed. Working offline - changes will be saved locally.');
      }
      
      return false;
    }
  }

  /**
   * Restore saved data
   */
  restoreSavedData() {
    try {
      const savedData = localStorage.getItem(this.STORAGE_KEY);
      if (!savedData) return;

      const formData = JSON.parse(savedData);
      const form = document.getElementById(formData._formId || this.currentFormId);
      if (!form) return;

      // Don't restore if form is already filled
      if (this.isFormFilled()) return;

      for (let element of form.elements) {
        const key = element.name || element.id;
        if (key in formData) {
          if (element.type === 'checkbox' || element.type === 'radio') {
            element.checked = formData[key] === element.value;
          } else if (element.type !== 'file') {
            element.value = formData[key] || '';
          }
        }
      }

      // Update any file name indicators
      ['aadharFront', 'aadharBack', 'profilePhoto', 'casteCertificate'].forEach(id => {
        if (formData[id]) {
          const fileNameSpan = document.getElementById(`${id}Name`);
          if (fileNameSpan) {
            fileNameSpan.textContent = 'Previously uploaded';
          }
        }
      });

      this.showAutoRestoreIndicator();
    } catch (error) {
      console.error('Failed to restore saved data:', error);
    }
  }

  /**
   * Check if form has unsaved changes
   */
  hasUnsavedChanges() {
    const savedData = localStorage.getItem(this.STORAGE_KEY);
    if (!savedData) return false;

    const currentData = JSON.stringify(this.getFormData());
    return savedData !== currentData;
  }

  /**
   * Check if form is already filled
   */
  isFormFilled() {
    const form = document.getElementById(this.currentFormId);
    if (!form) return false;

    for (let element of form.elements) {
      if ((element.type === 'text' || element.type === 'email' || element.type === 'tel') && 
          element.value.trim() !== '' && 
          !element.id.includes('Name') && // Skip file name indicators
          element.id !== 'declarationSignature') {
        return true;
      }
    }
    return false;
  }

  /**
   * Load CSRF token from server
   */
  async loadCsrfToken() {
    try {
      const response = await fetch(`${scriptUrl}?action=getCsrfToken`);
      const data = await response.json();
      
      if (data.success && data.csrfToken) {
        this.csrfToken = data.csrfToken;
        return true;
      }
    } catch (error) {
      console.error('Failed to load CSRF token:', error);
    }
    return false;
  }

  /**
   * Show auto-save indicator
   */
  showAutoSaveIndicator() {
    const indicator = document.getElementById('autoSaveIndicator') || this.createAutoSaveIndicator();
    indicator.textContent = 'Changes saved locally';
    indicator.style.display = 'block';
    
    setTimeout(() => {
      indicator.style.display = 'none';
    }, 3000);
  }

  /**
   * Show auto-restore indicator
   */
  showAutoRestoreIndicator() {
    const indicator = document.getElementById('autoSaveIndicator') || this.createAutoSaveIndicator();
    indicator.textContent = 'Restored previous session';
    indicator.style.display = 'block';
    
    setTimeout(() => {
      indicator.style.display = 'none';
    }, 3000);
  }

  /**
   * Create auto-save indicator element
   */
  createAutoSaveIndicator() {
    const indicator = document.createElement('div');
    indicator.id = 'autoSaveIndicator';
    indicator.style.position = 'fixed';
    indicator.style.bottom = '20px';
    indicator.style.right = '20px';
    indicator.style.padding = '10px 15px';
    indicator.style.backgroundColor = '#4CAF50';
    indicator.style.color = 'white';
    indicator.style.borderRadius = '4px';
    indicator.style.zIndex = '1000';
    indicator.style.display = 'none';
    document.body.appendChild(indicator);
    return indicator;
  }

  /**
   * Show error message
   */
  showError(message) {
    const errorElement = document.getElementById('autoSaveError') || this.createErrorElement();
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    setTimeout(() => {
      errorElement.style.display = 'none';
    }, 5000);
  }

  /**
   * Create error element
   */
  createErrorElement() {
    const errorElement = document.createElement('div');
    errorElement.id = 'autoSaveError';
    errorElement.style.position = 'fixed';
    errorElement.style.bottom = '60px';
    errorElement.style.right = '20px';
    errorElement.style.padding = '10px 15px';
    errorElement.style.backgroundColor = '#f44336';
    errorElement.style.color = 'white';
    errorElement.style.borderRadius = '4px';
    errorElement.style.zIndex = '1000';
    errorElement.style.display = 'none';
    document.body.appendChild(errorElement);
    return errorElement;
  }

  /**
   * Clear saved data
   */
  clearSavedData() {
    localStorage.removeItem(this.STORAGE_KEY);
  }

  /**
   * Enable/disable auto-save
   */
  setEnabled(enabled) {
    this.enabled = enabled;
    if (!enabled) {
      this.clearSavedData();
    }
  }
}

// Initialize the service
const formAutoSaveService = new FormAutoSaveService();

// Export for module system if needed
if (typeof module !== 'undefined' && module.exports) {
  module.exports = formAutoSaveService;
}