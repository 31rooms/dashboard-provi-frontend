import dotenv from 'dotenv';
import { logger } from './utils/logger.js';
import { KommoService } from './services/kommo.service.js';
import { SupabaseService } from './services/supabase.service.js';
import { fullSync } from './sync/full-sync.js';
import { incrementalSync } from './sync/incremental-sync.js';

dotenv.config();

async function main() {
    const syncMode = process.env.SYNC_MODE || 'incremental';

    logger.info('🚀 Iniciando proceso de sincronización Kommo -> Supabase');
    logger.info(`📊 Modo: ${syncMode.toUpperCase()}`);

    const kommoService = new KommoService();
    const supabaseService = new SupabaseService();

    try {
        // Verificar conexiones
        logger.info('🔍 Verificando conexiones...');
        const kommoOk = await kommoService.testConnection();
        if (!kommoOk) throw new Error('No se pudo conectar a Kommo API');

        // El test de Supabase fallará si no hay credenciales, pero permitimos que el script 
        // intente continuar si es necesario o falle con gracia.

        if (syncMode === 'full') {
            await fullSync(kommoService, supabaseService);
        } else {
            await incrementalSync(kommoService, supabaseService);
        }

        logger.info('✅ Proceso finalizado exitosamente');
    } catch (error) {
        logger.error('💥 Error crítico en la ejecución:', error.message);
        process.exit(1);
    }
}

main();
