/**
 * MassMailer Mini-App
 * Main application logic
 */

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', initApp);

// Global state
const appState = {
    csvRows: [],
    csvColumns: [],
    templates: [],
    attachments: [],
    settings: {},
    currentPreviewIndex: 0
};

// UI elements object
const ui = {
    // Step 1: Data & Template
    dataFileInput: document.getElementById('dataFile'),
    templateSelect: document.getElementById('templateSelect'),
    loadTemplateBtn: document.getElementById('loadTemplateBtn'),
    saveTemplateBtn: document.getElementById('saveTemplateBtn'),
    copyTemplateBtn: document.getElementById('copyTemplateBtn'),
    deleteTemplateBtn: document.getElementById('deleteTemplateBtn'),
    
    // Step 2: Editor
    subjectInput: document.getElementById('subject'),
    placeholderTags: document.getElementById('placeholderTags'),
    plainTextSwitch: document.getElementById('plainTextSwitch'),
    attachmentsInput: document.getElementById('attachments'),
    attachmentList: document.getElementById('attachmentList'),
    previewBtn: document.getElementById('previewBtn'),
    
    // Step 3: Preview & Send
    prevRecipientBtn: document.getElementById('prevRecipientBtn'),
    nextRecipientBtn: document.getElementById('nextRecipientBtn'),
    currentRecipientIndex: document.getElementById('currentRecipientIndex'),
    totalRecipients: document.getElementById('totalRecipients'),
    previewTo: document.getElementById('previewTo'),
    previewSubject: document.getElementById('previewSubject'),
    previewBody: document.getElementById('previewBody'),
    previewAttachments: document.getElementById('previewAttachments'),
    previewAttachmentsFooter: document.getElementById('previewAttachmentsFooter'),
    sendBtn: document.getElementById('sendBtn'),
    sendProgress: document.getElementById('sendProgress'),
    sendStatusLog: document.getElementById('sendStatusLog'),
    
    // Settings
    languageSelect: document.getElementById('languageSelect'),
    languageDropdown: document.getElementById('languageDropdown'),
    languageMenu: document.getElementById('languageMenu'),
    currentLanguage: document.getElementById('currentLanguage'),
    webhookUrlInput: document.getElementById('webhookUrl'),
    defaultSenderInput: document.getElementById('defaultSender'),
    webhookTimeoutInput: document.getElementById('webhookTimeout'),
    exportDataBtn: document.getElementById('exportDataBtn'),
    importDataInput: document.getElementById('importDataInput'),
    clearDataBtn: document.getElementById('clearDataBtn'),
    saveSettingsBtn: document.getElementById('saveSettingsBtn'),
    
    // Steps
    step1: document.getElementById('step1'),
    step2: document.getElementById('step2'),
    step3: document.getElementById('step3')
};

// Quill editor
let quill;

/**
 * Initialize the application
 */
