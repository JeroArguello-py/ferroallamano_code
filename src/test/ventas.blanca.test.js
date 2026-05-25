/**
 * □ CAJA BLANCA · SaleService.createSale — cobertura de ramas
 *
 * `createSale` tiene muchas decisiones (validaciones, búsqueda de cliente y
 * productos, stock, tipo de descuento). Diseñamos un test por cada rama para
 * lograr cobertura de ramas, no solo de líneas.
 *
 * Mockeamos los 3 repositorios (la "BD"). En las ramas de error verificamos
 * además que NO se haya intentado persistir la venta (saleRepository.create),
 * que es la garantía de que el "early return" cortó el flujo.
 */
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { makeProduct, makeClient } from './fixtures.js';

const clientRepository = { findById: jest.fn() };
const productRepository = { findById: jest.fn() };
const saleRepository = { nextSequenceForYear: jest.fn(), create: jest.fn() };

jest.unstable_mockModule('../repositories/clientRepository.js', () => ({ default: clientRepository }));
jest.unstable_mockModule('../repositories/productRepository.js', () => ({ default: productRepository }));
jest.unstable_mockModule('../repositories/saleRepository.js', () => ({ default: saleRepository }));

const { default: saleService } = await import('../services/saleService.js');

beforeEach(() => {
    clientRepository.findById.mockResolvedValue(makeClient());
    productRepository.findById.mockResolvedValue(makeProduct({ precio: 100, stock: 5 }));
    saleRepository.nextSequenceForYear.mockResolvedValue(7);
    saleRepository.create.mockImplementation(async (data) => ({ id: 'venta-001', ...data }));
});

const ventaValida = (overrides = {}) => ({
    clienteId: 'cli-001',
    items: [{ productId: 'prod-001', cantidad: 2 }],
    ...overrides
});

describe('createSale — ramas de validación', () => {

    test('rama: sin clienteId → 400 y no persiste', async () => {
        const r = await saleService.createSale({ items: [{ productId: 'prod-001', cantidad: 1 }] });
        expect(r.statusCode).toBe(400);
        expect(r.message).toMatch(/cliente/i);
        expect(saleRepository.create).not.toHaveBeenCalled();
    });

    test('rama: sin items → 400', async () => {
        const r = await saleService.createSale({ clienteId: 'cli-001', items: [] });
        expect(r.statusCode).toBe(400);
        expect(r.message).toMatch(/producto/i);
    });

    test('rama: faltan cliente e items → 400 con ambos mensajes', async () => {
        const r = await saleService.createSale({});
        expect(r.statusCode).toBe(400);
        expect(r.message).toMatch(/cliente/i);
        expect(r.message).toMatch(/producto/i);
    });

    test('rama: cliente no encontrado → 404', async () => {
        clientRepository.findById.mockResolvedValue(null);
        const r = await saleService.createSale(ventaValida());
        expect(r.statusCode).toBe(404);
        expect(r.message).toMatch(/cliente/i);
        expect(saleRepository.create).not.toHaveBeenCalled();
    });

    test('rama: producto no encontrado → 404', async () => {
        productRepository.findById.mockResolvedValue(null);
        const r = await saleService.createSale(ventaValida());
        expect(r.statusCode).toBe(404);
        expect(r.message).toMatch(/producto/i);
    });

    test('rama: cantidad inválida (0) → 400', async () => {
        const r = await saleService.createSale(ventaValida({ items: [{ productId: 'prod-001', cantidad: 0 }] }));
        expect(r.statusCode).toBe(400);
        expect(r.message).toMatch(/cantidad/i);
    });

    test('rama: stock insuficiente → 400', async () => {
        // producto tiene stock 5, se piden 10
        const r = await saleService.createSale(ventaValida({ items: [{ productId: 'prod-001', cantidad: 10 }] }));
        expect(r.statusCode).toBe(400);
        expect(r.message).toMatch(/stock/i);
        expect(saleRepository.create).not.toHaveBeenCalled();
    });
});

describe('createSale — ramas de éxito y tipo de descuento', () => {

    test('happy path con descuento en porcentaje → 201 y persiste con totales', async () => {
        const r = await saleService.createSale(ventaValida({ descuentoPorcentaje: 10 }));
        expect(r.success).toBe(true);
        expect(r.statusCode).toBe(201);
        expect(r.data.codigo).toMatch(/^VEN-\d{4}-007$/);

        // subtotal 200, descuento 20, base 180, iva 34.2, total 214.2
        expect(r.data.subtotal).toBe(200);
        expect(r.data.descuento).toBe(20);
        expect(r.data.total).toBe(214.2);

        // Se "persistió" exactamente con esos totales.
        expect(saleRepository.create).toHaveBeenCalledTimes(1);
        expect(saleRepository.create.mock.calls[0][0].total).toBe(214.2);
    });

    test('rama: descuento como monto fijo (sin porcentaje) deriva el % equivalente', async () => {
        // subtotal 200, descuento fijo 50 → % equivalente 25, base 150, iva 28.5, total 178.5
        const r = await saleService.createSale(ventaValida({ descuento: 50 }));
        expect(r.statusCode).toBe(201);
        expect(r.data.descuento).toBe(50);
        expect(r.data.descuentoPorcentaje).toBe(25);
        expect(r.data.total).toBe(178.5);
    });

    test('rama: descuentoPorcentaje no numérico se trata como 0', async () => {
        const r = await saleService.createSale(ventaValida({ descuentoPorcentaje: 'abc' }));
        expect(r.statusCode).toBe(201);
        expect(r.data.descuento).toBe(0);
        expect(r.data.total).toBe(238); // 200 + 38 de IVA
    });
});
