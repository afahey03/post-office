/** UTF-8 safe Base64 for Basic auth (btoa only supports Latin1). */
export function encodeBasicAuth(username: string, password: string): string {
    const credentials = `${username}:${password}`;
    const bytes = new TextEncoder().encode(credentials);
    let binary = '';
    bytes.forEach((b) => {
        binary += String.fromCharCode(b);
    });
    return btoa(binary);
}
