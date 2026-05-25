/**
 * □ CAJA BLANCA · ProductService — cobertura de ramas
 *
 * Conocemos el código fuente, así que diseñamos un test por cada RAMA de
 * `_validate`, `createProduct` y `updateProduct`. La meta no es solo cubrir
 * líneas, sino cubrir cada decisión (verdadero/falso).
 *
 * Buenas prácticas aplicadas:
 *  - Solo mockeamos la dependencia externa real (el repositorio = la BD).
 *  - Verificamos comportamiento observable (status, mensaje, datos) y, donde
 *    aporta, que NO se llame a `create/update` en las ramas de error
 *    (demuestra que el "early return" funcionó).
 */
import { jest, describe, test, expect, beforeEach } from '@jest/globals';

const productRepository = {
    getAll: jest.fn(),
    findById: jest.fn(),
    findBySku: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
};
jest.unstable_mockModule('../repositories/productRepository.js', () => ({ default: productRepository }));

const { default: productService } = await import('../services/productService.js');

/** Producto válido base; cada test sobreescribe el campo que quiere romper. */
function productoValido(overrides = {}) {
    return {
        nombre: 'Cinta Métrica 5m',
        sku: 'CIN-5M',
        categoria: 'Otros',
        precio: 15000,
        stock: 30,
        descripcion: 'Cinta de 5 metros',
        imagen: '',
        ...overrides
    };
}

beforeEach(() => {
    // Por defecto: SKU libre y create/update que devuelven lo recibido + id.
    productRepository.findBySku.mockResolvedValue(null);
    productRepository.create.mockImplementation(async (data) => ({ id: 'prod-nuevo', ...data }));
    productRepository.update.mockImplementation(async (id, data) => ({ id, ...data }));
});

describe('createProduct — ramas de validación (Caja Blanca)', () => {

    test('happy path: producto válido se crea (201) y se persiste normalizado', async () => {
        const r = await productService.createProduct(productoValido({ nombre: '  Cinta Métrica 5m  ', sku: '  CIN-5M ' }));
        expect(r.success).toBe(true);
        expect(r.statusCode).toBe(201);
        // Rama: datos se recortan (trim) antes de persistir.
        expect(productRepository.create).toHaveBeenCalledTimes(1);
        const persisted = productRepository.create.mock.calls[0][0];
        expect(persisted.nombre).toBe('Cinta Métrica 5m');
        expect(persisted.sku).toBe('CIN-5M');
        expect(persisted.precio).toBe(15000);
    });

    test('rama: nombre vacío → 400 y NO persiste', async () => {
        const r = await productService.createProduct(productoValido({ nombre: '' }));
        expect(r.statusCode).toBe(400);
        expect(r.message).toMatch(/nombre/i);
        expect(productRepository.create).not.toHaveBeenCalled();
    });

    test('rama: SKU vacío → 400', async () => {
        const r = await productService.createProduct(productoValido({ sku: '   ' }));
        expect(r.statusCode).toBe(400);
        expect(r.message).toMatch(/SKU/i);
    });

    test('rama: categoría faltante → 400', async () => {
        const r = await productService.createProduct(productoValido({ categoria: undefined }));
        expect(r.statusCode).toBe(400);
        expect(r.message).toMatch(/categor/i);
    });

    test('rama: categoría inválida (no está en la lista) → 400', async () => {
        const r = await productService.createProduct(productoValido({ categoria: 'Galaxias' }));
        expect(r.statusCode).toBe(400);
        expect(r.message).toMatch(/categor/i);
    });

    test('rama: precio negativo → 400', async () => {
        const r = await productService.createProduct(productoValido({ precio: -1 }));
        expect(r.statusCode).toBe(400);
        expect(r.message).toMatch(/precio/i);
    });

    test('rama: stock negativo → 400', async () => {
        const r = await productService.createProduct(productoValido({ stock: -5 }));
        expect(r.statusCode).toBe(400);
        expect(r.message).toMatch(/stock/i);
    });

    test('rama: imagen con formato inválido → 400', async () => {
        const r = await productService.createProduct(productoValido({ imagen: 'ftp://servidor/foto.png' }));
        expect(r.statusCode).toBe(400);
        expect(r.message).toMatch(/imagen/i);
    });

    test('rama: imagen demasiado grande → 400', async () => {
        const imagenEnorme = 'data:image/png;base64,' + 'A'.repeat(7_500_001);
        const r = await productService.createProduct(productoValido({ imagen: imagenEnorme }));
        expect(r.statusCode).toBe(400);
        expect(r.message).toMatch(/grande/i);
    });

    test('rama: SKU duplicado → 409 (conflicto)', async () => {
        productRepository.findBySku.mockResolvedValue({ id: 'otro', sku: 'CIN-5M' });
        const r = await productService.createProduct(productoValido());
        expect(r.statusCode).toBe(409);
        expect(productRepository.create).not.toHaveBeenCalled();
    });
});

describe('updateProduct — ramas (Caja Blanca)', () => {

    test('rama: producto inexistente → 404', async () => {
        productRepository.findById.mockResolvedValue(null);
        const r = await productService.updateProduct('id-inexistente', { precio: 1000 });
        expect(r.statusCode).toBe(404);
        expect(productRepository.update).not.toHaveBeenCalled();
    });

    test('happy path: actualización válida sin cambio de SKU → 200', async () => {
        productRepository.findById.mockResolvedValue(productoValido({ id: 'prod-1' }));
        const r = await productService.updateProduct('prod-1', { precio: 19999 });
        expect(r.statusCode).toBe(200);
        expect(productRepository.update).toHaveBeenCalledTimes(1);
        // No se consulta duplicidad si el SKU no cambia.
        expect(productRepository.findBySku).not.toHaveBeenCalled();
    });

    test('rama: cambiar a un SKU que ya existe en otro producto → 409', async () => {
        productRepository.findById.mockResolvedValue(productoValido({ id: 'prod-1', sku: 'CIN-5M' }));
        productRepository.findBySku.mockResolvedValue({ id: 'prod-2', sku: 'DUP-1' });
        const r = await productService.updateProduct('prod-1', { sku: 'DUP-1' });
        expect(r.statusCode).toBe(409);
        expect(productRepository.update).not.toHaveBeenCalled();
    });

    test('rama: cambios que dejan datos inválidos → 400', async () => {
        productRepository.findById.mockResolvedValue(productoValido({ id: 'prod-1' }));
        const r = await productService.updateProduct('prod-1', { precio: -100 });
        expect(r.statusCode).toBe(400);
        expect(productRepository.update).not.toHaveBeenCalled();
    });
});

describe('getCategories — contrato', () => {
    test('devuelve la lista de categorías válidas', () => {
        const cats = productService.getCategories();
        expect(Array.isArray(cats)).toBe(true);
        expect(cats).toContain('Herramientas Eléctricas');
        expect(cats).toContain('Otros');
    });
});
