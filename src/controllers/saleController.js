import saleService from '../services/saleService.js';

class SaleController {
    async renderNewSale(req, res) {
        try {
            res.render('newSale', {
                codigoPreview: await saleService.previewNextCode(),
                ivaRate: saleService.getIvaRate()
            });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error interno del servidor');
        }
    }

    // Vista: historial de ventas (tabla)
    async renderHistorial(req, res) {
        try {
            const result = await saleService.listSales();
            res.render('historialVentas', { ventas: result.data || [] });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error interno del servidor');
        }
    }

    async list(req, res) {
        try {
            const result = await saleService.listSales();
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    async getOne(req, res) {
        try {
            const result = await saleService.getSale(req.params.id);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    async create(req, res) {
        try {
            const result = await saleService.createSale(req.body);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }
}

export default new SaleController();
