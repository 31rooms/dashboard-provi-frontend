"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from "recharts";

interface AvanceVsMetaProps {
    data: Array<{
        desarrollo: string;
        leads_reales: number;
        citas_reales: number;
        apartados_reales: number;
        ventas_reales: number;
        meta_leads: number;
        meta_citas: number;
        meta_apartados: number;
        meta_ventas: number;
        avance_ventas_pct: number;
    }>;
}

export function AvanceVsMetaChart({ data }: AvanceVsMetaProps) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Avance vs Meta de Ventas</h3>
                <p className="text-gray-500 text-center py-8">No hay datos de metas configuradas</p>
            </div>
        );
    }

    // Preparar datos para el gráfico
    const chartData = data.map(d => ({
        desarrollo: d.desarrollo?.replace(" V2", "").substring(0, 15) || "Sin desarrollo",
        Reales: d.ventas_reales || 0,
        Meta: d.meta_ventas || 0,
        avance_pct: d.avance_ventas_pct || 0
    }));

    // Colores condicionales basados en el avance
    const getBarColor = (avance: number) => {
        if (avance >= 100) return "#10b981"; // Verde - Meta alcanzada
        if (avance >= 75) return "#f59e0b"; // Amarillo - Buen avance
        if (avance >= 50) return "#f97316"; // Naranja - Avance moderado
        return "#ef4444"; // Rojo - Bajo avance
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Avance vs Meta de Ventas</h3>

            {/* Tabla de resumen */}
            <div className="mb-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Desarrollo
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                Leads
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                Citas
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                Apartados
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                Ventas
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                Avance
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((row, idx) => {
                            const avance = row.avance_ventas_pct || 0;
                            const avanceColor =
                                avance >= 100 ? "text-green-600 bg-green-50" :
                                avance >= 75 ? "text-yellow-600 bg-yellow-50" :
                                avance >= 50 ? "text-orange-600 bg-orange-50" :
                                "text-red-600 bg-red-50";

                            return (
                                <tr key={idx}>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                        {row.desarrollo?.replace(" V2", "") || "Sin desarrollo"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-center text-gray-700">
                                        {row.leads_reales || 0} / {row.meta_leads || 0}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-center text-gray-700">
                                        {row.citas_reales || 0} / {row.meta_citas || 0}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-center text-gray-700">
                                        {row.apartados_reales || 0} / {row.meta_apartados || 0}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-center font-semibold text-gray-900">
                                        {row.ventas_reales || 0} / {row.meta_ventas || 0}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${avanceColor}`}>
                                            {avance.toFixed(0)}%
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Gráfico de barras */}
            <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="desarrollo" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="Meta" fill="#94a3b8" name="Meta" />
                    <Bar dataKey="Reales" name="Ventas Reales">
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={getBarColor(entry.avance_pct)} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>

            {/* Leyenda de colores */}
            <div className="mt-4 flex gap-4 justify-center text-xs">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                    <span className="text-gray-600">≥100% Meta alcanzada</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                    <span className="text-gray-600">75-99% Buen avance</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-orange-500 rounded"></div>
                    <span className="text-gray-600">50-74% Moderado</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-red-500 rounded"></div>
                    <span className="text-gray-600">&lt;50% Bajo</span>
                </div>
            </div>
        </div>
    );
}
