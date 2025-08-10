// =============================================
// GRATITUDE - MODERN WEB APP JAVASCRIPT
// =============================================

class GratitudeApp {
    constructor() {
        this.currentTab = 'send';
        this.theme = localStorage.getItem('theme') || 'light';
        this.databaseService = null;
        this.isInitialized = false;

        this.currentMessage = null; // Store current received message
        this.rippleMode = false; // Track if user was inspired
        
        // Initialize synchronously first
        this.initSync();
        
        // Then initialize async parts
        this.initAsync();
    }

    // Synchronous initialization for immediate UI needs
    initSync() {
        console.log('🚀 Initializing Gratitude App (sync)...');
        this.applyTheme();
        this.setupEventListeners();
        this.setupNotifications();
    }

    // Asynchronous initialization for database and other async operations
    async initAsync() {
        console.log('🔄 Initializing async components...');
        
        // Initialize database service FIRST
        await this.initializeDatabase();
        
        // Test database schema for ripple columns
        await this.testRippleSchema();
        
        // Check for shared message AFTER database is ready
        const urlParams = new URLSearchParams(window.location.search);
        const shareId = urlParams.get('share');
        
        if (shareId) {
            console.log('🔗 Shared message detected:', shareId);
            await this.loadSharedMessage(shareId);
        } else {
            // Load default message only if no shared message
            this.initializeDefaultMessage();
        }
        
        // Update stats
        await this.updateStats();
        
        this.isInitialized = true;
        console.log('✅ App fully initialized!');
    }

    // Initialize Database Service
    async initializeDatabase() {
        try {
            console.log('🔌 Connecting to database...');
            this.databaseService = new DatabaseService();
            await this.databaseService.init();
            
            const status = this.databaseService.getConnectionStatus();
            console.log(`📡 Database status: ${status.message}`);
            
            // Make it globally available
            window.databaseService = this.databaseService;
            
        } catch (error) {
            console.error('❌ Database initialization failed:', error);
            this.databaseService = null;
        }
    }

