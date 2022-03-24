export interface ValidationResult {
    msg: string;
    exception?: any;
    context?: string;
}

export interface ValidationResults {
    /**
     * Indicator that the whole schema is valid.
     */
    schemaIsValid: boolean;
    results: ValidationResult[];
}
