"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const COLORS = ['#0f172a', '#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#64748b', '#94a3b8'];

export function SourcesChart({ data, title = "Distribución por Canal", subtitle = "Origen de los prospectos" }: { data: any[]; title?: string; subtitle?: string }) {
    // Ordenar por valor descendente
    const sortedData = [...data].sort((a, b) => b.value - a.value);

    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-[400px]">
            <div className="mb-4">
                <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                <p className="text-sm text-slate-500">{subtitle}</p>
            </div>
            <div className="h-[320px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={sortedData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                        <XAxis type="number" fontSize={12} tickLine={false} axisLine={false} />
                        <YAxis
                            type="category"
                            dataKey="name"
                            width={150}
                            fontSize={11}
                            tickLine={false}
                            axisLine={false}
                            tick={{ fill: '#64748b' }}
                        />
                        <Tooltip
                            contentStyle={{
                                borderRadius: '12px',
                                border: 'none',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                fontSize: '13px',
                                color: '#1e293b'
                            }}
                            labelStyle={{ color: '#1e293b', fontWeight: 600 }}
                            formatter={(value) => [Number(value).toLocaleString(), 'Leads']}
                        />
                        <Bar dataKey="value" radius={[0, 4, 4, 0]} maxBarSize={24}>
                            {sortedData.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
