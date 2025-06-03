// =============================================================================
// APPROVIDEO LEARNING HUB - COMPLETE INTEGRATION FUNCTIONS
// Connecting Content Manager ↔ Learning Hub ↔ Parse Server
// =============================================================================

// 1. REAL-TIME DATA SYNC FUNCTIONS
// =============================================================================

class RealTimeSync {
    constructor(parseStore) {
        this.parseStore = parseStore;
        this.liveQueries = new Map();
        this.subscribers = new Map();
        this.isConnected = false;
    }

    // Initialize real-time connections
    async initializeLiveQueries() {
        try {
            // Set up live queries for each content type
            const queries = {
                areas: new Parse.Query('Area'),
                subcategories: new Parse.Query('Subcategory').include('area'),
                videos: new Parse.Query('Video'),
                tags: new Parse.Query('Tag'),
                languages: new Parse.Query('Language')
            };

            for (const [type, query] of Object.entries(queries)) {
                const subscription = await query.subscribe();
                
                // Handle real-time updates
                subscription.on('create', (object) => this.handleCreate(type, object));
                subscription.on('update', (object) => this.handleUpdate(type, object));
                subscription.on('delete', (object) => this.handleDelete(type, object));
                subscription.on('enter', (object) => this.handleEnter(type, object));
                subscription.on('leave', (object) => this.handleLeave(type, object));

                this.liveQueries.set(type, subscription);
            }

            this.isConnected = true;
            this.notifySubscribers('connection', { status: 'connected' });
            console.log('✅ Real-time sync initialized');
        } catch (error) {
            console.error('❌ Real-time sync failed:', error);
            this.isConnected = false;
        }
    }

    // Handle real-time data changes
    handleCreate(type, object) {
        const data = this.parseObjectToData(type, object);
        this.parseStore.handleRealTimeCreate(type, data);
        this.notifySubscribers(`${type}:create`, data);
    }

    handleUpdate(type, object) {
        const data = this.parseObjectToData(type, object);
        this.parseStore.handleRealTimeUpdate(type, data);
        this.notifySubscribers(`${type}:update`, data);
    }

    handleDelete(type, object) {
        this.parseStore.handleRealTimeDelete(type, object.id);
        this.notifySubscribers(`${type}:delete`, { id: object.id });
    }

    // Convert Parse object to data format
    parseObjectToData(type, object) {
        const baseData = {
            id: object.id,
            createdAt: object.createdAt,
            updatedAt: object.updatedAt
        };

        switch (type) {
            case 'areas':
                return {
                    ...baseData,
                    area: object.get('area'),
                    icon: object.get('icon'),
                    description: object.get('description'),
                    subcategories: []
                };
            case 'subcategories':
                return {
                    ...baseData,
                    title: object.get('title'),
                    materials: object.get('materials'),
                    processSteps: object.get('processSteps'),
                    areaId: object.get('area')?.id,
                    subtitle: object.get('subtitle'),
                    context: object.get('context'),
                    videos: []
                };
            case 'videos':
                return {
                    ...baseData,
                    title: object.get('title'),
                    youtubeId: object.get('youtubeId'),
                    description: object.get('description'),
                    categories: object.get('categories') || [],
                    tags: object.get('tags') || [],
                    rating: object.get('rating') || 0,
                    views: object.get('views') || 0,
                    duration: object.get('duration'),
                    creator: object.get('creator'),
                    date: object.get('date') || object.createdAt
                };
            case 'tags':
                return {
                    ...baseData,
                    name: object.get('name'),
                    definition: object.get('definition'),
                    color: object.get('color')
                };
            case 'languages':
                return {
                    ...baseData,
                    name: object.get('name'),
                    code: object.get('code'),
                    nativeName: object.get('nativeName'),
                    direction: object.get('direction')
                };
            default:
                return baseData;
        }
    }

    // Subscribe to real-time updates
    subscribe(event, callback) {
        if (!this.subscribers.has(event)) {
            this.subscribers.set(event, []);
        }
        this.subscribers.get(event).push(callback);
    }

    // Notify subscribers of updates
    notifySubscribers(event, data) {
        if (this.subscribers.has(event)) {
            this.subscribers.get(event).forEach(callback => callback(data));
        }
    }

    // Cleanup
    disconnect() {
        for (const [type, subscription] of this.liveQueries) {
            subscription.unsubscribe();
        }
        this.liveQueries.clear();
        this.subscribers.clear();
        this.isConnected = false;
    }
}

