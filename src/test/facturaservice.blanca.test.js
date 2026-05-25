/**
 * □ CAJA BLANCA · FacturaService — cobertura de ramas
 *
 * Es el servicio con más decisiones (generación, emisión y estado de pago).
 * Mockeamos facturaRepository y saleRepository (la "BD"). Importamos las
 * constantes reales de estado desde el modelo para no usar "números mágicos".
 */
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { ESTADO_FACTURA, ESTADO_PAGO } from '../models/facturaModel.js';

const facturaRepository = {
    findByVentaId: jest.fn(),
    findById: jest.fn(),
    getAll: jest.fn(),
    nextSequenceForYear: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
};
const saleRepository = { findById: jest.fn() };

jest.unstable_mockModule('../repositories/facturaRepository.js', () => ({ default: facturaRepository }));
jest.unstable_mockModule('../repositories/saleRepository.js', () => ({ default: saleRepository }));

const { default: facturaService } = await import('../services/facturaService.js');

function ventaBase(overrides = {}) {
    return {
        id: 'venta-1',
        codigo: 'VEN-2026-001',
        clienteId: 'cli-1',
        clienteSnapshot: { nombre: 'Ana', documento: '111' },
        items: [
            { productId: 'p1', sku: 'TAL-750', nombre: 'Taladro', descripcion: '', cantidad: 2, precioUnitario: 100, subtotal: 200 }
        ],
        subtotal: 200,
        descuento: 20,
        descuentoPorcentaje: 10,
        iva: 34.2,
        total: 214.2,
        notas: 'sin notas',
        ...overrides
    };
}

beforeEach(() => {
    facturaRepository.findByVentaId.mockResolvedValue(null);
    facturaRepository.findById.mockResolvedValue(null);
    facturaRepository.getAll.mockResolvedValue([]);
    facturaRepository.nextSequenceForYear.mockResolvedValue(1);
    facturaRepository.create.mockImplementation(async (d) => ({ id: 'fac-nueva', ...d }));
    facturaRepository.update.mockImplementation(async (id, changes) => ({ id, ...changes }));
    saleRepository.findById.mockResolvedValue(null);
});

describe('generarDesdeVenta — ramas (Caja Blanca)', () => {

    test('rama: ya existe factura para la venta → 200 y la devuelve sin recrear', async () => {
        facturaRepository.findByVentaId.mockResolvedValue({ id: 'fac-1', codigoFactura: 'FAC-2026-0001' });
        const r = await facturaService.generarDesdeVenta('venta-1');
        expect(r.statusCode).toBe(200);
        expect(r.data.id).toBe('fac-1');
        expect(saleRepository.findById).not.toHaveBeenCalled();
        expect(facturaRepository.create).not.toHaveBeenCalled();
    });

    test('rama: venta no encontrada → 404', async () => {
        saleRepository.findById.mockResolvedValue(null);
        const r = await facturaService.generarDesdeVenta('inexistente');
        expect(r.statusCode).toBe(404);
        expect(facturaRepository.create).not.toHaveBeenCalled();
    });

    test('happy path: crea borrador desde la venta → 201', async () => {
        saleRepository.findById.mockResolvedValue(ventaBase());
        const r = await facturaService.generarDesdeVenta('venta-1');
        expect(r.statusCode).toBe(201);
        expect(facturaRepository.create).toHaveBeenCalledTimes(1);
        const data = facturaRepository.create.mock.calls[0][0];
        expect(data.codigoFactura).toMatch(/^FAC-\d{4}-0001$/);
        expect(data.estadoFactura).toBe(ESTADO_FACTURA.BORRADOR);
        expect(data.estadoPago).toBe(ESTADO_PAGO.PENDIENTE);
        expect(data.descuentoPorcentaje).toBe(10); // la venta ya lo traía
        expect(data.items).toHaveLength(1);
    });

    test('rama: la venta no trae % → se deriva del descuento (subtotal > 0)', async () => {
        // subtotal 200, descuento 50 → % = 25
        saleRepository.findById.mockResolvedValue(ventaBase({ descuentoPorcentaje: undefined, subtotal: 200, descuento: 50 }));
        await facturaService.generarDesdeVenta('venta-1');
        const data = facturaRepository.create.mock.calls[0][0];
        expect(data.descuentoPorcentaje).toBe(25);
    });

    test('rama: la venta no trae % y subtotal 0 → % = 0', async () => {
        saleRepository.findById.mockResolvedValue(ventaBase({ descuentoPorcentaje: null, subtotal: 0, descuento: 0 }));
        await facturaService.generarDesdeVenta('venta-1');
        const data = facturaRepository.create.mock.calls[0][0];
        expect(data.descuentoPorcentaje).toBe(0);
    });
});

