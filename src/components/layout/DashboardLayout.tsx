"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
    LayoutDashboard,
    Users,
    Target,
    RefreshCw,
    LogOut,
    ChevronLeft,
    ChevronRight,
    Menu,
    X
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarItemProps {
    icon: React.ElementType;
    label: string;
    href: string;
    active?: boolean;
    collapsed?: boolean;
}

const SidebarItem = ({ icon: Icon, label, href, active, collapsed }: SidebarItemProps) => (
    <Link
        href={href}
        className={cn(
            "flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group",
            active
                ? "bg-slate-900 text-white shadow-lg shadow-slate-200"
                : "text-slate-500 hover:bg-slate-100 hover:text-slate-900",
            collapsed && "justify-center px-2"
        )}
    >
        <Icon size={20} className={cn("shrink-0", active ? "text-orange-400" : "group-hover:text-slate-900")} />
        {!collapsed && <span className="font-medium truncate">{label}</span>}
    </Link>
);

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [collapsed, setCollapsed] = useState(false);
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        document.cookie = "auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
        router.push("/login");
    };

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const response = await fetch("/api/sync", { method: "POST" });
            if (response.ok) {
                alert("Sincronización completada con éxito");
                router.refresh();
            } else {
                alert("Error al sincronizar");
            }
        } catch (error) {
            console.error("Sync error:", error);
        } finally {
            setIsSyncing(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#f8fafc] flex overflow-hidden">
            {/* Sidebar for Desktop */}
            <aside
                className={cn(
                    "hidden md:flex flex-col bg-white border-r border-slate-200 transition-all duration-300 ease-in-out z-30",
                    collapsed ? "w-20" : "w-72"
                )}
            >
                <div className="p-6 mb-2 flex items-center justify-between">
                    {!collapsed && (
                        <div className="h-10 relative w-32">
                            <Image src="/logo-provi.png" alt="Provi" fill className="object-contain" />
                        </div>
                    )}
                    <button
                        onClick={() => setCollapsed(!collapsed)}
                        className="p-2 rounded-xl border border-slate-100 text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
                    >
                        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    </button>
                </div>

                <nav className="flex-1 px-4 space-y-2 overflow-y-auto pt-4">
                    <SidebarItem
                        icon={LayoutDashboard}
                        label="Dirección"
                        href="/dashboard"
                        active={pathname === "/dashboard"}
                        collapsed={collapsed}
                    />
                    <SidebarItem
                        icon={Target}
                        label="Marketing"
                        href="/dashboard/marketing"
                        active={pathname === "/dashboard/marketing"}
                        collapsed={collapsed}
                    />
                    <SidebarItem
                        icon={Users}
                        label="Ventas"
                        href="/dashboard/ventas"
                        active={pathname === "/dashboard/ventas"}
                        collapsed={collapsed}
                    />
                </nav>

                <div className="p-4 border-t border-slate-100 space-y-2">
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group text-orange-600 hover:bg-orange-50",
                            collapsed && "justify-center px-2",
                            isSyncing && "opacity-50 cursor-not-allowed"
                        )}
                    >
                        <RefreshCw size={20} className={cn("shrink-0", isSyncing && "animate-spin")} />
                        {!collapsed && <span className="font-semibold text-sm">Sincronizar Datos</span>}
                    </button>

                    <button
                        onClick={handleLogout}
                        className={cn(
                            "w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group text-slate-500 hover:bg-red-50 hover:text-red-600",
                            collapsed && "justify-center px-2"
                        )}
                    >
                        <LogOut size={20} className="shrink-0" />
                        {!collapsed && <span className="font-medium text-sm">Cerrar Sesión</span>}
                    </button>
                </div>
            </aside>

            {/* Mobile Sidebar (Drawer) */}
            <div className={cn(
                "fixed inset-0 bg-slate-900/50 z-40 md:hidden transition-opacity duration-300",
                isMobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
            )} onClick={() => setIsMobileOpen(false)} />

            <aside className={cn(
                "fixed inset-y-0 left-0 w-72 bg-white z-50 md:hidden transition-transform duration-300 ease-in-out flex flex-col",
                isMobileOpen ? "translate-x-0" : "-translate-x-full"
            )}>
                <div className="p-6 flex items-center justify-between border-b border-slate-100">
                    <div className="h-8 relative w-24">
                        <Image src="/logo-provi.png" alt="Provi" fill className="object-contain" />
                    </div>
                    <button onClick={() => setIsMobileOpen(false)} className="p-2 text-slate-400">
                        <X size={24} />
                    </button>
                </div>
                {/* Mobile items ... same as desktop sidebar but without collapsed state */}
                <nav className="flex-1 px-4 py-6 space-y-2">
                    <SidebarItem icon={LayoutDashboard} label="Dirección" href="/dashboard" active={pathname === "/dashboard"} />
                    <SidebarItem icon={Target} label="Marketing" href="/dashboard/marketing" active={pathname === "/dashboard/marketing"} />
                    <SidebarItem icon={Users} label="Ventas" href="/dashboard/ventas" active={pathname === "/dashboard/ventas"} />
                </nav>
                <div className="p-4 border-t border-slate-100">
                    <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-500 hover:bg-red-50 hover:text-red-600 transition-all">
                        <LogOut size={20} />
                        <span className="font-medium">Cerrar Sesión</span>
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col h-screen overflow-hidden">
                {/* Header (Top Bar) */}
                <header className="h-16 bg-white border-b border-slate-200 px-6 flex items-center justify-between shrink-0 md:justify-end">
                    <button onClick={() => setIsMobileOpen(true)} className="md:hidden p-2 text-slate-600">
                        <Menu size={24} />
                    </button>

                    <div className="hidden lg:flex items-center gap-2 mr-6 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Pipelines V2 Activos:</span>
                        <div className="flex gap-1.5">
                            {[12290640, 12535008, 12535020].map(id => (
                                <span key={id} className="text-[11px] font-mono font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100/50">
                                    {id}
                                </span>
                            ))}
                        </div>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden sm:flex flex-col text-right">
                            <span className="text-sm font-semibold text-slate-800 uppercase">Administrador</span>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-slate-900 flex items-center justify-center text-white font-bold ring-4 ring-slate-50">
                            AD
                        </div>
                    </div>
                </header>

                {/* Dynamic Page Content */}
                <div className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#fbfcfd]">
                    {children}
                </div>
            </main>
        </div>
    );
}
