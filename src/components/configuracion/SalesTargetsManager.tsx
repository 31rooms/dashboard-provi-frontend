"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Save, X, TrendingUp, Calendar, Building2 } from "lucide-react";

interface SalesTarget {
    id?: number;
    mes: number;
    anio: number;
    desarrollo: string;
    meta_leads: number;
    meta_citas: number;
    meta_apartados: number;
    meta_ventas: number;
    meta_monto: number;
}

const MESES = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
];

// Solo los desarrollos individuales - "Todos" se calcula automáticamente
const DESARROLLOS = [
    "Bosques de Cholul",
    "Cumbres de San Pedro",
    "Paraíso Caucel"
];

export function SalesTargetsManager() {
    const [targets, setTargets] = useState<SalesTarget[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState<SalesTarget>({
        mes: new Date().getMonth() + 1,
        anio: 2025,
        desarrollo: "Bosques de Cholul",
        meta_leads: 0,
        meta_citas: 0,
        meta_apartados: 0,
        meta_ventas: 0,
        meta_monto: 0
    });
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Cargar metas al montar
    useEffect(() => {
        fetchTargets();
    }, []);

    const fetchTargets = async () => {
        try {
            const response = await fetch("/api/sales-targets");
            const result = await response.json();
            if (result.success) {
                setTargets(result.data || []);
            }
        } catch (err) {
            console.error("Error fetching targets:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        try {
            const url = editingId ? "/api/sales-targets" : "/api/sales-targets";
            const method = editingId ? "PUT" : "POST";
            const body = editingId ? { ...formData, id: editingId } : formData;

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(body)
            });

            const result = await response.json();

            if (!result.success) {
                setError(result.error || "Error al guardar la meta");
                return;
            }

            setSuccess(editingId ? "Meta actualizada correctamente" : "Meta creada correctamente");
            setShowForm(false);
            setEditingId(null);
            resetForm();
            fetchTargets();

            // Limpiar mensaje de éxito después de 3 segundos
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || "Error al guardar la meta");
        }
    };

    const handleEdit = (target: SalesTarget) => {
        setFormData(target);
        setEditingId(target.id || null);
        setShowForm(true);
        setError(null);
        setSuccess(null);
    };

    const handleDelete = async (id: number) => {
        if (!confirm("¿Estás seguro de eliminar esta meta?")) return;

        try {
            const response = await fetch(`/api/sales-targets?id=${id}`, {
                method: "DELETE"
            });

            const result = await response.json();

            if (!result.success) {
                setError(result.error || "Error al eliminar la meta");
                return;
            }

            setSuccess("Meta eliminada correctamente");
            fetchTargets();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || "Error al eliminar la meta");
        }
    };

    const resetForm = () => {
        setFormData({
            mes: new Date().getMonth() + 1,
            anio: 2025,
            desarrollo: "Bosques de Cholul V2",
            meta_leads: 0,
            meta_citas: 0,
            meta_apartados: 0,
            meta_ventas: 0,
            meta_monto: 0
        });
        setEditingId(null);
    };

    const handleCancel = () => {
        setShowForm(false);
        resetForm();
        setError(null);
    };

    // Generar opciones de años (2025 hacia adelante)
    const getYearOptions = () => {
        const years = [];
        for (let year = 2025; year <= 2030; year++) {
            years.push(year);
        }
        return years;
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="w-7 h-7 text-blue-600" />
                        Configuración de Metas de Ventas
                    </h2>
                    <p className="text-sm text-gray-600 mt-1">
                        Define las metas mensuales por desarrollo para medir el avance del equipo
                    </p>
                </div>
                {!showForm && (
                    <button
                        onClick={() => setShowForm(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        <Plus className="w-4 h-4" />
                        Nueva Meta
                    </button>
                )}
            </div>

            {/* Mensajes */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
                    {error}
                </div>
            )}
            {success && (
                <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg">
                    {success}
                </div>
            )}

            {/* Formulario */}
            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                    <h3 className="text-lg font-semibold mb-4">
                        {editingId ? "Editar Meta" : "Nueva Meta"}
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        {/* Mes */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Mes
                            </label>
                            <select
                                value={formData.mes}
                                onChange={(e) => setFormData({ ...formData, mes: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                {MESES.map((mes, idx) => (
                                    <option key={idx} value={idx + 1}>
                                        {mes}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Año */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Año
                            </label>
                            <select
                                value={formData.anio}
                                onChange={(e) => setFormData({ ...formData, anio: parseInt(e.target.value) })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                {getYearOptions().map((year) => (
                                    <option key={year} value={year}>
                                        {year}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Desarrollo */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                <Building2 className="w-4 h-4 inline mr-1" />
                                Desarrollo
                            </label>
                            <select
                                value={formData.desarrollo}
                                onChange={(e) => setFormData({ ...formData, desarrollo: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                required
                            >
                                {DESARROLLOS.map((dev) => (
                                    <option key={dev} value={dev}>
                                        {dev}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-4">
                        {/* Meta Leads */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Meta Leads
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={formData.meta_leads}
                                onChange={(e) => setFormData({ ...formData, meta_leads: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Meta Citas */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Meta Citas
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={formData.meta_citas}
                                onChange={(e) => setFormData({ ...formData, meta_citas: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Meta Apartados */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Meta Apartados
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={formData.meta_apartados}
                                onChange={(e) => setFormData({ ...formData, meta_apartados: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Meta Ventas */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Meta Ventas
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={formData.meta_ventas}
                                onChange={(e) => setFormData({ ...formData, meta_ventas: parseInt(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Meta Monto */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Meta Monto (MXN)
                            </label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                value={formData.meta_monto}
                                onChange={(e) => setFormData({ ...formData, meta_monto: parseFloat(e.target.value) || 0 })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex gap-3">
                        <button
                            type="submit"
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Save className="w-4 h-4" />
                            {editingId ? "Actualizar" : "Guardar"}
                        </button>
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            <X className="w-4 h-4" />
                            Cancelar
                        </button>
                    </div>
                </form>
            )}

            {/* Tabla de metas */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Período</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Desarrollo</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Leads</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Citas</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Apartados</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Ventas</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Monto</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {targets.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-6 py-12 text-center text-gray-500">
                                        No hay metas configuradas. Haz clic en "Nueva Meta" para comenzar.
                                    </td>
                                </tr>
                            ) : (
                                targets.map((target) => {
                                    const isTodos = target.desarrollo === "Todos";
                                    return (
                                        <tr key={target.id} className={isTodos ? "bg-blue-50 hover:bg-blue-100" : "hover:bg-gray-50"}>
                                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                                {MESES[target.mes - 1]} {target.anio}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-700">
                                                {isTodos ? (
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-blue-900">{target.desarrollo}</span>
                                                        <span className="px-2 py-0.5 text-xs bg-blue-200 text-blue-800 rounded-full font-semibold">
                                                            Auto
                                                        </span>
                                                    </div>
                                                ) : (
                                                    target.desarrollo?.replace(" V2", "") || "N/A"
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-center text-gray-900">{target.meta_leads}</td>
                                            <td className="px-6 py-4 text-sm text-center text-gray-900">{target.meta_citas}</td>
                                            <td className="px-6 py-4 text-sm text-center text-gray-900">{target.meta_apartados}</td>
                                            <td className="px-6 py-4 text-sm text-center font-semibold text-blue-600">{target.meta_ventas}</td>
                                            <td className="px-6 py-4 text-sm text-right font-mono text-gray-900">
                                                ${target.meta_monto?.toLocaleString("es-MX")}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {isTodos ? (
                                                    <span className="text-xs text-gray-500 italic">Calculado</span>
                                                ) : (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleEdit(target)}
                                                            className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                            title="Editar"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => target.id && handleDelete(target.id)}
                                                            className="p-1 text-red-600 hover:bg-red-50 rounded"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
