import saleService from '../services/saleService.js';

class SaleController {
    renderNewSale(req, res) {
        res.render('newSale', {
            codigoPreview: saleService.previewNextCode(),
            ivaRate: saleService.getIvaRate()
        });
    }

    list(req, res) {
        try {
            const result = saleService.listSales();
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    getOne(req, res) {
        try {
            const result = saleService.getSale(req.params.id);
            res.status(result.statusCode).json(result);
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    create(req, res) {
        try {
            const result = saleService.createSale(req.body);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }
}

export default new SaleController();
