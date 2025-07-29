// =============================================
// Loading Utilities
// =============================================

/**
 * Global loading indicator management
 * Provides consistent loading indicators throughout the application
 */

// DOM elements
const loadingIndicator = document.createElement('div');
loadingIndicator.className = 'global-loader hidden';
loadingIndicator.innerHTML = `
  <div class="loader-spinner"></div>
  <div class="loader-text">Loading...</div>
`;

// Add to body
document.body.appendChild(loadingIndicator);

/**
 * Shows global loading indicator
 * @param {string} message - Optional loading message
 */
export function showLoading(message = 'Loading...') {
  const textElement = loadingIndicator.querySelector('.loader-text');
  textElement.textContent = message;
  loadingIndicator.classList.remove('hidden');
  document.body.style.overflow = 'hidden';
}

/**
 * Hides global loading indicator
 */
export function hideLoading() {
  loadingIndicator.classList.add('hidden');
  document.body.style.overflow = '';
}

/**
 * Shows button loading state
 * @param {HTMLElement} button - Button element
 * @param {string} text - Optional loading text
 */
export function showButtonLoading(button, text = 'Processing...') {
  button.dataset.originalText = button.textContent;
  button.innerHTML = `${text} <span class="element-spinner"></span>`;
  button.disabled = true;
}

/**
 * Hides button loading state
 * @param {HTMLElement} button - Button element
 */
export function hideButtonLoading(button) {
  if (button.dataset.originalText) {
    button.textContent = button.dataset.originalText;
  }
  button.disabled = false;
}

/**
 * Shows element loading state
 * @param {HTMLElement} element - DOM element
 */
export function showElementLoading(element) {
  element.classList.add('loading');
  const spinner = document.createElement('span');
  spinner.className = 'element-spinner';
  element.appendChild(spinner);
}

/**
 * Hides element loading state
 * @param {HTMLElement} element - DOM element
 */
export function hideElementLoading(element) {
  element.classList.remove('loading');
  const spinner = element.querySelector('.element-spinner');
  if (spinner) {
    spinner.remove();
  }
}

// Initialize loading indicator styles
const style = document.createElement('style');
style.textContent = `
  .global-loader {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0,0,0,0.7);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    color: white;
  }
  
  .global-loader.hidden {
    display: none;
  }
  
  .loader-spinner {
    border: 4px solid rgba(255,255,255,0.3);
    border-radius: 50%;
    border-top: 4px solid #fff;
    width: 40px;
    height: 40px;
    animation: spin 1s linear infinite;
  }
  
  .loader-text {
    margin-top: 15px;
  }
  
  .element-spinner {
    border: 2px solid rgba(0,0,0,0.1);
    border-radius: 50%;
    border-top: 2px solid #3498db;
    width: 16px;
    height: 16px;
    animation: spin 1s linear infinite;
    display: inline-block;
    margin-left: 8px;
  }
  
  .loading {
    position: relative;
    opacity: 0.7;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);