import { useState } from 'react';
import {
    Activity,
    Box,
    Layers,
    ChevronRight,
} from 'lucide-react';
import {
    ResponsiveContainer,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ReferenceLine,
    AreaChart,
    Area
} from 'recharts';
import { cn } from '../lib/utils';
import "katex/dist/katex.min.css";
import { InlineMath, BlockMath } from "react-katex";

export function GeotechVisualizer() {
    const [activeTab, setActiveTab] = useState<'phase' | 'mohr' | 'stress' | 'uscs'>('phase');

    return (
        <div className="space-y-6 animate-in fade-in duration-500 p-6">
            {/* Header */}
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold tracking-tight text-white">Geotechnical Visualizer</h1>
                <p className="text-white/40">Interactive sandbox for soil mechanics and engineering concepts.</p>
            </div>

            {/* Navigation Tabs */}
            <div className="bg-secondary/20 border border-white/5 rounded-2xl overflow-hidden shadow-sm transition-colors">
                <div className="border-b border-white/5 bg-white/[0.02] px-4">
                    <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-2">
                        {[
                            { id: "phase", label: "Phase Relationships", icon: Box },
                            { id: "mohr", label: "Mohr-Coulomb", icon: Activity },
                            { id: "stress", label: "Stress Distribution", icon: Layers },
                            { id: "uscs", label: "USCS Classifier", icon: ChevronRight },
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as any)}
                                className={cn(
                                    "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all whitespace-nowrap",
                                    activeTab === tab.id
                                        ? "bg-secondary text-white shadow-sm ring-1 ring-white/10"
                                        : "text-white/40 hover:text-white hover:bg-army-500"
                                )}
                            >
                                <tab.icon className="w-4 h-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-8 min-h-[600px]">
                    {activeTab === 'phase' && <PhaseRelationships />}
                    {activeTab === 'mohr' && <MohrCoulomb />}
                    {activeTab === 'stress' && <StressDistribution />}
                    {activeTab === 'uscs' && <USCSClassifier />}
                </div>
            </div>
        </div>
    );
}

