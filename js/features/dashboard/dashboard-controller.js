/**
 * BKJS Community Dashboard Controller
 * Handles all dashboard-related functionality for members
 */

class DashboardController {
  constructor() {
    // Initialize services
    this.authService = new AuthService();
    this.apiService = new ApiService();
    this.sessionService = new SessionService();
    
    // DOM elements
    this.dashboardContainer = document.getElementById('dashboardContainer');
    this.profileSection = document.getElementById('profileSection');
    this.familySection = document.getElementById('familySection');
    this.eventsSection = document.getElementById('eventsSection');
    this.documentsSection = document.getElementById('documentsSection');
    
    // State
    this.currentUser = null;
    this.familyMembers = [];
    this.upcomingEvents = [];
    
    // Initialize the dashboard
    this.init();
  }
  
  async init() {
    try {
      // Check authentication
      if (!this.authService.isAuthenticated()) {
        window.location.href = '/login.html';
        return;
      }
      
      // Get current user data
      this.currentUser = await this.loadUserData();
      
      // Load dashboard sections
      await this.loadProfile();
      await this.loadFamilyMembers();
      await this.loadUpcomingEvents();
      await this.loadDocuments();
      
      // Set up event listeners
      this.setupEventListeners();
      
    } catch (error) {
      console.error('Dashboard initialization failed:', error);
      showErrorToast('Failed to load dashboard. Please try again.');
    }
  }
  
  async loadUserData() {
    try {
      const uniqueId = this.sessionService.getCurrentUser().uniqueId;
      const email = this.sessionService.getCurrentUser().email;
      
      const response = await this.apiService.post({
        action: 'verifyMember',
        uniqueId,
        email
      });
      
      if (!response.success) {
        throw new Error(response.message || 'Failed to load user data');
      }
      
      return response.data;
    } catch (error) {
      console.error('Error loading user data:', error);
      throw error;
    }
  }
  
  async loadProfile() {
    if (!this.currentUser) return;
    
    // Populate profile section
    this.profileSection.innerHTML = `
      <div class="profile-card">
        <div class="profile-header">
          <h3>Member Profile</h3>
          <button id="editProfileBtn" class="btn btn-sm btn-secondary">Edit</button>
        </div>
        <div class="profile-content">
          <div class="profile-row">
            <span class="profile-label">Samuday ID:</span>
            <span class="profile-value">${this.currentUser.uniqueId}</span>
          </div>
          <div class="profile-row">
            <span class="profile-label">Full Name:</span>
            <span class="profile-value">${this.currentUser.firstName} ${this.currentUser.middleName || ''} ${this.currentUser.lastName}</span>
          </div>
          <div class="profile-row">
            <span class="profile-label">Gender:</span>
            <span class="profile-value">${this.currentUser.gender}</span>
          </div>
          <div class="profile-row">
            <span class="profile-label">Date of Birth:</span>
            <span class="profile-value">${formatDate(this.currentUser.dob)}</span>
          </div>
          <div class="profile-row">
            <span class="profile-label">Caste:</span>
            <span class="profile-value">${this.currentUser.caste}</span>
          </div>
          <div class="profile-row">
            <span class="profile-label">Primary Contact:</span>
            <span class="profile-value">${this.currentUser.primaryMobile}</span>
          </div>
        </div>
      </div>
    `;
  }
  
