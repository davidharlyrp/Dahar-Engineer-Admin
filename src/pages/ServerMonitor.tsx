import { useState, useEffect } from "react";
import { Activity, Server, CheckCircle2, XCircle, Clock } from "lucide-react";
import { cn } from "../lib/utils";

interface ServerConfig {
    name: string;
    url: string;
}

interface ServerStatus {
    config: ServerConfig;
    isOnline: boolean;
    ping: number | null;
    lastChecked: Date;
    data?: any;
    error?: string;
}

export function ServerMonitor() {
    const [servers, setServers] = useState<ServerStatus[]>([]);
    const [isChecking, setIsChecking] = useState(false);

    // Parse the servers from the .env variable
    const getServersFromEnv = (): ServerConfig[] => {
        const envStr = import.meta.env.VITE_MONITOR_SERVERS || "";
        if (!envStr) return [];

        return envStr.split(",").map((item: string) => {
            const [name, url] = item.split("|");
            return { name: name?.trim(), url: url?.trim() };
        }).filter((config: ServerConfig) => config.name && config.url);
    };

    const checkServerStatus = async (config: ServerConfig): Promise<ServerStatus> => {
        const startTime = Date.now();
        try {
            const response = await fetch(config.url);
            const ping = Date.now() - startTime;

            let data;
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
                data = await response.json();
            }

            return {
                config,
                isOnline: response.ok,
                ping,
                data,
                lastChecked: new Date()
            };
        } catch (error) {
            return {
                config,
                isOnline: false,
                ping: null,
                lastChecked: new Date(),
                error: (error as Error).message
            };
        }
    };

    const pollAllServers = async () => {
        setIsChecking(true);
        const configs = getServersFromEnv();
        if (configs.length === 0) {
            setServers([]);
            setIsChecking(false);
            return;
        }

        const promises = configs.map(config => checkServerStatus(config));
        const results = await Promise.all(promises);

        setServers(results);
        setIsChecking(false);
    };

    useEffect(() => {
        // Initial poll
        pollAllServers();

        // Poll every 60 seconds
        const interval = setInterval(() => {
            pollAllServers();
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const configs = getServersFromEnv();

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                        Server Monitor
                    </h1>
                </div>
                <button
                    onClick={pollAllServers}
                    disabled={isChecking}
                    className="inline-flex items-center justify-center rounded-md bg-slate-900 dark:bg-slate-100 px-4 py-2 text-sm font-medium text-white dark:text-slate-900 hover:bg-black dark:hover:bg-white transition-colors shadow-sm disabled:opacity-50"
                >
                    <Activity className={cn("w-4 h-4 mr-2", isChecking && "animate-pulse")} />
                    {isChecking ? "Checking..." : "Refresh"}
                </button>
            </div>

            {configs.length === 0 ? (
                <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-12 flex flex-col items-center justify-center text-center transition-colors">
                    <div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-full mb-6">
                        <Server className="w-12 h-12 text-slate-300 dark:text-slate-700" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">No servers configured</h2>
                    <p className="text-slate-500 dark:text-slate-400 max-w-md mb-8">
                        Please add the VITE_MONITOR_SERVERS variable to your .env file in the format "Name|URL,Name2|URL2".
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {servers.map((server, index) => (
                        <div
                            key={`${server.config.url}-${index}`}
                            className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col"
                        >
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className={cn(
                                        "p-2 rounded-lg",
                                        server.isOnline ? "bg-slate-100 dark:bg-slate-800" : "bg-slate-200 dark:bg-slate-700"
                                    )}>
                                        <Server className={cn(
                                            "w-6 h-6",
                                            server.isOnline ? "text-slate-900 dark:text-slate-100" : "text-slate-500 dark:text-slate-400"
                                        )} />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100">
                                            {server.config.name}
                                        </h3>
                                        <a
                                            href={server.config.url}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 underline truncate max-w-[200px] block transition-colors"
                                        >
                                            {server.config.url}
                                        </a>
                                    </div>
                                </div>
                                <div className={cn(
                                    "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
                                    server.isOnline
                                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                        : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                                )}>
                                    {server.isOnline ? (
                                        <>
                                            <CheckCircle2 className="w-3 h-3" />
                                            Online
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="w-3 h-3" />
                                            Offline
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Display JSON Data */}
                            {server.data && (
                                <div className="mt-2 mb-4">
                                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-lg p-3 overflow-x-auto border border-slate-200 dark:border-slate-700">
                                        <pre className="text-[10px] text-slate-700 dark:text-slate-400 font-mono">
                                            {JSON.stringify(server.data, null, 2)}
                                        </pre>
                                    </div>
                                </div>
                            )}
                            {server.error && !server.data && (
                                <div className="mt-2 mb-4">
                                    <div className="bg-slate-100 dark:bg-slate-800/80 rounded-lg p-3 border border-slate-300 dark:border-slate-600">
                                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-3">
                                            {server.error}
                                        </p>
                                    </div>
                                </div>
                            )}

                            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between text-sm">
                                <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
                                    <Clock className="w-4 h-4" />
                                    <span>
                                        {server.ping !== null ? `${server.ping}ms` : 'Timeout'}
                                    </span>
                                </div>
                                <span className="text-slate-400 dark:text-slate-500 text-xs text-right">
                                    Checked: {server.lastChecked.toLocaleTimeString()}
                                </span>
                            </div>
                        </div>
                    ))}
                    {/* Render skeletons for pending checks */}
                    {isChecking && servers.length === 0 && configs.map((_, idx) => (
                        <div key={idx} className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-6 shadow-sm animate-pulse flex flex-col h-[150px]">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg" />
                                    <div className="space-y-2">
                                        <div className="w-24 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                                        <div className="w-32 h-3 bg-slate-200 dark:bg-slate-700 rounded" />
                                    </div>
                                </div>
                                <div className="w-16 h-6 bg-slate-200 dark:bg-slate-700 rounded-full" />
                            </div>
                            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                <div className="w-12 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                                <div className="w-20 h-4 bg-slate-200 dark:bg-slate-700 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
