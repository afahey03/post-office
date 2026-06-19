'use client';

import { useApiTester } from '@/hooks/useApiTester';
import ApiToolbar from '@/components/api-tester/ApiToolbar';
import RequestPanel from '@/components/api-tester/RequestPanel';
import ResponsePanel from '@/components/api-tester/ResponsePanel';

export default function ApiTester() {
    const state = useApiTester();

    return (
        <div className="tool-shell tool-shell-flex">
            <ApiToolbar state={state} />
            <div className="split-2-tight split-fill">
                <RequestPanel state={state} />
                <ResponsePanel state={state} />
            </div>
        </div>
    );
}
