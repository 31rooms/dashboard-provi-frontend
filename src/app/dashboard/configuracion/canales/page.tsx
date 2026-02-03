"use client";

import { useState, useEffect } from "react";
import { Radio, AlertCircle, Check, X, Pencil, Search } from "lucide-react";

interface KommoSource {
    id: number;
    source_id: number;
    source_name: string | null;
    source_type: string | null;
    created_at: string;
    updated_at: string;
    lead_count?: number;
}

const SOURCE_TYPES = [
    "Facebook Leads Ads",
    "WhatsApp Business",
    "WhatsApp Vendedor",
    "Formularios web",
    "Instagram Ads",
    "Google Ads",
    "Orgánico",
    "Referido",
    "Otro"
];

export default function CanalesPage() {
    const [sources, setSources] = useState<KommoSource[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editValue, setEditValue] = useState("");
    const [editType, setEditType] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState("");

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
        setEditType(source.source_type || null);
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
                    source_name: editValue.trim() || null,
                    source_type: editType || null
                })
            });

            const result = await response.json();

            if (!result.success) {
                setError(result.error || "Error al guardar");
                return;
            }

            setSuccess(`Canal actualizado correctamente`);
            setEditingId(null);
            setEditValue("");
            setEditType(null);
            fetchSources();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err: any) {
            setError(err.message || "Error al guardar");
        }
    };

    const handleCancel = () => {
        setEditingId(null);
        setEditValue("");
        setEditType(null);
        setError(null);
    };

    const handleKeyDown = (e: React.KeyboardEvent, source: KommoSource) => {
        if (e.key === "Enter") {
            handleSave(source);
        } else if (e.key === "Escape") {
            handleCancel();
        }
    };

    // Filtrar y ordenar: primero los que tienen tipo, luego los que no
    const filteredSources = sources
        .filter(s => {
            const search = searchTerm.toLowerCase();
            return (
                s.source_id.toString().includes(search) ||
                (s.source_name || "").toLowerCase().includes(search) ||
                (s.source_type || "").toLowerCase().includes(search)
            );
        })
        .sort((a, b) => {
            // Primero los que tienen tipo asignado
            if (a.source_type && !b.source_type) return -1;
            if (!a.source_type && b.source_type) return 1;
            // Luego ordenar por tipo alfabéticamente
            if (a.source_type && b.source_type) {
                return a.source_type.localeCompare(b.source_type);
            }
            // Los sin tipo, ordenar por source_id
            return a.source_id - b.source_id;
        });

    const unlabeledCount = sources.filter(s => !s.source_type).length;
    const labeledCount = sources.filter(s => s.source_type).length;

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
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                    <Radio className="w-8 h-8 text-purple-600" />
                    Canales de Origen
                </h1>
                <p className="text-sm text-gray-600 mt-2">
                    Asigna un <strong>Tipo</strong> a cada canal para agruparlos en el grafico de "Distribucion por Canal".
                    El <strong>Nombre</strong> es opcional y sirve para identificar cada formulario especifico.
                </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="text-2xl font-bold text-gray-900">{sources.length}</div>
                    <div className="text-sm text-gray-500">Canales detectados</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="text-2xl font-bold text-green-600">{labeledCount}</div>
                    <div className="text-sm text-gray-500">Con tipo asignado</div>
                </div>
                <div className="bg-white rounded-xl border border-gray-200 p-4">
                    <div className="text-2xl font-bold text-amber-600">{unlabeledCount}</div>
                    <div className="text-sm text-gray-500">Sin tipo asignado</div>
                </div>
            </div>

            {/* Alert for unlabeled */}
            {unlabeledCount > 0 && (
                <div className="flex items-center gap-2 text-amber-700 bg-amber-50 border border-amber-200 px-4 py-3 rounded-lg">
                    <AlertCircle className="w-5 h-5 flex-shrink-0" />
                    <span>
                        <strong>{unlabeledCount} canal{unlabeledCount !== 1 ? "es" : ""}</strong> sin tipo asignado.
                        Los leads de estos canales apareceran como "Sin clasificar" en el grafico.
                    </span>
                </div>
            )}

            {/* Messages */}
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

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                    type="text"
                    placeholder="Buscar por ID o nombre..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Source ID
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Nombre del Canal
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Tipo (Agrupacion)
                                </th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Detectado
                                </th>
                                <th className="px-6 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                    Acciones
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredSources.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                        {searchTerm ? "No se encontraron canales con ese criterio." : "No hay canales detectados. Ejecuta un sync para poblar esta tabla."}
                                    </td>
                                </tr>
                            ) : (
                                filteredSources.map((source) => {
                                    const isEditing = editingId === source.id;
                                    const isUnlabeled = !source.source_type;

                                    return (
                                        <tr
                                            key={source.id}
                                            className={isUnlabeled ? "bg-amber-50/50 hover:bg-amber-50" : "hover:bg-gray-50"}
                                        >
                                            <td className="px-6 py-4">
                                                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded text-gray-700">
                                                    {source.source_id}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4">
                                                {isEditing ? (
                                                    <input
                                                        type="text"
                                                        value={editValue}
                                                        onChange={(e) => setEditValue(e.target.value)}
                                                        onKeyDown={(e) => handleKeyDown(e, source)}
                                                        placeholder="Ej: CUMBRES | Enero | V1..."
                                                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                                                        autoFocus
                                                    />
                                                ) : (
                                                    <span className="text-gray-900 text-sm font-medium">
                                                        {source.source_name || <span className="text-gray-400 italic">-</span>}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4">
                                                {isEditing ? (
                                                    <select
                                                        value={editType || ""}
                                                        onChange={(e) => setEditType(e.target.value || null)}
                                                        className="w-full px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white"
                                                    >
                                                        <option value="">Seleccionar tipo...</option>
                                                        {SOURCE_TYPES.map(type => (
                                                            <option key={type} value={type}>{type}</option>
                                                        ))}
                                                    </select>
                                                ) : (
                                                    <span className={isUnlabeled ? "text-amber-600 italic text-sm" : "text-gray-900 text-sm"}>
                                                        {source.source_type || "Sin tipo asignado"}
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
                                            <td className="px-6 py-4">
                                                <div className="flex items-center justify-center gap-1">
                                                    {isEditing ? (
                                                        <>
                                                            <button
                                                                onClick={() => handleSave(source)}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                                title="Guardar"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={handleCancel}
                                                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
                                                                title="Cancelar"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleEdit(source)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Editar nombre"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Help text */}
            <div className="text-sm text-gray-500 bg-gray-50 rounded-lg p-4 space-y-2">
                <p>
                    <strong>Tipo:</strong> Es la categoria para agrupar en el grafico (ej: "Facebook Leads Ads", "WhatsApp Business").
                    Todos los formularios con el mismo tipo se sumaran juntos.
                </p>
                <p>
                    <strong>Nombre:</strong> Es opcional. Sirve para identificar cada formulario especifico
                    (ej: "CUMBRES | Enero | V1").
                </p>
            </div>
        </div>
    );
}
