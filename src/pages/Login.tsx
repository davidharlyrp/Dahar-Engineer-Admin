import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { pb } from "../lib/pb";
import { Lock, Mail, AlertCircle, Loader2 } from "lucide-react";

export function Login() {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleEmailLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        try {
            const authData = await pb.collection("users").authWithPassword(email, password);

            // Enforce isAdmin check
            if (!authData.record.isAdmin) {
                pb.authStore.clear(); // Log them out immediately
                setError("Access denied. Admin privileges required.");
                setIsLoading(false);
                return;
            }

            navigate("/");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Invalid email or password.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        setError("");
        setIsLoading(true);

        try {
            const authData = await pb.collection("users").authWithOAuth2({ provider: "google" });

            // Enforce isAdmin check
            if (!authData.record.isAdmin) {
                pb.authStore.clear();
                setError("Access denied. Admin privileges required.");
                setIsLoading(false);
                return;
            }

            navigate("/");
        } catch (err: unknown) {
            setError(err instanceof Error ? err.message : "Failed to log in with Google.");
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans transition-colors duration-200">
            <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
                <h2 className="mt-6 text-3xl font-bold tracking-tight text-white">
                    Dahar<span className="text-white/40 font-normal">Engineer</span>
                </h2>
                <p className="mt-2 text-sm text-white/40">Admin Dashboard Access</p>
            </div>

            <div className="mt-8 mx-auto w-[80%] md:w-full sm:max-w-md">
                <div className="bg-secondary py-8 px-4 shadow-xl border border-white/5 sm:rounded-2xl sm:px-10 transition-colors">

                    {error && (
                        <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                            <p className="text-sm text-red-400">{error}</p>
                        </div>
                    )}

                    <form className="space-y-6" onSubmit={handleEmailLogin}>
                        <div>
                            <label htmlFor="email" className="block text-sm font-bold tracking-widest uppercase text-white/40">
                                Email address
                            </label>
                            <div className="mt-2 relative rounded-xl shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-4 w-4 text-white/40" />
                                </div>
                                <input
                                    id="email"
                                    name="email"
                                    type="email"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 text-sm border-white/10 bg-black/40 text-white rounded-xl focus:ring-2 focus:ring-army-500 focus:border-transparent py-3 border transition-all placeholder:text-white/20"
                                    placeholder="admin@daharengineer.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="password" className="block text-sm font-bold tracking-widest uppercase text-white/40">
                                Password
                            </label>
                            <div className="mt-2 relative rounded-xl shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-4 w-4 text-white/40" />
                                </div>
                                <input
                                    id="password"
                                    name="password"
                                    type="password"
                                    autoComplete="current-password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 text-sm border-white/10 bg-black/40 text-white rounded-xl focus:ring-2 focus:ring-army-500 focus:border-transparent py-3 border transition-all placeholder:text-white/20"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        <div>
                            <button
                                type="submit"
                                disabled={isLoading}
                                className="w-full flex justify-center items-center py-3 px-4 rounded-xl shadow-sm text-sm font-bold text-black bg-white hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-army-500 focus:ring-offset-black transition-all disabled:opacity-70 disabled:cursor-not-allowed uppercase tracking-wider"
                            >
                                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Sign in"}
                            </button>
                        </div>
                    </form>

                    <div className="mt-6">
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-white/5" />
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="px-2 bg-secondary text-white/40 uppercase tracking-widest font-bold">Or continue with</span>
                            </div>
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={handleGoogleLogin}
                                disabled={isLoading}
                                className="w-full inline-flex justify-center items-center py-3 px-4 border border-white/10 rounded-xl shadow-sm bg-black/40 text-sm font-bold text-white hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-army-500 focus:ring-offset-black transition-all disabled:opacity-70 disabled:cursor-not-allowed group uppercase tracking-wider"
                            >
                                <svg className="w-5 h-5 mr-3 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="currentColor">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#hi" />
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                                </svg>
                                Sign in with Google
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
