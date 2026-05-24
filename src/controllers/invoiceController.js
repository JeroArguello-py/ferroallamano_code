import invoiceService from '../services/invoiceService.js';

class InvoiceController {
    // ── Vistas ──────────────────────────────────────────────────────────────
    renderInvoice(req, res) {
        const result = invoiceService.getInvoice(req.params.id);
        if (!result.success) {
            return res.status(result.statusCode).send(result.message);
        }
        res.render('invoice', { invoice: result.data });
    }

    // ── API ─────────────────────────────────────────────────────────────────
    list(req, res) {
        try {
            const result = invoiceService.listInvoices();
            res.status(result.statusCode).json(result);
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    getOne(req, res) {
        try {
            const result = invoiceService.getInvoice(req.params.id);
            res.status(result.statusCode).json(result);
        } catch (err) {
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    emit(req, res) {
        try {
            const result = invoiceService.emit(req.params.id);
            res.status(result.statusCode).json(result);
        } catch (err) {
            console.error(err);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }
}

export default new InvoiceController();