async function initApp() {
    // Apply translations based on current language
    LanguageManager.applyTranslations();
    
    // Show current language in dropdown
    updateLanguageDisplay();
    
    // Setup the Quill editor
    quill = new Quill('#editor', {
        theme: 'snow',
        modules: {
            toolbar: [
                [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                ['bold', 'italic', 'underline', 'strike'],
                [{ 'color': [] }, { 'background': [] }],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                [{ 'align': [] }],
                ['link', 'image'],
                ['clean']
            ]
        },
        placeholder: LanguageManager.translate('subject_placeholder')
    });
    
    // Load settings
    appState.settings = await StorageService.getSettings();
    
    // Load templates
    appState.templates = await StorageService.getTemplates();
    
    // Populate templates dropdown
    populateTemplatesDropdown();
    
    // Populate language selection
    populateLanguageOptions();
    
    // Fill settings form
    ui.webhookUrlInput.value = appState.settings.webhookUrl || '';
    ui.defaultSenderInput.value = appState.settings.defaultSender || '';
    ui.webhookTimeoutInput.value = appState.settings.webhookTimeout || 30;
    
    // Setup event listeners
    setupEventListeners();
    
    // Show a welcome message
    showToast(LanguageManager.translate('app_ready'), LanguageManager.translate('app_loaded'), 'info');
}

/**
 * Populate language options in menu and settings
 */
function populateLanguageOptions() {
    const languages = LanguageManager.getAvailableLanguages();
    const currentLang = LanguageManager.getCurrentLanguage();
    
    // Clear existing options
    ui.languageMenu.innerHTML = '';
    ui.languageSelect.innerHTML = '';
    
    // Add language options to dropdown menu
    for (const [code, name] of Object.entries(languages)) {
        // Dropdown menu
        const menuItem = document.createElement('li');
        const link = document.createElement('a');
        link.classList.add('dropdown-item');
        if (code === currentLang) {
            link.classList.add('active');
        }
        link.href = '#';
        link.textContent = name;
        link.dataset.langCode = code;
        link.addEventListener('click', function(e) {
            e.preventDefault();
            changeLanguage(code);
        });
        menuItem.appendChild(link);
        ui.languageMenu.appendChild(menuItem);
        
        // Settings select
        const option = document.createElement('option');
        option.value = code;
        option.textContent = name;
        option.selected = code === currentLang;
        ui.languageSelect.appendChild(option);
    }
}

/**
 * Update the language display in header
 */
function updateLanguageDisplay() {
    const currentLang = LanguageManager.getCurrentLanguage();
    const languages = LanguageManager.getAvailableLanguages();
    ui.currentLanguage.textContent = languages[currentLang] || currentLang;
}

/**
 * Change the application language
 * @param {string} langCode - The language code to change to
 */
function changeLanguage(langCode) {
    if (LanguageManager.setLanguage(langCode)) {
        // Update display
        updateLanguageDisplay();
        
        // Update settings select
        for (const option of ui.languageSelect.options) {
            option.selected = option.value === langCode;
        }
        
        // Apply translations
        LanguageManager.applyTranslations();
        
        // Update active state in dropdown menu
        const menuItems = ui.languageMenu.querySelectorAll('.dropdown-item');
        menuItems.forEach(item => {
            if (item.dataset.langCode === langCode) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
        
        // Show success message
        showToast(LanguageManager.translate('success'), LanguageManager.translate('settings_saved'), 'success');
    }
}

/**
 * Setup all event listeners for the application
 */
function setupEventListeners() {
    // File input change
    ui.dataFileInput.addEventListener('change', handleFileUpload);
    
    // Template selection change - aktiviert/deaktiviert die Template-Buttons
    ui.templateSelect.addEventListener('change', updateTemplateButtonStates);
    
    // Template buttons
    ui.loadTemplateBtn.addEventListener('click', loadSelectedTemplate);
    ui.saveTemplateBtn.addEventListener('click', saveAsNewTemplate);
    ui.copyTemplateBtn.addEventListener('click', copySelectedTemplate);
    ui.deleteTemplateBtn.addEventListener('click', deleteSelectedTemplate);
    
    // Attachments
    ui.attachmentsInput.addEventListener('change', handleAttachmentUpload);
    
    // Preview button
    ui.previewBtn.addEventListener('click', generatePreview);
    
    // Navigation buttons
    ui.prevRecipientBtn.addEventListener('click', () => navigatePreview(-1));
    ui.nextRecipientBtn.addEventListener('click', () => navigatePreview(1));
    
    // Send button
    ui.sendBtn.addEventListener('click', sendMessages);
    
    // Language select in settings
    ui.languageSelect.addEventListener('change', function() {
        changeLanguage(this.value);
    });
    
    // Settings buttons
    ui.saveSettingsBtn.addEventListener('click', saveSettings);
    ui.exportDataBtn.addEventListener('click', exportData);
    ui.importDataInput.addEventListener('change', importData);
    ui.clearDataBtn.addEventListener('click', clearData);
}

/**
 * Show a toast notification
 * @param {string} title - The title of the notification
 * @param {string} message - The message to display
 * @param {string} type - The type of notification (success, danger, warning, info)
 */
function showToast(title, message, type = 'info') {
    const toastElement = document.getElementById('liveToast');
    const toastTitle = toastElement.querySelector('.toast-title');
    const toastBody = toastElement.querySelector('.toast-body');
    
    // Set the title and message
    toastTitle.textContent = title;
    toastBody.textContent = message;
    
    // Set the color based on type
    toastElement.className = 'toast';
    toastElement.classList.add(`text-bg-${type}`);
    
    // Show the toast
    const bsToast = new bootstrap.Toast(toastElement);
    bsToast.show();
}

/**
 * Add a message to the send status log
 * @param {string} message - The message to add
 * @param {string} type - The type of message (success, danger, warning, info)
 */
function addToSendLog(message, type = 'info') {
    const logEntry = document.createElement('div');
    logEntry.className = `text-${type} mb-1`;
    logEntry.textContent = message;
    ui.sendStatusLog.appendChild(logEntry);
    
    // Auto-scroll to the bottom
    ui.sendStatusLog.scrollTop = ui.sendStatusLog.scrollHeight;
}

/**
 * Update the send progress
 * @param {number} current - The current progress
 * @param {number} total - The total number of items
 * @param {string} state - The current state (prepare, send, complete, error)
 */
function updateSendProgress(current, total, state = 'send') {
    const progressBar = ui.sendProgress.querySelector('.progress-bar');
    
    // Calculate percentage
    const percent = Math.min(Math.round((current / total) * 100), 100);
    
    // Update width and text
    progressBar.style.width = `${percent}%`;
    progressBar.textContent = `${percent}%`;
    
    // Update aria value
    progressBar.setAttribute('aria-valuenow', percent);
    
    // Handle different states
    if (state === 'prepare') {
        progressBar.classList.remove('bg-success', 'bg-danger');
        progressBar.classList.add('progress-bar-striped', 'progress-bar-animated');
    } else if (state === 'complete') {
        progressBar.classList.remove('progress-bar-striped', 'progress-bar-animated', 'bg-danger');
        progressBar.classList.add('bg-success');
    } else if (state === 'error') {
        progressBar.classList.remove('progress-bar-striped', 'progress-bar-animated', 'bg-success');
        progressBar.classList.add('bg-danger');
    }
}

/**
 * Handle file upload (CSV or Excel)
 * @param {Event} event - The file input change event
 */
function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
        processFile(file);
    }
}

/**
 * Process an uploaded file (CSV or Excel)
 * @param {File} file - The file to process
 */
async function processFile(file) {
    try {
        // Determine file type from extension
        const fileName = file.name.toLowerCase();
        
        if (fileName.endsWith('.csv')) {
            // Process CSV file
            const content = await readFileAsText(file);
            parseCSV(content);
        } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            // Process Excel file
            const data = await readFileAsArrayBuffer(file);
            parseExcel(data);
        } else {
            showToast(LanguageManager.translate('file_error'), LanguageManager.translate('file_no_data'), 'danger');
        }
    } catch (error) {
        console.error('File processing error:', error);
        showToast(LanguageManager.translate('file_error'), error.message, 'danger');
    }
}

