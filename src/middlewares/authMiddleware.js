import { ROLES } from '../models/usermodel.js';

/**
 * Lee el rol del usuario desde múltiples fuentes en el siguiente orden:
 *   1. Cookie `ferro_role` (presente en navegaciones GET del navegador).
 *   2. Header `x-user-role` (usado por las llamadas fetch desde el frontend).
 *   3. Query string `?role=` o el body (último recurso, útil para pruebas).
 *
 * Cuando se migre a una sesión real (JWT firmado o express-session) este
 * middleware se reemplaza sin tocar las rutas ni los controladores.
 */
function parseCookie(req, name) {
    const raw = req.headers.cookie || '';
    if (!raw) return undefined;
    const pairs = raw.split(';').map(p => p.trim());
    for (const pair of pairs) {
        const idx = pair.indexOf('=');
        if (idx === -1) continue;
        const key = pair.slice(0, idx);
        if (key === name) {
            return decodeURIComponent(pair.slice(idx + 1));
        }
    }
    return undefined;
}

export function getUserRole(req) {
    return (
        parseCookie(req, 'ferro_role') ||
        req.get('x-user-role') ||
        req.query.role ||
        req.body?.role ||
        null
    );
}

export function requireAdmin(req, res, next) {
    const role = getUserRole(req);

    if (role !== ROLES.ADMIN) {
        // Si la petición es de una vista (HTML), redirigimos al dashboard.
        // Si es JSON / XHR, devolvemos 403.
        const wantsHtml = req.accepts('html') && !req.xhr && !req.is('application/json');
        if (wantsHtml) {
            return res.redirect('/dashboard');
        }
        return res.status(403).json({
            success: false,
            message: 'Acceso restringido: se requiere rol de administrador.'
        });
    }

    next();
}
