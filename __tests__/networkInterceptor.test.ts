import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { NetworkBuffer } from '../src/networkBuffer';
import { patchFetch, unpatchFetch } from '../src/networkInterceptor';

function createMockResponse(body: string, init?: ResponseInit): Response {
    return new Response(body, init);
}

describe('networkInterceptor', () => {
    let buffer: NetworkBuffer;
    let mockFetch: ReturnType<typeof jest.fn<typeof globalThis.fetch>>;

    beforeEach(() => {
        unpatchFetch();
        buffer = new NetworkBuffer();
        mockFetch = jest.fn<typeof globalThis.fetch>();
        globalThis.fetch = mockFetch;
    });

    afterEach(() => {
        unpatchFetch();
    });

    it('captures GET request', async () => {
        mockFetch.mockResolvedValue(
            createMockResponse('{"ok":true}', {
                status: 200,
                statusText: 'OK',
                headers: { 'content-type': 'application/json' },
            }),
        );

        patchFetch(buffer);
        await globalThis.fetch('https://api.example.com/data');

        const entries = buffer.query();
        expect(entries).toHaveLength(1);
        expect(entries[0].method).toBe('GET');
        expect(entries[0].url).toBe('https://api.example.com/data');
        expect(entries[0].status).toBe(200);
        expect(entries[0].completed).toBe(true);
        expect(entries[0].mimeType).toBe('application/json');
    });

    it('captures POST with body', async () => {
        mockFetch.mockResolvedValue(
            createMockResponse('created', { status: 201 }),
        );

        patchFetch(buffer);
        await globalThis.fetch('https://api.example.com/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'test' }),
        });

        const entries = buffer.query();
        expect(entries).toHaveLength(1);
        expect(entries[0].method).toBe('POST');
        expect(entries[0].requestBody).toBe('{"name":"test"}');
        expect(entries[0].requestHeaders['Content-Type']).toBe('application/json');
    });

    it('captures fetch errors', async () => {
        mockFetch.mockRejectedValue(new Error('Network failure'));

        patchFetch(buffer);

        await expect(
            globalThis.fetch('https://api.example.com/fail'),
        ).rejects.toThrow('Network failure');

        const entries = buffer.query();
        expect(entries).toHaveLength(1);
        expect(entries[0].error).toBe('Network failure');
        expect(entries[0].completed).toBe(true);
        expect(entries[0].duration).toBeGreaterThanOrEqual(0);
    });

    it('does not break original response', async () => {
        mockFetch.mockResolvedValue(
            createMockResponse('response body', { status: 200 }),
        );

        patchFetch(buffer);
        const response = await globalThis.fetch('https://api.example.com/data');

        // Consumer can still read the body
        const text = await response.text();
        expect(text).toBe('response body');
    });

    it('unpatchFetch restores original', async () => {
        const original = globalThis.fetch;
        patchFetch(buffer);

        expect(globalThis.fetch).not.toBe(original);

        unpatchFetch();
        expect(globalThis.fetch).toBe(original);
    });

    it('captures response body via clone', async () => {
        mockFetch.mockResolvedValue(
            createMockResponse('cloned body', { status: 200 }),
        );

        patchFetch(buffer);
        await globalThis.fetch('https://api.example.com/data');

        // Wait for async body capture
        await new Promise((resolve) => setTimeout(resolve, 10));

        const entries = buffer.query();
        expect(entries[0].responseBody).toBe('cloned body');
    });
});
