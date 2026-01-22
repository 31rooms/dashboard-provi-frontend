/**
 * Deduplica un array de objetos basado en una propiedad (por defecto 'id')
 * @param {Array} arr - El array de objetos a deduplicar
 * @param {string} key - La propiedad por la cual deduplicar
 * @returns {Array} - Array deduplicado (mantiene el último elemento encontrado)
 */
export const uniqueByKey = (arr, key = 'id') => {
    const map = new Map();
    arr.forEach(item => {
        if (item[key] !== undefined && item[key] !== null) {
            map.set(item[key], item);
        }
    });
    return Array.from(map.values());
};

/**
 * Espera una cantidad de milisegundos
 * @param {number} ms - Milisegundos a esperar
 */
export const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
