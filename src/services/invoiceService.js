import invoiceRepository from '../repositories/invoiceRepository.js';
import saleRepository from '../repositories/saleRepository.js';
import { INVOICE_STATUS } from '../models/invoiceModel.js';

class InvoiceService {
    listInvoices() {
        const items = invoiceRepository.getAll();
        return { success: true, statusCode: 200, data: items, total: items.length };
    }

    /**
     * Devuelve la factura junto con la venta asociada (join en memoria).
     * Esto evita duplicar datos en el JSON: la venta sigue siendo la fuente
     * de verdad para items, cliente y totales mientras la factura es Borrador.
     */
    getInvoice(id) {
        const inv = invoiceRepository.findById(id);
        if (!inv) return { success: false, statusCode: 404, message: 'Factura no encontrada.' };

        // Si la factura ya fue emitida usamos su snapshot (inmutable).
        // Si sigue en borrador, leemos de la venta vinculada en vivo.
        let view;
        if (inv.isEmitted() && inv.snapshot) {
            view = { ...inv, sale: inv.snapshot };
        } else {
            const sale = saleRepository.findById(inv.saleId);
            if (!sale) {
                return { success: false, statusCode: 500, message: 'La venta asociada a esta factura no existe.' };
            }
            view = { ...inv, sale };
        }
        return { success: true, statusCode: 200, data: view };
    }

    /** Crea una factura en estado Borrador a partir de una venta existente. */
    createDraftForSale(saleId) {
        const sale = saleRepository.findById(saleId);
        if (!sale) {
            return { success: false, statusCode: 404, message: 'Venta no encontrada.' };
        }

        // Si por alguna razón ya hay factura para esa venta, la reutilizamos.
        const existing = invoiceRepository.findBySaleId(saleId);
        if (existing) {
            return { success: true, statusCode: 200, data: existing };
        }

        const year = new Date().getFullYear();
        const seq = invoiceRepository.nextSequenceForYear(year);
        const codigo = `FAC-${year}-${String(seq).padStart(4, '0')}`;

        const draft = invoiceRepository.create({
            codigo,
            saleId: sale.id,
            estado: INVOICE_STATUS.BORRADOR
        });

        return { success: true, statusCode: 201, data: draft };
    }

    /**
     * Cambia el estado a Emitida, registra la fecha de emisión y congela un
     * snapshot de la venta (cliente, ítems, totales) para preservar el valor
     * fiscal aunque más adelante cambien los datos originales.
     */
    emit(id) {
        const inv = invoiceRepository.findById(id);
        if (!inv) return { success: false, statusCode: 404, message: 'Factura no encontrada.' };
        if (inv.isEmitted()) {
            return { success: false, statusCode: 400, message: 'La factura ya fue emitida.' };
        }

        const sale = saleRepository.findById(inv.saleId);
        if (!sale) {
            return { success: false, statusCode: 500, message: 'No se puede emitir: la venta asociada no existe.' };
        }

        // Clonamos los datos de la venta para que sean inmutables.
        const snapshot = JSON.parse(JSON.stringify(sale));

        const updated = invoiceRepository.update(id, {
            estado: INVOICE_STATUS.EMITIDA,
            fechaEmision: new Date().toISOString(),
            emitidaAt: new Date().toISOString(),
            snapshot
        });

        return {
            success: true,
            statusCode: 200,
            message: 'Factura emitida correctamente.',
            data: updated
        };
    }
}

export default new InvoiceService();
