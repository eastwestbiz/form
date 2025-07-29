// =============================================
// OTP Verification Component
// =============================================

/**
 * OTP Verification Component
 * Handles OTP generation, validation, and UI for mobile/email verification
 */

class OtpVerification {
  constructor(options = {}) {
    // Configuration defaults
    this.defaults = {
      type: 'mobile', // 'mobile' or 'email'
      recipient: '', // phone number or email address
      otpLength: 6,
      resendInterval: 30, // seconds
      maxAttempts: 3,
      autoSubmit: false,
      debug: false
    };

    // Merge options with defaults
    this.config = { ...this.defaults, ...options };

    // State management
    this.state = {
      attempts: 0,
      lastSent: null,
      verified: false,
      timer: null,
      otp: ''
    };

    // DOM elements
    this.elements = {
      container: null,
      input: null,
      sendBtn: null,
      verifyBtn: null,
      statusEl: null,
      timerEl: null
    };

    // Initialize
    this.init();
  }

  // Initialize the component
  init() {
    // Create DOM structure if not provided
    if (!this.config.container) {
      this.createDOM();
    } else {
      this.cacheElements();
    }

    // Set up event listeners
    this.setupEventListeners();

    // Initialize UI state
    this.updateUI();

    if (this.config.debug) {
      console.log(`OTP Verification initialized for ${this.config.type}`);
    }
  }

  // Create DOM structure
  createDOM() {
    const container = document.createElement('div');
    container.className = 'otp-verification';

    container.innerHTML = `
      <div class="otp-container">
        <input type="text" class="otp-input" placeholder="OTP" maxlength="${this.config.otpLength}">
        <button type="button" class="btn btn-primary send-otp">Send OTP</button>
        <button type="button" class="btn btn-primary verify-otp">Verify</button>
      </div>
      <div class="verification-status"></div>
      <div class="otp-timer hidden"></div>
    `;

    document.body.appendChild(container);
    this.elements.container = container;
    this.cacheElements();
  }

  // Cache DOM elements
  cacheElements() {
    const container = this.config.container || this.elements.container;
    
    this.elements = {
      container,
      input: container.querySelector('.otp-input'),
      sendBtn: container.querySelector('.send-otp'),
      verifyBtn: container.querySelector('.verify-otp'),
      statusEl: container.querySelector('.verification-status'),
      timerEl: container.querySelector('.otp-timer')
    };
  }

  // Set up event listeners
  setupEventListeners() {
    // Send OTP button
    this.elements.sendBtn.addEventListener('click', () => this.sendOtp());

    // Verify OTP button
    this.elements.verifyBtn.addEventListener('click', () => this.verifyOtp());

    // Auto-submit if configured
    if (this.config.autoSubmit) {
      this.elements.input.addEventListener('input', (e) => {
        if (e.target.value.length === this.config.otpLength) {
          this.verifyOtp();
        }
      });
    }
  }

  // Send OTP to recipient
  async sendOtp() {
    // Check if we can send another OTP
    if (this.state.lastSent && 
        (Date.now() - this.state.lastSent) < (this.config.resendInterval * 1000)) {
      this.showStatus(`Please wait before requesting another OTP`, 'error');
      return;
    }

    // Validate recipient
    if (!this.validateRecipient()) {
      this.showStatus(`Invalid ${this.config.type}`, 'error');
      return;
    }

    try {
      // Show loading state
      this.showStatus('Sending OTP...', 'info');
      this.elements.sendBtn.disabled = true;

      // Generate OTP (in production, this would be server-side)
      this.state.otp = this.generateOtp();
      this.state.lastSent = Date.now();

      if (this.config.debug) {
        console.log(`OTP for ${this.config.type} ${this.config.recipient}: ${this.state.otp}`);
      }

      // Call API to send OTP
      const response = await this.callOtpApi();

      if (response.success) {
        this.showStatus(`OTP sent to ${this.config.type}`, 'success');
        this.startResendTimer();
        this.elements.input.focus();
      } else {
        throw new Error(response.message || 'Failed to send OTP');
      }
    } catch (error) {
      this.showStatus(error.message, 'error');
      console.error('OTP send error:', error);
    } finally {
      this.elements.sendBtn.disabled = false;
    }
  }

