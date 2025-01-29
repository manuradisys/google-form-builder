import { FormBuilder } from './services/form-builder.js';
import { StorageService } from './services/storage.js';
import { Form, FormField } from './types.js';
import { generateId } from './utils.js';

class App {
    private isFormCreated: boolean = false;  // Add this flag to track form creation state
    private isEditing: boolean = false;  // Add this flag to track edit mode
    private currentFormId: string | null = null;  // Add this to track current form ID
    private formBuilder: FormBuilder;
    private storageService: StorageService;
    private mainContent: HTMLElement;
    private tempForm: Form | null = null; // Add this to store temporary form

    constructor() {
        this.formBuilder = new FormBuilder();
        this.storageService = new StorageService();
        this.mainContent = document.getElementById('mainContent') as HTMLElement;
        this.initializeEventListeners();
    }

    private initializeEventListeners(): void {
        const createFormBtn = document.getElementById('createFormBtn');
        const viewFormsBtn = document.getElementById('viewFormsBtn');

        if (createFormBtn) {
            createFormBtn.addEventListener('click', () => this.showFormBuilder());
        }

        if (viewFormsBtn) {
            viewFormsBtn.addEventListener('click', () => this.showFormsList());
        }
    }

    private showFormBuilder(): void {
        const formBuilderHTML = `
            <div class="form-builder card">
                <div class="card-header bg-primary text-white">
                    <h2 class="card-title h5 mb-0">${this.isEditing ? 'Edit Form' : 'Create New Form'}</h2>
                </div>
                <div class="card-body">
                    <div class="mb-3">
                        <label for="formTitle" class="form-label">Form Title</label>
                        <input type="text" class="form-control" id="formTitle" placeholder="Enter form title">
                    </div>
                    <div class="mb-3">
                        <label for="formDescription" class="form-label">Form Description</label>
                        <textarea class="form-control" id="formDescription" rows="3" placeholder="Enter form description"></textarea>
                    </div>
                    <div id="formFields" class="mb-4">
                        <!-- Fields will be added here -->
                    </div>
                    <div class="d-flex flex-wrap gap-2 mb-3">
                        <button id="addTextBtn" class="btn ${this.isEditing ? 'btn-info' : 'btn-secondary'}" 
                            ${this.isEditing ? '' : 'disabled'}>
                            Add Text Field
                        </button>
                        <button id="addRadioBtn" class="btn ${this.isEditing ? 'btn-info' : 'btn-secondary'}" 
                            ${this.isEditing ? '' : 'disabled'}>
                            Add Radio Field
                        </button>
                        <button id="addCheckboxBtn" class="btn ${this.isEditing ? 'btn-info' : 'btn-secondary'}" 
                            ${this.isEditing ? '' : 'disabled'}>
                            Add Checkbox Field
                        </button>
                    </div>
                    <div class="mt-3">
                        <button id="saveFormBtn" class="btn btn-success">
                            ${this.isEditing ? 'Update Form' : 'Create Form'}
                        </button>
                    </div>
                </div>
            </div>
        `;
    
        this.mainContent.innerHTML = formBuilderHTML;
        this.initializeFormBuilderEvents();
    }

    private showFormsList(): void {
        this.isEditing = false;
        this.isFormCreated = false;
        this.currentFormId = null;
        this.tempForm = null;
    
        const forms = this.storageService.getForms();
        const formsWithFields = forms.filter(form => form.fields && form.fields.length > 0);
        
        const formsListHTML = `
            <div class="forms-list">
                <h2 class="mb-4">Your Forms</h2>
                ${formsWithFields.length === 0 ? 
                    '<div class="alert alert-info">No forms created yet.</div>' :
                    '<div class="row row-cols-1 row-cols-md-2 row-cols-lg-3 g-4">' +
                    formsWithFields.map(form => `
                        <div class="col">
                            <div class="card h-100">
                                <div class="card-body">
                                    <h5 class="card-title">${this.escapeHtml(form.title)}</h5>
                                    <p class="card-text">${this.escapeHtml(form.description)}</p>
                                    <div class="badge bg-primary mb-2">Fields: ${form.fields.length}</div>
                                </div>
                                <div class="card-footer bg-transparent">
                                    <div class="btn-group w-100">
                                        <button class="btn btn-outline-primary" onclick="app.editForm('${form.id}')">
                                            <i class="bi bi-pencil"></i> Edit
                                        </button>
                                        <button class="btn btn-outline-danger" onclick="app.deleteForm('${form.id}')">
                                            <i class="bi bi-trash"></i> Delete
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    `).join('') +
                    '</div>'
                }
            </div>
        `;
    
        this.mainContent.innerHTML = formsListHTML;
    
        // Add some styling
       /*  const style = document.createElement('style');
        style.textContent = `
            .form-item {
                background: #f5f5f5;
                padding: 15px;
                margin-bottom: 10px;
                border-radius: 4px;
                border: 1px solid #ddd;
            }
            .form-controls {
                margin-top: 10px;
            }
            .form-controls button {
                margin-right: 10px;
            }
            .edit-btn {
                background: #4285f4;
                color: white;
            }
            .delete-btn {
                background: #dc3545;
                color: white;
            }
        `;
        document.head.appendChild(style); */
    }
    
