import facturaService from '../services/facturaService.js';

class FacturaController {
    // ── Vista: generar/ver la factura de una venta ───────────────────────────
    async renderFacturaDesdeVenta(req, res) {
        try {
            const result = await facturaService.generarDesdeVenta(req.params.ventaId);
            if (!result.success) {
                return res.status(result.statusCode).render('factura', {
                    factura: null,
                    error: result.message
                });
            }
            res.render('factura', { factura: result.data, error: null });
        } catch (error) {
            console.error(error);
            res.status(500).render('factura', { factura: null, error: 'Error interno del servidor' });
        }
    }

    // ── Vista: ver una factura por su id ──────────────────────────────────────
    async renderFactura(req, res) {
        try {
            const result = await facturaService.getFactura(req.params.id);
            if (!result.success) {
                return res.status(result.statusCode).render('factura', {
                    factura: null,
                    error: result.message
                });
            }
            res.render('factura', { factura: result.data, error: null });
        } catch (error) {
            console.error(error);
            res.status(500).render('factura', { factura: null, error: 'Error interno del servidor' });
        }
    }

    // ── API JSON ──────────────────────────────────────────────────────────────
    async list(req, res) {
        try {
            const result = await facturaService.listFacturas();
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    async getOne(req, res) {
        try {
            const result = await facturaService.getFactura(req.params.id);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    async emitir(req, res) {
        try {
            const result = await facturaService.emitir(req.params.id);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    async actualizarPago(req, res) {
        try {
            const result = await facturaService.actualizarPago(req.params.id, req.body.estadoPago);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }
}

export default new FacturaController();
