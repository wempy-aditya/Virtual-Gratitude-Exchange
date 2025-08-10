// Database Service for Supabase Integration
class DatabaseService {
    constructor() {
        this.supabase = null;
        this.isConnected = false;
        this.fallbackMode = false;
        this.init();
    }

    // Initialize Supabase connection
    async init() {
        try {
            // Check if Supabase configuration is valid
            if (!window.SUPABASE_CONFIG || 
                window.SUPABASE_CONFIG.url === 'YOUR_SUPABASE_URL' || 
                window.SUPABASE_CONFIG.apiKey === 'YOUR_SUPABASE_ANON_KEY' ||
                window.SUPABASE_CONFIG.url === 'DEMO_MODE' || 
                window.SUPABASE_CONFIG.apiKey === 'DEMO_MODE') {
                console.warn('Supabase not configured. Running in fallback mode.');
                this.fallbackMode = true;
                return;
            }

            // Initialize Supabase client
            this.supabase = supabase.createClient(
                window.SUPABASE_CONFIG.url,
                window.SUPABASE_CONFIG.apiKey
            );

            // Test connection
            await this.testConnection();
            this.isConnected = true;
            console.log('✅ Connected to Supabase database');
        } catch (error) {
            console.error('❌ Failed to connect to Supabase:', error);
            this.fallbackMode = true;
        }
    }

    // Test database connection
    async testConnection() {
        if (this.fallbackMode) return false;
        
        try {
            const { data, error } = await this.supabase
                .from('gratitude_messages')
                .select('id')
                .limit(1);
            
            if (error) throw error;
            return true;
        } catch (error) {
            throw new Error('Database connection test failed');
        }
    }

    // Save gratitude message to database
    async saveGratitudeMessage(messageData) {
        if (this.fallbackMode) {
            return this.fallbackSaveMessage(messageData);
        }

        try {
            const { data, error } = await this.supabase
                .from('gratitude_messages')
                .insert([{
                    message: messageData.message,
                    category: messageData.category,
                    category_label: messageData.categoryLabel,
                    country: await this.getUserCountry()
                }])
                .select();

            if (error) throw error;

            // Update statistics
            await this.updateStats();
            
            return data[0];
        } catch (error) {
            console.error('Error saving message:', error);
            return this.fallbackSaveMessage(messageData);
        }
    }

    // Get random gratitude message from database
    async getRandomGratitudeMessage() {
        if (this.fallbackMode) {
            return this.fallbackGetRandomMessage();
        }

        try {
            // Get total count first
            const { count } = await this.supabase
                .from('gratitude_messages')
                .select('*', { count: 'exact', head: true });

            if (count === 0) {
                return this.fallbackGetRandomMessage();
            }

            // Get random offset
            const randomOffset = Math.floor(Math.random() * count);

            const { data, error } = await this.supabase
                .from('gratitude_messages')
                .select('*')
                .range(randomOffset, randomOffset)
                .limit(1);

            if (error) throw error;

            if (data && data.length > 0) {
                const message = data[0];
                return {
                    id: message.id,
                    message: message.message,
                    category: message.category,
                    categoryLabel: message.category_label,
                    timestamp: message.created_at,
                    country: message.country || 'Unknown'
                };
            } else {
                return this.fallbackGetRandomMessage();
            }
        } catch (error) {
            console.error('Error fetching random message:', error);
            return this.fallbackGetRandomMessage();
        }
    }

    // Get application statistics
    async getAppStats() {
        if (this.fallbackMode) {
            return this.fallbackGetStats();
        }

        try {
            // Get total messages count
            const { count: totalMessages } = await this.supabase
                .from('gratitude_messages')
                .select('*', { count: 'exact', head: true });

            // Get today's messages count
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const { count: todayMessages } = await this.supabase
                .from('gratitude_messages')
                .select('*', { count: 'exact', head: true })
                .gte('created_at', today.toISOString());

            // Get category statistics
            const { data: categoryData } = await this.supabase
                .from('gratitude_messages')
                .select('category')
                .order('created_at', { ascending: false });

            const categoryStats = {};
            if (categoryData) {
                categoryData.forEach(item => {
                    categoryStats[item.category] = (categoryStats[item.category] || 0) + 1;
                });
            }

            // Simulate active users (in real app, you'd track this properly)
            const activeUsers = Math.floor(totalMessages * 0.1) + Math.floor(Math.random() * 20);

            return {
                totalMessages: totalMessages || 0,
                todayMessages: todayMessages || 0,
                activeUsers: activeUsers,
                categoryStats: categoryStats
            };
        } catch (error) {
            console.error('Error fetching stats:', error);
            return this.fallbackGetStats();
        }
    }