/**
 * Read a file as text
 * @param {File} file - The file to read
 * @returns {Promise<string>} - The file contents as text
 */
function readFileAsText(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(e.target.error);
        reader.readAsText(file);
    });
}

/**
 * Read a file as ArrayBuffer (for Excel)
 * @param {File} file - The file to read
 * @returns {Promise<ArrayBuffer>} - The file contents as ArrayBuffer
 */
function readFileAsArrayBuffer(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = e => reject(e.target.error);
        reader.readAsArrayBuffer(file);
    });
}

/**
 * Parse CSV content
 * @param {string} content - The CSV content to parse
 */
function parseCSV(content) {
    try {
        const result = Papa.parse(content, {
            header: true,
            skipEmptyLines: true
        });
        
        if (result.errors.length > 0) {
            const errorMsg = result.errors.map(err => err.message).join(', ');
            throw new Error(LanguageManager.translate('parse_error', errorMsg));
        }
        
        if (result.data.length === 0) {
            throw new Error(LanguageManager.translate('file_no_data'));
        }
        
        // Store the parsed data in the app state
        appState.csvRows = result.data;
        appState.csvColumns = result.meta.fields;
        
        // Update placeholders
        updatePlaceholders();
        
        // Show the editor section
        ui.step2.style.display = 'block';
        
        // Show success message
        showToast(LanguageManager.translate('success'), LanguageManager.translate('data_loaded', result.data.length), 'success');
    } catch (error) {
        console.error('CSV parsing error:', error);
        showToast(LanguageManager.translate('parse_error'), error.message, 'danger');
    }
}

/**
 * Parse Excel file
 * @param {ArrayBuffer} data - The Excel file data
 */
function parseExcel(data) {
    try {
        // Read the Excel file
        const workbook = XLSX.read(data, { type: 'array' });
        
        if (workbook.SheetNames.length === 0) {
            throw new Error(LanguageManager.translate('excel_not_enough'));
        }
        
        // Get the first sheet
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Convert to JSON with headers
        const jsonData = XLSX.utils.sheet_to_json(sheet);
        
        if (jsonData.length === 0) {
            throw new Error(LanguageManager.translate('file_no_data'));
        }
        
        // Check for headers
        const headers = Object.keys(jsonData[0]);
        if (headers.length === 0) {
            throw new Error(LanguageManager.translate('excel_no_headers'));
        }
        
        // Store the parsed data in the app state
        appState.csvRows = jsonData;
        appState.csvColumns = headers;
        
        // Update placeholders
        updatePlaceholders();
        
        // Show the editor section
        ui.step2.style.display = 'block';
        
        // Show success message
        showToast(LanguageManager.translate('success'), LanguageManager.translate('data_loaded', jsonData.length), 'success');
    } catch (error) {
        console.error('Excel parsing error:', error);
        showToast(LanguageManager.translate('excel_error'), error.message, 'danger');
    }
}

