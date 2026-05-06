import { Router } from "express";
import authController from "../controllers/authcontroller.js";

const router = Router();


router.get('/', authController.renderLogin);


router.get('/dashboard', authController.renderDashboard);


router.post('/api/login', authController.login);

router.get('/clientes/nuevo', authController.renderNewClient);

router.post('/api/clientes', authController.createClient);

export default router;