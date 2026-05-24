import saleRepository from '../repositories/saleRepository.js';
import productRepository from '../repositories/productRepository.js';
import clientRepository from '../repositories/clientRepository.js';
import invoiceService from './invoiceService.js';
import Sale, { SaleItem, IVA_RATE } from '../models/saleModel.js';

class SaleService {
    getIvaRate() {
        return IVA_RATE;
    }

    /**
     * Construye un código de venta basado en el año y un consecutivo.
     * Ej. VEN-2026-001
     */
    previewNextCode() {
        const year = new Date().getFullYear();
        const seq = saleRepository.nextSequenceForYear(year);
        return `VEN-${year}-${String(seq).padStart(3, '0')}`;
    }

    listSales() {
        return {
            success: true,
            statusCode: 200,
            data: saleRepository.getAll(),
            total: saleRepository.getAll().length
        };
    }

    getSale(id) {
        const sale = saleRepository.findById(id);
        if (!sale) return { success: false, statusCode: 404, message: 'Venta no encontrada.' };
        return { success: true, statusCode: 200, data: sale };
    }

    /**
     * Crea una venta validando:
     *  - Existencia del cliente.
     *  - Que cada producto exista y tenga stock suficiente.
     *  - Que la cantidad y precio sean coherentes.
     * Luego descuenta el stock y persiste la venta.
     */
    createSale(payload) {
        const errors = [];

        if (!payload.clienteId) errors.push('Debe seleccionar un cliente.');
        if (!Array.isArray(payload.items) || payload.items.length === 0) {
            errors.push('Debe agregar al menos un producto a la venta.');
        }

        if (errors.length) {
            return { success: false, statusCode: 400, message: errors.join(' ') };
        }

        const cliente = clientRepository.findById(payload.clienteId);
        if (!cliente) {
            return { success: false, statusCode: 404, message: 'Cliente no encontrado.' };
        }

        // Validación + construcción de líneas a partir de datos actuales del producto.
        const items = [];
        for (const raw of payload.items) {
            const prod = productRepository.findById(raw.productId);
            if (!prod) {
                return { success: false, statusCode: 404, message: `Producto no encontrado: ${raw.productId}` };
            }
            const cantidad = Number(raw.cantidad);
            if (!cantidad || cantidad <= 0) {
                return { success: false, statusCode: 400, message: `Cantidad inválida para ${prod.nombre}.` };
            }
            if (cantidad > prod.stock) {
                return {
                    success: false,
                    statusCode: 400,
                    message: `Stock insuficiente para "${prod.nombre}". Disponible: ${prod.stock}, solicitado: ${cantidad}.`
                };
            }
            items.push(new SaleItem({
                productId: prod.id,
                sku: prod.sku,
                nombre: prod.nombre,
                descripcion: prod.descripcion,
                cantidad,
                precioUnitario: prod.precio
            }));
        }

        // Totales
        const subtotal = +items.reduce((acc, it) => acc + it.subtotal, 0).toFixed(2);
        const descuento = Math.max(0, Number(payload.descuento) || 0);
        const baseGravable = Math.max(0, subtotal - descuento);
        const iva = +(baseGravable * IVA_RATE).toFixed(2);
        const total = +(baseGravable + iva).toFixed(2);

        const year = new Date().getFullYear();
        const seq = saleRepository.nextSequenceForYear(year);
        const codigo = `VEN-${year}-${String(seq).padStart(3, '0')}`;

        const sale = saleRepository.create({
            codigo,
            fecha: new Date().toISOString(),
            clienteId: cliente.id,
            clienteSnapshot: {
                nombre: cliente.nombre,
                documento: cliente.documento,
                telefono: cliente.telefono,
                correo: cliente.correo,
                direccion: cliente.direccion
            },
            items,
            notas: (payload.notas || '').trim(),
            subtotal,
            descuento,
            iva,
            total
        });

        // Descontar stock de los productos involucrados.
        for (const it of items) {
            const prod = productRepository.findById(it.productId);
            if (prod) {
                productRepository.update(prod.id, { stock: prod.stock - it.cantidad });
            }
        }

        // Crear automáticamente la factura en estado Borrador para que el
        // usuario pueda revisarla y emitirla desde /facturas/:id
        const invoiceResult = invoiceService.createDraftForSale(sale.id);

        return {
            success: true,
            statusCode: 201,
            message: 'Venta registrada exitosamente.',
            data: sale,
            invoice: invoiceResult.success ? invoiceResult.data : null
        };
    }
}

export default new SaleService();
