export interface InitOptions {
    maxNetworkEntries?: number;
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

export interface DevToolsGlobal {
    version: string;
    getNetworkRequests: (options?: NetworkQueryOptions) => NetworkEntry[];
    getNetworkRequest: (id: string) => NetworkEntry | null;
    getNetworkStats: () => NetworkStats;
    clearNetwork: () => number;
}
