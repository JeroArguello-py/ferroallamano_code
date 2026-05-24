import { Router } from "express";
import authController from "../controllers/authcontroller.js";
import productController from "../controllers/productController.js";
import saleController from "../controllers/saleController.js";
import facturaController from "../controllers/facturaController.js";
import { requireAdmin } from "../middlewares/authMiddleware.js";

const router = Router();

// ── Vistas ─────────────────────────────────────────────────────────────────
router.get('/', authController.renderLogin);
router.get('/dashboard', authController.renderDashboard);

router.get('/clientes/nuevo', authController.renderNewClient);

router.get('/productos', productController.renderCatalog);
// Solo administradores pueden acceder al formulario de nuevo producto
router.get('/productos/nuevo', requireAdmin, productController.renderNewProduct);

// ── API: Auth ──────────────────────────────────────────────────────────────
router.post('/api/login', authController.login);

// ── API: Clientes ──────────────────────────────────────────────────────────
router.post('/api/clientes', authController.createClient);
router.get('/api/clientes', authController.getClients);

// ── API: Productos ─────────────────────────────────────────────────────────
router.get('/api/productos', productController.list);
router.get('/api/productos/:id', productController.getOne);
// Crear y actualizar productos requiere rol admin
router.post('/api/productos', requireAdmin, productController.create);
router.put('/api/productos/:id', requireAdmin, productController.update);

// ── Ventas ─────────────────────────────────────────────────────────────────
router.get('/ventas/nueva', saleController.renderNewSale);
router.get('/ventas/historial', saleController.renderHistorial);

router.get('/api/ventas', saleController.list);
router.get('/api/ventas/:id', saleController.getOne);
router.post('/api/ventas', saleController.create);

// ── Facturacion ──────────────────────────────────────────────────────────────
// Vista: genera/recupera la factura de una venta y la muestra.
router.get('/facturas/venta/:ventaId', facturaController.renderFacturaDesdeVenta);
// Vista: ver una factura por su id.
router.get('/facturas/:id', facturaController.renderFactura);

// API
router.get('/api/facturas', facturaController.list);
router.get('/api/facturas/:id', facturaController.getOne);
router.post('/api/facturas/:id/emitir', facturaController.emitir);
router.patch('/api/facturas/:id/pago', facturaController.actualizarPago);

export default router;
