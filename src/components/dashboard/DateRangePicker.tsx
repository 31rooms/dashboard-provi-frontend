"use client";

import React, { useState, useRef, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isWithinInterval, startOfDay, endOfDay, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

interface DateRangePickerProps {
    from: string;
    to: string;
    onSelect: (range: { from: string; to: string }) => void;
}

export function DateRangePicker({ from, to, onSelect }: DateRangePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [currentMonth, setCurrentMonth] = useState(new Date(from));
    const [tempRange, setTempRange] = useState<{ from: Date | null, to: Date | null }>({
        from: from ? parseISO(from) : null,
        to: to ? parseISO(to) : null
    });

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const days = eachDayOfInterval({
        start: startOfMonth(currentMonth),
        end: endOfMonth(currentMonth)
    });

    // Padding for the start of the month
    const firstDayOfWeek = startOfMonth(currentMonth).getDay();
    const padding = Array.from({ length: firstDayOfWeek }).map((_, i) => null);

    const handleDayClick = (day: Date) => {
        if (!tempRange.from || (tempRange.from && tempRange.to)) {
            // Start new selection
            setTempRange({ from: day, to: null });
        } else {
            // Complete range
            if (day < tempRange.from) {
                setTempRange({ from: day, to: tempRange.from });
                onSelect({
                    from: startOfDay(day).toISOString(),
                    to: endOfDay(tempRange.from).toISOString()
                });
            } else {
                setTempRange({ ...tempRange, to: day });
                onSelect({
                    from: startOfDay(tempRange.from).toISOString(),
                    to: endOfDay(day).toISOString()
                });
            }
            // Keep open as requested or close after a delay? 
            // The user said "sin salirme del calendario", usually implying it stays open for the second click.
            // After second click we can keep it open but the range is set.
        }
    };

    const isSelected = (day: Date) => {
        if (tempRange.from && isSameDay(day, tempRange.from)) return true;
        if (tempRange.to && isSameDay(day, tempRange.to)) return true;
        return false;
    };

    const isInRange = (day: Date) => {
        if (tempRange.from && tempRange.to) {
            return isWithinInterval(day, { start: tempRange.from, end: tempRange.to });
        }
        return false;
    };

    const weekDays = ["D", "L", "M", "M", "J", "V", "S"];

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all text-sm font-semibold text-slate-700"
            >
                <CalendarIcon size={16} className="text-slate-400" />
                <span>
                    {tempRange.from ? format(tempRange.from, "dd MMM", { locale: es }) : "Desde"}
                    {" - "}
                    {tempRange.to ? format(tempRange.to, "dd MMM", { locale: es }) : "Hasta"}
                </span>
            </button>

            {isOpen && (
                <div className="absolute top-full mt-3 right-0 z-50 bg-white/80 backdrop-blur-xl p-6 rounded-3xl border border-white shadow-2xl w-[320px] animate-in fade-in zoom-in-95 duration-200">
                    <div className="flex items-center justify-between mb-6">
                        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                            <ChevronLeft size={20} className="text-slate-600" />
                        </button>
                        <h4 className="text-sm font-bold text-slate-900 capitalize">
                            {format(currentMonth, "MMMM yyyy", { locale: es })}
                        </h4>
                        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-2 hover:bg-slate-50 rounded-xl transition-colors">
                            <ChevronRight size={20} className="text-slate-600" />
                        </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2">
                        {weekDays.map(d => (
                            <div key={d} className="text-[10px] font-bold text-slate-400 text-center py-2">
                                {d}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {padding.map((_, i) => (
                            <div key={`pad-${i}`} />
                        ))}
                        {days.map(day => {
                            const selected = isSelected(day);
                            const inRange = isInRange(day);
                            const isToday = isSameDay(day, new Date());

                            return (
                                <button
                                    key={day.toISOString()}
                                    onClick={() => handleDayClick(day)}
                                    className={cn(
                                        "h-9 w-9 text-xs rounded-xl flex items-center justify-center transition-all relative",
                                        selected ? "bg-slate-900 text-white font-bold z-10" :
                                            inRange ? "bg-slate-100 text-slate-900" :
                                                "hover:bg-slate-50 text-slate-600",
                                        isToday && !selected && "border border-slate-200"
                                    )}
                                >
                                    {day.getDate()}
                                </button>
                            );
                        })}
                    </div>

                    <div className="mt-6 flex justify-end">
                        <button
                            onClick={() => setIsOpen(false)}
                            className="text-xs font-bold text-slate-900 bg-slate-100 px-4 py-2 rounded-xl hover:bg-slate-200 transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