    // Helper method to escape HTML and prevent XSS
    private escapeHtml(str: string): string {
        const div = document.createElement('div');
        div.textContent = str;
        return div.innerHTML;
    }

    private initializeFormBuilderEvents(): void {
        // Get all buttons
        const addTextBtn = document.getElementById('addTextBtn');
        const addRadioBtn = document.getElementById('addRadioBtn');
        const addCheckboxBtn = document.getElementById('addCheckboxBtn');
        const saveFormBtn = document.getElementById('saveFormBtn');

        // Add click event listeners
        if (saveFormBtn) {
            saveFormBtn.addEventListener('click', () => {
                console.log('Save button clicked'); // Debug log
                this.saveForm();
            });
        }

        if (addTextBtn) {
            addTextBtn.addEventListener('click', () => this.addField('text'));
        }
        if (addRadioBtn) {
            addRadioBtn.addEventListener('click', () => this.addField('radio'));
        }
        if (addCheckboxBtn) {
            addCheckboxBtn.addEventListener('click', () => this.addField('checkbox'));
        }
    }

    

    private addField(type: 'text' | 'radio' | 'checkbox'): void {
        if (!this.isFormCreated && !this.isEditing) {
            alert('Please create a form first by entering title and description');
            return;
        }

        const label = prompt('Enter field label:');
        if (!label) return;

        let options: string[] | undefined;
        if (type === 'radio' || type === 'checkbox') {
            const optionsStr = prompt('Enter options (comma-separated):');
            options = optionsStr?.split(',').map(opt => opt.trim()).filter(opt => opt);
        }

        try {
            let field;
            if (this.isEditing) {
                // Add field to existing form
                field = this.formBuilder.addField(type, label, options);
                this.formBuilder.saveForm();
            } else {
                // Add field to temporary form and then save
                if (this.tempForm) {
                    field = {
                        id: generateId(),
                        type,
                        label,
                        options,
                        required: false,
                        order: this.tempForm.fields.length
                    };
                    this.tempForm.fields.push(field);
                    // Only save to storage after adding the first field
                    if (this.tempForm.fields.length === 1) {
                        this.formBuilder.createForm(this.tempForm.title, this.tempForm.description);
                        this.formBuilder.getCurrentForm()!.fields = this.tempForm.fields;
                        this.formBuilder.saveForm();
                    } else {
                        // Update existing form
                        this.formBuilder.getCurrentForm()!.fields = this.tempForm.fields;
                        this.formBuilder.saveForm();
                    }
                }
            }
            
            if (field) {
                this.renderField(field);
            }
        } catch (error) {
            console.error('Error adding field:', error);
            alert('Error adding field. Please try again.');
        }
    }


    
    private renderField(field: FormField): void {
        const fieldElement = document.createElement('div');
        fieldElement.className = 'card mb-3';
        fieldElement.innerHTML = `
            <div class="card-body">
                <div class="d-flex justify-content-between align-items-center mb-2">
                    <h5 class="card-title mb-0">${field.label}</h5>
                    
                </div>
                <div class="form-field-content">
                    ${this.getFieldInputHTML(field)}
                </div>
            </div>
        `;
    
        const formFields = document.getElementById('formFields');
        if (formFields) {
            formFields.appendChild(fieldElement);
        }
    }

