"use client";

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar } from "recharts";
import { format } from "date-fns";

interface MarketingSpendProps {
    data: Array<{
        fecha: string;
        canal: string;
        campana_nombre: string;
        gasto: number;
        leads_generados: number;
        clicks: number;
        impresiones: number;
        cpl: string;
    }>;
    viewMode?: "daily" | "by-channel";
}

export function MarketingSpendChart({ data, viewMode = "by-channel" }: MarketingSpendProps) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold mb-4 text-gray-900">Gasto de Marketing por Canal</h3>
                <p className="text-gray-500 text-center py-8">No hay datos de gastos disponibles</p>
            </div>
        );
    }

    // Agrupar por canal para resumen
    const byChannel = data.reduce((acc: any, row) => {
        const canal = row.canal || "Sin canal";
        if (!acc[canal]) {
            acc[canal] = {
                canal,
                gasto_total: 0,
                leads_total: 0,
                clicks_total: 0,
                impresiones_total: 0
            };
        }
        acc[canal].gasto_total += row.gasto || 0;
        acc[canal].leads_total += row.leads_generados || 0;
        acc[canal].clicks_total += row.clicks || 0;
        acc[canal].impresiones_total += row.impresiones || 0;
        return acc;
    }, {});

    const channelData = Object.values(byChannel).map((ch: any) => ({
        ...ch,
        cpl: ch.leads_total > 0 ? (ch.gasto_total / ch.leads_total).toFixed(2) : "0.00",
        ctr: ch.impresiones_total > 0 ? ((ch.clicks_total / ch.impresiones_total) * 100).toFixed(2) : "0.00"
    }));

    // Ordenar por gasto total descendente
    channelData.sort((a: any, b: any) => b.gasto_total - a.gasto_total);

    // Colores por canal
    const channelColors: Record<string, string> = {
        "Meta Ads": "#1877f2",
        "Google Ads": "#4285f4",
        "TikTok Ads": "#000000",
        "Landing Page": "#10b981",
        "WhatsApp": "#25d366",
        "Referidos": "#f59e0b",
        "Orgánico": "#8b5cf6"
    };

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold mb-4 text-gray-900">Gasto de Marketing por Canal</h3>

            {/* Resumen por canal */}
            <div className="mb-6 overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Canal
                            </th>
                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                Gasto Total
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                Leads
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                CPL
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                Clicks
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                CTR
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {channelData.map((row: any, idx) => (
                            <tr key={idx}>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900 flex items-center gap-2">
                                    <div
                                        className="w-3 h-3 rounded"
                                        style={{ backgroundColor: channelColors[row.canal] || "#6b7280" }}
                                    ></div>
                                    {row.canal}
                                </td>
                                <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                                    ${row.gasto_total.toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                                </td>
                                <td className="px-4 py-3 text-sm text-center text-gray-700">
                                    {row.leads_total}
                                </td>
                                <td className="px-4 py-3 text-sm text-center font-medium text-blue-600">
                                    ${row.cpl}
                                </td>
                                <td className="px-4 py-3 text-sm text-center text-gray-700">
                                    {row.clicks_total.toLocaleString("es-MX")}
                                </td>
                                <td className="px-4 py-3 text-sm text-center text-gray-700">
                                    {row.ctr}%
                                </td>
                            </tr>
                        ))}
                        <tr className="bg-gray-50 font-semibold">
                            <td className="px-4 py-3 text-sm text-gray-900">TOTAL</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-900">
                                ${channelData.reduce((sum: number, ch: any) => sum + ch.gasto_total, 0).toLocaleString("es-MX", { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900">
                                {channelData.reduce((sum: number, ch: any) => sum + ch.leads_total, 0)}
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-blue-600">
                                ${(
                                    channelData.reduce((sum: number, ch: any) => sum + ch.gasto_total, 0) /
                                    channelData.reduce((sum: number, ch: any) => sum + ch.leads_total, 0)
                                ).toFixed(2)}
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900">
                                {channelData.reduce((sum: number, ch: any) => sum + ch.clicks_total, 0).toLocaleString("es-MX")}
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900">
                                {(
                                    (channelData.reduce((sum: number, ch: any) => sum + ch.clicks_total, 0) /
                                    channelData.reduce((sum: number, ch: any) => sum + ch.impresiones_total, 0)) * 100
                                ).toFixed(2)}%
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Gráfico de barras - Gasto por canal */}
            <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Distribución de Gasto por Canal</h4>
                <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={channelData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="canal" angle={-45} textAnchor="end" height={100} />
                        <YAxis />
                        <Tooltip
                            formatter={(value: any, name: any) => {
                                if (name === "gasto_total") return [`$${Number(value).toLocaleString("es-MX", { minimumFractionDigits: 2 })}`, "Gasto"];
                                if (name === "leads_total") return [value, "Leads"];
                                return [value, name];
                            }}
                        />
                        <Legend />
                        <Bar dataKey="gasto_total" fill="#3b82f6" name="Gasto Total (MXN)" />
                        <Bar dataKey="leads_total" fill="#10b981" name="Leads Generados" />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
