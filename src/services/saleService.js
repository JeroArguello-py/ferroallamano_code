import saleRepository from '../repositories/saleRepository.js';
import productRepository from '../repositories/productRepository.js';
import clientRepository from '../repositories/clientRepository.js';
import { SaleItem, IVA_RATE } from '../models/saleModel.js';

class SaleService {
    getIvaRate() {
        return IVA_RATE;
    }

    /**
     * Vista previa del siguiente código de venta. Ej. VEN-2026-001
     */
    async previewNextCode() {
        const year = new Date().getFullYear();
        const seq = await saleRepository.nextSequenceForYear(year);
        return `VEN-${year}-${String(seq).padStart(3, '0')}`;
    }

    async listSales() {
        const sales = await saleRepository.getAll();
        return {
            success: true,
            statusCode: 200,
            data: sales,
            total: sales.length
        };
    }

    async getSale(id) {
        const sale = await saleRepository.findById(id);
        if (!sale) return { success: false, statusCode: 404, message: 'Venta no encontrada.' };
        return { success: true, statusCode: 200, data: sale };
    }

    /**
     * Crea una venta validando cliente, productos y stock.
     * El descuento se recibe como porcentaje (0-100) y se calcula sobre el subtotal.
     * El IVA se aplica sobre la base gravable (subtotal - descuento).
     */
    async createSale(payload) {
        const errors = [];

        if (!payload.clienteId) errors.push('Debe seleccionar un cliente.');
        if (!Array.isArray(payload.items) || payload.items.length === 0) {
            errors.push('Debe agregar al menos un producto a la venta.');
        }

        if (errors.length) {
            return { success: false, statusCode: 400, message: errors.join(' ') };
        }

        const cliente = await clientRepository.findById(payload.clienteId);
        if (!cliente) {
            return { success: false, statusCode: 404, message: 'Cliente no encontrado.' };
        }

        // Validación + construcción de líneas a partir de los datos actuales del producto.
        const items = [];
        for (const raw of payload.items) {
            const prod = await productRepository.findById(raw.productId);
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

        // Descuento como porcentaje (0-100). Se acepta tambien `descuento` (monto fijo)
        // por compatibilidad, pero el porcentaje tiene prioridad.
        let descuentoPorcentaje = Number(payload.descuentoPorcentaje);
        if (Number.isNaN(descuentoPorcentaje)) descuentoPorcentaje = 0;
        descuentoPorcentaje = Math.min(100, Math.max(0, descuentoPorcentaje));

        let descuento;
        if (payload.descuentoPorcentaje !== undefined) {
            descuento = +(subtotal * (descuentoPorcentaje / 100)).toFixed(2);
        } else {
            // Compatibilidad: monto fijo si no viene porcentaje.
            descuento = Math.max(0, Number(payload.descuento) || 0);
            descuentoPorcentaje = subtotal > 0 ? +((descuento / subtotal) * 100).toFixed(2) : 0;
        }

        const baseGravable = Math.max(0, subtotal - descuento);
        const iva = +(baseGravable * IVA_RATE).toFixed(2);
        const total = +(baseGravable + iva).toFixed(2);

        const year = new Date().getFullYear();
        const seq = await saleRepository.nextSequenceForYear(year);
        const codigo = `VEN-${year}-${String(seq).padStart(3, '0')}`;

        const sale = await saleRepository.create({
            codigo,
            fecha: new Date(),
            clienteId: cliente.id,
            clienteSnapshot: {
                nombre: cliente.nombre,
                documento: cliente.documento,
                telefono: cliente.telefono,
                correo: cliente.correo,
                direccion: cliente.direccion
            },
            items: items.map(i => ({ ...i })),
            notas: (payload.notas || '').trim(),
            subtotal,
            descuento,
            descuentoPorcentaje,
            iva,
            total
        });

        return {
            success: true,
            statusCode: 201,
            message: 'Venta registrada exitosamente.',
            data: sale
        };
    }
}

export default new SaleService();
