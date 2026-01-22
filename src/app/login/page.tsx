"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { loginAction } from "./actions";
import { Lock, User, Eye, EyeOff, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData();
        formData.append("username", username);
        formData.append("password", password);

        try {
            const result = await loginAction(formData);
            if (result.success) {
                router.push("/dashboard");
                router.refresh(); // Ensure the layout/segments pick up the cookie
            } else {
                setError(result.error || "Error al iniciar sesión");
                setLoading(false);
            }
        } catch (err) {
            setError("Ocurrió un error inesperado");
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] relative overflow-hidden">
            {/* Decorative blobs */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-orange-100/50 rounded-full blur-3xl animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-slate-200/50 rounded-full blur-3xl animate-pulse" />

            <div className="z-10 w-full max-w-md p-8">
                <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-2xl rounded-3xl overflow-hidden">
                    <div className="p-8 pb-4 flex flex-col items-center">
                        <div className="h-16 relative w-full mb-6">
                            <Image
                                src="/logo-provi.png"
                                alt="Provi Logo"
                                fill
                                className="object-contain"
                                priority
                            />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-800">Bienvenido</h1>
                        <p className="text-slate-500 mt-1">Ingresa para ver tus estadísticas</p>
                    </div>

                    <form onSubmit={handleLogin} className="p-8 pt-4 space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 ml-1">Usuario</label>
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-orange-500 transition-colors">
                                    <User size={18} />
                                </span>
                                <input
                                    type="text"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="w-full bg-slate-100/50 border border-transparent focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 rounded-2xl py-3.5 pl-11 pr-4 text-slate-800 placeholder-slate-400 transition-all outline-none"
                                    placeholder="Tu usuario"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2 ml-1">Contraseña</label>
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 group-focus-within:text-orange-500 transition-colors">
                                    <Lock size={18} />
                                </span>
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-100/50 border border-transparent focus:border-orange-500/50 focus:ring-4 focus:ring-orange-500/10 rounded-2xl py-3.5 pl-11 pr-12 text-slate-800 placeholder-slate-400 transition-all outline-none"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 text-red-500 text-sm py-3 px-4 rounded-xl border border-red-100 animate-shake">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className={cn(
                                "w-full bg-slate-900 text-white font-semibold py-4 rounded-2xl shadow-lg shadow-slate-200 hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none flex items-center justify-center gap-2",
                                loading && "bg-slate-800"
                            )}
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Iniciando sesión...
                                </>
                            ) : (
                                "Acceder al Dashboard"
                            )}
                        </button>
                    </form>

                    <div className="p-6 pt-0 text-center">
                        <p className="text-slate-400 text-xs">
                            &copy; {new Date().getFullYear()} Grupo Provi. Todos los derechos reservados.
                        </p>
                    </div>
                </div>
            </div>

            <style jsx global>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-shake {
          animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) both;
        }
      `}</style>
        </div>
    );
}
