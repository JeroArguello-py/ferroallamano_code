// Categorías válidas (alineadas con las del dashboard)
export const CATEGORIES = Object.freeze([
    'Herramientas Eléctricas',
    'Tornillería',
    'Pinturas y Acabados',
    'Plomería',
    'Construcción',
    'Otros'
]);

export default class Product {
    constructor({ id, nombre, sku, categoria, precio, stock, descripcion, createdAt, updatedAt }) {
        this.id = id || Date.now().toString();
        this.nombre = nombre;
        this.sku = sku;
        this.categoria = categoria;
        this.precio = Number(precio) || 0;
        this.stock = Number(stock) || 0;
        this.descripcion = descripcion || '';
        this.createdAt = createdAt || new Date().toISOString();
        this.updatedAt = updatedAt || this.createdAt;
    }

    isAvailable() {
        return this.stock > 0;
    }
}
