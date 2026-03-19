import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { init, _resetForTesting } from '../src/index';
import { unpatchFetch } from '../src/networkInterceptor';

function createMockResponse(body: string, init?: ResponseInit): Response {
    return new Response(body, init);
}

describe('integration', () => {
    let mockFetch: ReturnType<typeof jest.fn<typeof globalThis.fetch>>;

    beforeEach(() => {
        unpatchFetch();
        _resetForTesting();
        mockFetch = jest.fn<typeof globalThis.fetch>();
        globalThis.fetch = mockFetch;
    });

    afterEach(() => {
        unpatchFetch();
        _resetForTesting();
    });

    it('init() exposes global and captures fetch', async () => {
        mockFetch.mockResolvedValue(
            createMockResponse('{"data":1}', {
                status: 200,
                headers: { 'content-type': 'application/json' },
            }),
        );

        init();

        expect(globalThis.__RN_AI_DEVTOOLS__).toBeDefined();
        expect(globalThis.__RN_AI_DEVTOOLS__!.version).toBe('0.1.0');

        await globalThis.fetch('https://api.example.com/test');

        const requests = globalThis.__RN_AI_DEVTOOLS__!.getNetworkRequests();
        expect(requests).toHaveLength(1);
        expect(requests[0].url).toBe('https://api.example.com/test');
        expect(requests[0].status).toBe(200);

        const stats = globalThis.__RN_AI_DEVTOOLS__!.getNetworkStats();
        expect(stats.total).toBe(1);
    });

    it('init() is idempotent', () => {
        init();
        const first = globalThis.__RN_AI_DEVTOOLS__;

        init();
        expect(globalThis.__RN_AI_DEVTOOLS__).toBe(first);
    });

    it('clearNetwork returns count and empties buffer', async () => {
        mockFetch.mockResolvedValue(
            createMockResponse('ok', { status: 200 }),
        );

        init();
        await globalThis.fetch('https://api.example.com/a');
        await globalThis.fetch('https://api.example.com/b');

        const count = globalThis.__RN_AI_DEVTOOLS__!.clearNetwork();
        expect(count).toBe(2);
        expect(globalThis.__RN_AI_DEVTOOLS__!.getNetworkRequests()).toHaveLength(0);
    });
});
