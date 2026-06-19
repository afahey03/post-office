'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import {
    applyVariablesToRows,
    buildRequestHeaders,
    resolveAbsoluteBase,
    resolveRequestUrl,
    type HttpMethod,
    type AuthType,
    type BodyContentType,
} from '@/lib/apiRequest';
import { buildUrlWithParams } from '@/lib/buildUrl';
import { copyToClipboard } from '@/lib/copyToClipboard';
import { parseCurlCommand, requestToCurl } from '@/lib/curl';
import {
    buildExportBundle,
    downloadJsonFile,
    parseImportBundle,
} from '@/lib/collectionExport';
import {
    buildVariableMap,
    loadActiveEnvironmentId,
    loadEnvironments,
    saveActiveEnvironmentId,
    saveEnvironments,
    substituteVariables,
    type Environment,
} from '@/lib/environments';
import {
    clearApiHistory,
    loadApiCollections,
    loadApiHistory,
    loadApiState,
    normalizeSnapshot,
    pushApiHistoryEntry,
    saveApiCollections,
    saveApiState,
    type ApiHistoryEntry,
    type RequestSnapshot,
    type SavedRequestCollection,
} from '@/lib/apiStorage';
import {
    activeCount,
    appendBlankRow,
    clampTimeoutMs,
    DEFAULT_TIMEOUT_MS,
    formatSize,
    makeSnapshot,
    PRESETS,
    uid,
} from '@/lib/apiTesterUtils';
import {
    buildBrowserFormData,
    emptyFormField,
    hasMultipartBody,
    readFileAsBase64,
    rowsFromFormSnapshots,
    serializeMultipartForProxy,
    snapshotFormFields,
    type FormFieldRow,
} from '@/lib/multipart';
import { isJsonString } from '@/lib/jsonHighlight';
import { emptyKV, rowsToKV, type ApiResponse, type KeyValue, type ResponseTab, type TabKey } from '@/components/api-tester/types';

function readInitialSaved() {
    return loadApiState();
}

