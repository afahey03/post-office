import type { Metadata } from 'next';
import JsonFormatter from '@/components/JsonFormatter';

export const metadata: Metadata = {
    title: 'JSON Formatter | Post Office',
    description: 'Format, validate, and minify JSON with syntax highlighting.',
};

export default function JsonPage() {
    return <JsonFormatter />;
}