// Mapeo de emails a desarrollos (equipos de ventas)
const EMAIL_TO_DESARROLLO = {
    // Bosques de Cholul
    'a.lopez@grupoprovi.mx': 'Bosques de Cholul',
    'e.flota@grupoprovi.mx': 'Bosques de Cholul',
    'j.estrada@grupoprovi.mx': 'Bosques de Cholul',
    // Cumbres de San Pedro
    'm.vivas@grupoprovi.mx': 'Cumbres de San Pedro',
    'j.zapata@grupoprovi.mx': 'Cumbres de San Pedro',
    'r.cortes@grupoprovi.mx': 'Cumbres de San Pedro',
    // Paraíso Caucel
    'l.lopez@grupoprovi.mx': 'Paraíso Caucel',
    'g.varela@grupoprovi.mx': 'Paraíso Caucel',
    'z.martin@grupoprovi.mx': 'Paraíso Caucel',
};

export class UsersTransformer {
    static transform(kommoUser) {
        const email = (kommoUser.email || '').toLowerCase();
        const desarrollo = EMAIL_TO_DESARROLLO[email] || null;

        return {
            id: kommoUser.id,
            name: kommoUser.name,
            email: kommoUser.email || null,
            role: kommoUser.role || null,
            is_active: kommoUser.is_active !== undefined ? kommoUser.is_active : true,
            desarrollo: desarrollo,
            last_synced_at: new Date().toISOString()
        };
    }

    // Método estático para obtener el mapeo de desarrollos
    static getDesarrolloByEmail(email) {
        return EMAIL_TO_DESARROLLO[(email || '').toLowerCase()] || null;
    }
}
