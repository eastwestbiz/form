/**
 * Form validation service
 */
class FormValidation {
  static validateRegistrationForm(formData) {
    const errors = [];

    // Required fields
    const requiredFields = [
      'firstName', 'lastName', 'gender', 'dob', 'age',
      'caste', 'surname', 'fatherName', 'motherName',
      'currentAddress1', 'currentCity', 'currentState', 'currentPincode',
      'primaryMobile', 'primaryEmail', 'aadharNumber'
    ];

    requiredFields.forEach(field => {
      if (!formData[field] || formData[field].trim() === '') {
        errors.push(`${this.formatFieldName(field)} is required`);
      }
    });

    // Email validation
    if (formData.primaryEmail && !this.isValidEmail(formData.primaryEmail)) {
      errors.push('Primary email is invalid');
    }

    // Mobile validation
    if (formData.primaryMobile && !this.isValidMobile(formData.primaryMobile)) {
      errors.push('Primary mobile number is invalid');
    }

    // Aadhar validation
    if (formData.aadharNumber && !this.isValidAadhar(formData.aadharNumber)) {
      errors.push('Aadhar number must be 16 digits');
    }

    return errors.length === 0 ? { valid: true } : { valid: false, errors };
  }

  static formatFieldName(field) {
    return field
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .replace('Address1', 'Address Line 1');
  }

  static isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  static isValidMobile(mobile) {
    return /^[0-9]{10}$/.test(mobile);
  }

  static isValidAadhar(aadhar) {
    return /^[0-9]{16}$/.test(aadhar);
  }
}

export default FormValidation;