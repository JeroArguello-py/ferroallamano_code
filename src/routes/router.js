import { Router } from "express";
import authController from "../controllers/authcontroller.js";
import productController from "../controllers/productController.js";
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

export default router;
