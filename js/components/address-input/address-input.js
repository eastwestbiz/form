/**
 * Address Input Component
 * 
 * Features:
 * - Autocomplete for cities, states, and pincodes
 * - Address validation
 * - Same as current address toggle
 * - Integration with backend suggestions API
 * - Responsive design
 */

class AddressInput {
  /**
   * Initialize the address input component
   * @param {Object} options - Configuration options
   * @param {string} options.currentAddressContainer - Selector for current address container
   * @param {string} options.permanentAddressContainer - Selector for permanent address container
   * @param {string} options.sameAsCurrentCheckbox - Selector for "same as current" checkbox
   * @param {string} options.apiEndpoint - API endpoint for address suggestions
   */
  constructor(options) {
    this.options = {
      apiEndpoint: 'https://script.google.com/macros/s/1xN-HNeKqNo5I7Mo5uF_M0f1j3j40kPA4SpSoTVCvS750Q0UrJhXH0dca/exec',
      ...options
    };

    this.currentAddress = {
      line1: document.getElementById('currentAddress1'),
      line2: document.getElementById('currentAddress2'),
      city: document.getElementById('currentCity'),
      state: document.getElementById('currentState'),
      pincode: document.getElementById('currentPincode'),
      country: document.getElementById('currentCountry')
    };

    this.permanentAddress = {
      line1: document.getElementById('permanentAddress1'),
      line2: document.getElementById('permanentAddress2'),
      city: document.getElementById('permanentCity'),
      state: document.getElementById('permanentState'),
      pincode: document.getElementById('permanentPincode'),
      country: document.getElementById('permanentCountry')
    };

    this.sameAsCurrentCheckbox = document.getElementById('sameAsCurrent');
    
    this.init();
  }

  /**
   * Initialize the component
   */
  init() {
    // Set up event listeners
    this.setupEventListeners();
    
    // Initialize suggestion functionality
    this.initSuggestions();
    
    // Initialize same as current address functionality
    this.initSameAsCurrent();
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Add input event listeners for suggestions
    this.currentAddress.city.addEventListener('input', () => this.handleAddressFieldInput('city', this.currentAddress.city));
    this.currentAddress.state.addEventListener('input', () => this.handleAddressFieldInput('state', this.currentAddress.state));
    this.currentAddress.pincode.addEventListener('input', () => this.handleAddressFieldInput('pincode', this.currentAddress.pincode));
    
    // Add change listener for same as current checkbox
    this.sameAsCurrentCheckbox.addEventListener('change', () => this.toggleSameAsCurrent());
  }

