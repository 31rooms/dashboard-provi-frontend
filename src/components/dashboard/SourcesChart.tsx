"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const COLORS = ['#0f172a', '#f97316', '#64748b', '#94a3b8', '#cbd5e1', '#e2e8f0'];

export function SourcesChart({ data }: { data: any[] }) {
    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm h-[400px]">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900">Distribución por Canal</h3>
                <p className="text-sm text-slate-500">Origen de los prospectos</p>
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
