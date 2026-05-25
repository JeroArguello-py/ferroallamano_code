/**
 * ⬛ CAJA NEGRA · Módulo de Productos — búsqueda y filtros del catálogo
 *
 * Tratamos `productService.listProducts(query)` como una caja: dado un
 * catálogo conocido (sembrado vía el doble del repositorio) y unos criterios
 * de búsqueda, verificamos ÚNICAMENTE el resultado observable: qué productos
 * salen y cuántos.
 *
 * Técnicas: partición de equivalencia (coincide / no coincide), valores
 * límite (precio exactamente igual al mínimo/máximo) y tabla de decisión
 * (disponibilidad).
 */
import { jest, describe, test, expect, beforeEach } from '@jest/globals';
import { makeCatalogo } from './fixtures.js';

const productRepository = { getAll: jest.fn() };
jest.unstable_mockModule('../repositories/productRepository.js', () => ({ default: productRepository }));

const { default: productService } = await import('../services/productService.js');

// Catálogo de referencia:
//   p1 Taladro Percutor   TAL-750    $250.000  stock 5   (con stock)
//   p2 Martillo de Uña    MAR-016     $35.000  stock 0   (agotado)
//   p3 Pintura Blanca 1gl PIN-BLA-1   $80.000  stock 20  (con stock)
beforeEach(() => {
    productRepository.getAll.mockResolvedValue(makeCatalogo());
});

const ids = (res) => res.data.map(p => p.id);

describe('listProducts — búsqueda y filtros (Caja Negra)', () => {

    test('sin filtros devuelve todo el catálogo ordenado por nombre', async () => {
        const r = await productService.listProducts({});
        expect(r.success).toBe(true);
        expect(r.total).toBe(3);
        // Orden alfabético: Martillo, Pintura, Taladro
        expect(ids(r)).toEqual(['p2', 'p3', 'p1']);
    });

    // ── Búsqueda por nombre ─────────────────────────────────────────────────
    test('partición: nombre que coincide devuelve solo ese producto', async () => {
        const r = await productService.listProducts({ nombre: 'taladro' });
        expect(ids(r)).toEqual(['p1']);
    });

    test('búsqueda por nombre es insensible a mayúsculas', async () => {
        const r = await productService.listProducts({ nombre: 'MARTILLO' });
        expect(ids(r)).toEqual(['p2']);
    });

    test('partición: nombre sin coincidencias devuelve lista vacía', async () => {
        const r = await productService.listProducts({ nombre: 'inexistente-xyz' });
        expect(r.total).toBe(0);
        expect(r.data).toEqual([]);
    });

    // ── Búsqueda por SKU ────────────────────────────────────────────────────
    test('partición: SKU parcial coincide (case-insensitive)', async () => {
        const r = await productService.listProducts({ sku: 'mar' });
        expect(ids(r)).toEqual(['p2']);
    });

    // ── Valores límite de precio (filtro >= y <=) ───────────────────────────
    test('valor límite: precioMin igual al precio de un producto lo incluye', async () => {
        // precioMin = 80.000 → incluye p3 (=80.000) y p1 (250.000), excluye p2 (35.000)
        const r = await productService.listProducts({ precioMin: 80000 });
        expect(ids(r).sort()).toEqual(['p1', 'p3']);
    });

    test('valor límite: precioMax igual al precio de un producto lo incluye', async () => {
        // precioMax = 80.000 → incluye p2 (35.000) y p3 (=80.000), excluye p1 (250.000)
        const r = await productService.listProducts({ precioMax: 80000 });
        expect(ids(r).sort()).toEqual(['p2', 'p3']);
    });

    test('rango de precio combinado (min y max) filtra ambos extremos', async () => {
        const r = await productService.listProducts({ precioMin: 40000, precioMax: 200000 });
        expect(ids(r)).toEqual(['p3']); // solo Pintura (80.000)
    });

    // ── Disponibilidad: tabla de decisión ───────────────────────────────────
    // [disponibilidad, cantidadEsperada]
    const tablaDisponibilidad = [
        ['stock', 2],     // p1 y p3 tienen stock > 0
        ['agotado', 1],   // solo p2 (stock 0)
        ['', 3]           // sin criterio → no filtra
    ];

    test.each(tablaDisponibilidad)(
        'disponibilidad="%s" → %s producto(s)',
        async (disponibilidad, esperado) => {
            const r = await productService.listProducts({ disponibilidad });
            expect(r.total).toBe(esperado);
        }
    );

    test('disponibilidad=agotado devuelve exactamente el producto sin stock', async () => {
        const r = await productService.listProducts({ disponibilidad: 'agotado' });
        expect(ids(r)).toEqual(['p2']);
        expect(r.data[0].stock).toBe(0);
    });
});
