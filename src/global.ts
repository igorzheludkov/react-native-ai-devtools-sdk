import { NetworkBuffer } from './networkBuffer';
import { DevToolsGlobal, NetworkQueryOptions } from './types';

declare global {
    // eslint-disable-next-line no-var
    var __RN_AI_DEVTOOLS__: DevToolsGlobal | undefined;
}

export function exposeGlobal(buffer: NetworkBuffer): void {
    const devtools: DevToolsGlobal = {
        version: '0.1.0',
        getNetworkRequests: (options?: NetworkQueryOptions) => buffer.query(options),
        getNetworkRequest: (id: string) => buffer.get(id),
        getNetworkStats: () => buffer.getStats(),
        clearNetwork: () => buffer.clear(),
    };

    globalThis.__RN_AI_DEVTOOLS__ = devtools;
}