    private getFieldInputHTML(field: FormField): string {
        switch (field.type) {
            case 'text':
                return `
                    <div class="mb-3">
                        <input type="text" class="form-control" placeholder="Text input">
                    </div>
                `;
            case 'radio':
                return field.options?.map(opt => `
                    <div class="form-check">
                        <input class="form-check-input" type="radio" name="${field.id}" value="${opt}">
                        <label class="form-check-label">${opt}</label>
                    </div>
                `).join('') || '';
            case 'checkbox':
                return field.options?.map(opt => `
                    <div class="form-check">
                        <input class="form-check-input" type="checkbox" name="${field.id}" value="${opt}">
                        <label class="form-check-label">${opt}</label>
                    </div>
                `).join('') || '';
            default:
                return '';
        }
    }

    private saveForm(): void {
        const titleInput = document.getElementById('formTitle') as HTMLInputElement;
        const descriptionInput = document.getElementById('formDescription') as HTMLTextAreaElement;

        if (!titleInput.value) {
            alert('Please enter a form title');
            return;
        }

        if (!this.isEditing) {
            // Creating new form - just store it temporarily
            this.tempForm = {
                id: generateId(),
                title: titleInput.value,
                description: descriptionInput.value,
                fields: [],
                createdAt: Date.now()
            };
            
            this.isFormCreated = true;
            this.currentFormId = this.tempForm.id;

            // Enable all add field buttons
            const buttons = [
                document.getElementById('addTextBtn'),
                document.getElementById('addRadioBtn'),
                document.getElementById('addCheckboxBtn')
            ];

            buttons.forEach(button => {
                if (button) {
                    button.removeAttribute('disabled');
                }
            });

            const saveFormBtn = document.getElementById('saveFormBtn');
            if (saveFormBtn) {
                saveFormBtn.textContent = 'Update Form';
            }

            alert('Form created! You can now add fields.');
        } else {
            // Updating existing form
            if (!this.currentFormId) return;
            
            const currentForm = this.formBuilder.getCurrentForm();
            if (currentForm) {
                currentForm.title = titleInput.value;
                currentForm.description = descriptionInput.value;
                if (!Array.isArray(currentForm.fields)) {
                    currentForm.fields = [];
                }
                this.formBuilder.saveForm();
                alert('Form updated successfully!');
                this.showFormsList();
            }
        }
    }

    public editForm(formId: string): void {
        this.isEditing = true;
        this.isFormCreated = true;
        this.currentFormId = formId;
    
        const form = this.storageService.getForms().find(f => f.id === formId);
        if (!form) return;
    
        this.formBuilder.setCurrentForm(formId);
        this.showFormBuilder(); // This will now show "Update Form" button
    
        // Fill in the existing form data
        const titleInput = document.getElementById('formTitle') as HTMLInputElement;
        const descriptionInput = document.getElementById('formDescription') as HTMLTextAreaElement;
        const saveFormBtn = document.getElementById('saveFormBtn');
        
        if (titleInput) titleInput.value = form.title;
        if (descriptionInput) descriptionInput.value = form.description;
        if (saveFormBtn) saveFormBtn.textContent = 'Update Form';
    
        // Enable the buttons
        const addTextBtn = document.getElementById('addTextBtn');
        const addRadioBtn = document.getElementById('addRadioBtn');
        const addCheckboxBtn = document.getElementById('addCheckboxBtn');
        
        if (addTextBtn) addTextBtn.removeAttribute('disabled');
        if (addRadioBtn) addRadioBtn.removeAttribute('disabled');
        if (addCheckboxBtn) addCheckboxBtn.removeAttribute('disabled');
    
        // Render existing fields
        const formFields = document.getElementById('formFields');
        if (formFields && form.fields) {
            formFields.innerHTML = ''; // Clear existing fields
            form.fields.forEach(field => this.renderField(field));
        }
    }

    public deleteForm(formId: string): void {
        if (confirm('Are you sure you want to delete this form?')) {
            this.storageService.deleteForm(formId);
            this.showFormsList();
        }
    }
}

// Make app instance globally available for the onclick handlers
declare global {
    interface Window {
        app: App;
    }
}
window.app = new App();