// =============================================
// SECTION 1: INITIALIZATION AND CONFIGURATION
// =============================================

// DOM Elements
const DOM = {
    // Form sections
    loginSection: document.getElementById('loginSection'),
    registrationSection: document.getElementById('registrationSection'),
    documentChecklist: document.getElementById('documentChecklist'),
    applicationForm: document.getElementById('applicationForm'),
    updateSection: document.getElementById('updateSection'),
    
    // Form elements
    form: document.getElementById('membershipForm'),
    updateForm: document.getElementById('updateForm'),
    submitBtn: document.getElementById('submitBtn'),
    updateSubmitBtn: document.getElementById('updateSubmitBtn'),
    
    // Progress indicators
    formProgress: document.getElementById('formProgress'),
    updateProgress: document.getElementById('updateProgress'),
    
    // Modals
    previewModal: document.getElementById('previewModal'),
    termsModal: document.getElementById('termsModal'),
    successModal: document.getElementById('successModal'),
    
    // Other important elements
    sameAsCurrent: document.getElementById('sameAsCurrent'),
    updateSameAsCurrent: document.getElementById('updateSameAsCurrent')
};

// =============================================
// SECTION 2: VIEW RENDERING FUNCTIONS
// =============================================

/**
 * Toggles between login and registration views
 */
function toggleAuthViews() {
    DOM.loginSection.classList.toggle('hidden');
    DOM.registrationSection.classList.toggle('hidden');
}

/**
 * Shows the application form after document checklist
 */
function showApplicationForm() {
    DOM.documentChecklist.classList.add('hidden');
    DOM.applicationForm.classList.remove('hidden');
}

/**
 * Updates the progress bar based on form completion
 */
function updateProgressBar() {
    const requiredFields = Array.from(DOM.form.querySelectorAll('[required]'));
    const filledFields = requiredFields.filter(field => {
        if (field.type === 'checkbox' || field.type === 'radio') {
            return field.checked;
        }
        return field.value.trim() !== '';
    });
    
    const progress = (filledFields.length / requiredFields.length) * 100;
    DOM.formProgress.style.width = `${progress}%`;
    
    // Enable submit button when all required fields are filled
    DOM.submitBtn.disabled = filledFields.length < requiredFields.length;
}

/**
 * Renders the preview modal with form data
 */
function renderPreviewModal(formData) {
    // Personal Information
    document.getElementById('preview-fullName').textContent = 
        `${formData.firstName} ${formData.middleName ? formData.middleName + ' ' : ''}${formData.lastName}`;
    
    // Address Information
    document.getElementById('preview-currentAddress').textContent = 
        `${formData.currentAddress1}, ${formData.currentAddress2 || ''}, ${formData.currentCity}, ${formData.currentState} - ${formData.currentPincode}`;
    
    // Family Members
    const familyMembersContainer = document.getElementById('preview-familyMembers');
    familyMembersContainer.innerHTML = '';
    
    formData.familyMembers.forEach((member, index) => {
        if (member.name && member.relationship && member.age) {
            const memberDiv = document.createElement('div');
            memberDiv.className = 'preview-field';
            memberDiv.innerHTML = `
                <div class="preview-label">Member ${index + 1}:</div>
                <div class="preview-value">${member.name} (${member.relationship}, ${member.age})</div>
            `;
            familyMembersContainer.appendChild(memberDiv);
        }
    });
    
    // Show the modal
    DOM.previewModal.style.display = 'block';
}

/**
 * Renders success message after form submission
 */
function renderSuccessMessage(applicationId) {
    document.getElementById('applicationId').textContent = applicationId;
    DOM.successModal.style.display = 'block';
}

/**
 * Renders error message
 */
function renderError(message) {
    const errorElement = document.getElementById('errorMessage');
    errorElement.textContent = message;
    errorElement.classList.remove('hidden');
    setTimeout(() => errorElement.classList.add('hidden'), 5000);
}

// =============================================
// SECTION 3: EVENT HANDLERS AND LISTENERS
// =============================================

/**
 * Handles same as current address checkbox
 */
function handleSameAddressCheckbox() {
    if (DOM.sameAsCurrent.checked) {
        // Copy current address to permanent address
        document.getElementById('permanentAddress1').value = 
            document.getElementById('currentAddress1').value;
        document.getElementById('permanentAddress2').value = 
            document.getElementById('currentAddress2').value;
        document.getElementById('permanentCity').value = 
            document.getElementById('currentCity').value;
        document.getElementById('permanentState').value = 
            document.getElementById('currentState').value;
        document.getElementById('permanentPincode').value = 
            document.getElementById('currentPincode').value;
        document.getElementById('permanentCountry').value = 
            document.getElementById('currentCountry').value;
    }
}

/**
 * Handles file upload display
 */
function handleFileUpload(inputId, displayId) {
    const input = document.getElementById(inputId);
    const display = document.getElementById(displayId);
    
    input.addEventListener('change', () => {
        if (input.files.length > 0) {
            display.textContent = input.files[0].name;
        } else {
            display.textContent = 'No file selected';
        }
    });
}

// =============================================
// SECTION 4: INITIALIZATION
// =============================================

/**
 * Initializes all event listeners
 */
function initEventListeners() {
    // Form progress tracking
    DOM.form.addEventListener('input', updateProgressBar);
    
    // Same address checkbox
    DOM.sameAsCurrent.addEventListener('change', handleSameAddressCheckbox);
    DOM.updateSameAsCurrent.addEventListener('change', handleSameAddressCheckbox);
    
    // File upload displays
    handleFileUpload('aadharFront', 'aadharFrontName');
    handleFileUpload('aadharBack', 'aadharBackName');
    handleFileUpload('profilePhoto', 'profilePhotoName');
    handleFileUpload('casteCertificate', 'casteCertificateName');
    
    // Update form file upload displays
    handleFileUpload('updateAadharFront', 'updateAadharFrontName');
    handleFileUpload('updateAadharBack', 'updateAadharBackName');
    handleFileUpload('updateProfilePhoto', 'updateProfilePhotoName');
    
    // Modal close buttons
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').style.display = 'none';
        });
    });
    
    // Window click handler for modals
    window.addEventListener('click', (event) => {
        if (event.target.classList.contains('modal')) {
            event.target.style.display = 'none';
        }
    });
}

// Initialize the view module
document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    updateProgressBar();
});

// =============================================
// SECTION 5: PUBLIC API
// =============================================

export default {
    toggleAuthViews,
    showApplicationForm,
    renderPreviewModal,
    renderSuccessMessage,
    renderError,
    
    // DOM elements exposed for controller
    DOM
};
