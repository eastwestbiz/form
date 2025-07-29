/**
 * DOM Utility Functions
 * Provides helper functions for DOM manipulation and event handling
 */

/**
 * Creates a new DOM element with specified attributes and children
 * @param {string} tag - The HTML tag name
 * @param {object} attributes - Key-value pairs of attributes
 * @param {(string|HTMLElement|Array)} children - Child elements or text
 * @returns {HTMLElement} The created element
 */
export function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag);
  
  // Set attributes
  for (const [key, value] of Object.entries(attributes)) {
    if (key === 'className') {
      element.className = value;
    } else if (key === 'dataset') {
      for (const [dataKey, dataValue] of Object.entries(value)) {
        element.dataset[dataKey] = dataValue;
      }
    } else {
      element.setAttribute(key, value);
    }
  }
  
  // Append children
  if (typeof children === 'string') {
    element.textContent = children;
  } else if (Array.isArray(children)) {
    children.forEach(child => {
      if (child instanceof HTMLElement) {
        element.appendChild(child);
      } else if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      }
    });
  } else if (children instanceof HTMLElement) {
    element.appendChild(children);
  }
  
  return element;
}

/**
 * Shows a loading spinner in the specified element
 * @param {HTMLElement} element - The element to show spinner in
 * @param {string} size - 'sm', 'md', or 'lg'
 */
export function showLoadingSpinner(element, size = 'md') {
  const sizes = {
    sm: '1rem',
    md: '2rem',
    lg: '3rem'
  };
  
  element.innerHTML = `
    <div class="spinner" style="width: ${sizes[size]}; height: ${sizes[size]};">
      <div class="double-bounce1"></div>
      <div class="double-bounce2"></div>
    </div>
  `;
}

/**
 * Debounces a function to limit execution rate
 * @param {Function} func - The function to debounce
 * @param {number} wait - Time to wait in milliseconds
 * @returns {Function} The debounced function
 */
export function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Handles file upload UI updates
 * @param {HTMLElement} inputElement - The file input element
 * @param {HTMLElement} displayElement - The element to show file name
 */
export function setupFileUpload(inputElement, displayElement) {
  inputElement.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      displayElement.textContent = e.target.files[0].name;
      displayElement.style.color = '#28a745'; // Green for success
    } else {
      displayElement.textContent = 'No file selected';
      displayElement.style.color = '#6c757d'; // Gray for default
    }
  });
}

/**
 * Toggles visibility of an element
 * @param {HTMLElement} element - The element to toggle
 * @param {boolean} show - Whether to show or hide
 */
export function toggleElement(element, show) {
  if (show) {
    element.classList.remove('hidden');
  } else {
    element.classList.add('hidden');
  }
}

/**
 * Initializes address suggestion functionality
 * @param {string} fieldId - The input field ID
 * @param {string} suggestionType - 'city', 'state', or 'pincode'
 */
export function initAddressSuggestions(fieldId, suggestionType) {
  const input = document.getElementById(fieldId);
  const suggestionBox = document.getElementById(`${fieldId}Suggestions`);
  
  if (!input || !suggestionBox) return;
  
  const debouncedFetch = debounce(async (value) => {
    if (value.length < 2) {
      suggestionBox.innerHTML = '';
      suggestionBox.style.display = 'none';
      return;
    }
    
    try {
      const res = await fetch(`${scriptUrl}?action=suggestAddress&field=${suggestionType}&q=${encodeURIComponent(value)}`);
      const data = await res.json();
      
      if (data.success && data.suggestions.length > 0) {
        suggestionBox.innerHTML = '';
        data.suggestions.forEach(suggestion => {
          const item = createElement('div', {}, suggestion);
          item.addEventListener('click', () => {
            input.value = suggestion;
            suggestionBox.innerHTML = '';
            suggestionBox.style.display = 'none';
          });
          suggestionBox.appendChild(item);
        });
        suggestionBox.style.display = 'block';
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  }, 300);
  
  input.addEventListener('input', (e) => {
    debouncedFetch(e.target.value.trim());
  });
  
  // Hide suggestions when clicking outside
  document.addEventListener('click', (e) => {
    if (!input.contains(e.target) && !suggestionBox.contains(e.target)) {
      suggestionBox.innerHTML = '';
      suggestionBox.style.display = 'none';
    }
  });
}