  // Verify entered OTP
  async verifyOtp() {
    const enteredOtp = this.elements.input.value.trim();

    // Basic validation
    if (!enteredOtp || enteredOtp.length !== this.config.otpLength) {
      this.showStatus(`Please enter a ${this.config.otpLength}-digit OTP`, 'error');
      return;
    }

    // Check attempts
    if (this.state.attempts >= this.config.maxAttempts) {
      this.showStatus('Maximum attempts reached. Please request a new OTP.', 'error');
      this.disableVerification();
      return;
    }

    try {
      this.showStatus('Verifying...', 'info');
      this.elements.verifyBtn.disabled = true;

      // In a real app, this would verify with the server
      const isValid = enteredOtp === this.state.otp;

      if (isValid) {
        this.state.verified = true;
        this.showStatus('Verified successfully', 'success');
        this.dispatchVerificationEvent(true);
        this.clearTimer();
      } else {
        this.state.attempts++;
        const remaining = this.config.maxAttempts - this.state.attempts;
        throw new Error(`Invalid OTP. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
      }
    } catch (error) {
      this.showStatus(error.message, 'error');
      this.dispatchVerificationEvent(false);
    } finally {
      this.elements.verifyBtn.disabled = false;
    }
  }

  // Generate random OTP
  generateOtp() {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < this.config.otpLength; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  // Call OTP API (mock implementation)
  async callOtpApi() {
    // In a real app, this would call your backend
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({
          success: true,
          message: 'OTP sent successfully'
        });
      }, 1000);
    });
  }

  // Start resend timer
  startResendTimer() {
    this.clearTimer();
    
    let seconds = this.config.resendInterval;
    this.elements.timerEl.classList.remove('hidden');
    this.updateTimerDisplay(seconds);

    this.state.timer = setInterval(() => {
      seconds--;
      this.updateTimerDisplay(seconds);

      if (seconds <= 0) {
        this.clearTimer();
      }
    }, 1000);
  }

  // Update timer display
  updateTimerDisplay(seconds) {
    this.elements.timerEl.textContent = `Resend OTP in ${seconds}s`;
  }

  // Clear timer
  clearTimer() {
    if (this.state.timer) {
      clearInterval(this.state.timer);
      this.state.timer = null;
    }
    this.elements.timerEl.classList.add('hidden');
  }

  // Show status message
  showStatus(message, type = 'info') {
    this.elements.statusEl.textContent = message;
    this.elements.statusEl.className = `verification-status ${type}`;
  }

  // Disable verification after max attempts
  disableVerification() {
    this.elements.input.disabled = true;
    this.elements.verifyBtn.disabled = true;
  }

  // Validate recipient based on type
  validateRecipient() {
    if (!this.config.recipient) return false;

    if (this.config.type === 'mobile') {
      return /^[0-9]{10,15}$/.test(this.config.recipient);
    } else if (this.config.type === 'email') {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.config.recipient);
    }

    return false;
  }

  // Dispatch verification event
  dispatchVerificationEvent(success) {
    const event = new CustomEvent('otp-verification', {
      detail: {
        type: this.config.type,
        recipient: this.config.recipient,
        success,
        verified: this.state.verified
      },
      bubbles: true
    });
    this.elements.container.dispatchEvent(event);
  }

  // Update UI based on state
  updateUI() {
    this.elements.verifyBtn.disabled = this.state.verified;
    this.elements.input.disabled = this.state.verified;

    if (this.state.verified) {
      this.elements.input.classList.add('verified');
      this.elements.verifyBtn.textContent = 'Verified';
    } else {
      this.elements.input.classList.remove('verified');
      this.elements.verifyBtn.textContent = 'Verify';
    }
  }

  // Reset component
  reset() {
    this.state = {
      attempts: 0,
      lastSent: null,
      verified: false,
      timer: null,
      otp: ''
    };
    this.elements.input.value = '';
    this.showStatus('');
    this.clearTimer();
    this.updateUI();
  }

  // Destroy component
  destroy() {
    this.clearTimer();
    if (this.elements.container && !this.config.container) {
      this.elements.container.remove();
    }
  }
}

// Export for module system if available
if (typeof module !== 'undefined' && module.exports) {
  module.exports = OtpVerification;
} else {
  // Make available globally
  window.OtpVerification = OtpVerification;
}

// Auto-initialize components with data-otp attributes
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('[data-otp]').forEach(el => {
    const options = {
      container: el,
      type: el.dataset.otpType || 'mobile',
      recipient: el.dataset.otpRecipient || '',
      otpLength: parseInt(el.dataset.otpLength) || 6,
      resendInterval: parseInt(el.dataset.otpResendInterval) || 30,
      maxAttempts: parseInt(el.dataset.otpMaxAttempts) || 3,
      autoSubmit: el.dataset.otpAutoSubmit === 'true',
      debug: el.dataset.otpDebug === 'true'
    };

    // Initialize component
    new OtpVerification(options);
  });
});
