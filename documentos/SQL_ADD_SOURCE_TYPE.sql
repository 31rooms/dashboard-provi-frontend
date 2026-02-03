-- ============================================================================
-- Agregar source_type a kommo_sources y poblar con datos extraídos de Kommo UI
-- ============================================================================

-- 1. Agregar columna source_type
ALTER TABLE kommo_sources ADD COLUMN IF NOT EXISTS source_type TEXT;

-- 2. Insertar/Actualizar todas las fuentes detectadas con nombres y tipos
-- Tipos detectados del HTML: Formularios web, WhatsApp Business, Facebook Leads Ads, WhatsApp Vendedor

-- ===== PARAÍSO CAUCEL =====
INSERT INTO kommo_sources (source_id, source_name, source_type) VALUES
(23063573, 'Formulario Prueba', 'Formularios web'),
(23063799, 'Formulario web Cholul', 'Formularios web'),
(23063805, 'Formulario Web Caucel', 'Formularios web'),
(23063489, 'Paraíso Caucel', 'WhatsApp Business'),
(23063885, 'PARAISO CAUCEL FORANEO | PRESUPUESTO', 'Facebook Leads Ads'),
(23063887, 'PARAISO CAUCEL YUCATAN | PRESUPUESTO', 'Facebook Leads Ads'),
(23064163, 'PARAISO | MOFU | V2', 'Facebook Leads Ads'),
(23064165, 'PARAISO | BOFU | V2', 'Facebook Leads Ads'),
(23064364, 'PARAISO | MOFU | V2.2', 'Facebook Leads Ads'),
(23064366, 'PARAISO | BOFU | V2.2', 'Facebook Leads Ads'),
(23064372, 'PARAISO | Abierto | V1', 'Facebook Leads Ads'),
(23059702, 'Celina Martín', 'WhatsApp Vendedor'),
(23059706, 'Lilia López', 'WhatsApp Vendedor'),
(23062577, 'Giuliana Varela', 'WhatsApp Vendedor'),

-- ===== CUMBRES DE SAN PEDRO =====
(23064145, 'Form lp1 Cumbres', 'Formularios web'),
(23063457, 'Cumbres de San Pedro', 'WhatsApp Business'),
(23064139, 'CUMBRES DE SAN PEDRO FORANEO | PRESUPUESTO', 'Facebook Leads Ads'),
(23064141, 'CUMBRES DE SAN PEDRO YUCATAN | PRESUPUESTO', 'Facebook Leads Ads'),
(23064226, 'CUMBRES DE SAN PEDRO FORANEO | PRESUPUESTO | V2', 'Facebook Leads Ads'),
(23064374, 'CUMBRES DE SAN PEDRO | Abierto | V1.1', 'Facebook Leads Ads'),
(23064476, 'CUMBRES DE SAN PEDRO | Enero | V1', 'Facebook Leads Ads'),
(23059704, 'Ricardo Cortes', 'WhatsApp Vendedor'),
(23060375, 'Jorge Zapata', 'WhatsApp Vendedor'),
(23063695, 'Manuel Vivas', 'WhatsApp Vendedor'),

-- ===== BOSQUES DE CHOLUL =====
(23063987, 'Formulario Bosques de Cholul', 'Formularios web'),
(23064422, 'Web Bosques de Cholul', 'Formularios web'),
(23063475, 'Bosques de Cholul', 'WhatsApp Business'),
(23064017, 'FORMULARIO BOSQUES | MOFU | V1.1', 'Facebook Leads Ads'),
(23064137, 'FORMULARIO BOSQUES FORANEO | PRESUPUESTO', 'Facebook Leads Ads'),
(23064376, 'FORMULARIO BOSQUES Abierto | V1.1', 'Facebook Leads Ads'),
(23058699, 'Alejandro López', 'WhatsApp Vendedor'),
(23060689, 'ETHEL FLOTA', 'WhatsApp Vendedor'),
(23063391, 'Jesus Estrada', 'WhatsApp Vendedor')

ON CONFLICT (source_id) DO UPDATE SET
    source_name = EXCLUDED.source_name,
    source_type = EXCLUDED.source_type,
    updated_at = NOW();

-- 3. Verificar resultados con conteo de leads
SELECT
    ks.source_id,
    ks.source_name,
    ks.source_type,
    COUNT(l.id) as lead_count
FROM kommo_sources ks
LEFT JOIN leads l ON l.source_id = ks.source_id
GROUP BY ks.source_id, ks.source_name, ks.source_type
HAVING COUNT(l.id) > 0
ORDER BY ks.source_type, lead_count DESC;
