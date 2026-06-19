export interface FormFieldSnapshot {
    key: string;
    value: string;
    enabled: boolean;
    type: 'text' | 'file';
    fileName?: string;
    fileMimeType?: string;
    fileDataBase64?: string;
}

export interface FormFieldRow extends FormFieldSnapshot {
    id: string;
}

export interface ProxyMultipartPart {
    name: string;
    type: 'text' | 'file';
    value?: string;
    fileName?: string;
    contentType?: string;
    dataBase64?: string;
}

export function uid(): string {
    return Math.random().toString(36).slice(2, 8);
}

export function emptyFormField(): FormFieldRow {
    return { id: uid(), key: '', value: '', enabled: true, type: 'text' };
}

export function snapshotFormFields(rows: FormFieldRow[]): FormFieldSnapshot[] {
    return rows
        .filter((row) => row.key || row.value || row.fileName)
        .map((row) => ({
            key: row.key,
            value: row.value,
            enabled: row.enabled,
            type: row.type,
            fileName: row.fileName,
            fileMimeType: row.fileMimeType,
            fileDataBase64: row.fileDataBase64,
        }));
}

export function rowsFromFormSnapshots(rows: FormFieldSnapshot[]): FormFieldRow[] {
    const items = rows.map((r) => ({ id: uid(), ...r }));
    if (!items.some((i) => !i.key)) items.push(emptyFormField());
    return items.length ? items : [emptyFormField()];
}

export function hasMultipartBody(fields: FormFieldRow[]): boolean {
    return fields.some(
        (f) =>
            f.enabled &&
            f.key &&
            (f.type === 'text' ? f.value.length > 0 : Boolean(f.fileName || f.fileDataBase64)),
    );
}

export function readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.includes(',') ? result.split(',')[1]! : result;
            resolve(base64);
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

export async function buildBrowserFormData(fields: FormFieldRow[]): Promise<FormData> {
    const fd = new FormData();
    for (const field of fields.filter((f) => f.enabled && f.key)) {
        if (field.type === 'file') {
            if (field.fileDataBase64 && field.fileName) {
                const binary = atob(field.fileDataBase64);
                const bytes = new Uint8Array(binary.length);
                for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
                const blob = new Blob([bytes], { type: field.fileMimeType || 'application/octet-stream' });
                fd.append(field.key, blob, field.fileName);
            }
        } else {
            fd.append(field.key, field.value);
        }
    }
    return fd;
}

export function serializeMultipartForProxy(fields: FormFieldRow[]): ProxyMultipartPart[] {
    return fields
        .filter((f) => f.enabled && f.key)
        .map((field) => {
            if (field.type === 'file') {
                return {
                    name: field.key,
                    type: 'file' as const,
                    fileName: field.fileName,
                    contentType: field.fileMimeType,
                    dataBase64: field.fileDataBase64,
                };
            }
            return {
                name: field.key,
                type: 'text' as const,
                value: field.value,
            };
        })
        .filter((part) => (part.type === 'text' ? part.value !== undefined : Boolean(part.dataBase64 && part.fileName)));
}

export function buildNodeFormData(parts: ProxyMultipartPart[]): FormData {
    const fd = new FormData();
    for (const part of parts) {
        if (part.type === 'text') {
            fd.append(part.name, part.value ?? '');
            continue;
        }
        if (!part.dataBase64 || !part.fileName) continue;
        const buffer = Buffer.from(part.dataBase64, 'base64');
        const blob = new Blob([buffer], { type: part.contentType || 'application/octet-stream' });
        fd.append(part.name, blob, part.fileName);
    }
    return fd;
}

export function estimateMultipartSize(parts: ProxyMultipartPart[]): number {
    return parts.reduce((total, part) => {
        if (part.type === 'text') return total + new TextEncoder().encode(part.value ?? '').length;
        if (!part.dataBase64) return total;
        return total + Math.ceil((part.dataBase64.length * 3) / 4);
    }, 0);
}
