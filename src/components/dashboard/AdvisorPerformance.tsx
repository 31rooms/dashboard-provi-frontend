"use client";

import { UserCircle, Clock, Target, TrendingUp } from "lucide-react";

export function AdvisorPerformance({ data }: { data: any[] }) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white p-12 rounded-3xl border border-slate-100 shadow-sm text-center italic text-slate-400">
                No hay datos de rendimiento disponibles para los filtros seleccionados.
            </div>
        );
    }

    return (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-50">
                <h3 className="text-lg font-bold text-slate-900">Rendimiento por Asesor</h3>
                <p className="text-sm text-slate-500">Métricas operativas y de conversión del equipo comercial</p>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50/50 text-slate-500 text-[10px] font-bold uppercase tracking-widest">
                        <tr>
                            <th className="px-6 py-4">Asesor</th>
                            <th className="px-6 py-4">Desarrollo</th>
                            <th className="px-6 py-4 text-center">Leads</th>
                            <th className="px-6 py-4 text-center">Citas</th>
                            <th className="px-6 py-4 text-center">Asistencias</th>
                            <th className="px-6 py-4 text-center">Resp. (h)</th>
                            <th className="px-6 py-4 text-right">Monto Total</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50 text-sm">
                        {data.map((user, idx) => (
                            <tr key={`${user.user_id}-${idx}`} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
                                            <UserCircle size={18} />
                                        </div>
                                        <span className="font-bold text-slate-900">{user.user_name}</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-slate-600 font-medium">{user.desarrollo}</td>
                                <td className="px-6 py-4 text-center text-slate-900 font-bold">{user.total_leads}</td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex flex-col items-center">
                                        <span className="font-bold text-indigo-600">{user.citas_agendadas}</span>
                                        <span className="text-[10px] text-slate-400">
                                            {user.total_leads > 0 ? ((user.citas_agendadas / user.total_leads) * 100).toFixed(0) : 0}%
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <div className="flex flex-col items-center">
                                        <span className="font-bold text-green-600">{user.asistencias}</span>
                                        <span className="text-[10px] text-slate-400">
                                            {user.citas_agendadas > 0 ? ((user.asistencias / user.citas_agendadas) * 100).toFixed(0) : 0}%
                                        </span>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-center">
                                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${user.avg_response_time_hours <= 1 ? 'bg-green-50 text-green-600' :
                                            user.avg_response_time_hours <= 4 ? 'bg-orange-50 text-orange-600' :
                                                'bg-red-50 text-red-600'
                                        }`}>
                                        {user.avg_response_time_hours ? user.avg_response_time_hours.toFixed(1) : '0.0'}h
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right font-mono font-bold text-slate-900">
                                    {new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(user.total_value || 0)}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
