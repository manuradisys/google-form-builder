import { Form, FormField } from '../types.js';
import { StorageService } from './storage.js';
import { generateId } from '../utils.js';

export class FormBuilder {
    private storageService: StorageService;
    private currentForm: Form | null = null;
    private tempForm: Form | null = null; // Add this to store temporary form

    constructor() {
        this.storageService = new StorageService();
    }
// FormBuilder class
public createForm(title: string, description: string): Form {
    const form: Form = {
        id: generateId(), // Use your ID generation method
        title,
        description,
        fields: [],
        createdAt: Date.now()
    };
    this.currentForm = form;
    return form;
}


  // Update FormBuilder class methods
  public getCurrentForm(): Form | null {
    return this.currentForm || this.tempForm;
}


    public setCurrentForm(formId: string): void {
        const form = this.storageService.getForms().find(f => f.id === formId);
        if (form) {
            this.currentForm = form;
        }
    }

    public addField(type: FormField['type'], label: string, options?: string[]): FormField {
        if (!this.currentForm) {
            throw new Error('No form is currently being edited');
        }

        const field: FormField = {
            id: generateId(),
            type,
            label,
            options,
            required: false,
            order: this.currentForm.fields.length
        };

        this.currentForm.fields.push(field);
        return field;
    }

    public saveForm(): void {
        if (!this.currentForm) {
            throw new Error('No form is currently being edited');
        }
        this.storageService.saveForm(this.currentForm);
    }
}