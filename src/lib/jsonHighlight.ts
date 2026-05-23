const TOKEN_RE =
    /("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/g;

function classifyToken(match: string): string {
    if (/^"/.test(match)) return /:$/.test(match) ? 'json-key' : 'json-string';
    if (/true|false/.test(match)) return 'json-bool';
    if (/null/.test(match)) return 'json-null';
    return 'json-number';
}

function escapeHtml(text: string): string {
    return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/** HTML-safe syntax highlighting for JSON text (output must use dangerouslySetInnerHTML). */
export function syntaxHighlight(json: string, options?: { prettify?: boolean }): string {
    let source = json;
    if (options?.prettify) {
        try {
            source = JSON.stringify(JSON.parse(json), null, 2);
        } catch {
            /* keep raw */
        }
    }
    const escaped = escapeHtml(source);
    return escaped.replace(TOKEN_RE, (match) => {
        const cls = classifyToken(match);
        return `<span class="${cls}">${match}</span>`;
    });
}

export function isJsonString(value: string): boolean {
    try {
        JSON.parse(value);
        return true;
    } catch {
        return false;
    }
}