// 2. FRONTEND DATA INTEGRATION FUNCTIONS
// =============================================================================

class FrontendDataManager {
    constructor() {
        this.cache = new Map();
        this.lastSync = null;
        this.syncInProgress = false;
    }

    // Initialize Parse connection for frontend
    async initializeParse() {
        Parse.initialize(
            'JfMeozLs8UZFxaZibAiZhlpDl5OZkyjVwzdxLfqw', // App ID
            'fi6LWURzRGmTg7neZfI79MJaB2QHjWhiZ4nVFvKD'  // JS Key
        );
        Parse.serverURL = 'https://parseapi.back4app.com/';
        
        console.log('✅ Parse initialized for frontend');
    }

    // Fetch all content for learning hub
    async fetchAllContent() {
        if (this.syncInProgress) {
            console.log('Sync already in progress...');
            return this.cache.get('allContent');
        }

        this.syncInProgress = true;
        
        try {
            const [areas, subcategories, videos, tags] = await Promise.all([
                this.fetchAreas(),
                this.fetchSubcategories(),
                this.fetchVideos(),
                this.fetchTags()
            ]);

            // Build relationships
            const structuredData = this.buildContentStructure(areas, subcategories, videos, tags);
            
            this.cache.set('allContent', structuredData);
            this.lastSync = new Date();
            
            console.log('✅ Content synced successfully');
            return structuredData;
            
        } catch (error) {
            console.error('❌ Content fetch failed:', error);
            throw error;
        } finally {
            this.syncInProgress = false;
        }
    }

    // Fetch areas from Parse
    async fetchAreas() {
        const query = new Parse.Query('Area');
        query.ascending('area');
        
        const results = await query.find();
        return results.map(obj => ({
            id: obj.id,
            area: obj.get('area'),
            icon: obj.get('icon') || 'fas fa-folder',
            featherIcon: obj.get('featherIcon'),
            svgString: obj.get('svgString'),
            description: obj.get('description'),
            subcategories: []
        }));
    }

    // Fetch subcategories from Parse
    async fetchSubcategories() {
        const query = new Parse.Query('Subcategory');
        query.include('area');
        query.ascending('title');
        
        const results = await query.find();
        return results.map(obj => ({
            id: obj.id,
            title: obj.get('title'),
            description: obj.get('description'),
            materials: obj.get('materials'),
            processSteps: obj.get('processSteps'),
            context: obj.get('context'),
            subtitle: obj.get('subtitle'),
            areaId: obj.get('area')?.id,
            uniqueId: obj.get('uniqueId') || `${obj.get('area')?.get('area')?.toLowerCase().replace(/\s+/g, '-')}-${obj.id}`,
            tags: obj.get('tags') || [],
            videos: []
        }));
    }

    // Fetch videos from Parse
    async fetchVideos() {
        const query = new Parse.Query('Video');
        query.descending('createdAt');
        query.limit(1000);
        
        const results = await query.find();
        return results.map((obj, index) => ({
            id: obj.id,
            title: obj.get('title'),
            youtubeId: obj.get('youtubeId'),
            description: obj.get('description'),
            categories: obj.get('categories') || [],
            tags: obj.get('tags') || [],
            rating: obj.get('rating') || 0,
            views: obj.get('views') || 0,
            duration: obj.get('duration'),
            creator: obj.get('creator'),
            authors: obj.get('authors') || '',
            licence: obj.get('licence') || 'Standard YouTube License',
            localVideoFilename: obj.get('localVideoFilename') || '',
            icon_tag_fa: obj.get('icon_tag_fa') || 'fas fa-video',
            color_tag: obj.get('color_tag') || '#6c757d',
            flat_index: index,
            date: obj.get('date') || obj.createdAt
        }));
    }

    // Fetch tags from Parse
    async fetchTags() {
        const query = new Parse.Query('Tag');
        query.ascending('name');
        
        const results = await query.find();
        return results.map(obj => ({
            id: obj.id,
            name: obj.get('name'),
            definition: obj.get('definition'),
            color: obj.get('color') || '#8b5cf6'
        }));
    }

