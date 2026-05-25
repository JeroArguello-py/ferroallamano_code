/**
 * ⬛ CAJA NEGRA · Módulo de Ventas — cálculo de descuento, IVA y total
 *
 * Enfoque: tratamos `saleService.createSale(payload)` como una CAJA. Solo
 * conocemos su contrato (la "spec"):
 *
 *      subtotal      = Σ (cantidad × precioUnitario)
 *      baseGravable  = subtotal − descuento
 *      iva           = baseGravable × 19%      (IVA Colombia)
 *      total         = baseGravable + iva
 *      descuento%    se limita al rango [0, 100]
 *
 * NO miramos cómo está implementado por dentro. Todas las aserciones son
 * sobre la SALIDA (subtotal, descuento, iva, total).
 *
 * Los repositorios se reemplazan por dobles SOLO para poder ejecutar la
 * función de forma determinista (equivalen a "sembrar" el sistema con un
 * producto de precio conocido y un cliente válido). Nunca verificamos
 * llamadas internas: eso sería caja blanca.
 *
 * Técnicas aplicadas: partición de equivalencia, análisis de valores límite
 * y tabla de decisión.
 */
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { makeProduct, makeClient } from './fixtures.js';

// --- Dobles de prueba (solo arnés de ejecución) -----------------------------
const clientRepository = { findById: jest.fn() };
const productRepository = { findById: jest.fn() };
const saleRepository = { nextSequenceForYear: jest.fn(), create: jest.fn() };

jest.unstable_mockModule('../repositories/clientRepository.js', () => ({ default: clientRepository }));
jest.unstable_mockModule('../repositories/productRepository.js', () => ({ default: productRepository }));
jest.unstable_mockModule('../repositories/saleRepository.js', () => ({ default: saleRepository }));

const { default: saleService } = await import('../services/saleService.js');

const IVA = 0.19; // 19% — valor de negocio (no es conocimiento del código)

beforeEach(() => {
    // Producto de precio 100 y stock amplio; cliente válido.
    productRepository.findById.mockResolvedValue(makeProduct({ precio: 100, stock: 1000 }));
    clientRepository.findById.mockResolvedValue(makeClient());
    saleRepository.nextSequenceForYear.mockResolvedValue(1);
    // create devuelve los mismos datos "persistidos" + un id (eco).
    saleRepository.create.mockImplementation(async (data) => ({ id: 'venta-001', ...data }));
});

/** Construye un payload de venta con una sola línea. */
function ventaCon(cantidad, descuentoPorcentaje) {
    const payload = { clienteId: 'cli-001', items: [{ productId: 'prod-001', cantidad }] };
    if (descuentoPorcentaje !== undefined) payload.descuentoPorcentaje = descuentoPorcentaje;
    return payload;
}

describe('createSale — cálculo de totales (Caja Negra)', () => {

    // ── Partición de equivalencia sobre el % de descuento ───────────────────
    test('partición válida: sin descuento (0%) aplica IVA sobre todo el subtotal', async () => {
        const r = await saleService.createSale(ventaCon(2, 0));
        expect(r.success).toBe(true);
        expect(r.data.subtotal).toBe(200);
        expect(r.data.descuento).toBe(0);
        expect(r.data.iva).toBe(200 * IVA);   // 38
        expect(r.data.total).toBe(238);
    });

    test('partición válida: descuento parcial (50%) reduce base e IVA a la mitad', async () => {
        const r = await saleService.createSale(ventaCon(2, 50));
        expect(r.data.subtotal).toBe(200);
        expect(r.data.descuento).toBe(100);
        expect(r.data.iva).toBe(19);   // base 100 * 0.19
        expect(r.data.total).toBe(119);
    });

    test('partición válida: descuento total (100%) deja base, IVA y total en 0', async () => {
        const r = await saleService.createSale(ventaCon(2, 100));
        expect(r.data.descuento).toBe(200);
        expect(r.data.iva).toBe(0);
        expect(r.data.total).toBe(0);
    });

    // ── Valores límite del % de descuento ───────────────────────────────────
    test('valor límite inferior: 0% es válido', async () => {
        const r = await saleService.createSale(ventaCon(2, 0));
        expect(r.success).toBe(true);
        expect(r.data.total).toBe(238);
    });

    test('valor límite superior: 100% es válido', async () => {
        const r = await saleService.createSale(ventaCon(2, 100));
        expect(r.success).toBe(true);
        expect(r.data.total).toBe(0);
    });

    test('valor límite inválido: descuento negativo (-10%) se trata como 0%', async () => {
        const r = await saleService.createSale(ventaCon(2, -10));
        expect(r.data.descuento).toBe(0);
        expect(r.data.total).toBe(238);
    });

    test('valor límite inválido: descuento mayor a 100% (150%) se limita a 100%', async () => {
        const r = await saleService.createSale(ventaCon(2, 150));
        expect(r.data.descuento).toBe(200);   // 100% de 200
        expect(r.data.total).toBe(0);
    });

    // ── Tabla de decisión: cada fila es un caso ─────────────────────────────
    // [cantidad, descuento%, subtotalEsperado, totalEsperado]
    const tablaDecision = [
        [1, 0, 100, 119],   // base 100, iva 19
        [2, 0, 200, 238],   // base 200, iva 38
        [2, 50, 200, 119],  // base 100, iva 19
        [2, 100, 200, 0],   // base 0
        [4, 25, 400, 357]   // base 300, iva 57
    ];

    test.each(tablaDecision)(
        'cantidad=%s, descuento=%s%% → subtotal=%s, total=%s',
        async (cantidad, descuento, subtotalEsperado, totalEsperado) => {
            const r = await saleService.createSale(ventaCon(cantidad, descuento));
            expect(r.data.subtotal).toBe(subtotalEsperado);
            expect(r.data.total).toBe(totalEsperado);
        }
    );

    // ── Comportamiento con varias líneas ────────────────────────────────────
    test('suma correctamente el subtotal de varias líneas', async () => {
        // 2 productos distintos, ambos a precio 100 (el doble devuelve el mismo).
        const payload = {
            clienteId: 'cli-001',
            items: [
                { productId: 'prod-001', cantidad: 3 },
                { productId: 'prod-002', cantidad: 2 }
            ]
        };
        const r = await saleService.createSale(payload);
        expect(r.data.subtotal).toBe(500);   // (3+2) × 100
        expect(r.data.total).toBe(595);      // 500 + 95 de IVA
    });
});
