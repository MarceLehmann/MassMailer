/**
 * Language manager for MassMailer
 * Handles translation and language switching
 */

const LanguageManager = (function() {
    // Available languages
    const LANGUAGES = {
        'en': 'English',
        'de': 'Deutsch'
    };
    
    // Default language (browser language or fallback to English)
    const DEFAULT_LANGUAGE = (navigator.language || navigator.userLanguage || 'en').split('-')[0];
    
    // Currently active language
    let currentLanguage = localStorage.getItem('massmailer_language') || DEFAULT_LANGUAGE;
    if (!LANGUAGES[currentLanguage]) currentLanguage = 'en'; // Fallback if stored language is not supported
    
    // Translation dictionaries
    const translations = {
        'en': {
            // App general
            'app_title': 'MassMailer Mini-App',
            'app_ready': 'App ready',
            'app_loaded': 'MassMailer has been successfully loaded. Start by importing a CSV file.',
            
            // Settings
            'settings': 'Settings',
            'webhook_url': 'Webhook URL (make.com / n8n)',
            'default_sender': 'Default Sender (if needed by webhook)',
            'webhook_timeout': 'Webhook Timeout (seconds)',
            'data_management': 'Data Management',
            'export_settings': 'Export Settings & Templates',
            'import_settings': 'Import Settings & Templates',
            'delete_data': 'Delete All Local Data',
            'close': 'Close',
            'save': 'Save',
            'language': 'Language',
            
            // Step 1
            'step1': 'Step 1: Data & Template',
            'import_file': 'Import File (Excel or CSV)',
            'file_support': 'Supports Excel (.xlsx, .xls) and CSV files.',
            'select_template': 'Select Template',
            'please_choose': 'Please choose...',
            'load_template': 'Load template',
            'save_template': 'Save current entries as new template',
            'copy_template': 'Copy selected template',
            'delete_template': 'Delete selected template',
            
            // Step 2
            'step2': 'Step 2: Create Email',
            'available_placeholders': 'Available Placeholders',
            'placeholders_available': 'Available after CSV import.',
            'subject': 'Subject',
            'subject_placeholder': 'Your subject here...',
            'message': 'Message',
            'send_plaintext': 'Send as plain text',
            'attachments': 'Attachments',
            'generate_preview': 'Generate Preview',
            
            // Step 3
            'step3': 'Step 3: Preview & Send',
            'recipient': 'Recipient',
            'test_attachments': 'Test Attachments',
            'send_webhook': 'Send to Webhook',
            'to': 'To',
            'none': 'None',
            'send_progress': 'Send Progress',
            
            // Notifications
            'success': 'Success',
            'error': 'Error',
            'warning': 'Warning',
            'info': 'Info',
            'notification': 'Notification',
            'now': 'Now',
            
            // Debug
            'attachment_debug': 'Attachment Debug Information',
            'debug_note': 'This function shows information about the attachment format to diagnose transmission problems.',
            'type': 'Type',
            'size': 'Size',
            'formatted_graph': 'Formatted for Microsoft Graph',
            'download_file': 'Download formatted file',
            'use_alt_format': 'Use alternative format (data part only without prefix)',
            'json_object': 'As JSON object',
            'test_http': 'Test HTTP Request',
            'test_post': 'Test POST request to webhook',
            'download_payload': 'Download attachment payload',
            
            // Messages
            'template_saved': 'Template saved',
            'template_not_saved': 'Template could not be saved',
            'template_not_found': 'Template not found',
            'template_loaded': '{0} has been loaded',
            'template_copied': '{0} has been copied',
            'template_deleted': 'Template has been deleted',
            'template_delete_error': 'Template could not be deleted',
            'confirm_delete_template': 'Are you sure you want to delete this template?',
            'confirm_delete_data': 'Are you sure you want to delete all saved settings and templates? This action cannot be undone.',
            'file_error': 'File error',
            'excel_error': 'Excel error',
            'parse_error': 'Parse error: {0}',
            'file_no_data': 'The file contains no data',
            'excel_not_enough': 'The Excel file does not contain enough data.',
            'excel_no_headers': 'No valid column headers found.',
            'data_loaded': '{0} records loaded',
            'no_email': 'No email address found in row {0}',
            'no_csv': 'No CSV data available',
            'no_webhook': 'No webhook URL configured',
            'no_message': 'No valid message for testing',
            'network_error': 'Network error',
            'request_error': 'Error with the request: {0}',
            'file_too_large': 'File {0} is larger than 10 MB and will be skipped',
            'attachment_added': 'Attachment added',
            'settings_saved': 'Settings saved',
            'settings_error': 'Settings could not be saved',
            'export_success': 'All settings and templates have been exported',
            'export_error': 'The data could not be exported',
            'import_success': 'Settings and templates have been imported',
            'import_error': 'The data could not be imported',
            'data_deleted': 'All settings and templates have been reset',
            'delete_error': 'The data could not be deleted',
            'sending': 'Sending {0} messages...',
            'send_success': 'Successfully sent! ({0}s)',
            'message_status': 'Message {0}: {1}',
            'webhook_timeout': 'The webhook did not respond in time (Timeout after {0} seconds).',
            'no_attachments': 'No attachments available for testing',
            'conversion_error': 'Error with binary conversion: {0}',
            'payload_exported': 'Payload exported as JSON file'
        },
        'de': {
            // App general
            'app_title': 'MassMailer Mini-App',
            'app_ready': 'App bereit',
            'app_loaded': 'MassMailer wurde erfolgreich geladen. Beginnen Sie mit dem Import einer CSV-Datei.',
            
            // Settings
            'settings': 'Einstellungen',
            'webhook_url': 'Webhook URL (make.com / n8n)',
            'default_sender': 'Standard-Absender (falls vom Webhook benötigt)',
            'webhook_timeout': 'Webhook Timeout (Sekunden)',
            'data_management': 'Datenverwaltung',
            'export_settings': 'Einstellungen & Vorlagen exportieren',
            'import_settings': 'Einstellungen & Vorlagen importieren',
            'delete_data': 'Alle lokalen Daten löschen',
            'close': 'Schließen',
            'save': 'Speichern',
            'language': 'Sprache',
            
            // Step 1
            'step1': 'Schritt 1: Daten & Vorlage',
            'import_file': 'Datei importieren (Excel oder CSV)',
            'file_support': 'Unterstützt Excel (.xlsx, .xls) und CSV-Dateien.',
            'select_template': 'Vorlage auswählen',
            'please_choose': 'Bitte wählen...',
            'load_template': 'Vorlage laden',
            'save_template': 'Aktuelle Eingaben als neue Vorlage speichern',
            'copy_template': 'Ausgewählte Vorlage kopieren',
            'delete_template': 'Ausgewählte Vorlage löschen',
            
            // Step 2
            'step2': 'Schritt 2: E-Mail erstellen',
            'available_placeholders': 'Verfügbare Platzhalter',
            'placeholders_available': 'Nach CSV-Import verfügbar.',
            'subject': 'Betreff',
            'subject_placeholder': 'Ihr Betreff hier...',
            'message': 'Nachricht',
            'send_plaintext': 'Als reinen Text senden',
            'attachments': 'Anhänge',
            'generate_preview': 'Vorschau generieren',
            
            // Step 3
            'step3': 'Schritt 3: Vorschau & Versand',
            'recipient': 'Empfänger',
            'test_attachments': 'Anhänge testen',
            'send_webhook': 'An Webhook senden',
            'to': 'An',
            'none': 'Keine',
            'send_progress': 'Sende-Fortschritt',
            
            // Notifications
            'success': 'Erfolg',
            'error': 'Fehler',
            'warning': 'Warnung',
            'info': 'Information',
            'notification': 'Benachrichtigung',
            'now': 'Jetzt',
            
            // Debug
            'attachment_debug': 'Anhang-Debug-Informationen',
            'debug_note': 'Diese Funktion zeigt Informationen zum Format der Anhänge, um Probleme bei der Übertragung zu diagnostizieren.',
            'type': 'Typ',
            'size': 'Größe',
            'formatted_graph': 'Formatiert für Microsoft Graph',
            'download_file': 'Formatierte Datei herunterladen',
            'use_alt_format': 'Alternatives Format verwenden (nur Data-Teil ohne Präfix)',
            'json_object': 'Als JSON-Objekt',
            'test_http': 'HTTP-Anfrage testen',
            'test_post': 'POST-Anfrage an Webhook testen',
            'download_payload': 'Anhangs-Payload herunterladen',
            
            // Messages
            'template_saved': 'Vorlage wurde gespeichert',
            'template_not_saved': 'Vorlage konnte nicht gespeichert werden',
            'template_not_found': 'Vorlage nicht gefunden',
            'template_loaded': '"{0}" wurde geladen',
            'template_copied': '"{0}" wurde kopiert',
            'template_deleted': 'Vorlage wurde gelöscht',
            'template_delete_error': 'Vorlage konnte nicht gelöscht werden',
            'confirm_delete_template': 'Sind Sie sicher, dass Sie diese Vorlage löschen möchten?',
            'confirm_delete_data': 'Sind Sie sicher, dass Sie alle gespeicherten Einstellungen und Vorlagen löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.',
            'file_error': 'Datei-Fehler',
            'excel_error': 'Excel-Fehler',
            'parse_error': 'Fehler beim Parsen: {0}',
            'file_no_data': 'Die Datei enthält keine Daten',
            'excel_not_enough': 'Die Excel-Datei enthält nicht genügend Daten.',
            'excel_no_headers': 'Keine gültigen Spaltenüberschriften gefunden.',
            'data_loaded': '{0} Datensätze geladen',
            'no_email': 'Keine E-Mail-Adresse gefunden in Zeile {0}',
            'no_csv': 'Keine CSV-Daten vorhanden',
            'no_webhook': 'Keine Webhook-URL konfiguriert',
            'no_message': 'Keine gültige Nachricht zum Testen',
            'network_error': 'Netzwerkfehler',
            'request_error': 'Fehler bei der Anfrage: {0}',
            'file_too_large': 'Datei {0} ist größer als 10 MB und wird übersprungen',
            'attachment_added': 'Anhang hinzugefügt',
            'settings_saved': 'Einstellungen wurden gespeichert',
            'settings_error': 'Einstellungen konnten nicht gespeichert werden',
            'export_success': 'Alle Einstellungen und Vorlagen wurden exportiert',
            'export_error': 'Die Daten konnten nicht exportiert werden',
            'import_success': 'Einstellungen und Vorlagen wurden importiert',
            'import_error': 'Die Daten konnten nicht importiert werden',
            'data_deleted': 'Alle Einstellungen und Vorlagen wurden zurückgesetzt',
            'delete_error': 'Die Daten konnten nicht gelöscht werden',
            'sending': 'Starte Übertragung von {0} Nachrichten...',
            'send_success': 'Erfolgreich gesendet! ({0}s)',
            'message_status': 'Nachricht {0}: {1}',
            'webhook_timeout': 'Der Webhook hat nicht rechtzeitig geantwortet (Timeout nach {0} Sekunden).',
            'no_attachments': 'Keine Anhänge vorhanden zum Testen',
            'conversion_error': 'Fehler bei der Binärkonvertierung: {0}',
            'payload_exported': 'Payload als JSON-Datei exportiert'
        }
    };
    
    /**
     * Format a string with placeholders
     * @param {string} str - The string with placeholders {0}, {1}, etc.
     * @param {...any} args - The values to insert
     * @returns {string} - The formatted string
     */
    function formatString(str, ...args) {
        return str.replace(/{(\d+)}/g, (match, number) => {
            return typeof args[number] !== 'undefined' ? args[number] : match;
        });
    }
    
    /**
     * Get a translated string
     * @param {string} key - The translation key
     * @param {...any} args - Optional formatting arguments
     * @returns {string} - The translated string
     */
    function translate(key, ...args) {
        const lang = currentLanguage;
        let text = '';
        
        // Try to get the translation in the current language
        if (translations[lang] && translations[lang][key]) {
            text = translations[lang][key];
        } 
        // Fallback to English
        else if (translations['en'] && translations['en'][key]) {
            text = translations['en'][key];
        } 
        // If no translation is found, return the key
        else {
            return key;
        }
        
        // Apply formatting if args are provided
        if (args.length > 0) {
            return formatString(text, ...args);
        }
        
        return text;
    }
    
    /**
     * Get the current language code
     * @returns {string} - The current language code (e.g., 'en', 'de')
     */
    function getCurrentLanguage() {
        return currentLanguage;
    }
    
    /**
     * Set the current language
     * @param {string} langCode - The language code to set (e.g., 'en', 'de')
     * @returns {boolean} - Success/failure
     */
    function setLanguage(langCode) {
        if (translations[langCode]) {
            currentLanguage = langCode;
            localStorage.setItem('massmailer_language', langCode);
            return true;
        }
        return false;
    }
    
    /**
     * Get all available languages
     * @returns {Object} - Object with language codes as keys and names as values
     */
    function getAvailableLanguages() {
        return LANGUAGES;
    }
    
    /**
     * Apply translations to the current page
     * Updates all elements with data-i18n attribute
     */
    function applyTranslations() {
        document.querySelectorAll('[data-i18n]').forEach(element => {
            const key = element.getAttribute('data-i18n');
            if (key) {
                // Special handling for placeholders
                if (element.hasAttribute('placeholder')) {
                    element.setAttribute('placeholder', translate(key));
                } else {
                    element.textContent = translate(key);
                }
            }
        });
        
        // Also translate title attributes
        document.querySelectorAll('[data-i18n-title]').forEach(element => {
            const key = element.getAttribute('data-i18n-title');
            if (key) {
                element.setAttribute('title', translate(key));
            }
        });
    }
    
    // External API
    return {
        translate,
        getCurrentLanguage,
        setLanguage,
        getAvailableLanguages,
        applyTranslations
    };
})();