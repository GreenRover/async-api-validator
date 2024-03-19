import { AsyncAPIDocumentInterface } from '@asyncapi/parser';

export interface ValidationResult {
    /**
     * Supposed to unique
     */
    item: string;
    error: string;
    context?: string;
}

export interface ValidationResults {
    /**
     * Indicator that the whole schema is valid.
     */
    schemaIsValid: boolean;
    results: ValidationResult[];
    asyncApiDoc?: any | undefined,
}
