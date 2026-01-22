"use client";

import { TrendingUp, Users } from "lucide-react";

interface WalkInsProps {
    data: Array<{
        desarrollo: string;
        vendedor: string;
        total_walk_ins: number;
        walk_ins_con_cita: number;
        walk_ins_visitados: number;
        walk_ins_apartados: number;
        conversion_walk_in_pct: string;
    }>;
}

export function WalkInsTable({ data }: WalkInsProps) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center gap-2 mb-4">
                    <Users className="w-5 h-5 text-blue-600" />
                    <h3 className="text-lg font-semibold text-gray-900">Walk-ins por Desarrollo y Vendedor</h3>
                </div>
                <p className="text-gray-500 text-center py-8">No hay registros de walk-ins</p>
            </div>
        );
    }

    // Agrupar por desarrollo para totales
    const byDesarrollo = data.reduce((acc: any, row) => {
        const desarrollo = row.desarrollo || "Sin desarrollo";
        if (!acc[desarrollo]) {
            acc[desarrollo] = {
                desarrollo,
                total: 0,
                con_cita: 0,
                visitados: 0,
                apartados: 0
            };
        }
        acc[desarrollo].total += row.total_walk_ins || 0;
        acc[desarrollo].con_cita += row.walk_ins_con_cita || 0;
        acc[desarrollo].visitados += row.walk_ins_visitados || 0;
        acc[desarrollo].apartados += row.walk_ins_apartados || 0;
        return acc;
    }, {});

    const desarrolloTotals = Object.values(byDesarrollo);

    // Calcular gran total
    const grandTotal = {
        total: data.reduce((sum, row) => sum + (row.total_walk_ins || 0), 0),
        con_cita: data.reduce((sum, row) => sum + (row.walk_ins_con_cita || 0), 0),
        visitados: data.reduce((sum, row) => sum + (row.walk_ins_visitados || 0), 0),
        apartados: data.reduce((sum, row) => sum + (row.walk_ins_apartados || 0), 0),
        conversion_pct: 0
    };
    grandTotal.conversion_pct = grandTotal.total > 0
        ? (grandTotal.apartados / grandTotal.total) * 100
        : 0;

    return (
        <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Walk-ins por Desarrollo y Vendedor</h3>
            </div>

            {/* Resumen por desarrollo */}
            <div className="mb-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                {desarrolloTotals.map((dev: any, idx) => {
                    const conversionPct = dev.total > 0 ? ((dev.apartados / dev.total) * 100).toFixed(1) : "0.0";
                    return (
                        <div key={idx} className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                                {dev.desarrollo?.replace(" V2", "") || "Sin desarrollo"}
                            </h4>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold text-blue-900">{dev.total}</span>
                                <span className="text-sm text-gray-600">walk-ins</span>
                            </div>
                            <div className="mt-2 flex items-center gap-1 text-xs text-gray-600">
                                <TrendingUp className="w-3 h-3 text-green-600" />
                                <span>{conversionPct}% conversión a apartado</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Tabla detallada por vendedor */}
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Desarrollo
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                Vendedor
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                Total Walk-ins
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                Con Cita
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                Visitados
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                Apartados
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                % Conversión
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {data.map((row, idx) => {
                            const conversion = parseFloat(row.conversion_walk_in_pct || "0");
                            const conversionColor =
                                conversion >= 20 ? "text-green-600 bg-green-50" :
                                conversion >= 10 ? "text-yellow-600 bg-yellow-50" :
                                "text-gray-600 bg-gray-50";

                            return (
                                <tr key={idx} className="hover:bg-gray-50">
                                    <td className="px-4 py-3 text-sm text-gray-900">
                                        {row.desarrollo?.replace(" V2", "") || "Sin desarrollo"}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                        {row.vendedor || "Sin asignar"}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-center font-semibold text-blue-600">
                                        {row.total_walk_ins || 0}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-center text-gray-700">
                                        {row.walk_ins_con_cita || 0}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-center text-gray-700">
                                        {row.walk_ins_visitados || 0}
                                    </td>
                                    <td className="px-4 py-3 text-sm text-center font-medium text-gray-900">
                                        {row.walk_ins_apartados || 0}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${conversionColor}`}>
                                            {conversion.toFixed(1)}%
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                        <tr className="bg-gray-100 font-semibold">
                            <td colSpan={2} className="px-4 py-3 text-sm text-gray-900">
                                TOTAL GENERAL
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-blue-600">
                                {grandTotal.total}
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900">
                                {grandTotal.con_cita}
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900">
                                {grandTotal.visitados}
                            </td>
                            <td className="px-4 py-3 text-sm text-center text-gray-900">
                                {grandTotal.apartados}
                            </td>
                            <td className="px-4 py-3 text-center">
                                <span className="inline-flex px-3 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
                                    {grandTotal.conversion_pct.toFixed(1)}%
                                </span>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Leyenda */}
            <div className="mt-4 text-xs text-gray-500">
                <p>
                    <strong>Walk-in:</strong> Cliente que visita directamente el desarrollo sin cita previa.
                    Una alta conversión de walk-ins indica buena ubicación y atención en sitio.
                </p>
            </div>
        </div>
    );
}
