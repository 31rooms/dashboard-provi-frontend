"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

interface AccordionSectionProps {
    title: string;
    subtitle?: string;
    badge?: {
        text: string;
        color?: string;
    };
    headerRight?: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
}

export function AccordionSection({
    title,
    subtitle,
    badge,
    headerRight,
    children,
    defaultOpen = false
}: AccordionSectionProps) {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="w-full p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 text-left">{title}</h3>
                        {subtitle && (
                            <p className="text-sm text-slate-500 text-left">{subtitle}</p>
                        )}
                    </div>
                    {badge && (
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-full ${badge.color || "bg-slate-100 text-slate-600"}`}>
                            {badge.text}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    {headerRight}
                    <ChevronDown
                        className={`text-slate-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
                        size={20}
                    />
                </div>
            </button>
            <div
                className={`transition-all duration-200 ease-in-out overflow-hidden ${
                    isOpen ? "max-h-[2000px] opacity-100" : "max-h-0 opacity-0"
                }`}
            >
                <div className="border-t border-slate-100">
                    {children}
                </div>
            </div>
        </div>
    );
}
