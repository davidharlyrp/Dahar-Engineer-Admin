import { useState, useEffect, useRef } from "react";
import {
    Activity,
    Server,
    CheckCircle2,
    XCircle,
    Clock,
    Play,
    Square,
    RotateCcw,
    Loader2,
    Terminal,
    X,
    Container
} from "lucide-react";
import { cn } from "../lib/utils";
import { pb } from "../lib/pb";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

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

interface DockerContainer {
    id: string;
    name: string;
    image: string;
    status: string;
    state: string;
    ports: Record<string, any>;
    created: string;
}

// ---------------------------------------------------------------------------
// Control API helper
// ---------------------------------------------------------------------------

const CONTROL_API = import.meta.env.VITE_CONTROL_API_URL || "";

async function controlApiFetch(path: string, options?: RequestInit) {
    const token = pb.authStore.token;
    const res = await fetch(`${CONTROL_API}${path}`, {
        ...options,
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
            ...(options?.headers || {}),
        },
    });
    if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || `Request failed (${res.status})`);
    }
    return res.json();
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ServerMonitor() {
    const [servers, setServers] = useState<ServerStatus[]>([]);
    const [isChecking, setIsChecking] = useState(false);

    // Docker state
    const [containers, setContainers] = useState<DockerContainer[]>([]);
    const [isLoadingContainers, setIsLoadingContainers] = useState(false);
    const [containerError, setContainerError] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<string | null>(null); // "name:action"
    const [logContainer, setLogContainer] = useState<string | null>(null);

    // ---- Server health polling ----

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

    // ---- Docker containers ----

    const fetchContainers = async () => {
        if (!CONTROL_API) return;
        setIsLoadingContainers(true);
        setContainerError(null);
        try {
            const data = await controlApiFetch("/containers");
            setContainers(data);
        } catch (err) {
            setContainerError((err as Error).message);
        } finally {
            setIsLoadingContainers(false);
        }
    };

    const handleContainerAction = async (name: string, action: "start" | "stop" | "restart") => {
        setActionLoading(`${name}:${action}`);
        try {
            await controlApiFetch(`/containers/${name}/action`, {
                method: "POST",
                body: JSON.stringify({ action }),
            });
            // Re-fetch container list after action
            await fetchContainers();
        } catch (err) {
            alert(`Failed to ${action} "${name}": ${(err as Error).message}`);
        } finally {
            setActionLoading(null);
        }
    };

    useEffect(() => {
        pollAllServers();
        fetchContainers();

        const interval = setInterval(() => {
            pollAllServers();
            fetchContainers();
        }, 60000);

        return () => clearInterval(interval);
    }, []);

    const configs = getServersFromEnv();

    return (
        <div className="space-y-8">
            {/* ============================================================ */}
            {/* Server Health Section                                        */}
            {/* ============================================================ */}
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            Server Monitor
                        </h1>
                    </div>
                    <button
                        onClick={() => { pollAllServers(); fetchContainers(); }}
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

            {/* ============================================================ */}
            {/* Docker Containers Section                                    */}
            {/* ============================================================ */}
            {CONTROL_API && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <Container className="w-5 h-5 text-slate-500" />
                            Docker Containers
                        </h2>
                    </div>

                    {containerError && (
                        <div className="p-3 bg-slate-100 dark:bg-slate-800/80 border border-slate-300 dark:border-slate-600 rounded-lg text-sm text-slate-600 dark:text-slate-400">
                            {containerError}
                        </div>
                    )}

                    {isLoadingContainers && containers.length === 0 ? (
                        <div className="flex items-center justify-center py-12 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl">
                            <Loader2 className="w-6 h-6 text-slate-500 animate-spin" />
                        </div>
                    ) : containers.length === 0 && !containerError ? (
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-8 text-center text-slate-500 dark:text-slate-400">
                            No containers found.
                        </div>
                    ) : (
                        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-sm overflow-hidden transition-colors">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                        <tr>
                                            <th className="px-6 py-3 font-medium">Container</th>
                                            <th className="px-6 py-3 font-medium">Image</th>
                                            <th className="px-6 py-3 font-medium">Status</th>
                                            <th className="px-6 py-3 font-medium text-right">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                                        {containers.map((c) => {
                                            const isRunning = c.state === "running";
                                            return (
                                                <tr key={c.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-700/50 transition-colors">
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={cn(
                                                                "w-2 h-2 rounded-full shrink-0",
                                                                isRunning ? "bg-emerald-500" : "bg-slate-400"
                                                            )} />
                                                            <span className="font-medium text-slate-900 dark:text-slate-100">
                                                                {c.name}
                                                            </span>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 text-slate-500 dark:text-slate-400 max-w-xs truncate font-mono text-xs">
                                                        {c.image}
                                                    </td>
                                                    <td className="px-6 py-4">
                                                        <span className={cn(
                                                            "px-2 py-0.5 rounded-full text-[10px] font-medium",
                                                            isRunning
                                                                ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                                                                : "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-400"
                                                        )}>
                                                            {c.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            {!isRunning && (
                                                                <button
                                                                    onClick={() => handleContainerAction(c.name, "start")}
                                                                    disabled={!!actionLoading}
                                                                    className="p-1.5 text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-md transition-colors disabled:opacity-50"
                                                                    title="Start"
                                                                >
                                                                    {actionLoading === `${c.name}:start`
                                                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                                                        : <Play className="w-4 h-4" />}
                                                                </button>
                                                            )}
                                                            {isRunning && (
                                                                <button
                                                                    onClick={() => handleContainerAction(c.name, "stop")}
                                                                    disabled={!!actionLoading}
                                                                    className="p-1.5 text-slate-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md transition-colors disabled:opacity-50"
                                                                    title="Stop"
                                                                >
                                                                    {actionLoading === `${c.name}:stop`
                                                                        ? <Loader2 className="w-4 h-4 animate-spin" />
                                                                        : <Square className="w-4 h-4" />}
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleContainerAction(c.name, "restart")}
                                                                disabled={!!actionLoading}
                                                                className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors disabled:opacity-50"
                                                                title="Restart"
                                                            >
                                                                {actionLoading === `${c.name}:restart`
                                                                    ? <Loader2 className="w-4 h-4 animate-spin" />
                                                                    : <RotateCcw className="w-4 h-4" />}
                                                            </button>
                                                            <button
                                                                onClick={() => setLogContainer(c.name)}
                                                                className="p-1.5 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md transition-colors"
                                                                title="Logs"
                                                            >
                                                                <Terminal className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Log Viewer Modal */}
            {logContainer && (
                <LogViewerModal
                    containerName={logContainer}
                    onClose={() => setLogContainer(null)}
                />
            )}
        </div>
    );
}

// ---------------------------------------------------------------------------
// Log Viewer Modal
// ---------------------------------------------------------------------------

function LogViewerModal({ containerName, onClose }: { containerName: string; onClose: () => void }) {
    const [logs, setLogs] = useState<string[]>([]);
    const [isConnected, setIsConnected] = useState(false);
    const logEndRef = useRef<HTMLDivElement>(null);
    const eventSourceRef = useRef<EventSource | null>(null);

    useEffect(() => {
        const token = pb.authStore.token;
        const url = `${CONTROL_API}/containers/${containerName}/logs?tail=200&token=${token}`;

        // EventSource doesn't support custom headers natively,
        // so we fall back to a basic fetch with stream reading.
        const controller = new AbortController();

        (async () => {
            try {
                const res = await fetch(url, {
                    headers: { Authorization: `Bearer ${token}` },
                    signal: controller.signal,
                });

                if (!res.ok || !res.body) {
                    setLogs(prev => [...prev, `[ERROR] Failed to connect (${res.status})`]);
                    return;
                }

                setIsConnected(true);
                const reader = res.body.getReader();
                const decoder = new TextDecoder();

                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    const chunk = decoder.decode(value, { stream: true });
                    const lines = chunk.split("\n").filter(l => l.startsWith("data: ")).map(l => l.slice(6));
                    if (lines.length > 0) {
                        setLogs(prev => [...prev, ...lines]);
                    }
                }
            } catch (err: any) {
                if (err.name !== "AbortError") {
                    setLogs(prev => [...prev, `[ERROR] ${err.message}`]);
                }
            } finally {
                setIsConnected(false);
            }
        })();

        return () => {
            controller.abort();
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
        };
    }, [containerName]);

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [logs]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
            <div className="relative w-full max-w-3xl bg-white dark:bg-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh] transition-colors animate-in fade-in zoom-in duration-200">
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
                    <div className="flex items-center gap-2">
                        <Terminal className="w-4 h-4 text-slate-500" />
                        <h2 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            Logs — {containerName}
                        </h2>
                        {isConnected && (
                            <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                Live
                            </span>
                        )}
                    </div>
                    <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors">
                        <X className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex-1 overflow-y-auto bg-slate-950 p-4 font-mono text-xs text-slate-300 leading-relaxed">
                    {logs.length === 0 && (
                        <div className="flex items-center gap-2 text-slate-500">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            Connecting...
                        </div>
                    )}
                    {logs.map((line, i) => (
                        <div key={i} className="whitespace-pre-wrap break-all">
                            {line}
                        </div>
                    ))}
                    <div ref={logEndRef} />
                </div>
            </div>
        </div>
    );
}
