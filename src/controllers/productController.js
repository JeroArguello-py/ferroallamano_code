import productService from '../services/productService.js';

class ProductController {
    // ── Vistas ──────────────────────────────────────────────────────────────
    renderCatalog(req, res) {
        const result = productService.listProducts({});
        res.render('products', {
            products: result.data,
            categorias: productService.getCategories()
        });
    }

    renderNewProduct(req, res) {
        // El guard de admin se aplica en la ruta vía middleware.
        res.render('newProduct', {
            categorias: productService.getCategories()
        });
    }

    // ── API JSON ────────────────────────────────────────────────────────────
    list(req, res) {
        try {
            const result = productService.listProducts(req.query);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    getOne(req, res) {
        try {
            const result = productService.getProduct(req.params.id);
            res.status(result.statusCode).json(result);
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    create(req, res) {
        try {
            const result = productService.createProduct(req.body);
            res.status(result.statusCode).json(result);
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    update(req, res) {
        try {
            const result = productService.updateProduct(req.params.id, req.body);
            res.status(result.statusCode).json(result);
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }
}

export default new ProductController();