  /**
   * Initialize suggestion functionality
   */
  initSuggestions() {
    // Create suggestion containers if they don't exist
    this.createSuggestionContainers();
    
    // Close suggestions when clicking outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.address-suggestions') && 
          !e.target.matches('[id^="currentCity"], [id^="currentState"], [id^="currentPincode"]')) {
        this.closeAllSuggestions();
      }
    });
  }

  /**
   * Create suggestion containers for address fields
   */
  createSuggestionContainers() {
    const fields = ['city', 'state', 'pincode'];
    
    fields.forEach(field => {
      const input = this.currentAddress[field];
      const container = document.createElement('div');
      container.className = 'address-suggestions';
      container.id = `${field}Suggestions`;
      container.style.display = 'none';
      input.parentNode.insertBefore(container, input.nextSibling);
    });
  }

  /**
   * Initialize same as current address functionality
   */
  initSameAsCurrent() {
    this.toggleSameAsCurrent(); // Set initial state
  }

  /**
   * Toggle permanent address fields based on "same as current" checkbox
   */
  toggleSameAsCurrent() {
    const isChecked = this.sameAsCurrentCheckbox.checked;
    
    Object.keys(this.permanentAddress).forEach(key => {
      this.permanentAddress[key].disabled = isChecked;
      
      if (isChecked) {
        // Copy values from current address
        this.permanentAddress[key].value = this.currentAddress[key]?.value || '';
      }
    });
  }

  /**
   * Handle address field input for suggestions
   * @param {string} fieldType - Type of field (city/state/pincode)
   * @param {HTMLElement} inputElement - The input element
   */
  async handleAddressFieldInput(fieldType, inputElement) {
    const query = inputElement.value.trim();
    const suggestionsContainer = document.getElementById(`${fieldType}Suggestions`);
    
    // Clear previous suggestions
    suggestionsContainer.innerHTML = '';
    suggestionsContainer.style.display = 'none';
    
    if (query.length < 2) return;
    
    try {
      const suggestions = await this.fetchAddressSuggestions(fieldType, query);
      
      if (suggestions.length > 0) {
        suggestions.forEach(suggestion => {
          const suggestionElement = document.createElement('div');
          suggestionElement.textContent = suggestion;
          suggestionElement.addEventListener('click', () => {
            inputElement.value = suggestion;
            suggestionsContainer.style.display = 'none';
            
            // Special handling for pincode - fetch city/state if possible
            if (fieldType === 'pincode') {
              this.handlePincodeSelection(suggestion);
            }
          });
          suggestionsContainer.appendChild(suggestionElement);
        });
        
        suggestionsContainer.style.display = 'block';
      }
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
    }
  }

  /**
   * Fetch address suggestions from the API
   * @param {string} field - Field type (city/state/pincode)
   * @param {string} query - Search query
   * @returns {Promise<Array>} Array of suggestions
   */
  async fetchAddressSuggestions(field, query) {
    const url = `${this.options.apiEndpoint}?action=suggestAddress&field=${encodeURIComponent(field)}&q=${encodeURIComponent(query)}`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data.success && Array.isArray(data.suggestions)) {
      return data.suggestions;
    }
    
    return [];
  }

  /**
   * Handle pincode selection - try to auto-fill city and state
   * @param {string} pincode - Selected pincode
   */
  async handlePincodeSelection(pincode) {
    try {
      // First try to get city/state from our known pincodes
      const knownPincodes = {
        '411001': { city: 'Pune', state: 'Maharashtra' },
        '411002': { city: 'Pune', state: 'Maharashtra' },
        '411003': { city: 'Pune', state: 'Maharashtra' }
        // Add more pincodes as needed
      };
      
      if (knownPincodes[pincode]) {
        this.currentAddress.city.value = knownPincodes[pincode].city;
        this.currentAddress.state.value = knownPincodes[pincode].state;
        return;
      }
      
      // If not found in our list, try to fetch from API
      const suggestions = await this.fetchAddressSuggestions('pincode', pincode);
      if (suggestions.length > 0) {
        // Assuming the first suggestion is the most relevant
        // This would depend on your API response structure
        // You might need to parse the suggestion to extract city/state
      }
    } catch (error) {
      console.error('Error handling pincode selection:', error);
    }
  }

  /**
   * Close all suggestion dropdowns
   */
  closeAllSuggestions() {
    document.querySelectorAll('.address-suggestions').forEach(container => {
      container.style.display = 'none';
    });
  }

  /**
   * Validate the address
   * @returns {boolean} True if address is valid
   */
  validate() {
    const requiredFields = [
      this.currentAddress.line1,
      this.currentAddress.city,
      this.currentAddress.state,
      this.currentAddress.pincode,
      this.currentAddress.country
    ];
    
    let isValid = true;
    
    requiredFields.forEach(field => {
      if (!field.value.trim()) {
        this.showError(field, 'This field is required');
        isValid = false;
      } else {
        this.clearError(field);
      }
    });
    
    // Validate pincode format
    if (this.currentAddress.pincode.value && !/^\d{6}$/.test(this.currentAddress.pincode.value)) {
      this.showError(this.currentAddress.pincode, 'Please enter a valid 6-digit pincode');
      isValid = false;
    }
    
    return isValid;
  }

  /**
   * Show error for a field
   * @param {HTMLElement} field - The input field
   * @param {string} message - Error message
   */
  showError(field, message) {
    const errorElement = field.nextElementSibling;
    
    if (!errorElement || !errorElement.classList.contains('error-message')) {
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.style.color = 'var(--error-color)';
      errorDiv.style.fontSize = '0.8em';
      errorDiv.style.marginTop = '5px';
      field.parentNode.insertBefore(errorDiv, field.nextSibling);
      errorDiv.textContent = message;
    } else {
      errorElement.textContent = message;
    }
    
    field.style.borderColor = 'var(--error-color)';
  }

  /**
   * Clear error for a field
   * @param {HTMLElement} field - The input field
   */
  clearError(field) {
    const errorElement = field.nextElementSibling;
    
    if (errorElement && errorElement.classList.contains('error-message')) {
      errorElement.remove();
    }
    
    field.style.borderColor = '';
  }

  /**
   * Get the current address data
   * @returns {Object} Current address object
   */
  getCurrentAddress() {
    return {
      address1: this.currentAddress.line1.value,
      address2: this.currentAddress.line2.value,
      city: this.currentAddress.city.value,
      state: this.currentAddress.state.value,
      pincode: this.currentAddress.pincode.value,
      country: this.currentAddress.country.value
    };
  }

  /**
   * Get the permanent address data
   * @returns {Object} Permanent address object
   */
  getPermanentAddress() {
    if (this.sameAsCurrentCheckbox.checked) {
      return this.getCurrentAddress();
    }
    
    return {
      address1: this.permanentAddress.line1.value,
      address2: this.permanentAddress.line2.value,
      city: this.permanentAddress.city.value,
      state: this.permanentAddress.state.value,
      pincode: this.permanentAddress.pincode.value,
      country: this.permanentAddress.country.value
    };
  }

  /**
   * Reset the address fields
   */
  reset() {
    Object.values(this.currentAddress).forEach(field => {
      if (field) field.value = '';
    });
    
    Object.values(this.permanentAddress).forEach(field => {
      if (field) field.value = '';
    });
    
    this.sameAsCurrentCheckbox.checked = false;
    this.closeAllSuggestions();
  }
}

// Export for module system if available
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AddressInput;
}

// Auto-initialize if data-address-input attribute is present
document.addEventListener('DOMContentLoaded', () => {
  const addressInputs = document.querySelectorAll('[data-address-input]');
  
  addressInputs.forEach(container => {
    new AddressInput({
      currentAddressContainer: container.querySelector('[data-current-address]'),
      permanentAddressContainer: container.querySelector('[data-permanent-address]'),
      sameAsCurrentCheckbox: container.querySelector('[data-same-as-current]')
    });
  });
});