    // Update global statistics
    async updateStats() {
        if (this.fallbackMode) return;

        try {
            const stats = await this.getAppStats();
            
            const { error } = await this.supabase
                .from('app_stats')
                .upsert({
                    id: 1,
                    total_messages: stats.totalMessages,
                    active_users: stats.activeUsers,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
        } catch (error) {
            console.error('Error updating stats:', error);
        }
    }

    // Get user's country (for geographic diversity)
    async getUserCountry() {
        try {
            const response = await fetch('https://ipapi.co/json/');
            const data = await response.json();
            return data.country_name || 'Unknown';
        } catch (error) {
            return 'Unknown';
        }
    }

    // Fallback methods when database is not available
    fallbackSaveMessage(messageData) {
        const messages = JSON.parse(localStorage.getItem('gratitudeMessages') || '[]');
        const newMessage = {
            ...messageData,
            id: Date.now(),
            timestamp: new Date().toISOString()
        };
        messages.push(newMessage);
        localStorage.setItem('gratitudeMessages', JSON.stringify(messages));
        return newMessage;
    }

    fallbackGetRandomMessage() {
        const messages = JSON.parse(localStorage.getItem('gratitudeMessages') || '[]');
        
        // Default messages if none exist
        if (messages.length === 0) {
            const defaultMessages = [
                {
                    id: 1,
                    category: 'kindness',
                    message: 'Terima kasih telah selalu menyebarkan kebaikan di sekitar Anda. Dunia menjadi tempat yang lebih baik karena Anda.',
                    timestamp: new Date().toISOString(),
                    categoryLabel: 'Atas Kebaikan Hati',
                    country: 'Indonesia'
                },
                {
                    id: 2,
                    category: 'hardwork',
                    message: 'Kerja keras dan dedikasi Anda sangat menginspirasi. Teruslah berjuang, hasil yang luar biasa menanti!',
                    timestamp: new Date().toISOString(),
                    categoryLabel: 'Atas Kerja Keras',
                    country: 'Malaysia'
                },
                {
                    id: 3,
                    category: 'friendship',
                    message: 'Persahabatan seperti Anda adalah hadiah yang sangat berharga. Terima kasih telah menjadi teman yang luar biasa.',
                    timestamp: new Date().toISOString(),
                    categoryLabel: 'Atas Persahabatan',
                    country: 'Singapore'
                },
                {
                    id: 4,
                    category: 'help',
                    message: 'Bantuan yang Anda berikan sangat berarti. Anda telah membuat perbedaan besar dalam hidup seseorang.',
                    timestamp: new Date().toISOString(),
                    categoryLabel: 'Atas Bantuan',
                    country: 'Thailand'
                },
                {
                    id: 5,
                    category: 'inspiration',
                    message: 'Anda adalah sumber inspirasi bagi banyak orang. Teruslah bersinar dan menginspirasi dunia!',
                    timestamp: new Date().toISOString(),
                    categoryLabel: 'Atas Inspirasi',
                    country: 'Philippines'
                }
            ];
            return defaultMessages[Math.floor(Math.random() * defaultMessages.length)];
        }

        return messages[Math.floor(Math.random() * messages.length)];
    }

    fallbackGetStats() {
        const messages = JSON.parse(localStorage.getItem('gratitudeMessages') || '[]');
        const stats = JSON.parse(localStorage.getItem('gratitudeStats') || '{}');
        
        return {
            totalMessages: messages.length + 1247,
            todayMessages: Math.floor(Math.random() * 10) + 5,
            activeUsers: 150 + Math.floor(Math.random() * 20),
            categoryStats: stats.categoryStats || {
                kindness: 245,
                hardwork: 189,
                friendship: 156,
                help: 203,
                inspiration: 178,
                general: 276
            }
        };
    }

    // Real-time subscription for new messages (Supabase feature)
    subscribeToNewMessages(callback) {
        if (this.fallbackMode || !this.supabase) return null;

        try {
            const subscription = this.supabase
                .channel('gratitude_messages')
                .on('postgres_changes', 
                    { event: 'INSERT', schema: 'public', table: 'gratitude_messages' },
                    (payload) => {
                        callback(payload.new);
                    }
                )
                .subscribe();

            return subscription;
        } catch (error) {
            console.error('Error setting up real-time subscription:', error);
            return null;
        }
    }

    // Unsubscribe from real-time updates
    unsubscribe(subscription) {
        if (subscription && this.supabase) {
            this.supabase.removeChannel(subscription);
        }
    }

    // Check if running in fallback mode
    isFallbackMode() {
        return this.fallbackMode;
    }

    // Get connection status
    getConnectionStatus() {
        if (this.fallbackMode) {
            return { status: 'fallback', message: 'Using local storage (demo mode)' };
        } else if (this.isConnected) {
            return { status: 'connected', message: 'Connected to Supabase database' };
        } else {
            return { status: 'connecting', message: 'Connecting to database...' };
        }
    }
}

// Export for use in main application
window.DatabaseService = DatabaseService;
