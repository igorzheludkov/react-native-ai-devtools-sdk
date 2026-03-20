export interface InitOptions {
    maxNetworkEntries?: number;
    maxConsoleEntries?: number;
    stores?: Record<string, unknown>;
    navigation?: unknown;
    /** Named references to any additional tools, services, or objects (e.g. AsyncStorage, MMKV, analytics) that don't belong to stores or navigation. */
    custom?: Record<string, unknown>;
}

export interface NetworkEntry {
    id: string;
    timestamp: number;
    method: string;
    url: string;
    status?: number;
    statusText?: string;
    duration?: number;
    requestHeaders: Record<string, string>;
    requestBody?: string;
    responseHeaders: Record<string, string>;
    responseBody?: string;
    mimeType?: string;
    error?: string;
    completed: boolean;
}

export interface NetworkQueryOptions {
    count?: number;
    method?: string;
    urlPattern?: string;
    status?: number;
}

export interface NetworkStats {
    total: number;
    completed: number;
    errors: number;
    avgDuration: number | null;
    byMethod: Record<string, number>;
    byStatus: Record<string, number>;
    byDomain: Record<string, number>;
}

export interface ConsoleEntry {
    id: string;
    timestamp: number;
    level: 'log' | 'warn' | 'error' | 'info' | 'debug';
    message: string;
}

export interface ConsoleQueryOptions {
    count?: number;
    level?: 'log' | 'warn' | 'error' | 'info' | 'debug';
    text?: string;
}

export interface Capabilities {
    network: boolean;
    console: boolean;
    stores: boolean;
    navigation: boolean;
    render: boolean;
}

export interface DevToolsGlobal {
    version: string;
    capabilities: Capabilities;
    stores: Record<string, unknown>;
    navigation: unknown;
    custom: Record<string, unknown>;
    getNetworkRequests: (options?: NetworkQueryOptions) => NetworkEntry[];
    getNetworkRequest: (id: string) => NetworkEntry | null;
    getNetworkStats: () => NetworkStats;
    clearNetwork: () => number;
    getConsoleLogs: (options?: ConsoleQueryOptions) => ConsoleEntry[];
    clearConsole: () => number;
}