    // Build the content structure for learning hub
    buildContentStructure(areas, subcategories, videos, tags) {
        // Create tag glossary
        const tagGlossary = {};
        tags.forEach(tag => {
            tagGlossary[tag.name.toLowerCase()] = tag.definition || `${tag.name} related content`;
        });

        // Build area structure
        const structuredAreas = areas.map(area => {
            // Find subcategories for this area
            const areaSubcategories = subcategories.filter(sub => sub.areaId === area.id);
            
            // Add videos to each subcategory
            areaSubcategories.forEach(subcategory => {
                subcategory.videos = videos.filter(video => 
                    video.categories.includes(subcategory.id)
                ).sort((a, b) => new Date(b.date) - new Date(a.date));
            });

            return {
                ...area,
                subcategories: areaSubcategories.sort((a, b) => a.title.localeCompare(b.title))
            };
        });

        return {
            areas: structuredAreas,
            videos: videos,
            tags: tags,
            tagGlossary: tagGlossary,
            lastUpdated: new Date().toISOString()
        };
    }

    // Export content as JSON for frontend consumption
    async exportForFrontend() {
        const content = await this.fetchAllContent();
        return {
            ...content,
            metadata: {
                version: '3.1.0',
                exportDate: new Date().toISOString(),
                totalAreas: content.areas.length,
                totalSubcategories: content.areas.reduce((sum, area) => sum + area.subcategories.length, 0),
                totalVideos: content.videos.length,
                totalTags: content.tags.length
            }
        };
    }
}

// 3. BULK OPERATIONS FUNCTIONS
// =============================================================================

class BulkOperations {
    constructor(parseStore, security) {
        this.parseStore = parseStore;
        this.security = security;
        this.batchSize = 50; // Parse batch limit
    }

    // Bulk import from JSON
    async importFromJSON(jsonData, options = {}) {
        const {
            overwriteExisting = false,
            validateData = true,
            createBackup = true
        } = options;

        console.log('🚀 Starting bulk import...');
        
        if (createBackup) {
            await this.createBackup();
        }

        const results = {
            areas: { created: 0, updated: 0, errors: [] },
            subcategories: { created: 0, updated: 0, errors: [] },
            videos: { created: 0, updated: 0, errors: [] },
            tags: { created: 0, updated: 0, errors: [] }
        };

        try {
            // Import in order: tags, areas, subcategories, videos
            if (jsonData.tags) {
                await this.bulkImportTags(jsonData.tags, results.tags, overwriteExisting, validateData);
            }
            
            if (jsonData.areas) {
                await this.bulkImportAreas(jsonData.areas, results.areas, overwriteExisting, validateData);
            }
            
            if (jsonData.subcategories) {
                await this.bulkImportSubcategories(jsonData.subcategories, results.subcategories, overwriteExisting, validateData);
            }
            
            if (jsonData.videos) {
                await this.bulkImportVideos(jsonData.videos, results.videos, overwriteExisting, validateData);
            }

            console.log('✅ Bulk import completed', results);
            return results;
            
        } catch (error) {
            console.error('❌ Bulk import failed:', error);
            throw error;
        }
    }

    // Bulk import tags
    async bulkImportTags(tags, results, overwriteExisting, validateData) {
        for (const tagData of tags) {
            try {
                if (validateData) {
                    const errors = this.validateTagData(tagData);
                    if (errors.length > 0) {
                        results.errors.push({ item: tagData, errors });
                        continue;
                    }
                }

                const existing = this.parseStore.data.tags.find(t => t.name === tagData.name);
                
                if (existing && overwriteExisting) {
                    await this.parseStore.updateTag(existing.id, tagData);
                    results.updated++;
                } else if (!existing) {
                    await this.parseStore.addTag(tagData);
                    results.created++;
                }
            } catch (error) {
                results.errors.push({ item: tagData, error: error.message });
            }
        }
    }

    // Bulk import areas
    async bulkImportAreas(areas, results, overwriteExisting, validateData) {
        for (const areaData of areas) {
            try {
                if (validateData) {
                    const errors = this.validateAreaData(areaData);
                    if (errors.length > 0) {
                        results.errors.push({ item: areaData, errors });
                        continue;
                    }
                }

                const existing = this.parseStore.data.areas.find(a => a.area === areaData.area);
                
                if (existing && overwriteExisting) {
                    await this.parseStore.updateArea(existing.id, areaData);
                    results.updated++;
                } else if (!existing) {
                    await this.parseStore.addArea(areaData);
                    results.created++;
                }
            } catch (error) {
                results.errors.push({ item: areaData, error: error.message });
            }
        }
    }

