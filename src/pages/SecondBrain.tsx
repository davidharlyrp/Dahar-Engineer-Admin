import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { pb } from '../lib/pb';
import ForceGraph3D from 'react-force-graph-3d';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import * as THREE from 'three';
import {
    SecondBrainService,
    type SecondBrainRecord
} from '../services/api';
import { Loader2, Maximize, Plus, Save, Trash2, Edit3, Search, ExternalLink } from 'lucide-react';

interface GraphNode {
    id: string;
    label: string;
    group: string;
    val: number;
    color: string;
    data: SecondBrainRecord;
}

interface GraphLink {
    source: string;
    target: string;
    val?: number;
}

const DEFAULT_COLOR = '#8b5cf6'; // Purple for Second Brain nodes

export function SecondBrain() {
    const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
    const graphContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        if (!graphContainerRef.current) return;
        const observer = new ResizeObserver((entries) => {
            const { width, height } = entries[0].contentRect;
            setDimensions({ width, height });
        });
        observer.observe(graphContainerRef.current);
        return () => observer.disconnect();
    }, []);

    const fgRef = useRef<any>(null);
    const hasInitiallyCentered = useRef(false);

    const [records, setRecords] = useState<SecondBrainRecord[]>([]);
    const [graphData, setGraphData] = useState<{ nodes: GraphNode[], links: GraphLink[] }>({ nodes: [], links: [] });
    const [loading, setLoading] = useState(true);
    const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);

    // Editor State
    const [isEditing, setIsEditing] = useState(false);
    const [editFormData, setEditFormData] = useState<{ title: string, tags: string, content: string, linked_nodes: string[] }>({ title: '', tags: '', content: '', linked_nodes: [] });
    const [isSaving, setIsSaving] = useState(false);
    const [isLinkDropdownOpen, setIsLinkDropdownOpen] = useState(false);
    const [linkSearchQuery, setLinkSearchQuery] = useState('');
    const [showLabels, setShowLabels] = useState(true);

    useEffect(() => {
        fetchData();
    }, []);

    // Tune ForceGraph 3D physics 
    useEffect(() => {
        if (fgRef.current) {
            // Push all nodes further away from each other
            fgRef.current.d3Force('charge').strength(-400);
            // Specifically increase the distance of links
            fgRef.current.d3Force('link').distance(150);
        }
    }, [graphData]);

    const fetchData = async () => {
        setLoading(true);
        try {
            const data = await SecondBrainService.getAll();
            console.log("Pocketbase response data:", data);
            setRecords(data);
            hasInitiallyCentered.current = false;
            processGraphData(data);
        } catch (error) {
            console.error("Error fetching data for Second Brain:", error);
            alert("Failed to load Knowledge Graph");
        } finally {
            setLoading(false);
        }
    };

    const processGraphData = (data: SecondBrainRecord[]) => {
        const nodes: GraphNode[] = [];
        const links: GraphLink[] = [];

        data.forEach((item) => {
            nodes.push({
                id: item.id,
                label: item.title,
                group: 'Second Brain',
                val: 2,
                color: DEFAULT_COLOR,
                data: item
            });
        });

        const linkSet = new Set<string>();

        // Explicit Links based on linked_nodes reference array
        data.forEach((item) => {
            let targets: string[] = [];
            const linkedNodes: any = item.linked_nodes;
            if (Array.isArray(linkedNodes)) {
                targets = linkedNodes;
            } else if (typeof linkedNodes === 'string') {
                targets = (linkedNodes as string).split(',').map(s => s.trim()).filter(Boolean);
            }

            targets.forEach(targetId => {
                // Prevent circular or duplicate linking by sorting IDs
                const key = item.id < targetId ? `${item.id}-${targetId}` : `${targetId}-${item.id}`;
                if (!linkSet.has(key)) {
                    linkSet.add(key);
                    links.push({ source: item.id, target: targetId, val: 2 });
                }
            });
        });

        setGraphData({ nodes, links });
    };

    const handleNodeClick = useCallback((node: any) => {
        setSelectedNodeId(node.id);
        setIsEditing(false); // Default to view mode when clicking a node

        if (fgRef.current) {
            const distance = 500;
            const camPos = fgRef.current.cameraPosition();

            // Calculate vector from node to camera
            const dx = camPos.x - node.x;
            const dy = camPos.y - node.y;
            const dz = camPos.z - node.z;

            // Normalize and scale by desired distance
            const currentDist = Math.hypot(dx, dy, dz);
            const distRatio = distance / (currentDist || 1);

            const newPos = {
                x: node.x + dx * distRatio,
                y: node.y + dy * distRatio,
                z: node.z + dz * distRatio
            };

            fgRef.current.cameraPosition(newPos, node, 1500);
            hasInitiallyCentered.current = true; // Prevent automatic zoom-to-fit after manual click zoom
        }
    }, [fgRef]);

    const resetCamera = useCallback(() => {
        if (fgRef.current) {
            fgRef.current.zoomToFit(1500, 50, () => true);
        }
    }, [fgRef]);

    const handleToggleTask = useCallback(async (index: number) => {
        if (!selectedNodeId) return;
        const record = records.find(r => r.id === selectedNodeId);
        if (!record) return;

        const lines = (record.content || '').split('\n');
        let taskIndex = 0;
        const newLines = lines.map(line => {
            if (line.trim().match(/^[-*]\s+\[[ xX]\]/)) {
                if (taskIndex === index) {
                    const isChecked = line.includes('[x]') || line.includes('[X]');
                    const newLine = line.replace(/\[[ xX]\]/, isChecked ? '[ ]' : '[x]');
                    taskIndex++;
                    return newLine;
                }
                taskIndex++;
            }
            return line;
        });

        const newContent = newLines.join('\n');
        try {
            // Update local state immediately for snappy feel
            setRecords(prev => prev.map(r => r.id === record.id ? { ...r, content: newContent } : r));
            await SecondBrainService.update(record.id, { content: newContent });
        } catch (error) {
            console.error("Error toggling task:", error);
            // Minimal revert: rely on next fetch or just let it be if it's minor
        }
    }, [selectedNodeId, records]);

    const handleCreateNew = () => {
        setSelectedNodeId(null);
        setEditFormData({
            title: 'New Concept',
            tags: '',
            content: `# New Knowledge Node

Deskripsi ide atau riset Anda di sini. Gunakan format di bawah ini sebagai referensi:

### 1. Referensi Link (Contoh)
Berikut contoh penggunaan link eksternal yang rapi:
- Sumber Riset: {https://scholar.google.com}
- Tools Utama: {https://pocketbase.io}

### 2. Daftar Tugas & Tahapan
- [ ] Kumpulkan data awal
- [ ] Analisis korelasi
- [x] Studi literatur selesai

1. Langkah Pertama: Identifikasi masalah.
2. Langkah Kedua: Lakukan simulasi awal.`,
            linked_nodes: []
        });
        setIsLinkDropdownOpen(false);
        setLinkSearchQuery('');
        setIsEditing(true);
    };

    const handleEditCurrent = () => {
        if (selectedRecord) {
            setEditFormData({
                title: selectedRecord.title,
                tags: selectedRecord.tags,
                content: selectedRecord.content,
                linked_nodes: Array.isArray(selectedRecord.linked_nodes) ? selectedRecord.linked_nodes : []
            });
            setIsEditing(true);
        }
    };

    const handleInsertLink = (nodeId: string, nodeTitle: string) => {
        const textarea = textareaRef.current;
        const linkText = `[${nodeTitle}](#${nodeId})`;

        setEditFormData(prev => {
            const currentNodes = Array.isArray(prev.linked_nodes) ? prev.linked_nodes : [];
            const newNodes = currentNodes.includes(nodeId) ? currentNodes : [...currentNodes, nodeId];

            if (textarea) {
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const newContent = prev.content.substring(0, start) + linkText + prev.content.substring(end);

                setTimeout(() => {
                    textarea.focus();
                    textarea.setSelectionRange(start + linkText.length, start + linkText.length);
                }, 10);

                return { ...prev, content: newContent, linked_nodes: newNodes };
            }

            return { ...prev, content: prev.content + `\n${linkText}`, linked_nodes: newNodes };
        });
    };

    const handleSave = async () => {
        if (!editFormData.title.trim()) {
            alert("Title is required");
            return;
        }

        setIsSaving(true);
        try {
            // Auto-sync linked_nodes by extracting all valid node IDs from the markdown content
            // Matches markdown links in the exact format we generated: [Title](#id)
            const linkRegex = /\]\(\#([a-zA-Z0-9_-]+)\)/g;
            const extractedIds = new Set<string>();
            let match;
            while ((match = linkRegex.exec(editFormData.content)) !== null) {
                if (match[1]) {
                    extractedIds.add(match[1]);
                }
            }

            // Only keep extracted IDs that are actually valid existing node IDs 
            // (in case the user manually typed a fake `#id`)
            const validExtractedIds = Array.from(extractedIds).filter(id =>
                records.some(r => r.id === id)
            );

            // Ensure linked_nodes is a clean array of purely string IDs before sending to PocketBase
            const payload = {
                ...editFormData,
                linked_nodes: validExtractedIds,
                user_id: pb.authStore.record?.id
            };

            if (selectedNodeId) {
                // Update
                const updated = await SecondBrainService.update(selectedNodeId, payload);
                setRecords(prev => prev.map(r => r.id === selectedNodeId ? updated : r));
                processGraphData(records.map(r => r.id === selectedNodeId ? updated : r));
            } else {
                // Create
                const created = await SecondBrainService.create(payload);
                setRecords(prev => [created, ...prev]);
                processGraphData([created, ...records]);
                setSelectedNodeId(created.id);
                // Auto-zoom to fit all nodes including the new one
                setTimeout(() => resetCamera(), 100);
            }
            setIsEditing(false);
        } catch (error) {
            console.error("Error saving node:", error);
            alert("Failed to save node");
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!selectedNodeId) return;
        if (!window.confirm("Are you sure you want to delete this node?")) return;

        try {
            await SecondBrainService.remove(selectedNodeId);
            const remaining = records.filter(r => r.id !== selectedNodeId);
            setRecords(remaining);
            processGraphData(remaining);
            setSelectedNodeId(null);
            setIsEditing(false);
        } catch (error) {
            console.error("Error deleting node:", error);
            alert("Failed to delete node");
        }
    };

    const selectedRecord = useMemo(() => {
        return records.find(r => r.id === selectedNodeId);
    }, [records, selectedNodeId]);




    return (
        <div className="flex flex-col lg:flex-row min-h-[calc(85dvh)] lg:h-[calc(100vh-3rem)] w-full">

            {/* LEFT: 3D Force Graph */}
            <div
                ref={graphContainerRef}
                className="flex-1 lg:w-full min-h-[50dvh] relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden"
            >


                {loading ? (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                        <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
                    </div>
                ) : (
                    <div className="absolute inset-0 z-0 cursor-move">
                        <ForceGraph3D
                            ref={fgRef}
                            width={dimensions.width}
                            height={dimensions.height}
                            graphData={graphData}
                            nodeLabel="label"
                            nodeColor="color"
                            nodeVal="val"
                            nodeRelSize={8}
                            linkWidth={(link: any) => link.val || 1}
                            linkOpacity={0.9}
                            linkColor={() => document.documentElement.classList.contains('dark') ? '#e2e8f0' : '#1e293b'}
                            warmupTicks={10}
                            cooldownTicks={100}
                            onEngineStop={() => {
                                if (fgRef.current && !hasInitiallyCentered.current) {
                                    fgRef.current.zoomToFit(400, 50);
                                    hasInitiallyCentered.current = true;
                                }
                            }}
                            onNodeClick={handleNodeClick}
                            backgroundColor={document.documentElement.classList.contains('dark') ? '#0f172a' : '#ffffff'}
                            nodeThreeObject={(node: any) => {
                                if (!showLabels) return new THREE.Object3D();

                                // Create a canvas to draw the text
                                const canvas = document.createElement('canvas');
                                const context = canvas.getContext('2d');
                                if (!context) return new THREE.Object3D();

                                const text = node.label;
                                const fontSize = 128;
                                context.font = `bold ${fontSize}px sans-serif`;

                                const textMetrics = context.measureText(text);
                                const textWidth = textMetrics.width;

                                canvas.width = textWidth + 20;
                                canvas.height = fontSize + 10;

                                // Redraw with the correct size
                                context.font = `bold ${fontSize}px sans-serif`;
                                context.textAlign = 'center';
                                context.textBaseline = 'middle';

                                // Text color based on theme
                                const isDark = document.documentElement.classList.contains('dark');
                                context.fillStyle = isDark ? '#f1f5f9' : '#1e293b';
                                context.fillText(text, canvas.width / 2, canvas.height / 2);

                                // Create sprite
                                const texture = new THREE.CanvasTexture(canvas);
                                const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true });
                                const sprite = new THREE.Sprite(spriteMaterial);

                                // Position above the node
                                sprite.scale.set(canvas.width / 10, canvas.height / 10, 1);
                                sprite.position.set(0, 32, 0); // Offset upwards

                                return sprite;
                            }}
                            nodeThreeObjectExtend={true}
                        />
                    </div>
                )}

                {/* Control Overlay */}
                <div className="absolute top-4 left-4 z-50 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col gap-2 pointer-events-auto">
                    <button
                        onClick={handleCreateNew}
                        className="flex items-center gap-2 px-3 py-1.5 bg-slate-500 hover:bg-slate-600 text-white rounded-lg text-sm font-medium transition-colors w-full justify-center"
                    >
                        <Plus className="w-4 h-4" /> New Node
                    </button>

                    <button
                        onClick={resetCamera}
                        className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-lg text-sm font-medium border border-slate-200 dark:border-slate-700 transition-colors w-full justify-center"
                    >
                        <Maximize className="w-4 h-4" /> Reset View
                    </button>

                    <div className="flex items-center justify-between gap-3 px-1 py-1 w-full bg-slate-50/50 dark:bg-slate-800/50 rounded-lg border border-slate-100 dark:border-slate-700">
                        <span className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 ml-1.5">
                            Labels
                        </span>
                        <button
                            onClick={() => setShowLabels(!showLabels)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${showLabels ? 'bg-blue-600' : 'bg-slate-300 dark:bg-slate-600'
                                }`}
                        >
                            <span
                                className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${showLabels ? 'translate-x-5' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>

                    {!loading && (
                        <div className="mt-2 pt-2 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-500 text-center">
                            {graphData.nodes.length} Nodes • {graphData.links.length} Links
                        </div>
                    )}
                </div>

            </div>

            {/* RIGHT: Editor / Viewer Panel */}
            <div className="w-full lg:w-1/3 h-[50dvh] lg:h-full flex justify-start items-end bg-transparent flex flex-col overflow-hidden">
                {!selectedNodeId && !isEditing ? (
                    <>
                    </>
                ) : (
                    <>
                        {/* Header Actions */}
                        <div className="w-full p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-900/50">
                            <h3 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                                {isEditing ? (selectedNodeId ? 'Edit Node' : 'New Node') : 'View Node'}
                            </h3>
                            <div className="flex gap-2">
                                {!isEditing && selectedNodeId && (
                                    <>
                                        <button onClick={handleEditCurrent} className="p-1.5 text-slate-600 hover:text-slate-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md transition-colors shadow-sm">
                                            <Edit3 className="w-4 h-4" />
                                        </button>
                                        <button onClick={handleDelete} className="p-1.5 text-slate-600 hover:text-red-600 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-md transition-colors shadow-sm">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </>
                                )}
                                {isEditing && (
                                    <>
                                        <button
                                            onClick={() => {
                                                setIsEditing(false);
                                                if (!selectedNodeId) setEditFormData({ title: '', tags: '', content: '', linked_nodes: [] });
                                            }}
                                            className="px-3 py-1.5 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-md transition-colors"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="px-3 py-1.5 text-sm flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md transition-colors disabled:opacity-50"
                                        >
                                            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Content Area */}
                        <div className="w-full flex-1 overflow-y-auto px-4 py-2 custom-scrollbar">
                            {isEditing ? (
                                <div className="space-y-2 flex flex-col h-full">
                                    <input
                                        type="text"
                                        value={editFormData.title}
                                        onChange={e => setEditFormData({ ...editFormData, title: e.target.value })}
                                        className="w-full text-lg font-bold px-1 py-1 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                                        placeholder="e.g. Backpropagation Algorithm"
                                    />
                                    <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-700">
                                        <label className="text-xs font-semibold text-slate-500 mb-1">Tags</label>
                                        <input
                                            type="text"
                                            value={editFormData.tags}
                                            onChange={e => setEditFormData({ ...editFormData, tags: e.target.value })}
                                            className="w-full px-1 py-1 text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow"
                                            placeholder="ex. machine-learning, calculus, neural-networks"
                                        />
                                    </div>
                                    <div className="relative flex flex-col items-start z-40 pt-2">
                                        <button
                                            type="button"
                                            onClick={() => setIsLinkDropdownOpen(!isLinkDropdownOpen)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg text-sm font-semibold transition-colors border border-slate-200 dark:border-slate-700"
                                            title="Insert Reference to another Node"
                                        >
                                            <Plus className="w-4 h-4" /> Connect Other Nodes
                                        </button>

                                        {isLinkDropdownOpen && (
                                            <div className="absolute top-full left-0 mt-2 w-72 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl p-2 flex flex-col gap-2">
                                                <div className="relative">
                                                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input
                                                        type="text"
                                                        placeholder="Search nodes..."
                                                        value={linkSearchQuery}
                                                        onChange={(e) => setLinkSearchQuery(e.target.value)}
                                                        autoFocus
                                                        className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-sm text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow"
                                                    />
                                                </div>
                                                <div className="max-h-48 overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-1">
                                                    {records
                                                        .filter(r => r.id !== selectedNodeId && r.title.toLowerCase().includes(linkSearchQuery.toLowerCase()))
                                                        .map(node => (
                                                            <div key={node.id} className="group flex items-center justify-between p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-lg transition-colors">
                                                                <span className="text-sm text-slate-700 dark:text-slate-300 truncate pr-2 flex-1" title={node.title}>{node.title}</span>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => {
                                                                        handleInsertLink(node.id, node.title);
                                                                    }}
                                                                    className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded-md transition-all border border-blue-200 dark:border-blue-500/20"
                                                                    title={`Insert link to ${node.title}`}
                                                                >
                                                                    <Plus className="w-3.5 h-3.5" />
                                                                </button>
                                                            </div>
                                                        ))}
                                                    {records.filter(r => r.id !== selectedNodeId && r.title.toLowerCase().includes(linkSearchQuery.toLowerCase())).length === 0 && (
                                                        <p className="text-xs text-slate-400 p-2 text-center">No nodes found.</p>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1 flex flex-col">
                                        <label className="block text-xs font-semibold text-slate-500 mb-1">Content</label>
                                        <textarea
                                            ref={textareaRef}
                                            value={editFormData.content}
                                            onChange={e => setEditFormData({ ...editFormData, content: e.target.value })}
                                            className="flex-1 w-full px-2 py-1 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 transition-shadow resize-none font-mono text-sm"
                                            placeholder="Write your thoughts here... for inserting weblink use {-} ex. {https://www.google.com}."
                                        />
                                    </div>
                                </div>
                            ) : (
                                selectedRecord && (
                                    <div className="space-y-4">
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">{selectedRecord.title}</h2>
                                            {selectedRecord.tags && (
                                                <div className="flex flex-wrap gap-2 mt-2">
                                                    {selectedRecord.tags.split(',').map((tag, i) => (
                                                        <span key={i} className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-xs font-medium">
                                                            #{tag.trim()}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <div className="prose prose-slate dark:prose-invert max-w-none prose-sm border-t border-slate-100 dark:border-slate-800 pt-2">
                                            <ReactMarkdown
                                                remarkPlugins={[remarkGfm]}
                                                components={{
                                                    a: ({ node, href, children, ...props }) => {
                                                        if (href && href.startsWith('#')) {
                                                            const targetId = href.substring(1);
                                                            return (
                                                                <a
                                                                    href="#"
                                                                    onClick={(e) => {
                                                                        e.preventDefault();
                                                                        const targetNode = graphData.nodes.find(n => n.id === targetId);
                                                                        if (targetNode) handleNodeClick(targetNode);
                                                                    }}
                                                                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-semibold bg-blue-50 text-blue-600 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:hover:bg-blue-500/20 no-underline transition-colors border border-blue-200 dark:border-blue-500/20 mx-1 align-middle"
                                                                    title="Jump to Node"
                                                                    {...props}
                                                                >
                                                                    {children}
                                                                </a>
                                                            );
                                                        }
                                                        return (
                                                            <a
                                                                href={href}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                className="inline-flex items-center gap-1.5 px-2 py-0.5 bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/30 rounded-md hover:border-blue-500 dark:hover:border-blue-500 transition-all no-underline text-blue-600 dark:text-blue-400 align-middle mx-0.5 text-[11px] font-medium"
                                                                {...props}
                                                            >
                                                                <span className="truncate max-w-[150px]">{children}</span>
                                                                <ExternalLink className="w-3 h-3 opacity-60" />
                                                            </a>
                                                        );
                                                    },
                                                    input: ({ node, ...props }) => {
                                                        if (props.type === 'checkbox') {
                                                            return (
                                                                <input
                                                                    type="checkbox"
                                                                    checked={props.checked}
                                                                    readOnly
                                                                    className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer mr-2 align-middle"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const allCheckboxes = document.querySelectorAll('.prose input[type="checkbox"]');
                                                                        const index = Array.from(allCheckboxes).indexOf(e.currentTarget as any);
                                                                        if (index !== -1) handleToggleTask(index);
                                                                    }}
                                                                />
                                                            );
                                                        }
                                                        return <input {...props} />;
                                                    },
                                                    h1: ({ children }) => <h1 className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 mb-6 mt-8 border-b pb-2 border-slate-200 dark:border-slate-700">{children}</h1>,
                                                    h2: ({ children }) => <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-4 mt-6">{children}</h2>,
                                                    h3: ({ children }) => <h3 className="text-xl font-bold text-slate-800 dark:text-slate-200 mb-3 mt-5">{children}</h3>,
                                                    ul: ({ children }) => <ul className="list-disc list-outside ml-6 mb-4 space-y-2 text-slate-700 dark:text-slate-300">{children}</ul>,
                                                    ol: ({ children }) => <ol className="list-decimal list-outside ml-6 mb-4 space-y-2 text-slate-700 dark:text-slate-300">{children}</ol>,
                                                    li: ({ children }) => <li className="pl-1">{children}</li>,
                                                    p: ({ children }) => <p className="mb-4 leading-relaxed text-slate-700 dark:text-slate-300 whitespace-pre-wrap">{children}</p>,
                                                    strong: ({ children }) => <strong className="font-bold text-slate-900 dark:text-white">{children}</strong>,
                                                }}
                                            >
                                                {selectedRecord.content ? selectedRecord.content.replace(/\{([^}]+)\}/g, '[$1]($1)').replace(/\n/g, '  \n') : '*No content.*'}
                                            </ReactMarkdown>
                                        </div>
                                    </div>
                                )
                            )}
                        </div>
                    </>
                )}
            </div>

        </div>
    );
}
