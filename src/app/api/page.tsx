import type { Metadata } from 'next';
import ApiTester from '@/components/ApiTester';

export const metadata: Metadata = {
    title: 'API Tester | Post Office',
    description: 'Send HTTP requests with params, headers, auth, and inspect responses.',
};

export default function ApiPage() {
    return <ApiTester />;
}