    // Validation functions
    validateTagData(data) {
        const errors = [];
        if (!data.name) errors.push('Name is required');
        if (data.name && data.name.length > 50) errors.push('Name too long');
        return errors;
    }

    validateAreaData(data) {
        const errors = [];
        if (!data.area) errors.push('Area name is required');
        if (data.area && data.area.length > 100) errors.push('Area name too long');
        return errors;
    }

    // Export all data
    async exportAllData() {
        const data = {
            areas: this.parseStore.data.areas,
            subcategories: this.parseStore.data.subcategories,
            videos: this.parseStore.data.videos,
            tags: this.parseStore.data.tags,
            languages: this.parseStore.data.languages,
            metadata: {
                exportDate: new Date().toISOString(),
                version: '3.1.0',
                totalRecords: this.parseStore.data.areas.length + 
                             this.parseStore.data.subcategories.length + 
                             this.parseStore.data.videos.length + 
                             this.parseStore.data.tags.length
            }
        };

        return data;
    }

    // Create backup
    async createBackup() {
        const backup = await this.exportAllData();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `approvideo-backup-${timestamp}.json`;
        
        // Store backup (in a real app, you'd save to cloud storage)
        console.log(`📦 Backup created: ${filename}`, backup);
        return backup;
    }
}

// 4. USER AUTHENTICATION & PERMISSIONS
// =============================================================================

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.permissions = {
            admin: ['create', 'read', 'update', 'delete', 'export', 'import'],
            editor: ['create', 'read', 'update'],
            viewer: ['read']
        };
    }

    // Login with Parse User
    async login(username, password) {
        try {
            const user = await Parse.User.logIn(username, password);
            this.currentUser = user;
            
            console.log('✅ User logged in:', user.get('username'));
            return {
                success: true,
                user: {
                    id: user.id,
                    username: user.get('username'),
                    email: user.get('email'),
                    role: user.get('role') || 'viewer'
                }
            };
        } catch (error) {
            console.error('❌ Login failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Check if user has permission
    hasPermission(action) {
        if (!this.currentUser) return false;
        
        const userRole = this.currentUser.get('role') || 'viewer';
        const rolePermissions = this.permissions[userRole] || [];
        
        return rolePermissions.includes(action);
    }

    // Logout
    async logout() {
        await Parse.User.logOut();
        this.currentUser = null;
        console.log('✅ User logged out');
    }

    // Get current user
    getCurrentUser() {
        return Parse.User.current();
    }
}

// 5. ADVANCED SEARCH & ANALYTICS
// =============================================================================

class AdvancedAnalytics {
    constructor(parseStore) {
        this.parseStore = parseStore;
    }

    // Generate comprehensive analytics
    generateAdvancedAnalytics() {
        const data = this.parseStore.data;
        
        return {
            // Basic counts
            summary: {
                totalAreas: data.areas.length,
                totalSubcategories: data.subcategories.length,
                totalVideos: data.videos.length,
                totalTags: data.tags.length,
                totalViews: data.videos.reduce((sum, v) => sum + (v.views || 0), 0)
            },
            
            // Content distribution
            distribution: {
                videosByArea: this.getVideosByArea(),
                subcategoriesByArea: this.getSubcategoriesByArea(),
                tagUsage: this.getTagUsage(),
                contentGrowth: this.getContentGrowth()
            },
            
            // Quality metrics
            quality: {
                videosWithThumbnails: data.videos.filter(v => v.youtubeId).length,
                subcategoriesWithMaterials: data.subcategories.filter(s => s.materials).length,
                averageTagsPerVideo: this.getAverageTagsPerVideo(),
                contentCompleteness: this.getContentCompleteness()
            },
            
            // Engagement metrics
            engagement: {
                topViewedVideos: this.getTopViewedVideos(),
                topRatedVideos: this.getTopRatedVideos(),
                mostUsedTags: this.getMostUsedTags(),
                recentActivity: this.getRecentActivity()
            }
        };
    }

    getVideosByArea() {
        const distribution = {};
        this.parseStore.data.areas.forEach(area => {
            const videoCount = area.subcategories.reduce((sum, sub) => sum + sub.videos.length, 0);
            distribution[area.area] = videoCount;
        });
        return distribution;
    }

    getTagUsage() {
        const usage = {};
        this.parseStore.data.videos.forEach(video => {
            video.tags.forEach(tag => {
                usage[tag] = (usage[tag] || 0) + 1;
            });
        });
        return Object.entries(usage)
            .sort(([,a], [,b]) => b - a)
            .reduce((obj, [tag, count]) => ({ ...obj, [tag]: count }), {});
    }

    getTopViewedVideos(limit = 10) {
        return this.parseStore.data.videos
            .sort((a, b) => (b.views || 0) - (a.views || 0))
            .slice(0, limit)
            .map(v => ({ title: v.title, views: v.views || 0, id: v.id }));
    }

    // Search with advanced filters
    advancedSearch(query, filters = {}) {
        const {
            areas = [],
            tags = [],
            dateRange = null,
            minViews = 0,
            hasYouTubeId = null,
            creators = []
        } = filters;

        let results = this.parseStore.data.videos;

        // Text search
        if (query) {
            const searchTerm = query.toLowerCase();
            results = results.filter(video =>
                video.title.toLowerCase().includes(searchTerm) ||
                (video.description && video.description.toLowerCase().includes(searchTerm)) ||
                video.tags.some(tag => tag.toLowerCase().includes(searchTerm))
            );
        }

        // Filter by areas
        if (areas.length > 0) {
            const subcategoryIds = this.parseStore.data.subcategories
                .filter(sub => areas.includes(sub.areaId))
                .map(sub => sub.id);
            
            results = results.filter(video =>
                video.categories.some(catId => subcategoryIds.includes(catId))
            );
        }

        // Filter by tags
        if (tags.length > 0) {
            results = results.filter(video =>
                tags.some(tag => video.tags.includes(tag))
            );
        }

        // Filter by views
        if (minViews > 0) {
            results = results.filter(video => (video.views || 0) >= minViews);
        }

        // Filter by YouTube ID
        if (hasYouTubeId !== null) {
            results = results.filter(video =>
                hasYouTubeId ? !!video.youtubeId : !video.youtubeId
            );
        }

        // Filter by creators
        if (creators.length > 0) {
            results = results.filter(video =>
                video.creator && creators.includes(video.creator)
            );
        }

        return {
            results,
            totalFound: results.length,
            filters: filters,
            query: query
        };
    }
}

// 6. NOTIFICATION SYSTEM
// =============================================================================

class NotificationManager {
    constructor() {
        this.notifications = [];
        this.subscribers = [];
        this.maxNotifications = 50;
    }

    // Add notification
    add(type, title, message, data = {}) {
        const notification = {
            id: Date.now() + Math.random(),
            type, // 'success', 'error', 'warning', 'info'
            title,
            message,
            data,
            timestamp: new Date(),
            read: false
        };

        this.notifications.unshift(notification);
        
        // Keep only max notifications
        if (this.notifications.length > this.maxNotifications) {
            this.notifications = this.notifications.slice(0, this.maxNotifications);
        }

        // Notify subscribers
        this.notifySubscribers('new', notification);
        
        return notification;
    }

    // Subscribe to notifications
    subscribe(callback) {
        this.subscribers.push(callback);
    }

    // Notify subscribers
    notifySubscribers(event, data) {
        this.subscribers.forEach(callback => callback(event, data));
    }

    // Mark as read
    markAsRead(id) {
        const notification = this.notifications.find(n => n.id === id);
        if (notification) {
            notification.read = true;
            this.notifySubscribers('read', notification);
        }
    }

    // Get unread notifications
    getUnread() {
        return this.notifications.filter(n => !n.read);
    }

    // Clear all notifications
    clear() {
        this.notifications = [];
        this.notifySubscribers('clear', null);
    }
}

// =============================================================================
// MAIN INTEGRATION CLASS - BRINGS EVERYTHING TOGETHER
// =============================================================================

class ApproVideoIntegration {
    constructor() {
        this.frontendManager = new FrontendDataManager();
        this.realTimeSync = null;
        this.bulkOps = null;
        this.authManager = new AuthManager();
        this.analytics = null;
        this.notifications = new NotificationManager();
        this.isInitialized = false;
    }

    // Initialize the complete system
    async initialize(parseStore = null, security = null) {
        try {
            console.log('🚀 Initializing ApproVideo Integration...');
            
            // Initialize Parse for frontend
            await this.frontendManager.initializeParse();
            
            // Initialize other components if we have a parse store
            if (parseStore && security) {
                this.realTimeSync = new RealTimeSync(parseStore);
                this.bulkOps = new BulkOperations(parseStore, security);
                this.analytics = new AdvancedAnalytics(parseStore);
                
                // Start real-time sync
                await this.realTimeSync.initializeLiveQueries();
            }
            
            this.isInitialized = true;
            this.notifications.add('success', 'System Ready', 'ApproVideo Integration initialized successfully');
            
            console.log('✅ ApproVideo Integration ready!');
            return true;
            
        } catch (error) {
            console.error('❌ Integration initialization failed:', error);
            this.notifications.add('error', 'Initialization Failed', error.message);
            throw error;
        }
    }

    // Get data for frontend learning hub
    async getDataForLearningHub() {
        return await this.frontendManager.exportForFrontend();
    }

    // Perform bulk operations
    async performBulkImport(jsonData, options) {
        if (!this.bulkOps) throw new Error('Bulk operations not available - admin interface required');
        return await this.bulkOps.importFromJSON(jsonData, options);
    }

    // Get advanced analytics
    getAnalytics() {
        if (!this.analytics) throw new Error('Analytics not available - admin interface required');
        return this.analytics.generateAdvancedAnalytics();
    }

    // Perform advanced search
    advancedSearch(query, filters) {
        if (!this.analytics) throw new Error('Advanced search not available - admin interface required');
        return this.analytics.advancedSearch(query, filters);
    }

    // Authentication methods
    async login(username, password) {
        return await this.authManager.login(username, password);
    }

    async logout() {
        return await this.authManager.logout();
    }

    hasPermission(action) {
        return this.authManager.hasPermission(action);
    }

    // Subscribe to real-time updates
    subscribeToUpdates(event, callback) {
        if (this.realTimeSync) {
            this.realTimeSync.subscribe(event, callback);
        }
    }

    // Get system status
    getSystemStatus() {
        return {
            initialized: this.isInitialized,
            realTimeSync: this.realTimeSync?.isConnected || false,
            currentUser: this.authManager.getCurrentUser()?.get('username') || null,
            unreadNotifications: this.notifications.getUnread().length,
            lastSync: this.frontendManager.lastSync
        };
    }
}

// =============================================================================
// USAGE EXAMPLES & INTEGRATION INSTRUCTIONS
// =============================================================================

/* 
// FOR ADMIN INTERFACE (Content Manager):
// =====================================

const integration = new ApproVideoIntegration();
await integration.initialize(parseStore, security);

// Real-time updates
integration.subscribeToUpdates('areas:create', (data) => {
    console.log('New area created:', data);
    // Update UI accordingly
});

// Bulk operations
const importData = { areas: [...], videos: [...] };
const results = await integration.performBulkImport(importData, {
    overwriteExisting: true,
    createBackup: true
});

// Advanced analytics
const analytics = integration.getAnalytics();
console.log('Analytics:', analytics);


// FOR LEARNING HUB FRONTEND:
// ==========================

const integration = new ApproVideoIntegration();
await integration.initialize(); // No admin features

// Get all content for the learning hub
const contentData = await integration.getDataForLearningHub();

// Update your existing categoryData
window.categoryData = contentData.areas;

// Rebuild your UI
generateHomepageModules();
buildSearchableItems(categoryData);


// FOR REAL-TIME FRONTEND UPDATES:
// ===============================

integration.subscribeToUpdates('areas:update', (updatedArea) => {
    // Update the specific area in your UI
    updateAreaInUI(updatedArea);
});

integration.subscribeToUpdates('videos:create', (newVideo) => {
    // Add new video to relevant subcategories
    addVideoToUI(newVideo);
});


// AUTHENTICATION FLOW:
// ====================

// In admin interface
const loginResult = await integration.login('admin', 'password');
if (loginResult.success) {
    console.log('Admin logged in:', loginResult.user);
    // Show admin features
} else {
    console.error('Login failed:', loginResult.error);
}

// Check permissions before operations
if (integration.hasPermission('create')) {
    // Show create buttons
}

*/

// Export the main integration class
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ApproVideoIntegration;
} else if (typeof window !== 'undefined') {
    window.ApproVideoIntegration = ApproVideoIntegration;
}

console.log('📦 ApproVideo Integration Functions Loaded');
