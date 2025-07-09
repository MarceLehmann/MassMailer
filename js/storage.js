/**
 * Storage Service for MassMailer
 * Handles local storage of settings and template data
 * Supports both localStorage and (optional) Tauri file persistence
 */

const StorageService = (function() {
    // Constants for Storage Keys
    const SETTINGS_KEY = 'massmailer_settings';
    const TEMPLATES_KEY = 'massmailer_templates';
    
    // Default settings
    const DEFAULT_SETTINGS = {
        webhookUrl: '',
        defaultSender: 'no-reply@company.com',
        webhookTimeout: 30 // seconds
    };
    
    // Check if Tauri is available
    const isTauriAvailable = window.__TAURI__ !== undefined;
    
    // Helper function: Check if localStorage is available
    function isLocalStorageAvailable() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch(e) {
            return false;
        }
    }
    
    // Provides fallback via IndexedDB for environments without localStorage
    // or for large files (> 5 MB)
    let indexedDBInstance = null;
    
    function getIndexedDB() {
        return new Promise((resolve, reject) => {
            if (indexedDBInstance) {
                resolve(indexedDBInstance);
                return;
            }
            
            const request = indexedDB.open('massmailerDB', 1);
            
            request.onupgradeneeded = function(event) {
                const db = event.target.result;
                if (!db.objectStoreNames.contains('settings')) {
                    db.createObjectStore('settings', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('templates')) {
                    db.createObjectStore('templates', { keyPath: 'id' });
                }
            };
            
            request.onsuccess = function(event) {
                indexedDBInstance = event.target.result;
                resolve(indexedDBInstance);
            };
            
            request.onerror = function(event) {
                console.error('IndexedDB error:', event.target.error);
                reject(event.target.error);
            };
        });
    }
    
    // Helper functions for IndexedDB
    async function getFromIndexedDB(storeName, key) {
        const db = await getIndexedDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            
            request.onsuccess = function() {
                resolve(request.result ? request.result.data : null);
            };
            
            request.onerror = function(event) {
                reject(event.target.error);
            };
        });
    }
    
    async function saveToIndexedDB(storeName, key, data) {
        const db = await getIndexedDB();
        return new Promise((resolve, reject) => {
            const transaction = db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.put({ id: key, data: data });
            
            request.onsuccess = function() {
                resolve();
            };
            
            request.onerror = function(event) {
                reject(event.target.error);
            };
        });
    }
    
    // Tauri-specific functions for reading/writing files
    async function readFromTauriFS(filename) {
        try {
            // Path to the app config file in the user data directory
            const { appDataDir } = await window.__TAURI__.path.appDataDir();
            const filepath = `${appDataDir}/${filename}.json`;
            
            // Check if the file exists
            const exists = await window.__TAURI__.fs.exists(filepath);
            if (!exists) return null;
            
            // Read file
            const content = await window.__TAURI__.fs.readTextFile(filepath);
            return JSON.parse(content);
        } catch (error) {
            console.error(`Error reading Tauri file ${filename}:`, error);
            return null;
        }
    }
    
    async function writeToTauriFS(filename, data) {
        try {
            // Path to the app config file in the user data directory
            const { appDataDir } = await window.__TAURI__.path.appDataDir();
            const filepath = `${appDataDir}/${filename}.json`;
            
            // Create directory if it doesn't exist
            await window.__TAURI__.fs.createDir(appDataDir, { recursive: true });
            
            // Write file
            await window.__TAURI__.fs.writeTextFile(filepath, JSON.stringify(data, null, 2));
            return true;
        } catch (error) {
            console.error(`Error writing Tauri file ${filename}:`, error);
            return false;
        }
    }
    
    /**
     * Load settings
     * @returns {Promise<Object>} The loaded settings
     */
    async function getSettings() {
        let settings = null;
        
        if (isTauriAvailable) {
            settings = await readFromTauriFS('settings');
        } else if (isLocalStorageAvailable()) {
            const settingsJson = localStorage.getItem(SETTINGS_KEY);
            if (settingsJson) {
                try {
                    settings = JSON.parse(settingsJson);
                } catch (e) {
                    console.error('Error parsing settings from localStorage:', e);
                }
            }
        } else {
            // Fallback to IndexedDB
            try {
                settings = await getFromIndexedDB('settings', SETTINGS_KEY);
            } catch (e) {
                console.error('Error loading settings from IndexedDB:', e);
            }
        }
        
        // Use default settings if none were found
        return { ...DEFAULT_SETTINGS, ...settings };
    }
    
    /**
     * Save settings
     * @param {Object} settings The settings to save
     * @returns {Promise<boolean>} Success/failure
     */
    async function saveSettings(settings) {
        try {
            if (isTauriAvailable) {
                return await writeToTauriFS('settings', settings);
            } else if (isLocalStorageAvailable()) {
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
                return true;
            } else {
                // Fallback to IndexedDB
                await saveToIndexedDB('settings', SETTINGS_KEY, settings);
                return true;
            }
        } catch (e) {
            console.error('Error saving settings:', e);
            return false;
        }
    }
    
    /**
     * Load templates
     * @returns {Promise<Array>} The loaded templates
     */
    async function getTemplates() {
        let templates = [];
        
        try {
            if (isTauriAvailable) {
                templates = await readFromTauriFS('templates') || [];
            } else if (isLocalStorageAvailable()) {
                const templatesJson = localStorage.getItem(TEMPLATES_KEY);
                if (templatesJson) {
                    try {
                        templates = JSON.parse(templatesJson);
                        // Validiere dass templates ein Array ist
                        if (!Array.isArray(templates)) {
                            console.warn('Templates in localStorage sind kein Array, setze auf leeres Array zurück');
                            templates = [];
                        }
                    } catch (e) {
                        console.error('Error parsing templates from localStorage:', e);
                        // Bei Parsing-Fehler: Versuche localStorage zu reparieren
                        localStorage.removeItem(TEMPLATES_KEY);
                    }
                }
            } else {
                // Fallback to IndexedDB
                try {
                    templates = await getFromIndexedDB('templates', TEMPLATES_KEY) || [];
                    // Validiere dass templates ein Array ist
                    if (!Array.isArray(templates)) {
                        console.warn('Templates in IndexedDB sind kein Array, setze auf leeres Array zurück');
                        templates = [];
                    }
                } catch (e) {
                    console.error('Error loading templates from IndexedDB:', e);
                }
            }
        } catch (e) {
            console.error('Allgemeiner Fehler beim Laden der Templates:', e);
        }
        
        // Stelle sicher, dass wir IMMER ein Array zurückgeben
        return Array.isArray(templates) ? templates : [];
    }
    
    /**
     * Save templates
     * @param {Array} templates The templates to save
     * @returns {Promise<boolean>} Success/failure
     */
    async function saveTemplates(templates) {
        try {
            if (isTauriAvailable) {
                return await writeToTauriFS('templates', templates);
            } else if (isLocalStorageAvailable()) {
                localStorage.setItem(TEMPLATES_KEY, JSON.stringify(templates));
                return true;
            } else {
                // Fallback to IndexedDB
                await saveToIndexedDB('templates', TEMPLATES_KEY, templates);
                return true;
            }
        } catch (e) {
            console.error('Error saving templates:', e);
            return false;
        }
    }
    
    /**
     * Save or update a single template
     * @param {Object} template The template to save
     * @returns {Promise<boolean>} Success/failure
     */
    async function saveTemplate(template) {
        const templates = await getTemplates();
        
        // Check if this is an update
        const existingIndex = templates.findIndex(t => t.id === template.id);
        
        if (existingIndex >= 0) {
            // Update template
            templates[existingIndex] = { 
                ...templates[existingIndex], 
                ...template,
                updated: new Date().toISOString()
            };
        } else {
            // Add new template
            templates.push({
                ...template,
                id: template.id || `template-${Date.now()}`,
                created: new Date().toISOString(),
                updated: new Date().toISOString()
            });
        }
        
        return await saveTemplates(templates);
    }
    
    /**
     * Delete a template
     * @param {string} templateId The ID of the template to delete
     * @returns {Promise<boolean>} Success/failure
     */
    async function deleteTemplate(templateId) {
        const templates = await getTemplates();
        const filteredTemplates = templates.filter(t => t.id !== templateId);
        
        if (filteredTemplates.length === templates.length) {
            // Nothing deleted
            return false;
        }
        
        return await saveTemplates(filteredTemplates);
    }
    
    /**
     * Delete all local data
     * @returns {Promise<boolean>} Success/failure
     */
    async function clearAllData() {
        try {
            if (isTauriAvailable) {
                await writeToTauriFS('settings', DEFAULT_SETTINGS);
                await writeToTauriFS('templates', []);
            } else if (isLocalStorageAvailable()) {
                localStorage.removeItem(SETTINGS_KEY);
                localStorage.removeItem(TEMPLATES_KEY);
            } else {
                // Fallback to IndexedDB
                const db = await getIndexedDB();
                const transaction = db.transaction(['settings', 'templates'], 'readwrite');
                transaction.objectStore('settings').clear();
                transaction.objectStore('templates').clear();
                await new Promise((resolve, reject) => {
                    transaction.oncomplete = resolve;
                    transaction.onerror = reject;
                });
            }
            return true;
        } catch (e) {
            console.error('Error deleting all data:', e);
            return false;
        }
    }
    
    /**
     * Export all data
     * @returns {Promise<Object>} The exported data
     */
    async function exportData() {
        const settings = await getSettings();
        const templates = await getTemplates();
        
        return {
            settings,
            templates,
            exportDate: new Date().toISOString(),
            version: '1.0' // For future compatibility
        };
    }
    
    /**
     * Import data
     * @param {Object} data The data to import
     * @returns {Promise<boolean>} Success/failure
     */
    async function importData(data) {
        if (!data || !data.settings || !Array.isArray(data.templates)) {
            return false;
        }
        
        try {
            await saveSettings(data.settings);
            await saveTemplates(data.templates);
            return true;
        } catch (e) {
            console.error('Error importing data:', e);
            return false;
        }
    }
    
    // External API
    return {
        getSettings,
        saveSettings,
        getTemplates,
        saveTemplates,
        saveTemplate,
        deleteTemplate,
        clearAllData,
        exportData,
        importData
    };
})();