/**
 * File Upload Component
 * Handles file uploads with preview, validation and progress tracking
 */

class FileUpload {
  constructor(options) {
    // Required options
    this.inputId = options.inputId;
    this.previewId = options.previewId;
    this.maxSize = options.maxSize || 5 * 1024 * 1024; // 5MB default
    this.allowedTypes = options.allowedTypes || ['image/jpeg', 'image/png', 'application/pdf'];
    
    // Optional callbacks
    this.onUploadStart = options.onUploadStart || (() => {});
    this.onUploadProgress = options.onUploadProgress || (() => {});
    this.onUploadComplete = options.onUploadComplete || (() => {});
    this.onError = options.onError || (() => {});
    
    // Initialize
    this.inputElement = document.getElementById(this.inputId);
    this.previewElement = document.getElementById(this.previewId);
    this.fileNameElement = document.getElementById(`${this.inputId}Name`);
    
    if (!this.inputElement) {
      console.error(`FileUpload: Input element with ID ${this.inputId} not found`);
      return;
    }
    
    this._bindEvents();
  }
  
  _bindEvents() {
    this.inputElement.addEventListener('change', (e) => this._handleFileSelect(e));
  }
  
  _handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    // Validate file
    if (!this._validateFile(file)) {
      this.inputElement.value = ''; // Clear invalid selection
      return;
    }
    
    // Update UI
    if (this.fileNameElement) {
      this.fileNameElement.textContent = file.name;
    }
    
    // Show preview if image
    if (file.type.startsWith('image/')) {
      this._showImagePreview(file);
    } else {
      this._showGenericPreview(file);
    }
    
    // Notify parent
    this.onUploadStart(file);
  }
  
  _validateFile(file) {
    // Size validation
    if (file.size > this.maxSize) {
      this.onError({
        type: 'SIZE_LIMIT',
        message: `File exceeds maximum size of ${this.maxSize / 1024 / 1024}MB`
      });
      return false;
    }
    
    // Type validation
    if (!this.allowedTypes.includes(file.type)) {
      this.onError({
        type: 'INVALID_TYPE',
        message: `File type ${file.type} not allowed`
      });
      return false;
    }
    
    return true;
  }
  
  _showImagePreview(file) {
    if (!this.previewElement) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      this.previewElement.innerHTML = `
        <img src="${e.target.result}" 
             alt="Preview" 
             style="max-width: 100%; max-height: 200px;">
      `;
    };
    reader.readAsDataURL(file);
  }
  
  _showGenericPreview(file) {
    if (!this.previewElement) return;
    
    this.previewElement.innerHTML = `
      <div class="file-preview">
        <i class="file-icon" data-feather="file"></i>
        <div class="file-info">
          <div class="file-name">${file.name}</div>
          <div class="file-size">${this._formatFileSize(file.size)}</div>
          <div class="file-type">${file.type}</div>
        </div>
      </div>
    `;
    feather.replace(); // Refresh icon if using feather icons
  }
  
  _formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
  
  async uploadToServer() {
    const file = this.inputElement.files[0];
    if (!file) {
      this.onError({ type: 'NO_FILE', message: 'No file selected' });
      return null;
    }
    
    try {
      // In a real implementation, this would upload to your backend
      // For Google Apps Script, we'd use FormData and fetch
      const formData = new FormData();
      formData.append('file', file);
      formData.append('csrfToken', getCsrfToken()); // From your auth service
      
      const response = await fetch(scriptUrl, {
        method: 'POST',
        body: formData,
        // Note: Don't set Content-Type header when using FormData
        // The browser will set it automatically with the correct boundary
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }
      
      const result = await response.json();
      this.onUploadComplete(result);
      return result;
    } catch (error) {
      this.onError({
        type: 'UPLOAD_FAILED',
        message: error.message
      });
      throw error;
    }
  }
  
  reset() {
    this.inputElement.value = '';
    if (this.previewElement) this.previewElement.innerHTML = '';
    if (this.fileNameElement) this.fileNameElement.textContent = 'No file selected';
  }
}

// Export for CommonJS/ES modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FileUpload;
} else {
  window.FileUpload = FileUpload;
}
