'use client';

import { useEffect, useRef, useState } from 'react';
import CodeMirror from '@uiw/react-codemirror';
import { json } from '@codemirror/lang-json';

interface JsonCodeEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    'aria-label'?: string;
}

export default function JsonCodeEditor({ value, onChange, placeholder, 'aria-label': ariaLabel }: JsonCodeEditorProps) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const [height, setHeight] = useState(320);

    useEffect(() => {
        const el = wrapRef.current;
        if (!el) return;

        const update = () => {
            const next = el.clientHeight;
            if (next > 0) setHeight(next);
        };

        update();
        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    return (
        <div ref={wrapRef} className="json-editor-wrap">
            {height > 0 && (
                <CodeMirror
                    value={value}
                    height={`${height}px`}
                    extensions={[json()]}
                    onChange={onChange}
                    placeholder={placeholder}
                    basicSetup={{
                        lineNumbers: true,
                        foldGutter: true,
                        highlightActiveLine: true,
                    }}
                    aria-label={ariaLabel}
                />
            )}
        </div>
    );
}
