import { NetworkBuffer } from './networkBuffer';
import { ConsoleBuffer } from './consoleBuffer';
import { DevToolsGlobal, NetworkQueryOptions, ConsoleQueryOptions, Capabilities } from './types';

declare global {
    // eslint-disable-next-line no-var
    var __RN_AI_DEVTOOLS__: DevToolsGlobal | undefined;
}

export interface ExposeGlobalOptions {
    networkBuffer: NetworkBuffer;
    consoleBuffer: ConsoleBuffer;
    stores: Record<string, unknown>;
    navigation: unknown;
    custom: Record<string, unknown>;
    capabilities: Capabilities;
}

export function exposeGlobal(options: ExposeGlobalOptions): void {
    const { networkBuffer, consoleBuffer, stores, navigation, custom, capabilities } = options;

    const devtools: DevToolsGlobal = {
        version: '0.2.0',
        capabilities,
        stores,
        navigation,
        custom,
        getNetworkRequests: (opts?: NetworkQueryOptions) => networkBuffer.query(opts),
        getNetworkRequest: (id: string) => networkBuffer.get(id),
        getNetworkStats: () => networkBuffer.getStats(),
        clearNetwork: () => networkBuffer.clear(),
        getConsoleLogs: (opts?: ConsoleQueryOptions) => consoleBuffer.query(opts),
        clearConsole: () => consoleBuffer.clear(),
    };

    globalThis.__RN_AI_DEVTOOLS__ = devtools;
}