/**
 * Update placeholders in the UI
 */
function updatePlaceholders() {
    // Clear previous placeholders
    ui.placeholderTags.innerHTML = '';
    
    // Add each column as a placeholder
    appState.csvColumns.forEach(column => {
        const tag = document.createElement('button');
        tag.className = 'list-group-item list-group-item-action';
        tag.textContent = column;
        tag.addEventListener('click', () => insertPlaceholder(column));
        ui.placeholderTags.appendChild(tag);
    });
}

/**
 * Insert a placeholder at the current cursor position
 * @param {string} field - The field name to insert
 */
function insertPlaceholder(field) {
    const placeholder = `{{${field}}}`;
    
    // Determine the active element
    const activeElement = document.activeElement;
    
    if (activeElement === ui.subjectInput) {
        // Insert into the subject field
        const startPos = ui.subjectInput.selectionStart;
        const endPos = ui.subjectInput.selectionEnd;
        const before = ui.subjectInput.value.substring(0, startPos);
        const after = ui.subjectInput.value.substring(endPos);
        ui.subjectInput.value = before + placeholder + after;
        
        // Set the cursor position after the placeholder
        ui.subjectInput.selectionStart = ui.subjectInput.selectionEnd = startPos + placeholder.length;
        ui.subjectInput.focus();
    } else {
        // Insert into the Quill editor
        quill.focus();
        const range = quill.getSelection() || { index: quill.getLength(), length: 0 };
        quill.insertText(range.index, placeholder);
    }
}

/**
 * Populate the templates dropdown
 */
async function populateTemplatesDropdown() {
    // Clear previous options
    ui.templateSelect.innerHTML = '';
    
    // Add default option
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = LanguageManager.translate('please_choose');
    defaultOption.disabled = true;
    defaultOption.selected = true;
    ui.templateSelect.appendChild(defaultOption);
    
    // Add each template as an option
    appState.templates.forEach(template => {
        const option = document.createElement('option');
        option.value = template.id;
        option.textContent = template.name;
        ui.templateSelect.appendChild(option);
    });
    
    // Update button states
    updateTemplateButtonStates();
}

/**
 * Update template buttons based on selection
 */
function updateTemplateButtonStates() {
    const hasTemplate = ui.templateSelect.value !== '';
    ui.loadTemplateBtn.disabled = !hasTemplate;
    ui.copyTemplateBtn.disabled = !hasTemplate;
    ui.deleteTemplateBtn.disabled = !hasTemplate;
}

/**
 * Load the selected template
 */
async function loadSelectedTemplate() {
    const templateId = ui.templateSelect.value;
    if (!templateId) return;
    
    const template = appState.templates.find(t => t.id === templateId);
    if (!template) {
        showToast(LanguageManager.translate('error'), LanguageManager.translate('template_not_found'), 'danger');
        return;
    }
    
    // Set subject and content
    ui.subjectInput.value = template.subject || '';
    quill.root.innerHTML = template.html || '';
    
    // Show success message
    showToast(LanguageManager.translate('success'), LanguageManager.translate('template_loaded', template.name), 'success');
}

/**
 * Save current content as a new template
 */
async function saveAsNewTemplate() {
    // Prompt for template name
    const templateName = prompt(LanguageManager.translate('template_name'));
    if (!templateName) return;
    
    const template = {
        id: `template_${Date.now()}`,
        name: templateName,
        subject: ui.subjectInput.value,
        html: quill.root.innerHTML
    };
    
    // Save the template
    const success = await StorageService.saveTemplate(template);
    
    if (success) {
        // Reload templates
        appState.templates = await StorageService.getTemplates();
        populateTemplatesDropdown();
        
        // Select the new template
        ui.templateSelect.value = template.id;
        updateTemplateButtonStates();
        
        // Show success message
        showToast(LanguageManager.translate('success'), LanguageManager.translate('template_saved'), 'success');
    } else {
        showToast(LanguageManager.translate('error'), LanguageManager.translate('template_not_saved'), 'danger');
    }
}