function PhaseRelationships() {
    const [gs, setGs] = useState(2.7);
    const [e, setE] = useState(0.6);
    const [s, setS] = useState(0.5); // Saturation 0-1

    // Calculations (assuming Vs = 1)
    const Vs = 1;
    const Vv = e;
    const V = Vs + Vv;
    const Vw = s * e;
    const Va = (1 - s) * e;

    const Ms = gs; // assuming rho_w = 1
    const Mw = Vw;
    const M = Ms + Mw;

    // Derived parameters
    const n = e / (1 + e);
    const w = (s * e) / gs;


    const gamma_t = (gs + s * e) / (1 + e); // Unit weight normalized to rho_w

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Control Panel */}
            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        Input Parameters
                    </h3>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <label className="font-semibold text-white/80 flex items-center gap-1">
                                    Specific Gravity (<InlineMath math="G_s" />)
                                </label>
                                <span className="px-2 py-0.5 bg-white/5 rounded font-mono font-semibold text-white/60">{gs.toFixed(2)}</span>
                            </div>
                            <input
                                type="range" min="2.0" max="3.5" step="0.01" value={gs}
                                onChange={(e) => setGs(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-army-500"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <label className="font-semibold text-white/80 flex items-center gap-1">
                                    Void Ratio (<InlineMath math="e" />)
                                </label>
                                <span className="px-2 py-0.5 bg-white/5 rounded font-mono font-semibold text-white/60">{e.toFixed(3)}</span>
                            </div>
                            <input
                                type="range" min="0.1" max="2.0" step="0.001" value={e}
                                onChange={(e) => setE(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-army-500"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <label className="font-semibold text-white/80 flex items-center gap-1">
                                    Saturation (<InlineMath math="S" />)
                                </label>
                                <span className="px-2 py-0.5 bg-white/5 rounded font-mono font-semibold text-white/60">{(s * 100).toFixed(1)}%</span>
                            </div>
                            <input
                                type="range" min="0" max="1" step="0.01" value={s}
                                onChange={(e) => setS(parseFloat(e.target.value))}
                                className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-army-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                    <h3 className="text-sm font-bold text-white/40 uppercase tracking-widest mb-4">Derived Values</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="bg-white/[0.02] p-3 rounded-xl border border-white/5">
                            <p className="text-sm font-semibold text-white/40 flex items-center gap-1">
                                Porosity (<InlineMath math="n" />)
                            </p>
                            <p className="text-xl font-bold text-white/80">{n.toFixed(3)}</p>
                        </div>
                        <div className="bg-white/[0.02] p-3 rounded-xl border border-white/5">
                            <p className="text-sm font-semibold text-white/40 flex items-center gap-1">
                                Water Content (<InlineMath math="w_n" />)
                            </p>
                            <p className="text-xl font-bold text-white/80">{(w * 100).toFixed(1)}%</p>
                        </div>
                        <div className="bg-white/[0.02] p-3 rounded-xl border border-white/5">
                            <p className="text-sm font-semibold text-white/40 flex items-center gap-1">
                                Total Unit Weight (<InlineMath math="\gamma_n" />)
                            </p>
                            <p className="text-xl font-bold text-white/80">{gamma_t.toFixed(2)} <InlineMath math="\gamma_w" /></p>
                        </div>
                        <div className="bg-white/[0.02] p-3 rounded-xl border border-white/5">
                            <p className="text-sm font-semibold text-white/40 flex items-center gap-1">
                                Dry Unit Weight (<InlineMath math="\gamma_{dry}" />)
                            </p>
                            <p className="text-xl font-bold text-white/80">{(gs / (1 + e)).toFixed(2)} <InlineMath math="\gamma_w" /></p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Visualization */}
            <div className="flex flex-col items-center justify-center p-6 bg-black/20 rounded-3xl border border-white/5 min-h-[450px]">
                <h3 className="text-sm font-semibold text-white/40 mb-8 flex items-center gap-2">
                    3-Phase Soil Diagram
                </h3>

                <div className="flex items-stretch w-full max-w-sm h-80 border-2 border-white/5 relative shadow-2xl">
                    {/* Left Volume Axis */}
                    <div className="absolute -left-12 top-0 bottom-0 flex flex-col justify-between py-1 text-[10px] font-semibold text-white/40">
                        <span>Vₜ = {V.toFixed(2)}</span>
                        <span>0</span>
                    </div>

                    {/* Right Mass Axis */}
                    <div className="absolute -right-12 top-0 bottom-0 flex flex-col justify-between py-1 text-[10px] font-semibold text-white/40 text-right">
                        <span>Mₜ = {M.toFixed(2)}</span>
                        <span>0</span>
                    </div>

                    {/* Phase Blocks */}
                    <div className="flex flex-col-reverse w-full">
                        <div
                            style={{ height: `${(Vs / V) * 100}%` }}
                            className="bg-orange-950/90 border-t border-white/5/10 flex items-center justify-center transition-all"
                        >
                            <span className="text-white text-xs font-black uppercase tracking-widest opacity-80">Solid</span>
                        </div>
                        <div
                            style={{ height: `${(Vw / V) * 100}%` }}
                            className="bg-blue-500/80 border-t border-white/5/10 flex items-center justify-center transition-all"
                        >
                            <span className="text-white text-xs font-black uppercase tracking-widest opacity-80">{Vw > 0.05 ? 'Water' : ''}</span>
                        </div>
                        <div
                            style={{ height: `${(Va / V) * 100}%` }}
                            className="bg-army-500 flex items-center justify-center transition-all"
                        >
                            <span className="text-white/40 text-xs font-black uppercase tracking-widest opacity-80">{Va > 0.05 ? 'Air' : ''}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex gap-8">
                    <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase">
                        <div className="w-3 h-3 bg-orange-950 rounded"></div> Solid
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase">
                        <div className="w-3 h-3 bg-blue-500 rounded"></div> Water
                    </div>
                    <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase">
                        <div className="w-3 h-3 bg-white/5 rounded"></div> Air
                    </div>
                </div>
            </div>
        </div>
    );
}

function MohrCoulomb() {
    const [c, setC] = useState(20); // Cohesion in kPa
    const [phi, setPhi] = useState(30); // Friction angle in degrees
    const [sigma3, setSigma3] = useState(50); // Minor principal stress
    const [sigma1, setSigma1] = useState(150); // Major principal stress

    const phiRad = (phi * Math.PI) / 180;

    // Generate envelope line
    const maxSigma = Math.max(sigma1 * 1.5, 400);
    const envelopeData = [];
    for (let s = 0; s <= maxSigma; s += 20) {
        envelopeData.push({
            sigma: s,
            tau: c + s * Math.tan(phiRad)
        });
    }

    // Generate Mohr Circle points
    const center = (sigma1 + sigma3) / 2;
    const radius = (sigma1 - sigma3) / 2;
    const circlePoints = [];
    for (let a = 0; a <= 180; a += 5) {
        const rad = (a * Math.PI) / 180;
        circlePoints.push({
            sigma: center + radius * Math.cos(rad),
            tau: radius * Math.sin(rad)
        });
    }

    // Check if failure occurs
    // Condition for failure: sin(phi) = (sigma1 - sigma3) / (sigma1 + sigma3 + 2*c*cot(phi))
    const cotPhi = 1 / Math.tan(phiRad);
    const lhs = radius;
    const rhs = (center + c * cotPhi) * Math.sin(phiRad);
    const isFailing = lhs > rhs;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Column 1: Inputs */}
            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-bold text-white mb-6">Strength Parameters</h3>
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <label className="font-semibold text-white/80 flex items-center gap-1">
                                    Cohesion (<InlineMath math="c" />)
                                </label>
                                <span className="px-2 py-0.5 bg-white/5 rounded font-mono font-bold text-white/60">{c} kPa</span>
                            </div>
                            <input
                                type="range" min="0" max="200" step="1" value={c}
                                onChange={(e) => setC(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-army-500"
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <label className="font-semibold text-white/80 flex items-center gap-1">
                                    Friction Angle (<InlineMath math="\phi" />)
                                </label>
                                <span className="px-2 py-0.5 bg-white/5 rounded font-mono font-bold text-white/60">{phi}°</span>
                            </div>
                            <input
                                type="range" min="0" max="45" step="1" value={phi}
                                onChange={(e) => setPhi(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-army-500"
                            />
                        </div>
                    </div>
                </div>

                <div>
                    <h3 className="text-lg font-bold text-white mb-6 font-semibold">Principal Stresses</h3>
                    <div className="space-y-6">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-3">
                                <label className="text-[10px] font-semibold text-white/40 flex items-center gap-1">
                                    <InlineMath math="\sigma_3" /> (Minor)
                                </label>
                                <input
                                    type="number" value={sigma3}
                                    onChange={(e) => setSigma3(parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 bg-secondary border border-white/5 rounded-xl text-sm font-bold"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-semibold text-white/40 flex items-center gap-1">
                                    <InlineMath math="\sigma_1" /> (Major)
                                </label>
                                <input
                                    type="number" value={sigma1}
                                    onChange={(e) => setSigma1(parseInt(e.target.value) || 0)}
                                    className="w-full px-3 py-2 bg-secondary border border-white/5 rounded-xl text-sm font-bold"
                                />
                            </div>
                        </div>
                        <input
                            type="range" min={sigma3} max="500" step="1" value={sigma1}
                            onChange={(e) => setSigma1(parseInt(e.target.value))}
                            className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-army-500"
                        />
                    </div>
                </div>

                <div className={cn(
                    "p-4 rounded-2xl border flex flex-col gap-2 transition-colors",
                    isFailing
                        ? "bg-rose-500/10 border-rose-500/20 text-rose-400"
                        : "bg-army-500/10 border-army-500/20 text-army-400"
                )}>
                    <p className="text-sm font-semibold opacity-60">Status</p>
                    <p className="text-sm font-bold">{isFailing ? "FAILURE IMMINENT" : "STABLE / SAFE STATE"}</p>
                </div>
            </div>

            {/* Column 2: Triaxial Visualization */}
            <div className="flex flex-col items-center justify-center relative overflow-hidden h-[500px]">
                <div className="absolute top-6 left-6 right-6 text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/40">Sample Simulation</p>
                </div>

                <div className="relative scale-90">
                    {/* Axial Stress Arrow (sigma1) */}
                    <div className="absolute -top-14 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
                        <span className="text-[10px] font-bold text-white/40"><InlineMath math="\sigma_1" /></span>
                        <div className="w-px h-10 bg-white/5 relative">
                            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-white/5" />
                        </div>
                    </div>

                    {/* Confining Stress Arrows (sigma3) */}
                    <div className="absolute top-1/2 -left-14 -translate-y-1/2 flex items-center gap-1">
                        <span className="text-[10px] font-bold text-white/40"><InlineMath math="\sigma_3" /></span>
                        <div className="h-px w-10 bg-white/5 relative">
                            <div className="absolute right-0 top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-t-transparent border-b-transparent border-white/5" />
                        </div>
                    </div>
                    <div className="absolute top-1/2 -right-14 -translate-y-1/2 flex items-center gap-1">
                        <div className="h-px w-10 bg-white/5 relative">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-t-transparent border-b-transparent border-white/5" />
                        </div>
                        <span className="text-[10px] font-bold text-white/40"><InlineMath math="\sigma_3" /></span>
                    </div>

                    {/* Soil Sample */}
                    <div
                        className={cn(
                            "w-32 h-48 border-2 relative overflow-hidden",
                            isFailing
                                ? "bg-rose-50/30 border-rose-400"
                                : "bg-secondary/80 border-white/5"
                        )}
                        style={{
                            transform: `scale(${1 + (sigma1 - sigma3) / 4000}, ${1 - (sigma1 - sigma3) / 1200})`,
                            borderRadius: '4px'
                        }}
                    >
                        {/* Failure Plane */}
                        {isFailing && (
                            <div
                                className="absolute inset-0 bg-rose-500/20 backdrop-blur-[1px]"
                                style={{
                                    clipPath: `polygon(0% 100%, 100% 0%, 105% 0%, 0% 105%)`,
                                    transform: `rotate(${45 + phi / 2}deg) scale(2)`,
                                }}
                            />
                        )}

                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
                            style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '8px 8px' }}
                        />
                    </div>

                    {/* Axial Stress Arrow Bottom */}
                    <div className="absolute -bottom-14 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1">
                        <div className="w-px h-10 bg-white/5 relative">
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-l-transparent border-r-transparent border-white/5" />
                        </div>
                        <span className="text-[10px] font-bold text-white/40"><InlineMath math="\sigma_1" /></span>
                    </div>
                </div>
            </div>

            {/* Column 3: Mohr Chart */}
            <div className="flex flex-col items-center justify-center relative overflow-hidden h-[500px]">
                <div className="absolute top-6 left-6 right-6 text-center">
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-white/40">Mohr Chart</p>
                </div>

                <div className="w-full h-full pt-16">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart margin={{ top: 20, right: 20, left: 10, bottom: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis
                                type="number" dataKey="sigma" domain={[0, 'dataMax']}
                                tick={{ fontSize: 9 }}
                            />
                            <YAxis
                                type="number" domain={[0, 'auto']}
                                tick={{ fontSize: 9 }}
                            />
                            <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />

                            <Area
                                data={envelopeData} type="monotone" dataKey="tau"
                                stroke="#f43f5e" strokeWidth={2} fill="#f43f5e" fillOpacity={0.03}
                                isAnimationActive={false}
                                name="Envelope"
                            />

                            <Area
                                data={circlePoints} type="monotone" dataKey="tau"
                                stroke={isFailing ? "#f43f5e" : "#3b82f6"} strokeWidth={2}
                                fill={isFailing ? "#f43f5e" : "#3b82f6"} fillOpacity={0.08}
                                isAnimationActive={false}
                                name="Stress"
                            />

                            <ReferenceLine x={sigma3} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'σ₃', position: 'top', fontSize: 9 }} />
                            <ReferenceLine x={sigma1} stroke="#94a3b8" strokeDasharray="4 4" label={{ value: 'σ₁', position: 'top', fontSize: 9 }} />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}

function StressDistribution() {
    const [p, setP] = useState(1000); // Load in kN
    const xMax = 10; // Max horizontal distance
    const zMax = 10; // Max depth

    // Generate stress bulb data
    // We'll create a"mesh"of points
    const data = [];
    const steps = 20;
    for (let z = 0.5; z <= zMax; z += zMax / steps) {
        for (let r = -xMax; r <= xMax; r += (2 * xMax) / steps) {
            // Boussinesq Equation
            const R = Math.sqrt(r * r + z * z);
            const deltaSigmaZ = (3 * p * Math.pow(z, 3)) / (2 * Math.PI * Math.pow(R, 5));
            data.push({ r, z, stress: deltaSigmaZ });
        }
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <div className="space-y-8">
                <div>
                    <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                        Loading Parameters
                    </h3>

                    <div className="space-y-6">
                        <div className="space-y-3">
                            <div className="flex justify-between items-center text-sm">
                                <label className="font-semibold text-white/80 flex items-center gap-1">
                                    Point Load (<InlineMath math="P" />)
                                </label>
                                <span className="px-2 py-0.5 bg-white/5 rounded font-mono font-bold text-white/60">{p} kN</span>
                            </div>
                            <input
                                type="range" min="100" max="5000" step="100" value={p}
                                onChange={(e) => setP(parseInt(e.target.value))}
                                className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-army-500"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                                <p className="font-semibold text-white/40 mb-1">Theory</p>
                                <p className="text-white/60 italic">Boussinesq's Solution for elastic half-space.</p>
                            </div>
                            <div className="p-3 bg-white/[0.02] rounded-xl border border-white/5">
                                <p className="font-semibold text-white/40 mb-1">Assumptions</p>
                                <p className="text-white/60 italic">Homogeneous, Isotropic, Elastic soil.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                    <h3 className="text-sm font-semibold text-white/40 mb-4 flex items-center gap-2">
                        Stress Intensity Table
                    </h3>
                    <div className="overflow-hidden rounded-xl border border-white/5">
                        <table className="w-full text-xs text-left">
                            <thead className="bg-black/40 text-white/40">
                                <tr>
                                    <th className="px-4 py-2 font-bold">Depth (<InlineMath math="z" />)</th>
                                    <th className="px-4 py-2 font-bold">At Center (<InlineMath math="r=0" />)</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {[1, 2, 5, 10].map(z => {
                                    const val = (3 * p) / (2 * Math.PI * z * z);
                                    return (
                                        <tr key={z} className="">
                                            <td className="px-4 py-2 font-mono">{z} m</td>
                                            <td className="px-4 py-2 font-mono font-bold text-white/60">{val.toFixed(2)} kPa</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* Stress Bulb Visualizer */}
            <div className="p-8 relative overflow-hidden min-h-[500px] flex flex-col">
                <div className="flex justify-between items-center mb-6 relative z-10">
                    <h3 className="text-white font-bold flex items-center gap-2 italic">
                        Vertical Stress Bulb (<InlineMath math="\Delta \sigma_z" />)
                    </h3>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-army-500 animate-pulse" />
                        <span className="text-[10px] text-white/40 font-bold uppercase flex items-center gap-1">
                            Point Load <InlineMath math="P" />
                        </span>
                    </div>
                </div>

                <div className="flex-1 relative border-l border-t border-white/5">
                    {/* Equation Overlay */}
                    <div className="absolute bottom-4 right-4 bg-army-500 p-3 rounded-lg border border-white/5 backdrop-blur-sm z-20">
                        <p className="text-[10px] font-semibold text-white/40 uppercase mb-2">Governing Equation</p>
                        <p className="text-sm text-white/40"><BlockMath math="\Delta \sigma_z = \frac{3Pz^3}{2\pi R^5}" /></p>
                    </div>
                    {/* Load Point */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20">
                        <div className="w-4 h-4 bg-army-500 rounded-full" />
                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-0.5 h-8 bg-gradient-to-b from-army-500 to-transparent" />
                    </div>

                    {/* Simple Bulb visualization using CSS gradients or SVG ideally, but let's use a creative mapping */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        {[0.1, 0.2, 0.5, 0.8].map((factor, i) => {
                            // Scale dimensions based on factor (stress intensity)
                            // Stress = 0.1 * q0 implies some radius
                            const width = Math.sqrt(p) * factor * 10;
                            const height = Math.sqrt(p) * factor * 14;
                            return (
                                <div
                                    key={i}
                                    style={{
                                        width: `${width}px`,
                                        height: `${height}px`,
                                        top: '0',
                                        opacity: 1 - factor
                                    }}
                                    className="absolute border-2 border-white/5/30 rounded-[50%_50%_50%_50%_/_0%_0%_100%_100%] border-t-0"
                                />
                            );
                        })}
                    </div>

                    {/* Depth grid lines */}
                    <div className="absolute inset-0 flex flex-col justify-between p-4 pointer-events-none opacity-20">
                        <div className="border-t border-white/5 w-full" />
                        <div className="border-t border-white/5 w-full" />
                        <div className="border-t border-white/5 w-full" />
                        <div className="border-t border-white/5 w-full" />
                    </div>
                </div>

                <p className="mt-4 text-[10px] text-white/40 text-center italic">
                    Iso-stress lines representing the bulb of pressure below the foundation.
                </p>
            </div>
        </div>
    );
}

function USCSClassifier() {
    const [fines, setFines] = useState(30);
    const [sand, setSand] = useState(40);
    const [gravel, setGravel] = useState(30);
    const [ll, setLl] = useState(40);
    const [pi, setPi] = useState(15);

    // Classification Logic with Path Tracing
    const path = new Set<string>();
    let classification = "N/A";
    let groupName = "Select parameters...";

    path.add('start');
    if (fines < 50) {
        path.add('coarse');
        const isGravel = gravel > sand;
        if (isGravel) {
            path.add('gravel');
            if (fines < 5) { path.add('gw-gp'); classification = "GW/GP"; groupName = "Well/Poorly Graded Gravel"; }
            else if (fines > 12) { path.add('gm-gc'); classification = "GM/GC"; groupName = "Silty/Clayey Gravel"; }
            else { path.add('g-dual'); classification = "GP-GM / GW-GC"; groupName = "Dual Symbol Gravel"; }
        } else {
            path.add('sand');
            if (fines < 5) { path.add('sw-sp'); classification = "SW/SP"; groupName = "Well/Poorly Graded Sand"; }
            else if (fines > 12) { path.add('sm-sc'); classification = "SM/SC"; groupName = "Silty/Clayey Sand"; }
            else { path.add('s-dual'); classification = "SP-SM / SW-SC"; groupName = "Dual Symbol Sand"; }
        }
    } else {
        path.add('fine');
        const isHighPlasticity = ll >= 50;
        const aLine = 0.73 * (ll - 20);
        const aboveALine = pi > aLine;

        if (isHighPlasticity) {
            path.add('high-p');
            if (aboveALine) { path.add('ch'); classification = "CH"; groupName = "Fat Clay"; }
            else { path.add('mh'); classification = "MH"; groupName = "Elastic Silt"; }
        } else {
            path.add('low-p');
            if (ll < 30 && pi < 7) { path.add('ml-cl-dual'); classification = "CL-ML"; groupName = "Silty Clay"; }
            else if (aboveALine) { path.add('cl'); classification = "CL"; groupName = "Lean Clay"; }
            else { path.add('ml'); classification = "ML"; groupName = "Silt"; }
        }
    }

    const Node = ({ id, label, sublabel }: { id: string, label: string, sublabel?: string }) => {
        const isActive = path.has(id);
        return (
            <div className={cn(
                "relative p-3 rounded-xl border-2 transition-all duration-500 flex flex-col items-center text-center group/node",
                isActive
                    ? "bg-black/20 border-white/5 text-white shadow-lg shadow-army-500/10 scale-105 z-10"
                    : "bg-white/[0.02] border-white/5 text-white/40 opacity-40 shrink-0"
            )}>
                <span className="text-[10px] font-semibold uppercase tracking-tighter mb-1">{label}</span>
                {sublabel && <span className="text-[9px] font-bold opacity-60 leading-none">{sublabel}</span>}
                {isActive && (
                    <div className="absolute -top-1 -right-1 w-3 h-3 bg-army-500 rounded-full border-2 border-white border-white/5 animate-pulse" />
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-12">
            {/* Tree Visualization */}


            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="bg-black/20 rounded-[2.5rem] p-10 border border-white/5 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col items-center gap-16">
                        <Node id="start" label="USCS Classifier" sublabel="Sieve #200" />

                        <div className="grid grid-cols-2 gap-x-32 w-full max-w-5xl relative">
                            {/* Connecting Lines for Main Branch */}
                            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-12 -translate-y-14 bg-white/5" />
                            <div className="absolute top-0 left-[25%] right-[25%] h-px -translate-y-8 bg-white/5" />

                            {/* Coarse Branch */}
                            <div className="flex flex-col items-center gap-12">
                                <Node id="coarse" label="Coarse-Grained" sublabel="Fines < 50%" />

                                <div className="grid grid-cols-2 gap-8 w-full relative">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-8 -translate-y-10 bg-white/5" />
                                    <div className="absolute top-0 left-[25%] right-[25%] h-px -translate-y-6 bg-white/5" />

                                    <div className="flex flex-col items-center gap-8">
                                        <Node id="gravel" label="Gravel" sublabel="G > S" />
                                        <div className="flex flex-col gap-2 w-full">
                                            <Node id="gw-gp" label="Clean" sublabel="< 5%" />
                                            <Node id="g-dual" label="Mixed" sublabel="5-12%" />
                                            <Node id="gm-gc" label="Dirty" sublabel="> 12%" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center gap-8">
                                        <Node id="sand" label="Sand" sublabel="S ≥ G" />
                                        <div className="flex flex-col gap-2 w-full">
                                            <Node id="sw-sp" label="Clean" sublabel="< 5%" />
                                            <Node id="s-dual" label="Mixed" sublabel="5-12%" />
                                            <Node id="sm-sc" label="Dirty" sublabel="> 12%" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Fine Branch */}
                            <div className="flex flex-col items-center gap-12">
                                <Node id="fine" label="Fine-Grained" sublabel="Fines ≥ 50%" />

                                <div className="grid grid-cols-2 gap-8 w-full relative">
                                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-px h-8 -translate-y-10 bg-white/5" />
                                    <div className="absolute top-0 left-[25%] right-[25%] h-px -translate-y-6 bg-white/5" />

                                    <div className="flex flex-col items-center gap-8">
                                        <Node id="low-p" label="Low Plasticity" sublabel="LL < 50" />
                                        <div className="flex flex-col gap-2 w-full">
                                            <Node id="cl" label="Clay (CL)" sublabel="Above A" />
                                            <Node id="ml" label="Silt (ML)" sublabel="Below A" />
                                            <Node id="ml-cl-dual" label="Dual (CL-ML)" sublabel="PI 4-7" />
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-center gap-8">
                                        <Node id="high-p" label="High Plasticity" sublabel="LL ≥ 50" />
                                        <div className="flex flex-col gap-2 w-full">
                                            <Node id="ch" label="Fat Clay" sublabel="CH" />
                                            <Node id="mh" label="Elastic Silt" sublabel="MH" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex flex-col gap-6">
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-lg font-bold text-white mb-6">Input Parameters</h3>
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between text-xs font-semibold text-white/40 uppercase">
                                        <span>Gravel ({gravel}%)</span>
                                        <span>Sand ({sand}%)</span>
                                        <span>Fines ({fines}%)</span>
                                    </div>
                                    <div className="flex h-3 w-full rounded-full overflow-hidden shadow-inner bg-white/5">
                                        <div style={{ width: `${gravel}%` }} className="bg-orange-800 transition-all duration-500" />
                                        <div style={{ width: `${sand}%` }} className="bg-yellow-600 transition-all duration-500" />
                                        <div style={{ width: `${fines}%` }} className="bg-army-500 transition-all duration-500" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-white/80">Passing #200 (Fines %)</label>
                                        <input
                                            type="range" min="0" max="100" step="1" value={fines}
                                            onChange={(e) => setFines(parseInt(e.target.value))}
                                            className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-army-500"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-sm font-semibold text-white/80">Gravel / Sand Ratio</label>
                                        <input
                                            type="range" min="0" max="100" step="1" value={(gravel / (gravel + sand)) * 100 || 0}
                                            onChange={(e) => {
                                                const totalCoarse = 100 - fines;
                                                const gRatio = parseInt(e.target.value) / 100;
                                                setGravel(Math.round(totalCoarse * gRatio));
                                                setSand(Math.round(totalCoarse * (1 - gRatio)));
                                            }}
                                            className="w-full h-1.5 bg-white/5 rounded-lg appearance-none cursor-pointer accent-army-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-white/40">Liquid Limit (LL)</label>
                                <input
                                    type="number" value={ll}
                                    onChange={(e) => setLl(parseInt(e.target.value) || 0)}
                                    className="w-full px-4 py-3 bg-secondary border border-white/5 rounded-2xl text-lg font-semibold text-white/40 focus:outline-none focus:ring-2 focus:ring-white/10"
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-xs font-semibold text-white/40">Plasticity Index (PI)</label>
                                <input
                                    type="number" value={pi}
                                    onChange={(e) => setPi(parseInt(e.target.value) || 0)}
                                    className="w-full px-4 py-3 bg-secondary border border-white/5 rounded-2xl text-lg font-semibold text-white/40 focus:outline-none focus:ring-2 focus:ring-white/10"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-col items-center justify-center p-4 bg-secondary rounded-[3rem] border border-white/5 shadow-2xl relative overflow-hidden group">

                        <div className="text-center space-y-3 relative z-10">
                            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/40">Classification Result</p>
                            <h2 className="text-4xl font-bold text-white tracking-tighter drop-shadow-sm">{classification}</h2>
                            <div className="px-8 py-3 bg-white/5/40 rounded-3xl border border-white/5/50 inline-block backdrop-blur-md">
                                <p className="text-xl font-bold text-white/80">{groupName}</p>
                            </div>
                        </div>

                        <div className="mt-4 grid grid-cols-2 gap-4 w-full max-w-sm">
                            <div className="p-5 bg-black/20 rounded-3xl border border-white/5">
                                <p className="text-[10px] font-semibold text-white/40 uppercase mb-2 flex items-center gap-1">
                                    A-Line <InlineMath math="PI" />
                                </p>
                                <p className="text-lg font-semibold text-white/90">{(0.73 * (ll - 20)).toFixed(1)}</p>
                            </div>
                            <div className="p-5 bg-black/20 rounded-3xl border border-white/5">
                                <p className="text-[10px] font-semibold text-white/40 uppercase mb-2 flex items-center gap-1">
                                    Plasticity
                                </p>
                                <p className="text-lg font-semibold text-white/90">{ll >= 50 ? "High" : "Low"}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
