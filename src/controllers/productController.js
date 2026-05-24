import productService from '../services/productService.js';

class ProductController {
    async renderCatalog(req, res) {
        try {
            const result = await productService.listProducts({});
            res.render('products', {
                products: result.data,
                categorias: productService.getCategories()
            });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error interno del servidor');
        }
    }

    renderNewProduct(req, res) {
        res.render('newProduct', {
            categorias: productService.getCategories()
        });
    }

    async list(req, res) {
        try {
            const result = await productService.listProducts(req.query);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    async getOne(req, res) {
        try {
            const result = await productService.getProduct(req.params.id);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    async create(req, res) {
        try {
            const result = await productService.createProduct(req.body);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    async update(req, res) {
        try {
            const result = await productService.updateProduct(req.params.id, req.body);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }
}

export default new ProductController();
