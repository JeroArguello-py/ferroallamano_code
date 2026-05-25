/**
 * ▪ CAJA GRIS · API /api/ventas — integración HTTP + persistencia simulada
 *
 * Verificamos el contrato HTTP completo de la creación de ventas y, siguiendo
 * la idea de la guía ("un error no debe persistir nada"), comprobamos que en
 * los casos inválidos NO se llame a saleRepository.create.
 *
 * Persistencia mockeada: ver la nota en productos.gris.test.js. El "estado
 * tras la operación" se valida con las llamadas registradas en el doble.
 */
import request from 'supertest';
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { makeProduct, makeClient } from './fixtures.js';

const clientRepository = { findById: jest.fn() };
const productRepository = { findById: jest.fn() };
const saleRepository = {
    getAll: jest.fn(),
    findById: jest.fn(),
    nextSequenceForYear: jest.fn(),
    create: jest.fn()
};

jest.unstable_mockModule('../repositories/clientRepository.js', () => ({ default: clientRepository }));
jest.unstable_mockModule('../repositories/productRepository.js', () => ({ default: productRepository }));
jest.unstable_mockModule('../repositories/saleRepository.js', () => ({ default: saleRepository }));

const { default: app } = await import('../app.js');

beforeEach(() => {
    clientRepository.findById.mockResolvedValue(makeClient());
    productRepository.findById.mockResolvedValue(makeProduct({ precio: 100, stock: 5 }));
    saleRepository.nextSequenceForYear.mockResolvedValue(1);
    saleRepository.create.mockImplementation(async (d) => ({ id: 'venta-001', ...d }));
    saleRepository.getAll.mockResolvedValue([]);
});

describe('POST /api/ventas — creación', () => {
    test('venta válida → 201, totales correctos y se persiste', async () => {
        const res = await request(app)
            .post('/api/ventas')
            .send({ clienteId: 'cli-001', items: [{ productId: 'prod-001', cantidad: 2 }] });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        expect(res.body.data.subtotal).toBe(200);
        expect(res.body.data.total).toBe(238); // 200 + 19% IVA

        // Verifica el "estado persistido" (caja gris con doble de BD).
        expect(saleRepository.create).toHaveBeenCalledTimes(1);
        expect(saleRepository.create.mock.calls[0][0].total).toBe(238);
    });

    test('sin cliente → 400 y NO persiste nada', async () => {
        const res = await request(app)
            .post('/api/ventas')
            .send({ items: [{ productId: 'prod-001', cantidad: 1 }] });

        expect(res.status).toBe(400);
        expect(saleRepository.create).not.toHaveBeenCalled();
    });

    test('stock insuficiente → 400 y NO persiste nada', async () => {
        const res = await request(app)
            .post('/api/ventas')
            .send({ clienteId: 'cli-001', items: [{ productId: 'prod-001', cantidad: 10 }] });

        expect(res.status).toBe(400);
        expect(res.body.message).toMatch(/stock/i);
        expect(saleRepository.create).not.toHaveBeenCalled();
    });
});

describe('GET /api/ventas — listado', () => {
    test('devuelve 200 con el total de ventas', async () => {
        saleRepository.getAll.mockResolvedValue([
            { id: 'v1', codigo: 'VEN-2026-001', total: 238 },
            { id: 'v2', codigo: 'VEN-2026-002', total: 119 }
        ]);
        const res = await request(app).get('/api/ventas');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(res.body.total).toBe(2);
    });
});
