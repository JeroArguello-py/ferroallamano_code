/**
 * Fixtures (datos de prueba) reutilizables.
 *
 * Principio de la guía: "Los datos de prueba deben ser mínimos pero
 * representativos". Estos builders crean objetos válidos por defecto y
 * permiten sobreescribir solo el campo que cada test necesita variar.
 *
 * Nota: estos objetos imitan lo que devuelven los repositorios DESPUÉS de
 * serializar (campo `id` string en vez de `_id`), que es justo lo que
 * consumen los services.
 */

export function makeProduct(overrides = {}) {
    return {
        id: 'prod-001',
        nombre: 'Taladro Percutor 750W',
        sku: 'TAL-750',
        categoria: 'Herramientas Eléctricas',
        precio: 100,
        stock: 10,
        descripcion: 'Taladro de prueba',
        imagen: '',
        ...overrides
    };
}

export function makeClient(overrides = {}) {
    return {
        id: 'cli-001',
        nombre: 'Cliente Demo',
        documento: '1234567890',
        telefono: '3000000000',
        correo: 'demo@correo.com',
        direccion: 'Calle 1 # 2-3',
        ...overrides
    };
}

/**
 * Catálogo de 3 productos con casos representativos:
 *  - p1: caro, con stock, Herramientas Eléctricas
 *  - p2: barato, SIN stock (agotado), Construcción
 *  - p3: precio medio, con stock, Pinturas
 * Útil para probar búsqueda por nombre/sku/precio/disponibilidad.
 */
export function makeCatalogo() {
    return [
        makeProduct({ id: 'p1', nombre: 'Taladro Percutor', sku: 'TAL-750', precio: 250000, stock: 5, categoria: 'Herramientas Eléctricas' }),
        makeProduct({ id: 'p2', nombre: 'Martillo de Uña', sku: 'MAR-016', precio: 35000, stock: 0, categoria: 'Construcción' }),
        makeProduct({ id: 'p3', nombre: 'Pintura Blanca 1gl', sku: 'PIN-BLA-1', precio: 80000, stock: 20, categoria: 'Pinturas y Acabados' })
    ];
}
