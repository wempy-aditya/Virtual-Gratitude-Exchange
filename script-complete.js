// =============================================
// GRATITUDE - MODERN WEB APP JAVASCRIPT
// =============================================

class GratitudeApp {
    constructor() {
        this.currentTab = 'send';
        this.theme = localStorage.getItem('theme') || 'light';
        this.init();
    }

    init() {
        console.log('🚀 Initializing Gratitude App...');
        this.applyTheme();
        this.setupEventListeners();
        this.updateStats();
        this.setupNotifications();
        this.initializeDefaultMessage();
    }

    // Theme Management
    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.theme);
        const themeIcon = document.querySelector('#themeToggle i');
        if (themeIcon) {
            themeIcon.className = this.theme === 'dark' ? 'fas fa-sun' : 'fas fa-moon';
        }
        console.log(`🎨 Applied ${this.theme} theme`);
    }

    toggleTheme() {
        this.theme = this.theme === 'light' ? 'dark' : 'light';
        localStorage.setItem('theme', this.theme);
        this.applyTheme();
        
        // Add smooth transition effect
        document.body.style.transition = 'all 0.3s ease-in-out';
        setTimeout(() => {
            document.body.style.transition = '';
        }, 300);
        
        this.showNotification(`Switched to ${this.theme} mode! ✨`, 'success');
    }

    // Event Listeners Setup
    setupEventListeners() {
        // Theme toggle
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }

        // Tab navigation
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const tab = e.currentTarget.dataset.tab;
                this.switchTab(tab);
            });
        });

        // Form submission
        const gratitudeForm = document.getElementById('gratitudeForm');
        if (gratitudeForm) {
            gratitudeForm.addEventListener('submit', (e) => this.handleFormSubmit(e));
        }

        // Character counter
        const messageTextarea = document.getElementById('message');
        if (messageTextarea) {
            messageTextarea.addEventListener('input', (e) => this.updateCharCounter(e));
        }

        // New message button
        const newMessageBtn = document.getElementById('newMessageBtn');
        if (newMessageBtn) {
            newMessageBtn.addEventListener('click', () => this.getNewMessage());
        }

        // Modal close
        const modalCloseBtn = document.getElementById('modalCloseBtn');
        if (modalCloseBtn) {
            modalCloseBtn.addEventListener('click', () => this.closeModal());
        }

        // Close modal on overlay click
        const modalOverlay = document.getElementById('successModal');
        if (modalOverlay) {
            modalOverlay.addEventListener('click', (e) => {
                if (e.target === modalOverlay) {
                    this.closeModal();
                }
            });
        }

        console.log('✅ Event listeners setup complete');
    }

    // Tab Management
    switchTab(tabName) {
        // Update tab buttons
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        const activeTab = document.querySelector(`[data-tab="${tabName}"]`);
        if (activeTab) {
            activeTab.classList.add('active');
        }

        // Update tab content
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        const activeContent = document.getElementById(`${tabName}Content`);
        if (activeContent) {
            activeContent.classList.add('active');
        }

        this.currentTab = tabName;

        // Refresh stats if switching to stats tab
        if (tabName === 'stats') {
            this.updateStats();
        }

        console.log(`📍 Switched to ${tabName} tab`);
    }

    // Form Handling
    async handleFormSubmit(e) {
        e.preventDefault();
        
        const category = document.getElementById('category').value;
        const message = document.getElementById('message').value;

        if (!category || !message.trim()) {
            this.showNotification('Please fill in all fields! 📝', 'error');
            return;
        }

        this.showLoading('Sending your gratitude to the world... 🌍');

        try {
            // Simulate sending message
            await this.simulateDelay(2000);

            // Send message via database service if available
            let success = false;
            if (window.databaseService) {
                success = await window.databaseService.sendMessage({
                    category,
                    message: message.trim(),
                    timestamp: new Date().toISOString()
                });
            } else {
                // Fallback: just simulate success
                success = true;
            }

            this.hideLoading();

            if (success) {
                this.showSuccessModal();
                this.resetForm();
                this.updateStats();
                console.log('✅ Message sent successfully');
            } else {
                this.showNotification('Failed to send message. Please try again! 😔', 'error');
            }
        } catch (error) {
            console.error('❌ Error sending message:', error);
            this.hideLoading();
            this.showNotification('Something went wrong. Please try again! 🔧', 'error');
        }
    }

    // Get New Message
    async getNewMessage() {
        this.showLoading('Finding a beautiful message for you... 💝');

        try {
            let message = null;
            
            // Try to get message from database service
            if (window.databaseService) {
                message = await window.databaseService.getRandomMessage();
            }
            
            // Fallback: use sample messages
            if (!message) {
                message = this.getSampleMessage();
            }

            await this.simulateDelay(1500);
            this.hideLoading();

            if (message) {
                this.displayMessage(message);
                this.showNotification('New message received! 💝', 'success');
            } else {
                this.showNotification('No messages available right now. Try again later! 🔄', 'error');
            }
        } catch (error) {
            console.error('❌ Error getting message:', error);
            this.hideLoading();
            this.showNotification('Failed to get message. Please try again! 🔧', 'error');
        }
    }

    // Sample Messages for Fallback
    getSampleMessage() {
        const sampleMessages = [
            {
                category: 'kindness',
                message: "Your kindness today made my entire week brighter. Thank you for being such a wonderful human being!",
                timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
            },
            {
                category: 'inspiration',
                message: "Watching you pursue your dreams with such dedication inspires me to never give up on mine. You're amazing!",
                timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
            },
            {
                category: 'help',
                message: "The way you helped me when I needed it most showed me what true friendship looks like. Forever grateful!",
                timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
            },
            {
                category: 'hardwork',
                message: "Your dedication and hard work doesn't go unnoticed. You're making a real difference in this world!",
                timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
            },
            {
                category: 'friendship',
                message: "Having you as a friend makes life so much more beautiful. Thank you for always being there!",
                timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
            },
            {
                category: 'general',
                message: "Just wanted to remind you that you matter, you're loved, and you make this world a better place by existing!",
                timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString()
            }
        ];

        return sampleMessages[Math.floor(Math.random() * sampleMessages.length)];
    }

    // Initialize Default Message
    initializeDefaultMessage() {
        const defaultMessage = {
            category: 'general',
            message: "Welcome to Gratitude! Click 'Get New Message' to receive a heartfelt message from someone around the world. You're about to brighten your day! ✨",
            timestamp: new Date().toISOString()
        };
        this.displayMessage(defaultMessage);
    }

    // Display Message
    displayMessage(message) {
        const categoryEl = document.getElementById('receivedCategory');
        const messageEl = document.getElementById('receivedMessage');
        const timeEl = document.getElementById('receivedTime');
        const locationEl = document.getElementById('receivedLocation');

        if (categoryEl && messageEl && timeEl) {
            // Category mapping with emojis
            const categoryMap = {
                'kindness': '💝 Kindness & Compassion',
                'hardwork': '💪 Hard Work & Dedication', 
                'friendship': '👥 Friendship & Support',
                'help': '🤝 Help & Assistance',
                'inspiration': '🌟 Inspiration & Motivation',
                'general': '❤️ General Appreciation'
            };

            categoryEl.textContent = categoryMap[message.category] || '❤️ General Appreciation';
            messageEl.textContent = message.message;
            
            // Format timestamp
            const messageDate = new Date(message.timestamp);
            timeEl.textContent = this.formatRelativeTime(messageDate);

            // Location display
            if (locationEl) {
                const locations = [
                    'someone in New York', 'someone in Tokyo', 'someone in London',
                    'someone in Paris', 'someone in Sydney', 'someone in Mumbai',
                    'someone in São Paulo', 'someone in Cairo', 'someone in Moscow',
                    'someone in Seoul', 'someone in Mexico City', 'someone in Berlin',
                    'someone in Amsterdam', 'someone in Barcelona', 'someone in Singapore'
                ];
                const randomLocation = locations[Math.floor(Math.random() * locations.length)];
                locationEl.textContent = `From ${randomLocation}`;
            }

            console.log('💌 Message displayed successfully');
        }
    }

    // Update Statistics
    async updateStats() {
        try {
            let stats = null;
            
            // Try to get stats from database service
            if (window.databaseService) {
                stats = await window.databaseService.getStats();
            }
            
            // Fallback stats
            if (!stats) {
                stats = this.generateSampleStats();
            }
            
            // Update hero stats
            const heroTotalEl = document.getElementById('heroTotalMessages');
            const heroActiveEl = document.getElementById('heroActiveUsers');
            
            if (heroTotalEl) heroTotalEl.textContent = this.formatNumber(stats.totalMessages);
            if (heroActiveEl) heroActiveEl.textContent = this.formatNumber(stats.activeUsers);

            // Update stats tab
            const totalEl = document.getElementById('totalMessages');
            const todayEl = document.getElementById('todayMessages');
            const activeEl = document.getElementById('activeUsers');
            
            if (totalEl) totalEl.textContent = this.formatNumber(stats.totalMessages);
            if (todayEl) todayEl.textContent = this.formatNumber(stats.todayMessages);
            if (activeEl) activeEl.textContent = this.formatNumber(stats.activeUsers);

            // Update category stats
            this.updateCategoryStats(stats.categoryStats);

            console.log('📊 Stats updated successfully');
        } catch (error) {
            console.error('❌ Error updating stats:', error);
            // Set default values if there's an error
            this.setDefaultStats();
        }
    }

    // Generate Sample Stats
    generateSampleStats() {
        const baseStats = {
            totalMessages: 1247 + Math.floor(Math.random() * 100),
            todayMessages: 23 + Math.floor(Math.random() * 20),
            activeUsers: 156 + Math.floor(Math.random() * 50)
        };

        const categoryStats = {
            kindness: 345 + Math.floor(Math.random() * 50),
            inspiration: 298 + Math.floor(Math.random() * 40),
            help: 234 + Math.floor(Math.random() * 30),
            friendship: 189 + Math.floor(Math.random() * 25),
            hardwork: 123 + Math.floor(Math.random() * 20),
            general: 98 + Math.floor(Math.random() * 15)
        };

        return { ...baseStats, categoryStats };
    }

    // Update Category Statistics
    updateCategoryStats(categoryStats) {
        const categoryList = document.getElementById('categoryStats');
        if (!categoryList || !categoryStats) return;

        const categoryMap = {
            'kindness': '💝 Kindness',
            'hardwork': '💪 Hard Work',
            'friendship': '👥 Friendship',
            'help': '🤝 Help',
            'inspiration': '🌟 Inspiration',
            'general': '❤️ General'
        };

        categoryList.innerHTML = '';
        
        // Sort categories by count
        const sortedCategories = Object.entries(categoryStats)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 6); // Show top 6 categories

        sortedCategories.forEach(([category, count]) => {
            const item = document.createElement('div');
            item.className = 'category-item';
            item.innerHTML = `
                <span class="category-name">${categoryMap[category] || category}</span>
                <span class="category-count">${count}</span>
            `;
            categoryList.appendChild(item);
        });
    }

    // Set Default Stats
    setDefaultStats() {
        const defaultStats = {
            totalMessages: 1247,
            todayMessages: 23,
            activeUsers: 156
        };

        document.querySelectorAll('#heroTotalMessages, #totalMessages').forEach(el => {
            if (el) el.textContent = this.formatNumber(defaultStats.totalMessages);
        });
        
        document.querySelectorAll('#heroActiveUsers, #activeUsers').forEach(el => {
            if (el) el.textContent = this.formatNumber(defaultStats.activeUsers);
        });
        
        const todayEl = document.getElementById('todayMessages');
        if (todayEl) todayEl.textContent = this.formatNumber(defaultStats.todayMessages);
    }

    // Utility Functions
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    formatRelativeTime(date) {
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);
        
        if (diffInSeconds < 60) return 'Just now';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
        return `${Math.floor(diffInSeconds / 86400)} days ago`;
    }

    updateCharCounter(e) {
        const charCount = e.target.value.length;
        const charCountEl = document.getElementById('charCount');
        if (charCountEl) {
            charCountEl.textContent = charCount;
            
            // Change color based on character count
            if (charCount > 250) {
                charCountEl.style.color = '#ef4444';
            } else if (charCount > 200) {
                charCountEl.style.color = '#f59e0b';
            } else {
                charCountEl.style.color = 'var(--text-muted)';
            }
        }
    }

    resetForm() {
        const form = document.getElementById('gratitudeForm');
        if (form) {
            form.reset();
            this.updateCharCounter({ target: { value: '' } });
        }
    }

    simulateDelay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Modal Management
    showSuccessModal() {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.classList.add('show');
            document.body.style.overflow = 'hidden';
        }
    }

    closeModal() {
        const modal = document.getElementById('successModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    // Loading Management
    showLoading(text = 'Loading...') {
        const loadingOverlay = document.getElementById('loadingOverlay');
        const loadingText = document.getElementById('loadingText');
        
        if (loadingOverlay) {
            if (loadingText) loadingText.textContent = text;
            loadingOverlay.classList.add('show');
        }
    }

    hideLoading() {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.classList.remove('show');
        }
    }

    // Notification System
    setupNotifications() {
        this.notifications = [];
    }

    showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <div class="notification-icon">
                    <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
                </div>
                <div class="notification-text">${message}</div>
            </div>
        `;

        document.body.appendChild(notification);

        // Show notification
        setTimeout(() => notification.classList.add('show'), 100);

        // Auto hide after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 5000);

        this.notifications.push(notification);
        console.log(`📢 Notification: ${message} (${type})`);
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 Starting Gratitude App...');
    window.gratitudeApp = new GratitudeApp();
    console.log('✨ App initialized successfully!');
});
