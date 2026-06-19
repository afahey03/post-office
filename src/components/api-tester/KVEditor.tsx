import type { KeyValue } from '@/components/api-tester/types';
import { emptyKV } from '@/components/api-tester/types';
import { removeKVFromList, updateKVList } from '@/lib/apiTesterUtils';

interface KVEditorProps {
    list: KeyValue[];
    setList: (list: KeyValue[]) => void;
    keyPlaceholder: string;
    valPlaceholder: string;
}

export default function KVEditor({ list, setList, keyPlaceholder, valPlaceholder }: KVEditorProps) {
    const updateKV = (id: string, field: keyof KeyValue, val: string | boolean) => {
        setList(updateKVList(list, id, field, val, emptyKV));
    };

    const removeKV = (id: string) => {
        setList(removeKVFromList(list, id, emptyKV));
    };

    return (
        <div>
            <div className="kv-header-row">
                <span />
                <span className="kv-col-label">Key</span>
                <span className="kv-col-label">Value</span>
                <span />
            </div>
            {list.map((item) => (
                <div key={item.id} className="kv-row">
                    <input
                        type="checkbox"
                        checked={item.enabled}
                        onChange={(e) => updateKV(item.id, 'enabled', e.target.checked)}
                        aria-label={`Enable ${item.key || 'row'}`}
                    />
                    <input
                        className="kv-input"
                        value={item.key}
                        onChange={(e) => updateKV(item.id, 'key', e.target.value)}
                        placeholder={keyPlaceholder}
                    />
                    <input
                        className="kv-input"
                        value={item.value}
                        onChange={(e) => updateKV(item.id, 'value', e.target.value)}
                        placeholder={valPlaceholder}
                    />
                    <button type="button" className="rm-btn" onClick={() => removeKV(item.id)} aria-label="Remove row">
                        ×
                    </button>
                </div>
            ))}
        </div>
    );
}
