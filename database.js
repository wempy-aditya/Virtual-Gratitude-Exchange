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

    // Save gratitude message with ripple tracking
    async saveGratitudeMessage(messageData) {
        console.log('💾 Database saveGratitudeMessage called with:', messageData);
        
        if (this.isFallbackMode()) {
            console.log('📱 Running in fallback mode');
            return this.saveToLocalStorage(messageData);
        }

        try {
            // Enhanced message data with ripple tracking
            const enhancedData = {
                message: messageData.message,
                category: messageData.category,
                category_label: messageData.categoryLabel,
                country: messageData.country || 'Unknown',
                ripple_parent_id: messageData.rippleParentId || null,
                ripple_depth: messageData.rippleDepth || 0,
                inspired_by_message_id: messageData.inspiredByMessageId || null
            };

            console.log('📝 Enhanced data for database:', enhancedData);

            const { data, error } = await this.supabase
                .from('gratitude_messages')
                .insert([enhancedData])
                .select()
                .single();

            if (error) {
                console.error('❌ Database insert error:', error);
                throw error;
            }

            console.log('✅ Message saved with ripple tracking:', data);
            
            // FALLBACK: Manual ripple count update if trigger doesn't work
            if (enhancedData.ripple_parent_id) {
                console.log('🔄 Manual ripple count update for parent:', enhancedData.ripple_parent_id);
                setTimeout(async () => {
                    try {
                        // First check if parent count was already updated by trigger
                        const { data: checkData } = await this.supabase
                            .from('gratitude_messages')
                            .select('ripple_count')
                            .eq('id', enhancedData.ripple_parent_id)
                            .single();
                        
                        console.log('📊 Parent ripple count after trigger:', checkData?.ripple_count);
                        
                        // If trigger worked (count > 0), skip manual update
                        if (checkData && checkData.ripple_count > 0) {
                            console.log('✅ Trigger worked! Skipping manual update.');
                            return;
                        }
                        
                        console.log('🔧 Trigger might not have worked, trying manual update...');
                        
                        // Try RPC function first
                        const { data: rpcResult, error: rpcError } = await this.supabase
                            .rpc('increment_ripple_count', { 
                                parent_id: enhancedData.ripple_parent_id 
                            });
                        
                        if (rpcError) {
                            console.log('RPC failed, trying direct SQL update...');
                            
                            // Direct UPDATE with proper syntax
                            const { data: directUpdate, error: directError } = await this.supabase
                                .from('gratitude_messages')
                                .update({ 
                                    ripple_count: 1  // Simple increment for now
                                })
                                .eq('id', enhancedData.ripple_parent_id)
                                .eq('ripple_count', 0); // Only update if still 0
                            
                            if (directError) {
                                console.error('❌ Manual UPDATE also failed:', directError);
                            } else {
                                console.log('✅ Manual UPDATE successful');
                            }
                        } else {
                            console.log('✅ RPC increment successful');
                        }
                    } catch (manualError) {
                        console.error('❌ Manual ripple update failed:', manualError);
                    }
                }, 500);
            }
            
            return data;

        } catch (error) {
            console.error('❌ Error saving message:', error);
            console.log('🔄 Falling back to localStorage');
            return this.saveToLocalStorage(messageData);
        }
    }

    // Get ripple chain for a message
    async getRippleChain(messageId) {
        if (this.isFallbackMode()) {
            return this.getFallbackRippleChain(messageId);
        }

        try {
            const { data, error } = await this.supabase
                .from('gratitude_messages')
                .select(`
                    id,
                    message,
                    category,
                    ripple_count,
                    ripple_depth,
                    created_at,
                    country,
                    ripple_parent_id
                `)
                .or(`id.eq.${messageId},ripple_parent_id.eq.${messageId}`)
                .order('created_at', { ascending: true });

            if (error) throw error;

            return this.buildRippleTree(data, messageId);

        } catch (error) {
            console.error('❌ Error fetching ripple chain:', error);
            return this.getFallbackRippleChain(messageId);
        }
    }

    // Build ripple tree structure
    buildRippleTree(messages, rootId) {
        const messageMap = new Map();
        const rootMessage = messages.find(m => m.id == rootId);
        
        if (!rootMessage) return null;

        // Build the tree structure
        const tree = {
            ...rootMessage,
            children: [],
            ripples: []
        };

        // Find all ripples (children) of this message
        const ripples = messages.filter(m => m.ripple_parent_id == rootId);
        tree.ripples = ripples;
        tree.totalRipples = rootMessage.ripple_count || 0;

        return tree;
    }

    // Get top ripple messages (most inspiring)
    async getTopRippleMessages(limit = 10) {
        if (this.isFallbackMode()) {
            return this.getFallbackTopRipples(limit);
        }

        try {
            const { data, error } = await this.supabase
                .from('ripple_analytics')
                .select('*')
                .gte('ripple_count', 1)
                .order('ripple_count', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data;

        } catch (error) {
            console.error('❌ Error fetching top ripples:', error);
            return this.getFallbackTopRipples(limit);
        }
    }

    // Get ripple statistics
    async getRippleStats() {
        if (this.isFallbackMode()) {
            return this.getFallbackRippleStats();
        }

        try {
            const { data, error } = await this.supabase
                .from('gratitude_messages')
                .select('ripple_count, ripple_depth')
                .gte('ripple_count', 0);

            if (error) throw error;

            const totalRipples = data.reduce((sum, msg) => sum + (msg.ripple_count || 0), 0);
            const messagesWithRipples = data.filter(msg => msg.ripple_count > 0).length;
            const maxRippleDepth = Math.max(...data.map(msg => msg.ripple_depth || 0));

            return {
                totalRipples,
                messagesWithRipples,
                maxRippleDepth,
                averageRipples: messagesWithRipples > 0 ? (totalRipples / messagesWithRipples).toFixed(1) : 0
            };

        } catch (error) {
            console.error('❌ Error fetching ripple stats:', error);
            return this.getFallbackRippleStats();
        }
    }

    // Fallback methods for demo mode
    getFallbackRippleChain(messageId) {
        return {
            id: messageId,
            message: "This kindness inspired others to spread more love!",
            ripple_count: Math.floor(Math.random() * 50) + 5,
            ripples: [
                { id: 'r1', message: "Inspired by your message, I helped a stranger today", country: "Japan" },
                { id: 'r2', message: "Your words motivated me to appreciate my team more", country: "Germany" }
            ]
        };
    }

    getFallbackTopRipples(limit) {
        return [
            { id: 1, message: "Thank you for being kind to everyone around you...", ripple_count: 47, category: "kindness", created_at: new Date().toISOString() },
            { id: 2, message: "Your hard work inspires me to do better...", ripple_count: 32, category: "hardwork", created_at: new Date().toISOString() },
            { id: 3, message: "Grateful for friends like you who never give up...", ripple_count: 28, category: "friendship", created_at: new Date().toISOString() }
        ].slice(0, limit);
    }

    getFallbackRippleStats() {
        return {
            totalRipples: 157,
            messagesWithRipples: 23,
            maxRippleDepth: 4,
            averageRipples: 6.8
        };
    }
}

// Export for use in main application
window.DatabaseService = DatabaseService;
