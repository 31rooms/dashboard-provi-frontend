"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const COLORS = ['#0f172a', '#f97316', '#3b82f6', '#10b981', '#8b5cf6', '#ec4899', '#64748b', '#94a3b8'];

interface SourceDetail {
    name: string;
    value: number;
}

interface SourceGroup {
    type: string;
    sources: SourceDetail[];
    total: number;
}

export function SourcesDetailChart({ data }: { data: SourceGroup[] }) {
    return (
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-slate-900">Distribución por Canal (Detalle)</h3>
                <p className="text-sm text-slate-500">Desglose por formulario/fuente individual</p>
            </div>

            <div className="space-y-8">
                {data.map((group, groupIndex) => (
                    <div key={group.type} className="space-y-3">
                        {/* Header del grupo */}
                        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: COLORS[groupIndex % COLORS.length] }}
                                />
                                <span className="font-semibold text-slate-800">{group.type}</span>
                            </div>
                            <span className="text-sm font-bold text-slate-600">
                                {group.total.toLocaleString()} leads
                            </span>
                        </div>

                        {/* Chart del grupo */}
                        <div style={{ height: Math.max(group.sources.length * 32, 80) }}>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart
                                    data={group.sources}
                                    layout="vertical"
                                    margin={{ top: 0, right: 30, left: 20, bottom: 0 }}
                                >
                                    <XAxis type="number" hide />
                                    <YAxis
                                        type="category"
                                        dataKey="name"
                                        width={200}
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
                                    <Bar
                                        dataKey="value"
                                        fill={COLORS[groupIndex % COLORS.length]}
                                        radius={[0, 4, 4, 0]}
                                        maxBarSize={20}
                                        opacity={0.8}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