describe('getFactura', () => {
    test('rama: no encontrada → 404', async () => {
        facturaRepository.findById.mockResolvedValue(null);
        const r = await facturaService.getFactura('x');
        expect(r.statusCode).toBe(404);
    });

    test('rama: encontrada → 200', async () => {
        facturaRepository.findById.mockResolvedValue({ id: 'fac-1' });
        const r = await facturaService.getFactura('fac-1');
        expect(r.statusCode).toBe(200);
        expect(r.data.id).toBe('fac-1');
    });
});

describe('listFacturas', () => {
    test('devuelve el total de facturas', async () => {
        facturaRepository.getAll.mockResolvedValue([{ id: 'a' }, { id: 'b' }, { id: 'c' }]);
        const r = await facturaService.listFacturas();
        expect(r.statusCode).toBe(200);
        expect(r.total).toBe(3);
    });
});

describe('emitir — ramas (Caja Blanca)', () => {
    test('rama: factura no encontrada → 404', async () => {
        facturaRepository.findById.mockResolvedValue(null);
        const r = await facturaService.emitir('x');
        expect(r.statusCode).toBe(404);
        expect(facturaRepository.update).not.toHaveBeenCalled();
    });

    test('rama: factura ya emitida → 200 sin volver a actualizar', async () => {
        facturaRepository.findById.mockResolvedValue({ id: 'fac-1', estadoFactura: ESTADO_FACTURA.EMITIDA });
        const r = await facturaService.emitir('fac-1');
        expect(r.statusCode).toBe(200);
        expect(r.message).toMatch(/ya estaba emitida/i);
        expect(facturaRepository.update).not.toHaveBeenCalled();
    });

    test('rama: factura en borrador → se emite (200)', async () => {
        facturaRepository.findById.mockResolvedValue({ id: 'fac-1', estadoFactura: ESTADO_FACTURA.BORRADOR, fechaEmision: new Date() });
        const r = await facturaService.emitir('fac-1');
        expect(r.statusCode).toBe(200);
        expect(facturaRepository.update).toHaveBeenCalledTimes(1);
        expect(facturaRepository.update.mock.calls[0][1].estadoFactura).toBe(ESTADO_FACTURA.EMITIDA);
    });
});

describe('actualizarPago — ramas (Caja Blanca)', () => {
    test('rama: estado de pago inválido → 400 y NO actualiza', async () => {
        const r = await facturaService.actualizarPago('fac-1', 'reembolsado');
        expect(r.statusCode).toBe(400);
        expect(facturaRepository.update).not.toHaveBeenCalled();
    });

    test('rama: estado válido pero factura inexistente → 404', async () => {
        facturaRepository.update.mockResolvedValue(null);
        const r = await facturaService.actualizarPago('inexistente', ESTADO_PAGO.PAGADO);
        expect(r.statusCode).toBe(404);
    });

    test('rama: estado válido y factura existente → 200', async () => {
        facturaRepository.update.mockResolvedValue({ id: 'fac-1', estadoPago: ESTADO_PAGO.PAGADO });
        const r = await facturaService.actualizarPago('fac-1', ESTADO_PAGO.PAGADO);
        expect(r.statusCode).toBe(200);
        expect(facturaRepository.update.mock.calls[0][1]).toEqual({ estadoPago: ESTADO_PAGO.PAGADO });
    });
});
