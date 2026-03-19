import { NetworkBuffer } from './networkBuffer';
import { NetworkEntry } from './types';

let originalFetch: typeof globalThis.fetch | null = null;
let idCounter = 0;

function generateId(): string {
    const random = Math.random().toString(36).substring(2, 6);
    return `sdk-${random}-${++idCounter}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractHeaders(headers?: any): Record<string, string> {
    const result: Record<string, string> = {};

    if (!headers) {
        return result;
    }

    if (typeof headers.forEach === 'function') {
        headers.forEach((value: string, key: string) => {
            result[key] = value;
        });
    } else if (Array.isArray(headers)) {
        for (const [key, value] of headers) {
            result[key] = value;
        }
    } else if (typeof headers === 'object') {
        Object.assign(result, headers);
    }

    return result;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractBody(body?: any): string | undefined {
    if (body == null) {
        return undefined;
    }

    if (typeof body === 'string') {
        return body;
    }

    return '[non-string body]';
}

function responseHeadersToRecord(headers: Headers): Record<string, string> {
    const result: Record<string, string> = {};
    headers.forEach((value, key) => {
        result[key] = value;
    });
    return result;
}

export function patchFetch(buffer: NetworkBuffer): void {
    if (originalFetch) {
        return;
    }

    originalFetch = globalThis.fetch;

    globalThis.fetch = async function patchedFetch(
        input: Parameters<typeof fetch>[0],
        init?: Parameters<typeof fetch>[1],
    ): Promise<Response> {
        const id = generateId();
        const startTime = Date.now();

        let url: string;
        let method: string;
        let requestHeaders: Record<string, string>;
        let requestBody: string | undefined;

        try {
            if (input instanceof Request) {
                url = input.url;
                method = (init?.method || input.method || 'GET').toUpperCase();
                requestHeaders = extractHeaders(init?.headers ?? input.headers);
                requestBody = extractBody(init?.body);
            } else {
                url = typeof input === 'string' ? input : input.toString();
                method = (init?.method || 'GET').toUpperCase();
                requestHeaders = extractHeaders(init?.headers);
                requestBody = extractBody(init?.body);
            }
        } catch {
            url = String(input);
            method = 'GET';
            requestHeaders = {};
            requestBody = undefined;
        }

        const entry: NetworkEntry = {
            id,
            timestamp: startTime,
            method,
            url,
            requestHeaders,
            requestBody,
            responseHeaders: {},
            completed: false,
        };

        buffer.add(entry);

        try {
            const response = await originalFetch!.call(globalThis, input, init);
            const duration = Date.now() - startTime;

            const responseHeaders = responseHeadersToRecord(response.headers);
            const mimeType = response.headers.get('content-type') ?? undefined;

            buffer.update(id, {
                status: response.status,
                statusText: response.statusText,
                duration,
                responseHeaders,
                mimeType,
                completed: true,
            });

            // Capture response body without consuming the original response
            try {
                response.clone().text().then((body) => {
                    buffer.update(id, { responseBody: body });
                }).catch(() => {
                    // ignore body read failures
                });
            } catch {
                // ignore clone failures
            }

            return response;
        } catch (err: unknown) {
            const duration = Date.now() - startTime;
            const errorMessage = err instanceof Error ? err.message : String(err);

            buffer.update(id, {
                error: errorMessage,
                duration,
                completed: true,
            });

            throw err;
        }
    };
}

export function unpatchFetch(): void {
    if (originalFetch) {
        globalThis.fetch = originalFetch;
        originalFetch = null;
    }
    idCounter = 0;
}
