import { emptyFormField, type FormFieldRow } from '@/lib/multipart';

interface FormDataEditorProps {
    fields: FormFieldRow[];
    setFields: (fields: FormFieldRow[]) => void;
    onFileSelect: (id: string, file: File | null) => void;
}

export default function FormDataEditor({ fields, setFields, onFileSelect }: FormDataEditorProps) {
    const updateField = (id: string, patch: Partial<FormFieldRow>) => {
        setFields(fields.map((field) => (field.id === id ? { ...field, ...patch } : field)));
    };

    const removeField = (id: string) => {
        const next = fields.filter((field) => field.id !== id);
        setFields(next.length ? next : [emptyFormField()]);
    };

    const addField = () => {
        setFields([...fields, emptyFormField()]);
    };

    return (
        <div className="form-data-editor">
            <div className="kv-header-row form-data-header">
                <span />
                <span className="kv-col-label">Field</span>
                <span className="kv-col-label">Value / File</span>
                <span />
            </div>
            {fields.map((field) => (
                <div key={field.id} className="kv-row form-data-row">
                    <input
                        type="checkbox"
                        checked={field.enabled}
                        onChange={(e) => updateField(field.id, { enabled: e.target.checked })}
                        aria-label={`Enable ${field.key || 'field'}`}
                    />
                    <input
                        className="kv-input"
                        value={field.key}
                        onChange={(e) => updateField(field.id, { key: e.target.value })}
                        placeholder="field name"
                    />
                    <div className="form-data-value-col">
                        <select
                            className="tool-select form-data-type"
                            value={field.type}
                            onChange={(e) =>
                                updateField(field.id, {
                                    type: e.target.value as 'text' | 'file',
                                    value: '',
                                    fileName: undefined,
                                    fileDataBase64: undefined,
                                })
                            }
                            aria-label="Field type"
                        >
                            <option value="text">Text</option>
                            <option value="file">File</option>
                        </select>
                        {field.type === 'text' ? (
                            <input
                                className="kv-input"
                                value={field.value}
                                onChange={(e) => updateField(field.id, { value: e.target.value })}
                                placeholder="value"
                            />
                        ) : (
                            <div className="form-file-row">
                                <input
                                    type="file"
                                    className="form-file-input"
                                    onChange={(e) => void onFileSelect(field.id, e.target.files?.[0] ?? null)}
                                    aria-label={`File for ${field.key || 'field'}`}
                                />
                                {field.fileName && <span className="stats-hint">{field.fileName}</span>}
                            </div>
                        )}
                    </div>
                    <button type="button" className="rm-btn" onClick={() => removeField(field.id)} aria-label="Remove field">
                        ×
                    </button>
                </div>
            ))}
            <button type="button" className="tool-btn form-data-add" onClick={addField}>
                Add field
            </button>
        </div>
    );
}