  async loadFamilyMembers() {
    if (!this.currentUser.familyMembers || this.currentUser.familyMembers.length === 0) {
      this.familySection.innerHTML = '<p>No family members registered</p>';
      return;
    }
    
    let familyHTML = `
      <div class="family-card">
        <h3>Family Members</h3>
        <table class="family-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Relationship</th>
              <th>Age</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    this.currentUser.familyMembers.forEach(member => {
      familyHTML += `
        <tr>
          <td>${member.name}</td>
          <td>${member.relationship}</td>
          <td>${member.age}</td>
        </tr>
      `;
    });
    
    familyHTML += `
          </tbody>
        </table>
        <button id="updateFamilyBtn" class="btn btn-sm btn-secondary">Update Family</button>
      </div>
    `;
    
    this.familySection.innerHTML = familyHTML;
  }
  
  async loadUpcomingEvents() {
    try {
      // In a real implementation, this would fetch from the API
      this.upcomingEvents = [
        {
          id: 'evt001',
          title: 'Annual Community Gathering',
          date: '2023-12-15',
          location: 'Community Hall, Pune',
          description: 'Join us for our yearly community gathering with cultural programs and dinner'
        },
        {
          id: 'evt002',
          title: 'Youth Workshop',
          date: '2023-11-20',
          location: 'Online',
          description: 'Career guidance workshop for community youth'
        }
      ];
      
      let eventsHTML = `
        <div class="events-card">
          <h3>Upcoming Events</h3>
          <div class="events-list">
      `;
      
      this.upcomingEvents.forEach(event => {
        eventsHTML += `
          <div class="event-item">
            <h4>${event.title}</h4>
            <p><strong>Date:</strong> ${formatDate(event.date)}</p>
            <p><strong>Location:</strong> ${event.location}</p>
            <p>${event.description}</p>
            <button class="btn btn-sm btn-primary" data-event-id="${event.id}">Register</button>
          </div>
        `;
      });
      
      eventsHTML += `
          </div>
        </div>
      `;
      
      this.eventsSection.innerHTML = eventsHTML;
      
    } catch (error) {
      console.error('Error loading events:', error);
      this.eventsSection.innerHTML = '<p>Unable to load upcoming events</p>';
    }
  }
  
  async loadDocuments() {
    // This would normally fetch from API
    const documents = [
      { name: 'Membership Certificate', downloadUrl: '#', issuedDate: '2023-01-15' },
      { name: 'Caste Certificate', downloadUrl: '#', issuedDate: '2022-11-20' }
    ];
    
    let docsHTML = `
      <div class="documents-card">
        <h3>Your Documents</h3>
        <table class="documents-table">
          <thead>
            <tr>
              <th>Document</th>
              <th>Issued Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    documents.forEach(doc => {
      docsHTML += `
        <tr>
          <td>${doc.name}</td>
          <td>${formatDate(doc.issuedDate)}</td>
          <td><a href="${doc.downloadUrl}" class="btn btn-sm btn-primary">Download</a></td>
        </tr>
      `;
    });
    
    docsHTML += `
          </tbody>
        </table>
      </div>
    `;
    
    this.documentsSection.innerHTML = docsHTML;
  }
  
  setupEventListeners() {
    // Edit profile button
    document.getElementById('editProfileBtn')?.addEventListener('click', () => {
      this.navigateToUpdateForm();
    });
    
    // Update family button
    document.getElementById('updateFamilyBtn')?.addEventListener('click', () => {
      this.navigateToUpdateForm('family');
    });
    
    // Event registration buttons
    document.querySelectorAll('[data-event-id]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const eventId = e.target.getAttribute('data-event-id');
        this.registerForEvent(eventId);
      });
    });
  }
  
  navigateToUpdateForm(section = 'profile') {
    // Store which section to show in update form
    this.sessionService.set('updateSection', section);
    window.location.href = '/update.html';
  }
  
  async registerForEvent(eventId) {
    try {
      showLoadingSpinner('Registering for event...');
      
      const response = await this.apiService.post({
        action: 'registerEvent',
        eventId,
        uniqueId: this.currentUser.uniqueId
      });
      
      if (response.success) {
        showSuccessToast('Successfully registered for the event!');
      } else {
        throw new Error(response.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Event registration error:', error);
      showErrorToast(error.message || 'Failed to register for event');
    } finally {
      hideLoadingSpinner();
    }
  }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new DashboardController();
});
