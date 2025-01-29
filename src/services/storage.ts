import { Form, FormResponse } from '../types.js';

// StorageService.ts
export class StorageService {
    private readonly FORMS_KEY = 'forms';

    public getForms(): Form[] {
        try {
            const forms = localStorage.getItem(this.FORMS_KEY);
            return forms ? JSON.parse(forms) : [];
        } catch (error) {
            console.error('Error getting forms:', error);
            return [];
        }
    }

    public saveForm(form: Form): void {
        try {
            const forms = this.getForms();
            const existingIndex = forms.findIndex(f => f.id === form.id);
            
            if (existingIndex >= 0) {
                // Update existing form
                forms[existingIndex] = { ...form };
            } else {
                // Add new form
                forms.push({ ...form });
            }
            
            // Remove any potential duplicates by ID
            const uniqueForms = this.removeDuplicates(forms);
            localStorage.setItem(this.FORMS_KEY, JSON.stringify(uniqueForms));
        } catch (error) {
            console.error('Error saving form:', error);
        }
    }

    public deleteForm(formId: string): void {
        try {
            const forms = this.getForms().filter(f => f.id !== formId);
            localStorage.setItem(this.FORMS_KEY, JSON.stringify(forms));
        } catch (error) {
            console.error('Error deleting form:', error);
        }
    }

    private removeDuplicates(forms: Form[]): Form[] {
        const seen = new Set();
        return forms.filter(form => {
            if (seen.has(form.id)) {
                return false;
            }
            seen.add(form.id);
            return true;
        });
    }
}