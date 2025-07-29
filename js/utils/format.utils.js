/**
 * Formatting utilities for the application
 */

// Format date to YYYY-MM-DD (for input[type="date"])
export function formatDateForInput(date) {
  if (!date) return '';
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Format date to readable string (e.g., "Jan 1, 2023")
export function formatDateReadable(date) {
  if (!date) return '';
  const options = { year: 'numeric', month: 'short', day: 'numeric' };
  return new Date(date).toLocaleDateString(undefined, options);
}

// Format phone number with country code
export function formatPhoneNumber(phone, countryCode = '91') {
  if (!phone) return '';
  // Remove all non-digit characters
  const cleaned = phone.replace(/\D/g, '');
  // Add country code if not present
  return cleaned.startsWith(countryCode) ? `+${cleaned}` : `+${countryCode}${cleaned}`;
}

// Format address into a single string
export function formatAddress(addressObj) {
  if (!addressObj) return '';
  const parts = [
    addressObj.address1,
    addressObj.address2,
    `${addressObj.city}, ${addressObj.state} ${addressObj.pincode}`,
    addressObj.country
  ].filter(Boolean);
  return parts.join(', ');
}

// Format family members array for display
export function formatFamilyMembers(members) {
  if (!members || !members.length) return 'None';
  return members.map(m => `${m.name} (${m.relationship}, ${m.age})`).join('; ');
}

// Format caste ID and name
export function formatCaste(casteId) {
  if (!casteId) return '';
  const parts = casteId.split('-');
  return parts.length > 1 ? parts[1] : casteId;
}

// Format verification status with color
export function formatVerificationStatus(status) {
  const statusMap = {
    'Pending': { text: 'Pending Review', class: 'text-warning' },
    'Approved': { text: 'Verified', class: 'text-success' },
    'Rejected': { text: 'Rejected', class: 'text-danger' },
    'Pending Update': { text: 'Update Pending Review', class: 'text-warning' }
  };
  return statusMap[status] || { text: status, class: '' };
}

// Format file size to human readable format
export function formatFileSize(bytes) {
  if (!bytes) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}