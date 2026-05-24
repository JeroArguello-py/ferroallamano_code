// Estados de la factura
export const INVOICE_STATUS = Object.freeze({
    BORRADOR: 'Borrador',
    EMITIDA: 'Emitida',
    ANULADA: 'Anulada'
});

// Estados de pago
export const PAYMENT_STATUS = Object.freeze({
    PENDIENTE: 'Pendiente',
    PAGADO: 'Pagado'
});

/**
 * La factura referencia a una venta (saleId) y vive su propio ciclo
 * (Borrador → Emitida). Los datos monetarios (subtotal, iva, total)
 * y el cliente se obtienen al renderizar haciendo join con la venta,
 * salvo cuando la factura es Emitida, momento en el que se congelan
 * (snapshot) para que el comprobante fiscal sea inmutable.
 */
export default class Invoice {
    constructor({
        id,
        codigo,
        saleId,
        fechaEmision,
        estado,
        estadoPago,
        emitidaAt,
        // Snapshot opcional (se llena al emitir):
        snapshot,
        createdAt
    }) {
        this.id = id || Date.now().toString();
        this.codigo = codigo;
        this.saleId = saleId;
        this.fechaEmision = fechaEmision || null;
        this.estado = estado || INVOICE_STATUS.BORRADOR;
        this.estadoPago = estadoPago || PAYMENT_STATUS.PENDIENTE;
        this.emitidaAt = emitidaAt || null;
        this.snapshot = snapshot || null;
        this.createdAt = createdAt || new Date().toISOString();
    }

    isDraft() { return this.estado === INVOICE_STATUS.BORRADOR; }
    isEmitted() { return this.estado === INVOICE_STATUS.EMITIDA; }
}
