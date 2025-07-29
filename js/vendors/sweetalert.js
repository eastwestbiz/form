/**
 * SweetAlert2 wrapper for consistent alert styling and behavior
 * Provides simplified interface for common alert types used throughout the application
 */

// Import SweetAlert2 from CDN (already loaded in HTML)
const Swal = window.Swal;

class SweetAlert {
  /**
   * Show a success alert
   * @param {string} title 
   * @param {string} text 
   * @param {string} confirmButtonText 
   */
  static success(title, text = '', confirmButtonText = 'OK') {
    return Swal.fire({
      icon: 'success',
      title,
      text,
      confirmButtonText,
      customClass: {
        confirmButton: 'btn btn-primary'
      }
    });
  }

  /**
   * Show an error alert
   * @param {string} title 
   * @param {string} text 
   * @param {string} confirmButtonText 
   */
  static error(title, text = '', confirmButtonText = 'OK') {
    return Swal.fire({
      icon: 'error',
      title,
      text,
      confirmButtonText,
      customClass: {
        confirmButton: 'btn btn-danger'
      }
    });
  }

  /**
   * Show a warning alert
   * @param {string} title 
   * @param {string} text 
   * @param {string} confirmButtonText 
   */
  static warning(title, text = '', confirmButtonText = 'OK') {
    return Swal.fire({
      icon: 'warning',
      title,
      text,
      confirmButtonText,
      customClass: {
        confirmButton: 'btn btn-warning'
      }
    });
  }

  /**
   * Show a confirmation dialog
   * @param {string} title 
   * @param {string} text 
   * @param {string} confirmButtonText 
   * @param {string} cancelButtonText 
   */
  static confirm(title, text = '', confirmButtonText = 'Yes', cancelButtonText = 'Cancel') {
    return Swal.fire({
      icon: 'question',
      title,
      text,
      showCancelButton: true,
      confirmButtonText,
      cancelButtonText,
      customClass: {
        confirmButton: 'btn btn-primary',
        cancelButton: 'btn btn-secondary'
      }
    });
  }

  /**
   * Show a loading indicator
   * @param {string} title 
   */
  static loading(title = 'Processing...') {
    return Swal.fire({
      title,
      html: '<div class="loader-spinner"></div>',
      showConfirmButton: false,
      allowOutsideClick: false,
      allowEscapeKey: false,
      willOpen: () => {
        Swal.showLoading();
      }
    });
  }

  /**
   * Close currently open SweetAlert
   */
  static close() {
    Swal.close();
  }
}

// Make available globally
window.SweetAlert = SweetAlert;