/**
 * Copy the selected template
 */
async function copySelectedTemplate() {
    const templateId = ui.templateSelect.value;
    if (!templateId) return;
    
    const template = appState.templates.find(t => t.id === templateId);
    if (!template) {
        showToast(LanguageManager.translate('error'), LanguageManager.translate('template_not_found'), 'danger');
        return;
    }
    
    // Create a copy with a new ID and name
    const copy = {
        ...template,
        id: `template_${Date.now()}`,
        name: `${template.name} (${LanguageManager.translate('copy')})`
    };
    
    // Save the copy
    const success = await StorageService.saveTemplate(copy);
    
    if (success) {
        // Reload templates
        appState.templates = await StorageService.getTemplates();
        populateTemplatesDropdown();
        
        // Select the new copy
        ui.templateSelect.value = copy.id;
        updateTemplateButtonStates();
        
        // Show success message
        showToast(LanguageManager.translate('success'), LanguageManager.translate('template_copied', template.name), 'success');
    } else {
        showToast(LanguageManager.translate('error'), LanguageManager.translate('template_not_saved'), 'danger');
    }
}

/**
 * Delete the selected template
 */
async function deleteSelectedTemplate() {
    const templateId = ui.templateSelect.value;
    if (!templateId) return;
    
    // Confirm deletion
    if (!confirm(LanguageManager.translate('confirm_delete_template'))) {
        return;
    }
    
    // Delete the template
    const success = await StorageService.deleteTemplate(templateId);
    
    if (success) {
        // Reload templates
        appState.templates = await StorageService.getTemplates();
        populateTemplatesDropdown();
        
        // Show success message
        showToast(LanguageManager.translate('success'), LanguageManager.translate('template_deleted'), 'success');
    } else {
        showToast(LanguageManager.translate('error'), LanguageManager.translate('template_delete_error'), 'danger');
    }
}

/**
 * Handle attachment upload
 * @param {Event} event - The file input change event
 */
function handleAttachmentUpload(event) {
    if (event.target.files && event.target.files.length > 0) {
        processAttachments(event.target.files);
        // Reset input so the same file can be selected again
        event.target.value = '';
    }
}

/**
 * Process attachment files
 * @param {FileList} files - The files to process
 */
async function processAttachments(files) {
    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Check for maximum file size (10 MB)
        if (file.size > 10 * 1024 * 1024) {
            showToast(LanguageManager.translate('warning'), LanguageManager.translate('file_too_large', file.name), 'warning');
            continue;
        }
        
        // Convert file to Base64
        const base64content = await fileToBase64(file);
        
        // Add to state
        appState.attachments.push({
            name: file.name,
            type: file.type,
            size: file.size,
            content: base64content
        });
    }
    
    // Update attachments list
    updateAttachmentsList();
}

/**
 * Convert a file to Base64
 * @param {File} file - The file to convert
 * @returns {Promise<string>} - The Base64 content
 */
function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

/**
 * Update the attachments list in UI
 */
function updateAttachmentsList() {
    ui.attachmentList.innerHTML = '';
    
    appState.attachments.forEach((attachment, index) => {
        const listItem = document.createElement('li');
        listItem.className = 'list-group-item d-flex justify-content-between align-items-center';
        
        const nameSpan = document.createElement('span');
        nameSpan.textContent = `${attachment.name} (${formatFileSize(attachment.size)})`;
        
        const removeButton = document.createElement('button');
        removeButton.className = 'btn-close';
        removeButton.setAttribute('aria-label', LanguageManager.translate('remove'));
        removeButton.addEventListener('click', () => removeAttachment(index));
        
        listItem.appendChild(nameSpan);
        listItem.appendChild(removeButton);
        ui.attachmentList.appendChild(listItem);
    });
}

/**
 * Remove an attachment
 * @param {number} index - The index of the attachment to remove
 */
function removeAttachment(index) {
    appState.attachments.splice(index, 1);
    updateAttachmentsList();
}

/**
 * Format file size for display
 * @param {number} bytes - The size in bytes
 * @returns {string} - Formatted size (e.g., "1.2 MB")
 */
function formatFileSize(bytes) {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
}

/**
 * Generate a preview
 */
