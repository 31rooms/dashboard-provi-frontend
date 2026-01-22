import axios from 'axios';

const KOMMO_SUBDOMAIN = process.env.KOMMO_SUBDOMAIN;
const KOMMO_ACCESS_TOKEN = process.env.KOMMO_ACCESS_TOKEN;

export const kommoConfig = {
    subdomain: KOMMO_SUBDOMAIN,
    accessToken: KOMMO_ACCESS_TOKEN,
    baseUrl: `https://${KOMMO_SUBDOMAIN}.kommo.com/api/v4`
};

export const kommoClient = axios.create({
    baseURL: kommoConfig.baseUrl,
    headers: {
        'Authorization': `Bearer ${kommoConfig.accessToken}`,
        'Content-Type': 'application/json'
    },
    timeout: 60000 // 60 segundos de timeout para operaciones pesadas
});

// Interceptor para manejo de rate limiting y reintentos (7 req/seg)
kommoClient.interceptors.response.use(
    response => response,
    async error => {
        const { config, response, code } = error;

        // Determinar si es un error reintentable (429, 502, 503, 504 o errores de red)
        const isRetryableError =
            (response && [429, 502, 503, 504].includes(response.status)) ||
            code === 'ECONNABORTED' ||
            code === 'ECONNRESET' ||
            code === 'ETIMEDOUT' ||
            (error.message && error.message.toLowerCase().includes('socket hang up'));

        if (isRetryableError && (!config.__retryCount || config.__retryCount < 5)) {
            config.__retryCount = config.__retryCount || 0;
            config.__retryCount += 1;

            // Tiempo de espera incremental: 2s, 4s, 8s, 16s, 32s
            const delay = Math.pow(2, config.__retryCount) * 1000;
            const statusInfo = response ? `Status ${response.status}` : (code || error.message);

            console.warn(`⚠️ Error de API/Red (${statusInfo}). Reintentando en ${delay / 1000}s... (Intento ${config.__retryCount}/5)`);

            await new Promise(resolve => setTimeout(resolve, delay));
            return kommoClient(config);
        }

        return Promise.reject(error);
    }
);