    // Test if ripple columns exist in database
    async testRippleSchema() {
        if (!this.databaseService || this.databaseService.isFallbackMode()) {
            console.log('⚠️ Skipping schema test - fallback mode');
            return;
        }

        try {
            console.log('🔍 Testing ripple schema...');
            
            // Try to select ripple columns to see if they exist
            const { data, error } = await this.databaseService.supabase
                .from('gratitude_messages')
                .select('id, ripple_parent_id, ripple_depth, ripple_count, inspired_by_message_id')
                .limit(1);

            if (error) {
                console.error('❌ Ripple schema test failed:', error.message);
                if (error.message.includes('column') && error.message.includes('does not exist')) {
                    console.log('🚨 RIPPLE COLUMNS MISSING! Run add-ripple-columns.sql in Supabase');
                }
            } else {
                console.log('✅ Ripple schema test passed - columns exist');
            }
        } catch (error) {
            console.error('❌ Schema test error:', error);
        }
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

        // Inspire button
        const inspireBtn = document.getElementById('inspireBtn');
        if (inspireBtn) {
            inspireBtn.addEventListener('click', () => this.handleInspiredAction());
        }

        // Tab switching (enhanced for ripple tab)
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const tab = btn.dataset.tab;
                this.switchTab(tab);
                
                // Load ripple dashboard when switching to ripple tab
                if (tab === 'ripple') {
                    this.loadRippleDashboard();
                }
            });
        });

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

        // Only log tab switches for debugging when needed
        // console.log(`📍 Switched to ${tabName} tab`);
    }

    // Handle "This Inspired Me" button
    handleInspiredAction() {
        if (!this.currentMessage) {
            console.log('❌ No current message found for ripple');
            return;
        }

        console.log('🌊 Inspire button clicked!');
        console.log('Current message:', this.currentMessage);

        // Switch to send tab with inspiration context
        this.rippleMode = true;
        this.switchTab('send');
        
        console.log('✅ Ripple mode activated:', this.rippleMode);
        
        // Show inspiration message
        this.showNotification('✨ Write a message inspired by what you received!', 'info', 5000);
        
        // Focus on message textarea
        setTimeout(() => {
            const messageTextarea = document.getElementById('message');
            if (messageTextarea) {
                messageTextarea.focus();
                messageTextarea.placeholder = "Inspired by that beautiful message, I want to say...";
            }
        }, 500);
    }

    // Enhanced form submit with ripple tracking
    async handleFormSubmit(e) {
        e.preventDefault();
        
        const messageInput = document.getElementById('message');
        const categoryInput = document.getElementById('category');
        
        if (!messageInput.value.trim() || !categoryInput.value) {
            this.showNotification('Please fill in all fields', 'error');
            return;
        }

        this.showLoading('Sending your gratitude to the world...');

        try {
            const messageData = {
                message: messageInput.value.trim(),
                category: categoryInput.value,
                categoryLabel: this.getCategoryLabel(categoryInput.value),
                country: await this.getUserCountry(),
                // Add ripple tracking if inspired by previous message
                ...(this.rippleMode && this.currentMessage && {
                    inspiredByMessageId: this.currentMessage.id,
                    rippleParentId: this.currentMessage.ripple_parent_id || this.currentMessage.id,
                    rippleDepth: (this.currentMessage.ripple_depth || 0) + 1
                })
            };

            console.log('🚀 Submitting message data:');
            console.log('Ripple mode:', this.rippleMode);
            console.log('Current message:', this.currentMessage);
            console.log('Message data:', messageData);

            const result = await this.databaseService.saveGratitudeMessage(messageData);
            
            console.log('💾 Database save result:', result);
            
            if (result) {
                // If this was a ripple message, let's verify the parent was updated
                if (messageData.rippleParentId) {
                    console.log('🔍 Checking if parent ripple count was updated...');
                    setTimeout(async () => {
                        try {
                            const parentCheck = await this.databaseService.supabase
                                .from('gratitude_messages')
                                .select('id, ripple_count, message')
                                .eq('id', messageData.rippleParentId)
                                .single();
                            
                            if (parentCheck.data) {
                                console.log('📊 Parent message after ripple:', parentCheck.data);
                                console.log(`Ripple count for parent ${messageData.rippleParentId}: ${parentCheck.data.ripple_count}`);
                            }
                        } catch (error) {
                            console.error('❌ Error checking parent ripple count:', error);
                        }
                    }, 1000);
                }
                
                // Reset ripple mode
                this.rippleMode = false;
                this.currentMessage = null;
                
                // Reset form
                messageInput.value = '';
                messageInput.placeholder = 'Write a heartfelt message of gratitude...';
                categoryInput.value = '';
                this.updateCharCounter({ target: { value: '' } });
                
                this.hideLoading();
                this.showSuccessModal();
                await this.updateStats();
                
                // Show ripple effect notification if was inspired
                if (messageData.inspiredByMessageId) {
                    setTimeout(() => {
                        this.showNotification('🌊 Your message created a ripple effect!', 'success', 4000);
                    }, 2000);
                }
            } else {
                throw new Error('Failed to save message');
            }
        } catch (error) {
            this.hideLoading();
            this.showNotification('Failed to send message. Please try again.', 'error');
            console.error('Error sending message:', error);
        }
    }

    // Get New Message
    async getNewMessage() {
        this.showLoading('Finding a beautiful message for you... 💝');

        try {
            let message = null;
            
            // Try to get message from database service
            if (this.databaseService) {
                message = await this.databaseService.getRandomGratitudeMessage();
                console.log('📨 Received message from database:', message);
            }
            
            // Fallback: use sample messages
            if (!message) {
                message = this.getSampleMessage();
                console.log('📨 Using fallback sample message');
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
                timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
                country: 'United States'
            },
            {
                category: 'inspiration',
                message: "Watching you pursue your dreams with such dedication inspires me to never give up on mine. You're amazing!",
                timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
                country: 'Japan'
            },
            {
                category: 'help',
                message: "The way you helped me when I needed it most showed me what true friendship looks like. Forever grateful!",
                timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
                country: 'United Kingdom'
            },
            {
                category: 'hardwork',
                message: "Your dedication and hard work doesn't go unnoticed. You're making a real difference in this world!",
                timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
                country: 'Germany'
            },
            {
                category: 'friendship',
                message: "Having you as a friend makes life so much more beautiful. Thank you for always being there!",
                timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
                country: 'Australia'
            },
            {
                category: 'general',
                message: "Just wanted to remind you that you matter, you're loved, and you make this world a better place by existing!",
                timestamp: new Date(Date.now() - Math.random() * 86400000).toISOString(),
                country: 'Canada'
            }
        ];

        return sampleMessages[Math.floor(Math.random() * sampleMessages.length)];
    }

    // Get Category Label
    getCategoryLabel(category) {
        const categoryLabels = {
            'kindness': 'Atas Kebaikan Hati',
            'hardwork': 'Atas Kerja Keras', 
            'friendship': 'Atas Persahabatan',
            'help': 'Atas Bantuan',
            'inspiration': 'Atas Inspirasi',
            'general': 'Secara Umum'
        };
        return categoryLabels[category] || 'Secara Umum';
    }

    // Get User Country (simplified version)
    async getUserCountry() {
        try {
            // Try to get country from IP geolocation API
            const response = await fetch('https://ipapi.co/json/');
            if (response.ok) {
                const data = await response.json();
                return data.country_name || 'Unknown';
            }
        } catch (error) {
            console.log('Could not get country from API, using fallback');
        }
        
        // Fallback to browser locale
        try {
            const locale = navigator.language || navigator.userLanguage;
            if (locale.includes('-')) {
                const countryCode = locale.split('-')[1].toUpperCase();
                const countryMap = {
                    'ID': 'Indonesia',
                    'US': 'United States',
                    'GB': 'United Kingdom',
                    'AU': 'Australia',
                    'CA': 'Canada',
                    'DE': 'Germany',
                    'FR': 'France',
                    'JP': 'Japan',
                    'KR': 'South Korea',
                    'CN': 'China',
                    'IN': 'India',
                    'BR': 'Brazil',
                    'MX': 'Mexico',
                    'IT': 'Italy',
                    'ES': 'Spain',
                    'NL': 'Netherlands',
                    'SE': 'Sweden',
                    'NO': 'Norway',
                    'DK': 'Denmark',
                    'FI': 'Finland'
                };
                return countryMap[countryCode] || 'Unknown';
            }
        } catch (error) {
            console.log('Could not get country from locale');
        }
        
        // Final fallback
        return 'Unknown';
    }

    // Initialize Default Message
    initializeDefaultMessage() {
        const defaultMessage = {
            category: 'general',
            message: "Welcome to Gratitude! Click 'Get New Message' to receive a heartfelt message from someone around the world. You're about to brighten your day! ✨",
            timestamp: new Date().toISOString(),
            country: 'Global Community'
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
                let locationText = 'From somewhere in the world';
                
                // Use country from database if available
                if (message.country && message.country !== 'Unknown') {
                    locationText = `From someone in ${message.country}`;
                } else {
                    // Fallback to random locations only if no country data
                    const locations = [
                        'someone in New York', 'someone in Tokyo', 'someone in London',
                        'someone in Paris', 'someone in Sydney', 'someone in Mumbai',
                        'someone in São Paulo', 'someone in Cairo', 'someone in Moscow',
                        'someone in Seoul', 'someone in Mexico City', 'someone in Berlin',
                        'someone in Amsterdam', 'someone in Barcelona', 'someone in Singapore'
                    ];
                    locationText = `From ${locations[Math.floor(Math.random() * locations.length)]}`;
                }
                
                locationEl.textContent = locationText;
            }

            // Store current message for sharing
            this.currentMessage = message;
            
            // Show share button
            this.updateShareButton();

            // Show inspire button
            const inspireBtn = document.getElementById('inspireBtn');
            if (inspireBtn) {
                inspireBtn.style.display = 'inline-flex';
            }

            console.log('💌 Message displayed successfully');
        }
    }

    // Load ripple dashboard
    async loadRippleDashboard() {
        try {
            const [topRipples, rippleStats] = await Promise.all([
                this.databaseService.getTopRippleMessages(5),
                this.databaseService.getRippleStats()
            ]);

            this.displayTopRippleMessages(topRipples);
            this.updateRippleStats(rippleStats);

        } catch (error) {
            console.error('Error loading ripple dashboard:', error);
            this.displayFallbackRippleData();
        }
    }

    // Display top ripple messages
    displayTopRippleMessages(messages) {
        const container = document.getElementById('topRippleMessages');
        if (!container) return;

        container.innerHTML = messages.map((message, index) => `
            <div class="ripple-message-card" data-ripples="${message.ripple_count}">
                <div class="ripple-rank">#${index + 1}</div>
                <div class="ripple-message-content">
                    <div class="ripple-category">${this.getCategoryLabel(message.category)}</div>
                    <blockquote class="ripple-text">${message.message}</blockquote>
                    <div class="ripple-impact">
                        <span class="ripple-count">
                            <i class="fas fa-water"></i>
                            ${message.ripple_count} ripples
                        </span>
                        <span class="ripple-time">${this.formatRelativeTime(new Date(message.created_at))}</span>
                    </div>
                </div>
                <div class="ripple-waves">
                    ${Array.from({length: Math.min(message.ripple_count, 5)}, () => '<div class="wave"></div>').join('')}
                </div>
            </div>
        `).join('');
    }

    // Update ripple statistics display
    updateRippleStats(stats) {
        const totalRipplesEl = document.getElementById('totalRipples');
        const myRipplesEl = document.getElementById('myRipples');

        if (totalRipplesEl) {
            totalRipplesEl.textContent = stats.totalRipples || 0;
        }

        if (myRipplesEl) {
            // For now, show messages with ripples count
            // In a real app, this would be user-specific
            myRipplesEl.textContent = stats.messagesWithRipples || 0;
        }
    }

    // Display fallback ripple data when database fails
    displayFallbackRippleData() {
        this.displayTopRippleMessages([
            { 
                id: 1, 
                message: "Thank you for being so kind...", 
                category: "kindness", 
                ripple_count: 12, 
                created_at: new Date().toISOString() 
            },
            { 
                id: 2, 
                message: "Your hard work inspires me...", 
                category: "hardwork", 
                ripple_count: 8, 
                created_at: new Date().toISOString() 
            }
        ]);

        this.updateRippleStats({
            totalRipples: 45,
            messagesWithRipples: 8
        });
    }

    // Update Share Button
    updateShareButton() {
        const shareBtn = document.getElementById('shareMessageBtn');
        if (shareBtn && this.currentMessage) {
            shareBtn.style.display = 'inline-flex';
            shareBtn.onclick = () => this.shareMessage(this.currentMessage);
        }
    }

    // Share Message Function
    async shareMessage(message) {
        try {
            // Generate unique share ID
            const shareId = this.generateShareId();
            
            // Create shareable message data
            const shareData = {
                id: shareId,
                category: message.category,
                message: message.message,
                timestamp: message.timestamp,
                country: message.country || 'Unknown',
                createdAt: new Date().toISOString()
            };

            // Save to localStorage for demo (in production, save to database)
            const sharedMessages = JSON.parse(localStorage.getItem('sharedMessages') || '{}');
            sharedMessages[shareId] = shareData;
            localStorage.setItem('sharedMessages', JSON.stringify(sharedMessages));

            // Generate share URL with proper protocol
            const baseUrl = window.location.href.split('?')[0]; // Remove existing params
            const shareUrl = `${baseUrl}?share=${shareId}`;

            console.log('🔗 Generated share URL:', shareUrl);
            console.log('💾 Saved to localStorage:', shareData);

            // Show share modal
            this.showShareModal(shareUrl, message);
            
            this.showNotification('Share link generated! 🔗', 'success');
            console.log('🔗 Message shared with ID:', shareId);
            
        } catch (error) {
            console.error('❌ Error sharing message:', error);
            this.showNotification('Failed to generate share link. Please try again! 🔧', 'error');
        }
    }

    // Generate unique share ID
    generateShareId() {
        return 'share_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Show Share Modal
    showShareModal(shareUrl, message) {
        // Create share modal if it doesn't exist
        if (!document.getElementById('shareModal')) {
            this.createShareModal();
        }

        const modal = document.getElementById('shareModal');
        const urlInput = document.getElementById('shareUrl');
        const messagePreview = document.getElementById('shareMessagePreview');
        const categoryPreview = document.getElementById('shareCategoryPreview');

        if (urlInput) urlInput.value = shareUrl;
        if (messagePreview) messagePreview.textContent = message.message;
        if (categoryPreview) {
            const categoryMap = {
                'kindness': '💝 Kindness & Compassion',
                'hardwork': '💪 Hard Work & Dedication', 
                'friendship': '👥 Friendship & Support',
                'help': '🤝 Help & Assistance',
                'inspiration': '🌟 Inspiration & Motivation',
                'general': '❤️ General Appreciation'
            };
            categoryPreview.textContent = categoryMap[message.category] || '❤️ General Appreciation';
        }

        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }

    // Create Share Modal
    createShareModal() {
        const modalHtml = `
            <div id="shareModal" class="modal">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3><i class="fas fa-share-alt"></i> Share This Message</h3>
                        <button class="modal-close" id="shareModalClose">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                    <div class="modal-body">
                        <div class="share-preview">
                            <div class="share-preview-header">
                                <i class="fas fa-eye"></i> Preview
                            </div>
                            <div class="message-card">
                                <div class="message-category" id="shareCategoryPreview">💝 Kindness & Compassion</div>
                                <div class="message-content" id="shareMessagePreview">Your message preview will appear here...</div>
                            </div>
                        </div>
                        
                        <div class="share-url-section">
                            <label for="shareUrl">Share this link:</label>
                            <div class="url-input-group">
                                <input type="text" id="shareUrl" readonly>
                                <button id="copyUrlBtn" class="btn-copy">
                                    <i class="fas fa-copy"></i> Copy
                                </button>
                            </div>
                        </div>
                        
                        <div class="share-options">
                            <button id="shareWhatsappBtn" class="share-btn whatsapp">
                                <i class="fab fa-whatsapp"></i> WhatsApp
                            </button>
                            <button id="shareTwitterBtn" class="share-btn twitter">
                                <i class="fab fa-twitter"></i> Twitter
                            </button>
                            <button id="shareFacebookBtn" class="share-btn facebook">
                                <i class="fab fa-facebook"></i> Facebook
                            </button>
                            <button id="shareEmailBtn" class="share-btn email">
                                <i class="fas fa-envelope"></i> Email
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHtml);

        // Add event listeners
        document.getElementById('shareModalClose').addEventListener('click', () => this.closeShareModal());
        document.getElementById('copyUrlBtn').addEventListener('click', () => this.copyShareUrl());
        document.getElementById('shareWhatsappBtn').addEventListener('click', () => this.shareToWhatsApp());
        document.getElementById('shareTwitterBtn').addEventListener('click', () => this.shareToTwitter());
        document.getElementById('shareFacebookBtn').addEventListener('click', () => this.shareToFacebook());
        document.getElementById('shareEmailBtn').addEventListener('click', () => this.shareToEmail());

        // Close modal on overlay click
        document.getElementById('shareModal').addEventListener('click', (e) => {
            if (e.target.id === 'shareModal') {
                this.closeShareModal();
            }
        });
    }

    // Close Share Modal
    closeShareModal() {
        const modal = document.getElementById('shareModal');
        if (modal) {
            modal.classList.remove('show');
            document.body.style.overflow = '';
        }
    }

    // Copy Share URL
    async copyShareUrl() {
        const urlInput = document.getElementById('shareUrl');
        if (urlInput) {
            try {
                await navigator.clipboard.writeText(urlInput.value);
                this.showNotification('Link copied to clipboard! 📋', 'success');
                
                // Update button text temporarily
                const copyBtn = document.getElementById('copyUrlBtn');
                const originalText = copyBtn.innerHTML;
                copyBtn.innerHTML = '<i class="fas fa-check"></i> Copied!';
                copyBtn.classList.add('copied');
                
                setTimeout(() => {
                    copyBtn.innerHTML = originalText;
                    copyBtn.classList.remove('copied');
                }, 2000);
                
            } catch (error) {
                // Fallback for older browsers
                urlInput.select();
                document.execCommand('copy');
                this.showNotification('Link copied! 📋', 'success');
            }
        }
    }

    // Share to WhatsApp
    shareToWhatsApp() {
        const url = document.getElementById('shareUrl').value;
        const message = encodeURIComponent(`Check out this beautiful gratitude message: ${url}`);
        window.open(`https://wa.me/?text=${message}`, '_blank');
    }

    // Share to Twitter
    shareToTwitter() {
        const url = document.getElementById('shareUrl').value;
        const text = encodeURIComponent('Someone shared a beautiful gratitude message with you! ✨');
        window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(url)}`, '_blank');
    }

    // Share to Facebook
    shareToFacebook() {
        const url = document.getElementById('shareUrl').value;
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
    }

    // Share to Email
    shareToEmail() {
        const url = document.getElementById('shareUrl').value;
        const subject = encodeURIComponent('A Beautiful Gratitude Message for You');
        const body = encodeURIComponent(`Someone shared a heartfelt gratitude message with you!\n\nOpen this link to read it: ${url}\n\nSpread kindness and gratitude! ✨`);
        window.open(`mailto:?subject=${subject}&body=${body}`, '_blank');
    }

    // Check for shared message on load
    checkForSharedMessage() {
        const urlParams = new URLSearchParams(window.location.search);
        const shareId = urlParams.get('share');
        
        if (shareId) {
            console.log('🔗 Share parameter detected:', shareId);
            return shareId;
        }
        return null;
    }

    // Load shared message
    async loadSharedMessage(shareId) {
        try {
            console.log('🔗 Loading shared message:', shareId);
            
            let sharedMessage = null;
            
            // Try to get from database first if connected
            if (this.databaseService && !this.databaseService.isFallbackMode()) {
                // In production, you'd have a shared_messages table
                // For now, we'll use localStorage as fallback
                console.log('📡 Database connected, but shared messages not implemented in DB yet');
            }
            
            // Get from localStorage
            const sharedMessages = JSON.parse(localStorage.getItem('sharedMessages') || '{}');
            sharedMessage = sharedMessages[shareId];
            
            if (sharedMessage) {
                console.log('📨 Found shared message:', sharedMessage);
                
                // Switch to receive tab
                this.switchTab('receive');
                
                // Display the shared message
                this.displayMessage(sharedMessage);
                
                // Show notification
                this.showNotification('Shared message loaded! 💝', 'success');
                
                // Clean URL after a delay to ensure message is loaded
                setTimeout(() => {
                    const newUrl = window.location.protocol + "//" + window.location.host + window.location.pathname;
                    window.history.replaceState({path: newUrl}, '', newUrl);
                    console.log('🧹 URL cleaned');
                }, 2000);
                
                return true;
            } else {
                this.showNotification('Shared message not found or expired! 😔', 'error');
                return false;
            }
        } catch (error) {
            console.error('❌ Error loading shared message:', error);
            this.showNotification('Failed to load shared message! 🔧', 'error');
            return false;
        }
    }

    // Update Statistics
    async updateStats() {
        try {
            let stats = null;
            
            // Try to get stats from database service
            if (this.databaseService) {
                stats = await this.databaseService.getAppStats();
                console.log('📊 Stats from database:', stats);
            }
            
            // Fallback stats
            if (!stats) {
                stats = this.generateSampleStats();
                console.log('📊 Using fallback stats');
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

            // Update footer stats
            const footerTotalEl = document.getElementById('footerTotalMessages');
            const footerActiveEl = document.getElementById('footerActiveUsers');
            
            if (footerTotalEl) footerTotalEl.textContent = this.formatNumber(stats.totalMessages);
            if (footerActiveEl) footerActiveEl.textContent = this.formatNumber(stats.activeUsers);

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

        document.querySelectorAll('#heroTotalMessages, #totalMessages, #footerTotalMessages').forEach(el => {
            if (el) el.textContent = this.formatNumber(defaultStats.totalMessages);
        });
        
        document.querySelectorAll('#heroActiveUsers, #activeUsers, #footerActiveUsers').forEach(el => {
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
    console.log('✨ App base initialized successfully!');
});