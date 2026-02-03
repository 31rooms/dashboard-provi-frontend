"use client";

import { useState, useEffect } from "react";
import { Save, X, Radio, AlertCircle, Check } from "lucide-react";

interface KommoSource {
    id: number;
    source_id: number;
    source_name: string | null;
    created_at: string;
    updated_at: string;
}

export function KommoSourcesManager() {
    const [sources, setSources] = useState<KommoSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    useEffect(() => {
        fetchSources();
    }, []);

    const fetchSources = async () => {
        try {
            const response = await fetch("/api/kommo-sources");
            const result = await response.json();
            if (result.success) {
                setSources(result.data || []);
            }
        } catch (err) {
            console.error("Error fetching sources:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (source: KommoSource) => {
        setEditingId(source.id);
        setEditValue(source.source_name || "");
        setError(null);
        setSuccess(null);
    };

    const handleSave = async (source: KommoSource) => {
        setError(null);
        setSuccess(null);

        try {
            const response = await fetch("/api/kommo-sources", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: source.id,
                    source_name: editValue.trim() || null
                })
            });

            const result = await response.json();

            if (!result.success) {
                setError(result.error || "Error al guardar");
                return;
            }

            setSuccess(`Fuente #${source.source_id} actualizada`);
            setEditingId(null);
            setEditValue("");
            fetchSources();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || "Error al guardar");
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditValue("");
        setError(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent, source: KommoSource) => {
        if (e.key === "Enter") {
            handleSave(source);
        } else if (e.key === "Escape") {
            handleCancel();
        }
    };

    const unlabeledCount = sources.filter(s => !s.source_name).length;

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
            <div>
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                    <Radio className="w-7 h-7 text-purple-600" />
                    Fuentes de Kommo (Sources)
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                    Asigna nombres legibles a las fuentes nativas de Kommo. Estas se usan en el grafico de "Distribucion por Canal".
                </p>
                {unlabeledCount > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 px-3 py-2 rounded-lg text-sm">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        <span>{unlabeledCount} fuente{unlabeledCount !== 1 ? "s" : ""} sin etiquetar</span>
                    </div>
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

            {/* Tabla */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Source ID</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre asignado</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Detectado</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {sources.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                                        No hay fuentes detectadas. Ejecuta un sync para poblar esta tabla.
                                    </td>
                                </tr>
                            ) : (
                                sources.map((source) => {
                                    const isEditing = editingId === source.id;
                                    const isUnlabeled = !source.source_name;

                                    return (
                                        <tr
                                            key={source.id}
                                            className={isUnlabeled ? "bg-amber-50 hover:bg-amber-100" : "hover:bg-gray-50"}
                                        >
                                            <td className="px-6 py-4 text-sm font-mono text-gray-900">
                                                {source.source_id}
                                            </td>
                                            <td className="px-6 py-4 text-sm">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        onKeyDown={(e) => handleKeyDown(e, source)}
                                                        placeholder="Ej: Facebook Ads, Google Ads, Casa Muestra..."
                                                        className="w-full px-3 py-1.5 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span className={isUnlabeled ? "text-amber-600 italic" : "text-gray-900"}>
                                                        {source.source_name || "Sin nombre"}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(source.created_at).toLocaleDateString("es-MX", {
                                                    year: "numeric",
                                                    month: "short",
                                                    day: "numeric"
                                                })}
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {isEditing ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleSave(source)}
                                                            className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                            title="Guardar"
                                                        >
                                                            <Check className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={handleCancel}
                                                            className="p-1 text-gray-600 hover:bg-gray-100 rounded"
                                                            title="Cancelar"
                                                        >
                                                            <X className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => handleEdit(source)}
                                                        className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                        title="Editar nombre"
                                                    >
                                                        <Save className="w-4 h-4" />
                                                    </button>
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
