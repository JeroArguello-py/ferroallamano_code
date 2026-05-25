import { getUserRole, requireAdmin } from '../middlewares/authMiddleware.js';
import { ROLES } from '../models/usermodel.js';

describe('authMiddleware - getUserRole precedence', () => {
    test('lee rol desde cookie primero', () => {
        const req = { headers: { cookie: 'ferro_role=admin; other=1' }, get: () => undefined, query: {}, body: {} };
        expect(getUserRole(req)).toBe('admin');
    });

    test('usa header si cookie ausente', () => {
        const req = { headers: {}, get: (h) => (h === 'x-user-role' ? 'user' : undefined), query: {}, body: {} };
        expect(getUserRole(req)).toBe('user');
    });

    test('usa query si no hay cookie ni header', () => {
        const req = { headers: {}, get: () => undefined, query: { role: 'fromQuery' }, body: {} };
        expect(getUserRole(req)).toBe('fromQuery');
    });

    test('usa body si es último recurso', () => {
        const req = { headers: {}, get: () => undefined, query: {}, body: { role: 'fromBody' } };
        expect(getUserRole(req)).toBe('fromBody');
    });

    test('devuelve null si no encuentra', () => {
        const req = { headers: {}, get: () => undefined, query: {}, body: {} };
        expect(getUserRole(req)).toBeNull();
    });
});

describe('authMiddleware - requireAdmin', () => {
    function makeMock() {
        const fn = (...args) => { fn.calls.push(args); };
        fn.calls = [];
        return fn;
    }

    test('redirecciona a /dashboard para peticiones HTML sin admin', () => {
        const req = {
            headers: { cookie: '' },
            accepts: (type) => type === 'html',
            xhr: false,
            is: () => false,
            get: () => undefined,
            query: {},
            body: {}
        };
        const redirect = makeMock();
        const status = () => ({ json: makeMock() });
        const res = { redirect, status };
        const next = makeMock();

        requireAdmin(req, res, next);
        expect(redirect.calls.length).toBe(1);
        expect(redirect.calls[0][0]).toBe('/dashboard');
        expect(next.calls.length).toBe(0);
    });

    test('devuelve 403 JSON para peticiones XHR/JSON sin admin', () => {
        const req = {
            headers: { cookie: '' },
            accepts: () => false,
            xhr: false,
            is: (t) => t === 'application/json',
            get: () => undefined,
            query: {},
            body: {}
        };
        const jsonMock = makeMock();
        const res = { redirect: makeMock(), status: () => ({ json: jsonMock }) };
        const next = makeMock();

        requireAdmin(req, res, next);
        expect(jsonMock.calls.length).toBe(1);
        const payload = jsonMock.calls[0][0];
        expect(payload).toBeDefined();
        expect(payload.success).toBe(false);
        expect(next.calls.length).toBe(0);
    });

    test('invoca next para admin', () => {
        const req = {
            headers: { cookie: 'ferro_role=admin' },
            accepts: () => false,
            xhr: false,
            is: () => false,
            get: () => undefined,
            query: {},
            body: {}
        };
        const res = { redirect: makeMock(), status: () => ({ json: makeMock() }) };
        const next = makeMock();

        requireAdmin(req, res, next);
        expect(next.calls.length).toBe(1);
    });
});