function generatePreview() {
    if (!appState.csvRows.length) {
        showToast(LanguageManager.translate('error'), LanguageManager.translate('no_csv'), 'warning');
        return;
    }
    
    // Show step 3
    ui.step3.style.display = 'block';
    
    // Reset preview index
    appState.currentPreviewIndex = 0;
    
    // Show recipient count
    ui.totalRecipients.textContent = appState.csvRows.length;
    
    // Update preview
    updatePreview();
    
    // Enable/disable navigation buttons
    updatePreviewNavigation();
    
    // Enable send button if webhook URL is set
    ui.sendBtn.disabled = !appState.settings.webhookUrl;
}

/**
 * Update the preview
 */
function updatePreview() {
    if (!appState.csvRows.length) return;
    
    const currentRow = appState.csvRows[appState.currentPreviewIndex];
    
    // Find email address in the row
    let recipient = '';
    const emailFields = ['email', 'mail', 'e-mail', 'Email', 'Mail', 'E-Mail', 'Empfänger', 'Recipient', 'To'];
    for (const field of emailFields) {
        if (currentRow[field]) {
            recipient = currentRow[field];
            break;
        }
    }
    
    // Render subject with Mustache
    const renderedSubject = Mustache.render(ui.subjectInput.value, currentRow);
    
    // Render body with Mustache
    let htmlContent = quill.root.innerHTML;
    
    // If plain text is enabled, extract only the text
    if (ui.plainTextSwitch.checked) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlContent;
        htmlContent = tempDiv.textContent || tempDiv.innerText || '';
        htmlContent = htmlContent.replace(/\n/g, '<br>');
    }
    
    const renderedBody = Mustache.render(htmlContent, currentRow);
    
    // Update the preview UI
    ui.currentRecipientIndex.textContent = appState.currentPreviewIndex + 1;
    ui.previewTo.textContent = recipient;
    ui.previewSubject.textContent = renderedSubject;
    ui.previewBody.innerHTML = renderedBody;
    
    // Show attachments
    if (appState.attachments.length > 0) {
        ui.previewAttachments.innerHTML = appState.attachments.map(
            att => `<span class="badge bg-secondary me-1">${att.name} (${formatFileSize(att.size)})</span>`
        ).join('');
    } else {
        ui.previewAttachments.textContent = LanguageManager.translate('none');
    }
}

/**
 * Navigate to next/previous preview
 * @param {number} direction - 1 for next, -1 for previous
 */
function navigatePreview(direction) {
    const newIndex = appState.currentPreviewIndex + direction;
    
    if (newIndex >= 0 && newIndex < appState.csvRows.length) {
        appState.currentPreviewIndex = newIndex;
        updatePreview();
        updatePreviewNavigation();
    }
}

/**
 * Update preview navigation buttons
 */
function updatePreviewNavigation() {
    ui.prevRecipientBtn.disabled = appState.currentPreviewIndex <= 0;
    ui.nextRecipientBtn.disabled = appState.currentPreviewIndex >= appState.csvRows.length - 1;
}

/**
 * Format attachment for sending
 * @param {Object} attachment - The attachment object
 * @returns {Object} - Formatted attachment
 */
function formatAttachmentFinal(attachment) {
    // Extract Base64 content
    let base64Content = attachment.content;
    
    // If it's a complete data URL, extract just the Base64 part
    if (typeof base64Content === 'string' && base64Content.includes('base64,')) {
        base64Content = base64Content.split('base64,')[1];
    }
    
    // Remove any whitespace, line breaks, etc.
    base64Content = base64Content.replace(/[\r\n\s]/g, '');
    
    // Use just the filename without any path
    const filename = attachment.name.split('\\').pop().split('/').pop();
    
    // Convert Base64 to binary array (exactly the hex values as in your example)
    const binary = atob(base64Content);
    const bytes = new Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    
    // Return the exact format needed by make.com for the Email connector
    return {
        filename: filename,  // The filename
        data: bytes          // An array of byte values
    };
}

/**
 * Send messages to webhook
 */
