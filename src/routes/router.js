import { Router } from "express";
import authController from "../controllers/authController.js";

const router = Router();


router.get('/', authController.renderLogin);


router.get('/dashboard', authController.renderDashboard);


router.post('/api/login', authController.login);

export default router;