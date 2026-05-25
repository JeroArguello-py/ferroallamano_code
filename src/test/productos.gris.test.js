/**
 * ▪ CAJA GRIS · API /api/productos — integración HTTP + seguridad
 *
 * Probamos la pila REAL: ruta → middleware → controlador → servicio, con
 * Supertest. Conocemos la arquitectura (endpoints, que POST/PUT exigen rol
 * admin), pero ejercemos el sistema "desde afuera" vía HTTP.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * NOTA SOBRE LA "BD MOCKEADA" (decisión de este proyecto):
 * La guía recomienda una BD de test AISLADA y real para caja gris. Aquí, por
 * petición del equipo, se mockea la capa de persistencia (los repositorios)
 * sembrada con datos controlados. Ventaja: rápido y sin depender de Mongo.
 * Límite: NO valida la integración real con MongoDB (índices, validaciones
 * del esquema, transacciones). Para verificar el "estado persistido" usamos
 * las llamadas registradas en el doble del repositorio (repo.create/update).
 * ─────────────────────────────────────────────────────────────────────────
 */
import request from 'supertest';
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { makeProduct, makeCatalogo } from './fixtures.js';

const productRepository = {
    getAll: jest.fn(),
    findById: jest.fn(),
    findBySku: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
};
jest.unstable_mockModule('../repositories/productRepository.js', () => ({ default: productRepository }));

// La app se importa DESPUÉS de registrar el mock. Con NODE_ENV=test (que Jest
// define solo) app.js no conecta a Mongo ni abre un puerto.
const { default: app } = await import('../app.js');

const ADMIN = ['x-user-role', 'admin']; // cabecera que el middleware acepta como rol

beforeEach(() => {
    productRepository.getAll.mockResolvedValue(makeCatalogo());
    productRepository.findById.mockResolvedValue(makeProduct({ id: 'prod-001' }));
    productRepository.findBySku.mockResolvedValue(null);
    productRepository.create.mockImplementation(async (d) => ({ id: 'prod-nuevo', ...d }));
    productRepository.update.mockImplementation(async (id, d) => ({ id, ...d }));
});

describe('GET /api/productos — listado y filtros', () => {
    test('devuelve 200 y el contrato esperado', async () => {
        const res = await request(app).get('/api/productos');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.total).toBe(3);
        expect(Array.isArray(res.body.data)).toBe(true);
    });

    test('aplica el filtro de disponibilidad por query string', async () => {
        const res = await request(app).get('/api/productos?disponibilidad=agotado');
        expect(res.status).toBe(200);
        expect(res.body.total).toBe(1); // solo el producto sin stock
    });
});

describe('GET /api/productos/:id', () => {
    test('producto existente → 200 con sus datos', async () => {
        const res = await request(app).get('/api/productos/prod-001');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.data.id).toBe('prod-001');
    });

    test('producto inexistente → 404', async () => {
        productRepository.findById.mockResolvedValue(null);
        const res = await request(app).get('/api/productos/no-existe');
        expect(res.status).toBe(404);
        expect(res.body.success).toBe(false);
    });
});

describe('Seguridad: POST /api/productos exige rol admin', () => {
    const nuevo = {
        nombre: 'Llave Inglesa 10"',
        sku: 'LLA-10',
        categoria: 'Otros',
        precio: 28000,
        stock: 15
    };

    test('sin rol admin → 403 y NO persiste', async () => {
        const res = await request(app)
            .post('/api/productos')
            .set('Accept', 'application/json')
            .send(nuevo);
        expect(res.status).toBe(403);
        expect(productRepository.create).not.toHaveBeenCalled();
    });

    test('con rol admin y datos válidos → 201 y persiste normalizado', async () => {
        const res = await request(app)
            .post('/api/productos')
            .set(...ADMIN)
            .send({ ...nuevo, nombre: '  Llave Inglesa 10"  ' });
        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        // "Estado persistido": create recibió el nombre ya recortado.
        expect(productRepository.create).toHaveBeenCalledTimes(1);
        expect(productRepository.create.mock.calls[0][0].nombre).toBe('Llave Inglesa 10"');
    });

    test('con rol admin pero datos inválidos → 400', async () => {
        const res = await request(app)
            .post('/api/productos')
            .set(...ADMIN)
            .send({ ...nuevo, nombre: '' });
        expect(res.status).toBe(400);
    });

    test('con rol admin pero SKU duplicado → 409', async () => {
        productRepository.findBySku.mockResolvedValue({ id: 'otro', sku: 'LLA-10' });
        const res = await request(app)
            .post('/api/productos')
            .set(...ADMIN)
            .send(nuevo);
        expect(res.status).toBe(409);
    });
});

describe('Seguridad: PUT /api/productos/:id exige rol admin', () => {
    test('sin rol admin → 403', async () => {
        const res = await request(app)
            .put('/api/productos/prod-001')
            .set('Accept', 'application/json')
            .send({ precio: 30000 });
        expect(res.status).toBe(403);
        expect(productRepository.update).not.toHaveBeenCalled();
    });

    test('con rol admin → 200 y actualiza', async () => {
        const res = await request(app)
            .put('/api/productos/prod-001')
            .set(...ADMIN)
            .send({ precio: 30000 });
        expect(res.status).toBe(200);
        expect(productRepository.update).toHaveBeenCalledTimes(1);
    });
});