async function sendMessages() {
    // Check if webhook URL is set
    if (!appState.settings.webhookUrl) {
        showToast(LanguageManager.translate('error'), LanguageManager.translate('no_webhook'), 'danger');
        return;
    }
    
    // Show progress UI
    ui.sendProgress.style.display = 'block';
    ui.sendBtn.disabled = true;
    ui.sendStatusLog.innerHTML = '';
    
    // Message count
    const totalMessages = appState.csvRows.length;
    
    // Prepare messages array
    const messages = [];
    
    // Generate all messages WITHOUT attachments
    for (let i = 0; i < totalMessages; i++) {
        // Generate base message without attachments
        const row = appState.csvRows[i];
        
        // Extract email address
        let to = '';
        const emailFields = ['email', 'mail', 'e-mail', 'Email', 'Mail', 'E-Mail', 'Empfänger', 'Recipient', 'To'];
        for (const field of emailFields) {
            if (row[field]) {
                to = row[field];
                break;
            }
        }
        
        if (!to) {
            console.warn(`No email address found in row ${i + 1}`);
            addToSendLog(LanguageManager.translate('no_email', i + 1), 'warning');
            continue;
        }
        
        // Render subject and body
        const subject = Mustache.render(ui.subjectInput.value, row);
        let htmlContent = quill.root.innerHTML;
        
        // Add message without attachments
        if (ui.plainTextSwitch.checked) {
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlContent;
            htmlContent = tempDiv.textContent || tempDiv.innerText || '';
            
            messages.push({
                to,
                subject,
                text: Mustache.render(htmlContent, row),
                // No attachments here
            });
        } else {
            messages.push({
                to,
                subject,
                html: Mustache.render(htmlContent, row),
                // No attachments here
            });
        }
        
        // Update progress (preparation phase)
        updateSendProgress(i + 1, totalMessages, 'prepare');
    }
    
    // Process and format attachments separately
    const globalAttachments = appState.attachments.map(att => formatAttachmentFinal(att));
    
    // Optimized payload with separate attachments
    const payload = {
        messages: messages,
        attachments: globalAttachments,  // Send all attachments only once
        defaultSender: appState.settings.defaultSender || ''
    };
    
    // Log the full payload to console for debugging
    console.log('Sending payload to webhook:', JSON.stringify(payload, null, 2));
    
    try {
        // Get webhook timeout from settings
        const timeout = appState.settings.webhookTimeout * 1000 || 30000;
        
        // Timestamp for start of transmission
        const startTime = new Date();
        addToSendLog(LanguageManager.translate('sending', messages.length), 'info');
        
        // Send POST request to webhook
        const response = await fetch(appState.settings.webhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload),
            signal: AbortSignal.timeout(timeout) // Timeout from settings
        });
        
        // Timestamp for end of transmission
        const endTime = new Date();
        const durationSeconds = ((endTime - startTime) / 1000).toFixed(1);
        
        if (response.ok) {
            // Success
            const result = await response.json().catch(() => ({}));
            
            addToSendLog(LanguageManager.translate('send_success', durationSeconds), 'success');
            
            // If the webhook returns detailed results
            if (result.results && Array.isArray(result.results)) {
                result.results.forEach((res, idx) => {
                    const status = res.success ? 'success' : 'danger';
                    addToSendLog(LanguageManager.translate('message_status', idx + 1, res.message || (res.success ? 'OK' : 'Error')), status);
                });
            }
            
            // Set progress to 100%
            updateSendProgress(totalMessages, totalMessages, 'complete');
        } else {
            // Server error
            addToSendLog(`❌ ${LanguageManager.translate('error')} ${response.status}: ${response.statusText}`, 'danger');
            try {
                const errorBody = await response.text();
                addToSendLog(`${LanguageManager.translate('details')}: ${errorBody}`, 'danger');
            } catch (e) {
                // No further details available
            }
            
            // Set progress to error
            updateSendProgress(totalMessages, totalMessages, 'error');
        }
    } catch (error) {
        // Network error or timeout
        addToSendLog(`❌ ${LanguageManager.translate('error')}: ${error.message}`, 'danger');
        
        // Show more specific message for timeout
        if (error.name === 'TimeoutError' || error.name === 'AbortError') {
            addToSendLog(LanguageManager.translate('webhook_timeout', appState.settings.webhookTimeout), 'danger');
        }
        
        // Set progress to error
        updateSendProgress(totalMessages, totalMessages, 'error');
    } finally {
        // Re-enable send button
        ui.sendBtn.disabled = false;
    }
}

/**
 * Save settings
 */
async function saveSettings() {
    const settings = {
        webhookUrl: ui.webhookUrlInput.value,
        defaultSender: ui.defaultSenderInput.value,
        webhookTimeout: parseInt(ui.webhookTimeoutInput.value, 10) || 30
    };
    
    const success = await StorageService.saveSettings(settings);
    
    if (success) {
        // Update app state
        appState.settings = settings;
        
        showToast(LanguageManager.translate('success'), LanguageManager.translate('settings_saved'), 'success');
        
        // Close modal
        bootstrap.Modal.getInstance(document.getElementById('settingsModal')).hide();
        
        // Enable send button if webhook URL is set and we're in preview mode
        if (ui.step3.style.display !== 'none') {
            ui.sendBtn.disabled = !settings.webhookUrl;
        }
    } else {
        showToast(LanguageManager.translate('error'), LanguageManager.translate('settings_error'), 'danger');
    }
}

