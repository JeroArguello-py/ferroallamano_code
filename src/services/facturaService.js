import facturaRepository from '../repositories/facturaRepository.js';
import saleRepository from '../repositories/saleRepository.js';
import { ESTADO_FACTURA, ESTADO_PAGO } from '../models/facturaModel.js';

class FacturaService {
    /**
     * Genera (o recupera) la factura asociada a una venta.
     * Si ya existe una factura para esa venta, la devuelve tal cual.
     * Si no existe, crea una en estado BORRADOR a partir de los datos de la venta.
     */
    async generarDesdeVenta(ventaId) {
        const existente = await facturaRepository.findByVentaId(ventaId);
        if (existente) {
            return { success: true, statusCode: 200, data: existente };
        }

        const venta = await saleRepository.findById(ventaId);
        if (!venta) {
            return { success: false, statusCode: 404, message: 'Venta no encontrada.' };
        }

        const year = new Date().getFullYear();
        const seq = await facturaRepository.nextSequenceForYear(year);
        const codigoFactura = `FAC-${year}-${String(seq).padStart(4, '0')}`;

        const subtotal = Number(venta.subtotal) || 0;
        const descuento = Number(venta.descuento) || 0;
        // Si la venta ya trae el porcentaje exacto, lo usamos; si no, lo calculamos.
        const descuentoPorcentaje = (venta.descuentoPorcentaje !== undefined && venta.descuentoPorcentaje !== null)
            ? Number(venta.descuentoPorcentaje)
            : (subtotal > 0 ? +((descuento / subtotal) * 100).toFixed(2) : 0);

        const data = {
            codigoFactura,
            ventaId: venta.id,
            codigoVenta: venta.codigo,
            fechaEmision: new Date(),
            clienteId: venta.clienteId,
            clienteSnapshot: venta.clienteSnapshot || {},
            items: (venta.items || []).map(it => ({
                productId: it.productId,
                sku: it.sku,
                nombre: it.nombre,
                descripcion: it.descripcion,
                cantidad: it.cantidad,
                precioUnitario: it.precioUnitario,
                subtotal: it.subtotal
            })),
            subtotal,
            descuento,
            descuentoPorcentaje,
            ivaRate: 0.19,
            iva: Number(venta.iva) || 0,
            total: Number(venta.total) || 0,
            notas: venta.notas || '',
            estadoFactura: ESTADO_FACTURA.BORRADOR,
            estadoPago: ESTADO_PAGO.PENDIENTE
        };

        const factura = await facturaRepository.create(data);
        return { success: true, statusCode: 201, data: factura };
    }

    async getFactura(id) {
        const factura = await facturaRepository.findById(id);
        if (!factura) return { success: false, statusCode: 404, message: 'Factura no encontrada.' };
        return { success: true, statusCode: 200, data: factura };
    }

    async listFacturas() {
        const facturas = await facturaRepository.getAll();
        return { success: true, statusCode: 200, data: facturas, total: facturas.length };
    }

    /**
     * Emite la factura: cambia el estado de BORRADOR a EMITIDA.
     */
    async emitir(id) {
        const factura = await facturaRepository.findById(id);
        if (!factura) {
            return { success: false, statusCode: 404, message: 'Factura no encontrada.' };
        }
        if (factura.estadoFactura === ESTADO_FACTURA.EMITIDA) {
            return { success: true, statusCode: 200, message: 'La factura ya estaba emitida.', data: factura };
        }

        const actualizada = await facturaRepository.update(id, {
            estadoFactura: ESTADO_FACTURA.EMITIDA,
            fechaEmision: factura.fechaEmision || new Date()
        });

        return {
            success: true,
            statusCode: 200,
            message: 'Factura emitida correctamente.',
            data: actualizada
        };
    }

    /**
     * Cambia el estado de pago (pendiente / pagado).
     */
    async actualizarPago(id, estadoPago) {
        if (!Object.values(ESTADO_PAGO).includes(estadoPago)) {
            return { success: false, statusCode: 400, message: 'Estado de pago invalido.' };
        }
        const actualizada = await facturaRepository.update(id, { estadoPago });
        if (!actualizada) {
            return { success: false, statusCode: 404, message: 'Factura no encontrada.' };
        }
        return { success: true, statusCode: 200, message: 'Estado de pago actualizado.', data: actualizada };
    }
}

export default new FacturaService();
