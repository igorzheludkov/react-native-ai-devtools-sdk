import { NetworkBuffer } from './networkBuffer';
import { patchFetch } from './networkInterceptor';
import { exposeGlobal } from './global';
import { InitOptions } from './types';

export type {
    InitOptions,
    NetworkEntry,
    NetworkQueryOptions,
    NetworkStats,
    DevToolsGlobal,
} from './types';

let initialized = false;

declare const __DEV__: boolean | undefined;

export function init(options?: InitOptions): void {
    if (initialized) {
        return;
    }

    // Safety net: no-op in production
    if (typeof __DEV__ !== 'undefined' && !__DEV__) {
        return;
    }

    const maxSize = options?.maxNetworkEntries ?? 500;
    const buffer = new NetworkBuffer(maxSize);

    patchFetch(buffer);
    exposeGlobal(buffer);

    initialized = true;
}

// Exported for testing purposes
export function _resetForTesting(): void {
    initialized = false;
    delete globalThis.__RN_AI_DEVTOOLS__;
}
