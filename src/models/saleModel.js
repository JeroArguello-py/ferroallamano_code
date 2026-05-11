
export const IVA_RATE = 0.19;

export class SaleItem {
    constructor({ productId, sku, nombre, descripcion, cantidad, precioUnitario }) {
        this.productId = productId;
        this.sku = sku;
        this.nombre = nombre;
        this.descripcion = descripcion || '';
        this.cantidad = Number(cantidad) || 0;
        this.precioUnitario = Number(precioUnitario) || 0;
        this.subtotal = +(this.cantidad * this.precioUnitario).toFixed(2);
    }
}

export default class Sale {
    constructor({
        id,
        codigo,
        fecha,
        clienteId,
        clienteSnapshot,
        items,
        notas,
        subtotal,
        iva,
        descuento,
        total,
        createdAt
    }) {
        this.id = id || Date.now().toString();
        this.codigo = codigo;
        this.fecha = fecha || new Date().toISOString();
        this.clienteId = clienteId || null;
        this.clienteSnapshot = clienteSnapshot || null;
        this.items = (items || []).map(i => i instanceof SaleItem ? i : new SaleItem(i));
        this.notas = notas || '';
        this.subtotal = Number(subtotal) || 0;
        this.iva = Number(iva) || 0;
        this.descuento = Number(descuento) || 0;
        this.total = Number(total) || 0;
        this.createdAt = createdAt || new Date().toISOString();
    }
}