export function useApiTester() {
    const abortRef = useRef<AbortController | null>(null);
    const sendShortcutRef = useRef<() => Promise<void>>(async () => {});
    const copyShortcutRef = useRef<() => Promise<void>>(async () => {});
    const importInputRef = useRef<HTMLInputElement | null>(null);
    const saved = readInitialSaved();

    const [method, setMethod] = useState<HttpMethod>(() => (saved?.method as HttpMethod) || 'GET');
    const [url, setUrl] = useState(() => saved?.url || '');
    const [useProxy, setUseProxy] = useState(() => saved?.useProxy ?? false);
    const [tab, setTab] = useState<TabKey>('params');
    const [respTab, setRespTab] = useState<ResponseTab>('body');
    const [params, setParams] = useState<KeyValue[]>(() => (saved?.params ? rowsToKV(saved.params) : [emptyKV()]));
    const [headers, setHeaders] = useState<KeyValue[]>(() => (saved?.headers ? rowsToKV(saved.headers) : [emptyKV()]));
    const [body, setBody] = useState(() => saved?.body ?? '');
    const [bodyContentType, setBodyContentType] = useState<BodyContentType>(
        () => (saved?.bodyContentType as BodyContentType) || 'application/json',
    );
    const [formFields, setFormFields] = useState<FormFieldRow[]>(() =>
        saved?.formFields ? rowsFromFormSnapshots(saved.formFields) : [emptyFormField()],
    );
    const [authType, setAuthType] = useState<AuthType>(() => (saved?.authType as AuthType) || 'none');
    const [bearerToken, setBearerToken] = useState('');
    const [basicUser, setBasicUser] = useState('');
    const [basicPass, setBasicPass] = useState('');
    const [apiKey, setApiKey] = useState('');
    const [apiKeyHeader, setApiKeyHeader] = useState(() => saved?.apiKeyHeader || 'X-API-Key');
    const [timeoutMs, setTimeoutMs] = useState(() => clampTimeoutMs(saved?.timeoutMs ?? DEFAULT_TIMEOUT_MS));
    const [loading, setLoading] = useState(false);
    const [response, setResponse] = useState<ApiResponse | null>(null);
    const [error, setError] = useState('');
    const [history, setHistory] = useState<ApiHistoryEntry[]>(() => loadApiHistory());
    const [collections, setCollections] = useState<SavedRequestCollection[]>(() => loadApiCollections());
    const [selectedCollectionId, setSelectedCollectionId] = useState('');
    const [collectionName, setCollectionName] = useState('');
    const [curlInput, setCurlInput] = useState('');
    const [responsePretty, setResponsePretty] = useState(true);
    const [responseCopyState, setResponseCopyState] = useState<'idle' | 'ok' | 'error'>('idle');
    const [curlCopyState, setCurlCopyState] = useState<'idle' | 'ok' | 'error'>('idle');
    const [environments, setEnvironments] = useState<Environment[]>(() => loadEnvironments());
    const [activeEnvironmentId, setActiveEnvironmentId] = useState(() => loadActiveEnvironmentId());
    const [showEnvEditor, setShowEnvEditor] = useState(false);

    const activeEnvironment = environments.find((e) => e.id === activeEnvironmentId) ?? null;
    const variableMap = buildVariableMap(activeEnvironment);

    useEffect(() => {
        saveApiState({
            method,
            url,
            params: params.map(({ key, value, enabled }) => ({ key, value, enabled })),
            headers: headers.map(({ key, value, enabled }) => ({ key, value, enabled })),
            body,
            bodyContentType,
            formFields: snapshotFormFields(formFields),
            authType,
            apiKeyHeader,
            useProxy,
            timeoutMs,
        });
    }, [method, url, params, headers, body, bodyContentType, formFields, authType, apiKeyHeader, useProxy, timeoutMs]);

    useEffect(() => {
        saveApiCollections(collections);
    }, [collections]);

    useEffect(() => {
        saveEnvironments(environments);
    }, [environments]);

    useEffect(() => {
        saveActiveEnvironmentId(activeEnvironmentId);
    }, [activeEnvironmentId]);

    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    const targetUrl = useCallback(() => {
        const resolvedUrl = substituteVariables(url, variableMap);
        const resolvedParams = applyVariablesToRows(
            params.map(({ key, value, enabled }) => ({ key, value, enabled })),
            variableMap,
        );
        return buildUrlWithParams(resolveAbsoluteBase(resolvedUrl, origin), resolvedParams);
    }, [url, params, origin, variableMap]);

    const cancel = () => {
        abortRef.current?.abort();
        abortRef.current = null;
        setLoading(false);
    };

    const applySnapshot = useCallback((raw: Partial<RequestSnapshot>) => {
        const snapshot = normalizeSnapshot(raw);
        setMethod((snapshot.method as HttpMethod) || 'GET');
        setUrl(snapshot.url || '');
        setParams(rowsToKV(appendBlankRow(snapshot.params || [])));
        setHeaders(rowsToKV(appendBlankRow(snapshot.headers || [])));
        setBody(snapshot.body || '');
        setBodyContentType((snapshot.bodyContentType as BodyContentType) || 'application/json');
        setFormFields(rowsFromFormSnapshots(snapshot.formFields || []));
        setAuthType((snapshot.authType as AuthType) || 'none');
        setApiKeyHeader(snapshot.apiKeyHeader || 'X-API-Key');
        setUseProxy(Boolean(snapshot.useProxy));
        setTimeoutMs(clampTimeoutMs(snapshot.timeoutMs ?? DEFAULT_TIMEOUT_MS));
    }, []);

    const snapshot = useCallback(() => {
        return makeSnapshot({
            method,
            url,
            params,
            headers,
            body,
            bodyContentType,
            formFields,
            authType,
            apiKeyHeader,
            useProxy,
            timeoutMs,
        });
    }, [method, url, params, headers, body, bodyContentType, formFields, authType, apiKeyHeader, useProxy, timeoutMs]);

    const trackApiTest = useCallback(async () => {
        try {
            await fetch('/api/track/api-test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ source: 'api-tester' }),
            });
        } catch {
            /* best-effort */
        }
    }, []);

    const send = useCallback(async () => {
        const finalTarget = targetUrl();
        if (!finalTarget) return;

        abortRef.current?.abort();
        const controller = new AbortController();
        abortRef.current = controller;
        const timeout = window.setTimeout(() => controller.abort(), timeoutMs);

        setLoading(true);
        setError('');
        setResponse(null);
        const start = performance.now();

        const isMultipart = bodyContentType === 'multipart/form-data';
        const resolvedBody = substituteVariables(body, variableMap);
        const resolvedFormFields = formFields.map((field) => ({
            ...field,
            key: substituteVariables(field.key, variableMap),
            value: substituteVariables(field.value, variableMap),
        }));
        const hasTextBody = !['GET', 'HEAD'].includes(method) && resolvedBody.length > 0 && !isMultipart;
        const hasFormBody = !['GET', 'HEAD'].includes(method) && isMultipart && hasMultipartBody(resolvedFormFields);
        const hasBody = hasTextBody || hasFormBody;
        const contentType = hasBody ? bodyContentType : 'none';

        const resolvedHeaderRows = applyVariablesToRows(
            headers.map(({ key, value, enabled }) => ({ key, value, enabled })),
            variableMap,
        );

        const reqHeaders = buildRequestHeaders(
            resolvedHeaderRows,
            { type: authType, bearerToken, basicUser, basicPass, apiKey, apiKeyHeader },
            contentType,
            hasBody,
        );

        const resolvedParams = applyVariablesToRows(
            params.map(({ key, value, enabled }) => ({ key, value, enabled })),
            variableMap,
        );
        const { fetchUrl, targetUrl: resolvedTarget } = resolveRequestUrl(
            url,
            resolvedParams,
            useProxy,
            origin,
            variableMap,
        );

        try {
            let finalStatus = 0;

            if (useProxy) {
                const proxyPayload: Record<string, unknown> = {
                    url: resolvedTarget,
                    method,
                    headers: reqHeaders,
                    timeoutMs,
                };

                if (hasFormBody) {
                    proxyPayload.bodyMode = 'multipart';
                    proxyPayload.multipart = serializeMultipartForProxy(resolvedFormFields);
                } else if (hasTextBody) {
                    proxyPayload.body = resolvedBody;
                }

                const res = await fetch(fetchUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(proxyPayload),
                    signal: controller.signal,
                });
                const payload = await res.json();
                if (!res.ok) {
                    throw new Error(payload.error || `Proxy error (${res.status})`);
                }
                finalStatus = payload.status;
                setResponse({
                    status: payload.status,
                    statusText: payload.statusText,
                    headers: payload.headers,
                    body: payload.body,
                    time: Math.round(performance.now() - start),
                    size: formatSize(payload.body),
                });
            } else {
                const directUrl = targetUrl();
                const opts: RequestInit = { method, headers: reqHeaders, signal: controller.signal };
                if (hasFormBody) {
                    opts.body = await buildBrowserFormData(resolvedFormFields);
                } else if (hasTextBody) {
                    opts.body = resolvedBody;
                }
                const res = await fetch(directUrl, opts);
                const elapsed = Math.round(performance.now() - start);
                const text = await res.text();
                const resHeaders: Record<string, string> = {};
                res.headers.forEach((v, k) => {
                    resHeaders[k] = v;
                });
                finalStatus = res.status;
                setResponse({
                    status: res.status,
                    statusText: res.statusText,
                    headers: resHeaders,
                    body: text,
                    time: elapsed,
                    size: formatSize(text),
                });
            }

            setRespTab('body');
            pushApiHistoryEntry({
                id: uid(),
                timestamp: new Date().toISOString(),
                status: finalStatus,
                durationMs: Math.round(performance.now() - start),
                snapshot: snapshot(),
            });
            setHistory(loadApiHistory());
            void trackApiTest();
        } catch (e) {
            const failEntry = {
                id: uid(),
                timestamp: new Date().toISOString(),
                status: 0,
                durationMs: Math.round(performance.now() - start),
                snapshot: snapshot(),
            };
            if ((e as Error).name === 'AbortError') {
                setError('Request timed out or was cancelled');
            } else {
                setError((e as Error).message);
            }
            pushApiHistoryEntry(failEntry);
            setHistory(loadApiHistory());
        } finally {
            window.clearTimeout(timeout);
            if (abortRef.current === controller) {
                abortRef.current = null;
                setLoading(false);
            }
        }
    }, [
        targetUrl,
        timeoutMs,
        method,
        body,
        bodyContentType,
        formFields,
        headers,
        authType,
        bearerToken,
        basicUser,
        basicPass,
        apiKey,
        apiKeyHeader,
        url,
        params,
        useProxy,
        origin,
        snapshot,
        trackApiTest,
        variableMap,
    ]);

    const copyResponseBody = useCallback(async () => {
        if (!response) return;
        const ok = await copyToClipboard(response.body);
        setResponseCopyState(ok ? 'ok' : 'error');
        window.setTimeout(() => setResponseCopyState('idle'), 1200);
    }, [response]);

    useEffect(() => {
        sendShortcutRef.current = send;
        copyShortcutRef.current = copyResponseBody;
    }, [send, copyResponseBody]);

    const downloadResponseBody = () => {
        if (!response) return;
        const isJson = isJsonString(response.body);
        let content = response.body;
        if (isJson && responsePretty) {
            try {
                content = JSON.stringify(JSON.parse(response.body), null, 2);
            } catch {
                content = response.body;
            }
        }
        const ext = isJson ? 'json' : 'txt';
        const blob = new Blob([content], { type: isJson ? 'application/json' : 'text/plain' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `response-${Date.now()}.${ext}`;
        link.click();
        URL.revokeObjectURL(link.href);
    };

    const saveCurrentCollection = () => {
        const name = collectionName.trim();
        if (!name) return;
        setCollections((current) => [
            { id: uid(), name, createdAt: new Date().toISOString(), snapshot: snapshot() },
            ...current,
        ]);
        setCollectionName('');
    };

    const removeSelectedCollection = () => {
        if (!selectedCollectionId) return;
        setCollections((current) => current.filter((item) => item.id !== selectedCollectionId));
        setSelectedCollectionId('');
    };

    const clearAllCollections = () => {
        setCollections([]);
        setSelectedCollectionId('');
    };

    const exportCollections = () => {
        downloadJsonFile(
            `post-office-export-${Date.now()}.json`,
            buildExportBundle(collections, environments, activeEnvironmentId),
        );
    };

    const importCollections = async (file: File) => {
        const text = await file.text();
        const bundle = parseImportBundle(text);
        setCollections(bundle.collections);
        setEnvironments(bundle.environments);
        setActiveEnvironmentId(bundle.activeEnvironmentId);
        setSelectedCollectionId('');
        setError('');
    };

    const importCurl = () => {
        try {
            const parsed = parseCurlCommand(curlInput);
            setMethod(parsed.method);
            setUrl(parsed.url);
            setHeaders(rowsToKV(appendBlankRow(parsed.headers)));
            setBody(parsed.body);
            setBodyContentType(parsed.bodyContentType);
            setTab('headers');
            setError('');
        } catch (e) {
            setError((e as Error).message);
        }
    };

    const copyCurl = async () => {
        const ok = await copyToClipboard(requestToCurl(snapshot()));
        setCurlCopyState(ok ? 'ok' : 'error');
        window.setTimeout(() => setCurlCopyState('idle'), 1200);
    };

    const loadPreset = (preset: (typeof PRESETS)[0]) => {
        setMethod(preset.method);
        setUrl(preset.url);
        setParams([emptyKV()]);
        if (preset.relative) setUseProxy(false);
    };

    const handleFormFile = async (id: string, file: File | null) => {
        if (!file) return;
        const base64 = await readFileAsBase64(file);
        setFormFields((current) =>
            current.map((field) =>
                field.id === id
                    ? {
                          ...field,
                          type: 'file',
                          fileName: file.name,
                          fileMimeType: file.type || 'application/octet-stream',
                          fileDataBase64: base64,
                          value: '',
                      }
                    : field,
            ),
        );
    };

    useEffect(() => {
        const onKeyDown = (event: KeyboardEvent) => {
            if (!(event.ctrlKey || event.metaKey)) return;
            if (event.key === 'Enter' && !loading && url.trim()) {
                event.preventDefault();
                void sendShortcutRef.current();
                return;
            }
            if (event.shiftKey && event.key.toLowerCase() === 'c' && response) {
                event.preventDefault();
                void copyShortcutRef.current();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [loading, url, response]);

    return {
        method,
        setMethod,
        url,
        setUrl,
        useProxy,
        setUseProxy,
        tab,
        setTab,
        respTab,
        setRespTab,
        params,
        setParams,
        headers,
        setHeaders,
        body,
        setBody,
        bodyContentType,
        setBodyContentType,
        formFields,
        setFormFields,
        authType,
        setAuthType,
        bearerToken,
        setBearerToken,
        basicUser,
        setBasicUser,
        basicPass,
        setBasicPass,
        apiKey,
        setApiKey,
        apiKeyHeader,
        setApiKeyHeader,
        timeoutMs,
        setTimeoutMs,
        loading,
        response,
        error,
        history,
        collections,
        selectedCollectionId,
        setSelectedCollectionId,
        collectionName,
        setCollectionName,
        curlInput,
        setCurlInput,
        responsePretty,
        setResponsePretty,
        responseCopyState,
        curlCopyState,
        environments,
        setEnvironments,
        activeEnvironmentId,
        setActiveEnvironmentId,
        activeEnvironment,
        showEnvEditor,
        setShowEnvEditor,
        importInputRef,
        built: targetUrl(),
        displayUrl: url.trim(),
        methodSkipsBody: ['GET', 'HEAD'].includes(method),
        activeCount,
        cancel,
        send,
        applySnapshot,
        copyResponseBody,
        downloadResponseBody,
        saveCurrentCollection,
        removeSelectedCollection,
        clearAllCollections,
        exportCollections,
        importCollections,
        importCurl,
        copyCurl,
        loadPreset,
        handleFormFile,
        clearHistory: () => {
            clearApiHistory();
            setHistory([]);
        },
    };
}

export type ApiTesterState = ReturnType<typeof useApiTester>;
