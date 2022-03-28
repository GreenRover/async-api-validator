export interface ValidationResult {
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
}
