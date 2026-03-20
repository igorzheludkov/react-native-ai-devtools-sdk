import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { init, _resetForTesting } from '../src/index';
import { unpatchFetch } from '../src/networkInterceptor';
import { unpatchConsole } from '../src/consoleInterceptor';

function createMockResponse(body: string, init?: ResponseInit): Response {
    return new Response(body, init);
}

describe('integration', () => {
    let mockFetch: ReturnType<typeof jest.fn<typeof globalThis.fetch>>;

    beforeEach(() => {
        unpatchFetch();
        unpatchConsole();
        _resetForTesting();
        mockFetch = jest.fn<typeof globalThis.fetch>();
        globalThis.fetch = mockFetch;
    });

    afterEach(() => {
        unpatchFetch();
        unpatchConsole();
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
        expect(globalThis.__RN_AI_DEVTOOLS__!.version).toBe('0.2.0');

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

    it('exposes stores on the global', () => {
        const mockStore = { getState: () => ({ count: 1 }) };
        init({ stores: { redux: mockStore } });

        expect(globalThis.__RN_AI_DEVTOOLS__!.stores).toBeDefined();
        expect(globalThis.__RN_AI_DEVTOOLS__!.stores.redux).toBe(mockStore);
    });

    it('stores default to empty object when not provided', () => {
        init();

        expect(globalThis.__RN_AI_DEVTOOLS__!.stores).toEqual({});
    });

    it('capabilities reflect config with stores', () => {
        init({ stores: { redux: {} } });

        const caps = globalThis.__RN_AI_DEVTOOLS__!.capabilities;
        expect(caps.network).toBe(true);
        expect(caps.console).toBe(true);
        expect(caps.stores).toBe(true);
        expect(caps.render).toBe(false);
    });

    it('capabilities.stores is false when no stores provided', () => {
        init();

        expect(globalThis.__RN_AI_DEVTOOLS__!.capabilities.stores).toBe(false);
    });

    it('console methods are exposed on global', () => {
        init();

        expect(typeof globalThis.__RN_AI_DEVTOOLS__!.getConsoleLogs).toBe('function');
        expect(typeof globalThis.__RN_AI_DEVTOOLS__!.clearConsole).toBe('function');
    });

    it('captures console logs via global', () => {
        init();

        console.log('integration test log');

        const logs = globalThis.__RN_AI_DEVTOOLS__!.getConsoleLogs();
        // May have more than 1 entry from test framework output,
        // so filter for our specific message
        const ourLog = logs.find((l) => l.message.includes('integration test log'));
        expect(ourLog).toBeDefined();
        expect(ourLog!.level).toBe('log');
    });

    it('clearConsole returns count', () => {
        init();

        console.log('msg1');
        console.warn('msg2');

        const logs = globalThis.__RN_AI_DEVTOOLS__!.getConsoleLogs();
        const count = globalThis.__RN_AI_DEVTOOLS__!.clearConsole();
        expect(count).toBe(logs.length);
        expect(globalThis.__RN_AI_DEVTOOLS__!.getConsoleLogs()).toHaveLength(0);
    });
});
