import Ajv, { type ErrorObject } from 'ajv';

export interface SchemaValidationResult {
    valid: boolean;
    errors: string[];
}

const ajv = new Ajv({ allErrors: true, strict: false });

function formatAjvError(error: ErrorObject): string {
    const path = error.instancePath || '/';
    const msg = error.message ?? 'invalid';
    if (error.keyword === 'additionalProperties' && error.params?.additionalProperty) {
        return `${path}: unknown property "${error.params.additionalProperty as string}"`;
    }
    return `${path}: ${msg}`;
}

export function validateJsonAgainstSchema(data: unknown, schemaText: string): SchemaValidationResult {
    const trimmed = schemaText.trim();
    if (!trimmed) {
        return { valid: true, errors: [] };
    }

    let schema: unknown;
    try {
        schema = JSON.parse(trimmed);
    } catch (e) {
        return { valid: false, errors: [`Invalid schema JSON: ${(e as Error).message}`] };
    }

    try {
        const validate = ajv.compile(schema as object);
        const valid = validate(data);
        if (valid) {
            return { valid: true, errors: [] };
        }
        const errors = (validate.errors ?? []).map(formatAjvError);
        return { valid: false, errors: errors.length ? errors : ['JSON does not match schema'] };
    } catch (e) {
        return { valid: false, errors: [`Schema error: ${(e as Error).message}`] };
    }
}
