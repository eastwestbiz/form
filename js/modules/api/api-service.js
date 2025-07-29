/**
 * API service for making requests to backend
 */
class ApiService {
  constructor() {
    this.baseUrl = window.scriptUrl;
    this.csrfToken = null;
  }

  async init() {
    await this.getCsrfToken();
  }

  async getCsrfToken() {
    try {
      const response = await this.get('getCsrfToken');
      if (response.success) {
        this.csrfToken = response.csrfToken;
      }
    } catch (error) {
      console.error('Error getting CSRF token:', error);
    }
  }

  async get(action, params = {}) {
    const url = new URL(this.baseUrl);
    url.searchParams.append('action', action);
    
    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value);
    }

    const response = await fetch(url);
    return response.json();
  }

  async post(action, data = {}) {
    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action,
        csrfToken: this.csrfToken,
        ...data
      })
    });

    return response.json();
  }

  // Specific API methods
  async submitApplication(formData) {
    return this.post('submitApplication', formData);
  }

  async verifyMember(uniqueId, email) {
    return this.post('verifyMember', { uniqueId, email });
  }

  async sendOtp(type, recipient) {
    return this.post('sendOtp', { type, recipient });
  }
}

// Singleton instance
const apiService = new ApiService();
apiService.init();

export default apiService;
