export interface FormField {
    id: string;
    type: 'text' | 'radio' | 'checkbox';
    label: string;
    options?: string[];
    required: boolean;
    order: number;
}

export interface Form {
    id: string;
    title: string;
    description: string;
    fields: FormField[];
    createdAt: number;
}

export interface FormResponse {
    id: string;
    formId: string;
    responses: Record<string, string | string[]>;
    submittedAt: number;
}