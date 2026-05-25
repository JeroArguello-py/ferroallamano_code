import request from 'supertest';
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { ESTADO_FACTURA, ESTADO_PAGO } from '../models/facturaModel.js';

const facturaRepository = {
    findByVentaId: jest.fn(),
    findById: jest.fn(),
    nextSequenceForYear: jest.fn(),
    create: jest.fn(),
    getAll: jest.fn(),
    update: jest.fn()
};

const saleRepository = { findById: jest.fn() };

jest.unstable_mockModule('../repositories/facturaRepository.js', () => ({ default: facturaRepository }));
jest.unstable_mockModule('../repositories/saleRepository.js', () => ({ default: saleRepository }));

const { default: app } = await import('../app.js');

beforeEach(() => {
    facturaRepository.findByVentaId.mockResolvedValue(null);
    saleRepository.findById.mockResolvedValue({ id: 'v-1', subtotal: 100, descuento: 0, iva: 19, total: 119, items: [] });
    facturaRepository.nextSequenceForYear.mockResolvedValue(1);
    facturaRepository.create.mockImplementation(async (d) => ({ id: 'f-1', ...d }));
    facturaRepository.getAll.mockResolvedValue([{ id: 'f-1' }]);
    facturaRepository.findById.mockResolvedValue({ id: 'f-1', estadoFactura: ESTADO_FACTURA.BORRADOR });
    facturaRepository.update.mockImplementation(async (id, d) => ({ id, ...d }));
});

describe('POST /api/facturas/:id/emitir', () => {
    test('emite factura existente en borrador -> 200 y actualiza', async () => {
        const res = await request(app).post('/api/facturas/f-1/emitir');
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
        expect(facturaRepository.update).toHaveBeenCalledWith('f-1', expect.objectContaining({ estadoFactura: ESTADO_FACTURA.EMITIDA }));
    });

    test('emitir factura no encontrada -> 404', async () => {
        facturaRepository.findById.mockResolvedValue(null);
        const res = await request(app).post('/api/facturas/no-existe/emitir');
        expect(res.status).toBe(404);
    });
});

describe('PATCH /api/facturas/:id/pago', () => {
    test('estado invalido -> 400', async () => {
        const res = await request(app).patch('/api/facturas/f-1/pago').send({ estadoPago: 'unknown' });
        expect(res.status).toBe(400);
    });

    test('estado valido y existente -> 200', async () => {
        const res = await request(app).patch('/api/facturas/f-1/pago').send({ estadoPago: ESTADO_PAGO.PAGADO });
        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });
});

describe('GET /api/facturas', () => {
    test('list devuelve total', async () => {
        const res = await request(app).get('/api/facturas');
        expect(res.status).toBe(200);
        expect(res.body.total).toBe(1);
    });
});