/**
 * Export all data
 */
async function exportData() {
    try {
        const data = await StorageService.exportData();
        const dataStr = JSON.stringify(data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
        
        const exportFileName = `massmailer-export_${new Date().toISOString().slice(0, 10)}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileName);
        linkElement.click();
        
        showToast(LanguageManager.translate('success'), LanguageManager.translate('export_success'), 'success');
    } catch (error) {
        console.error('Export error:', error);
        showToast(LanguageManager.translate('error'), LanguageManager.translate('export_error'), 'danger');
    }
}

/**
 * Import data
 * @param {Event} event - The file input change event
 */
async function importData(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        const reader = new FileReader();
        
        reader.onload = async (fileEvent) => {
            try {
                const data = JSON.parse(fileEvent.target.result);
                const success = await StorageService.importData(data);
                
                if (success) {
                    // Reload settings
                    appState.settings = await StorageService.getSettings();
                    
                    // Reload templates
                    appState.templates = await StorageService.getTemplates();
                    populateTemplatesDropdown();
                    
                    // Update settings UI
                    ui.webhookUrlInput.value = appState.settings.webhookUrl || '';
                    ui.defaultSenderInput.value = appState.settings.defaultSender || '';
                    ui.webhookTimeoutInput.value = appState.settings.webhookTimeout || 30;
                    
                    showToast(LanguageManager.translate('success'), LanguageManager.translate('import_success'), 'success');
                } else {
                    showToast(LanguageManager.translate('error'), LanguageManager.translate('import_error'), 'danger');
                }
            } catch (parseError) {
                console.error('JSON parse error:', parseError);
                showToast(LanguageManager.translate('error'), LanguageManager.translate('import_error'), 'danger');
            }
        };
        
        reader.onerror = () => {
            showToast(LanguageManager.translate('error'), LanguageManager.translate('import_error'), 'danger');
        };
        
        reader.readAsText(file);
    } catch (error) {
        console.error('Import error:', error);
        showToast(LanguageManager.translate('error'), LanguageManager.translate('import_error'), 'danger');
    }
}

/**
 * Clear all data
 */
async function clearData() {
    if (!confirm(LanguageManager.translate('confirm_delete_data'))) {
        return;
    }
    
    const success = await StorageService.clearAllData();
    
    if (success) {
        // Reload settings
        appState.settings = await StorageService.getSettings();
        
        // Reload templates
        appState.templates = await StorageService.getTemplates();
        populateTemplatesDropdown();
        
        // Update settings UI
        ui.webhookUrlInput.value = appState.settings.webhookUrl || '';
        ui.defaultSenderInput.value = appState.settings.defaultSender || '';
        ui.webhookTimeoutInput.value = appState.settings.webhookTimeout || 30;
        
        showToast(LanguageManager.translate('success'), LanguageManager.translate('data_deleted'), 'success');
    } else {
        showToast(LanguageManager.translate('error'), LanguageManager.translate('delete_error'), 'danger');
    }
}

// Die folgende Funktion wurde entfernt:
// /**
//  * Test attachments format
//  */
// async function debugAttachments() { ... }

/**
 * Get MIME type from filename
 * @param {string} filename - The filename
 * @returns {string} - The MIME type
 */
function getMimeTypeFromFilename(filename) {
    const extension = filename.split('.').pop().toLowerCase();
    const mimeTypes = {
        'pdf': 'application/pdf',
        'doc': 'application/msword',
        'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'xls': 'application/vnd.ms-excel',
        'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'ppt': 'application/vnd.ms-powerpoint',
        'pptx': 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        'jpg': 'image/jpeg',
        'jpeg': 'image/jpeg',
        'png': 'image/png',
        'gif': 'image/gif',
        'txt': 'text/plain',
        'csv': 'text/csv',
        'html': 'text/html',
        'htm': 'text/html',
        'zip': 'application/zip',
        'rar': 'application/x-rar-compressed',
        'mp3': 'audio/mpeg',
        'mp4': 'video/mp4',
        'avi': 'video/x-msvideo',
        'mov': 'video/quicktime'
    };
    
    return mimeTypes[extension] || 'application/octet-stream';
}