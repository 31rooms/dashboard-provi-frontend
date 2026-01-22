"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, LabelList } from 'recharts';

export function FunnelChart({ data }: { data: any[] }) {
    // Process data to show the funnel stages
    const funnelData = [
        { name: 'Leads', value: data.reduce((acc, curr) => acc + (curr.total_leads || 0), 0), color: '#0f172a' },
        { name: 'Citas', value: data.reduce((acc, curr) => acc + (curr.total_citas || 0), 0), color: '#334155' },
        { name: 'Visitas', value: data.reduce((acc, curr) => acc + (curr.total_visitas || 0), 0), color: '#475569' },
        { name: 'Apartados', value: data.reduce((acc, curr) => acc + (curr.total_apartados || 0), 0), color: '#f97316' },
        { name: 'Ventas', value: data.reduce((acc, curr) => acc + (curr.total_ventas || 0), 0), color: '#ea580c' },
    ];

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-[450px]">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900">Embudo de Conversión</h3>
                <p className="text-sm text-slate-500">Progreso de leads a través de las etapas críticas</p>
            </div>
            <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        layout="vertical"
                        data={funnelData}
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f1f5f9" />
                        <XAxis type="number" hide />
                        <YAxis
                            dataKey="name"
                            type="category"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                        />
                        <Tooltip
                            cursor={{ fill: '#f8fafc' }}
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={40}>
                            {funnelData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                            <LabelList dataKey="value" position="right" style={{ fill: '#0f172a', fontWeight: 700, fontSize: 12 }} />
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            <div className="mt-4 flex justify-between text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                <span>Captación</span>
                <div className="h-px flex-1 border-t border-slate-100 mx-4 self-center"></div>
                <span>Cierre</span>
            </div>
        </div>
    );
}
