/**
 * reCAPTCHA Vendor Wrapper
 * Provides a clean interface to Google reCAPTCHA functionality
 * Handles loading, rendering, and verification of reCAPTCHA
 */

class RecaptchaService {
  constructor() {
    this.siteKey = 'YOUR_RECAPTCHA_SITE_KEY'; // Replace with actual key
    this.ready = false;
    this.widgetIds = {};
    this.loadRecaptcha();
  }

  /**
   * Dynamically loads the reCAPTCHA API script
   */
  loadRecaptcha() {
    if (window.grecaptcha) {
      this.ready = true;
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `https://www.google.com/recaptcha/api.js?render=explicit&onload=recaptchaOnLoad`;
      script.async = true;
      script.defer = true;
      
      // Global callback for when reCAPTCHA loads
      window.recaptchaOnLoad = () => {
        this.ready = true;
        resolve();
      };

      script.onerror = () => {
        reject(new Error('Failed to load reCAPTCHA script'));
      };

      document.head.appendChild(script);
    });
  }

  /**
   * Renders reCAPTCHA widget in a container
   * @param {string} containerId - ID of DOM element to render in
   * @param {string} action - reCAPTCHA action name
   * @param {Function} callback - Success callback
   * @param {Function} expiredCallback - Expired callback
   * @returns {Promise<string>} Widget ID
   */
  async render(containerId, action, callback, expiredCallback) {
    if (!this.ready) {
      await this.loadRecaptcha();
    }

    return new Promise((resolve) => {
      this.widgetIds[containerId] = grecaptcha.render(containerId, {
        sitekey: this.siteKey,
        size: 'normal',
        theme: 'light',
        action: action,
        callback: (token) => {
          if (callback) callback(token);
          resolve(token);
        },
        'expired-callback': () => {
          if (expiredCallback) expiredCallback();
          this.reset(containerId);
        },
        'error-callback': () => {
          this.reset(containerId);
        }
      });

      resolve(this.widgetIds[containerId]);
    });
  }

  /**
   * Resets a reCAPTCHA widget
   * @param {string} containerId - ID of container where widget is rendered
   */
  reset(containerId) {
    if (this.widgetIds[containerId]) {
      grecaptcha.reset(this.widgetIds[containerId]);
    }
  }

  /**
   * Verifies a reCAPTCHA token with backend
   * @param {string} token - reCAPTCHA token
   * @returns {Promise<boolean>} Whether verification succeeded
   */
  async verifyToken(token) {
    try {
      const response = await fetch(`${window.scriptUrl}?action=verifyRecaptcha`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ token })
      });

      const data = await response.json();
      return data.success === true;
    } catch (error) {
      console.error('reCAPTCHA verification error:', error);
      return false;
    }
  }

  /**
   * Executes reCAPTCHA and returns token
   * @param {string} action - reCAPTCHA action name
   * @returns {Promise<string>} reCAPTCHA token
   */
  async execute(action = 'submit') {
    if (!this.ready) {
      await this.loadRecaptcha();
    }

    return new Promise((resolve, reject) => {
      try {
        grecaptcha.execute(this.siteKey, { action }).then(resolve);
      } catch (error) {
        reject(error);
      }
    });
  }
}

// Singleton instance
const recaptcha = new RecaptchaService();
export default recaptcha;