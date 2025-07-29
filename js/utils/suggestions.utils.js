// /public/js/utils/suggestions.utils.js

/**
 * Suggestion Utility Module
 * Handles all suggestion-related functionality for form fields
 */

// Cache for suggestions to reduce API calls
const suggestionCache = new Map();

/**
 * Initialize suggestion functionality for a field
 * @param {string} fieldId - The ID of the input field
 * @param {string} fieldType - The type of field (surname, gothra, city, etc.)
 * @param {HTMLElement} suggestionsContainer - The container for suggestions
 */
export function initSuggestionField(fieldId, fieldType, suggestionsContainer) {
    const inputElement = document.getElementById(fieldId);
    
    if (!inputElement) return;

    // Set up event listeners
    inputElement.addEventListener('input', debounce(() => {
        handleInputChange(fieldType, inputElement, suggestionsContainer);
    }, 300));

    inputElement.addEventListener('focus', () => {
        if (inputElement.value.trim().length > 1 && suggestionCache.has(fieldType + inputElement.value)) {
            showSuggestions(suggestionCache.get(fieldType + inputElement.value), suggestionsContainer);
        }
    });

    // Hide suggestions when clicking outside
    document.addEventListener('click', (e) => {
        if (!suggestionsContainer.contains(e.target) && inputElement !== e.target) {
            suggestionsContainer.style.display = 'none';
        }
    });
}

/**
 * Handle input changes and fetch suggestions
 * @param {string} fieldType - Type of field (surname, gothra, etc.)
 * @param {HTMLElement} inputElement - The input element
 * @param {HTMLElement} suggestionsContainer - Container for suggestions
 */
async function handleInputChange(fieldType, inputElement, suggestionsContainer) {
    const query = inputElement.value.trim();
    suggestionsContainer.innerHTML = '';
    suggestionsContainer.style.display = 'none';

    if (query.length < 2) return;

    // Check cache first
    const cacheKey = fieldType + query;
    if (suggestionCache.has(cacheKey)) {
        showSuggestions(suggestionCache.get(cacheKey), suggestionsContainer);
        return;
    }

    try {
        // Determine if this is an address field or regular suggestion
        const action = fieldType === 'city' || fieldType === 'state' || fieldType === 'pincode' 
            ? 'suggestAddress' 
            : 'suggest';
        
        const response = await fetch(`${window.scriptUrl}?action=${action}&field=${encodeURIComponent(fieldType)}&q=${encodeURIComponent(query)}`);
        
        if (!response.ok) throw new Error('Failed to fetch suggestions');
        
        const data = await response.json();
        
        if (data.success && Array.isArray(data.suggestions) && data.suggestions.length > 0) {
            // Cache the results
            suggestionCache.set(cacheKey, data.suggestions);
            showSuggestions(data.suggestions, suggestionsContainer);
        }
    } catch (error) {
        console.error('Error fetching suggestions:', error);
        // Fail silently in production
    }
}

/**
 * Display suggestions in the UI
 * @param {Array} suggestions - Array of suggestion strings
 * @param {HTMLElement} container - Container to display suggestions
 */
function showSuggestions(suggestions, container) {
    container.innerHTML = '';
    
    suggestions.forEach(suggestion => {
        const suggestionElement = document.createElement('div');
        suggestionElement.textContent = suggestion;
        suggestionElement.addEventListener('click', () => {
            // The actual input field is the previous sibling of the suggestions container
            const inputField = container.previousElementSibling;
            if (inputField && inputField.tagName === 'INPUT') {
                inputField.value = suggestion;
            }
            container.style.display = 'none';
        });
        container.appendChild(suggestionElement);
    });
    
    container.style.display = 'block';
}

/**
 * Debounce function to limit API calls
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
function debounce(func, delay) {
    let timeoutId;
    return function(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Initialize all suggestion fields on the page
 */
export function initAllSuggestionFields() {
    // Regular suggestion fields
    const suggestionFields = [
        { id: 'surname', type: 'surname', containerId: 'surnameSuggestions' },
        { id: 'gothra', type: 'gothra', containerId: 'gothraSuggestions' },
        { id: 'vamsha', type: 'vamsha', containerId: 'vamshaSuggestions' },
        { id: 'veda', type: 'veda', containerId: 'vedaSuggestions' },
        { id: 'kuldevi', type: 'kuldevi', containerId: 'kuldeviSuggestions' },
        { id: 'kuldevata', type: 'kuldevata', containerId: 'kuldevataSuggestions' }
    ];

    // Address suggestion fields
    const addressFields = [
        { id: 'currentCity', type: 'city', containerId: 'currentCitySuggestions' },
        { id: 'currentState', type: 'state', containerId: 'currentStateSuggestions' },
        { id: 'currentPincode', type: 'pincode', containerId: 'currentPincodeSuggestions' },
        // Add permanent address fields if needed
    ];

    // Initialize all fields
    [...suggestionFields, ...addressFields].forEach(field => {
        const container = document.getElementById(field.containerId);
        if (container) {
            initSuggestionField(field.id, field.type, container);
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initAllSuggestionFields);