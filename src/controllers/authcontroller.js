import authService from '../services/authService.js';
import clientService from '../services/clientService.js';

class AuthController {
    renderLogin(req, res) {
        res.render('index');
    }

    renderNewClient(req, res) {
        res.render('newClient');
    }

    renderDashboard(req, res) {
        // Fecha actual formateada en español (ej. "11 de mayo 2026")
        const hoy = new Date();
        const fechaActual = hoy
            .toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
            .replace(/ de (\d{4})$/, ' $1');

        const dashboardData = {
            resumenDiario: {
                fecha: fechaActual,
                metricaPrincipal: "Métricas de desempeño comercial"
            },
            cards: [
                {
                    title: "TOTAL VENDIDO",
                    value: "$42,500.000",
                    vsAyer: "$37,775",
                    trend: "+12.5%",
                    trendClass: "positive",
                    iconClass: "fa-regular fa-money-bill-1"
                },
                {
                    title: "TRANSACCIONES",
                    value: "184",
                    vsAyer: "Operaciones completadas",
                    trend: "+4.2%",
                    trendClass: "positive",
                    iconClass: "fa-solid fa-file-invoice-dollar"
                },
                {
                    title: "PROMEDIO VENTA",
                    value: "$230.973",
                    vsAyer: "Por transacción",
                    trend: "-1.1%",
                    trendClass: "negative",
                    iconClass: "fa-solid fa-tag"
                }
            ],
            categorias: [
                { name: "Herramientas Eléctricas", percentage: 45, color: "#9c5220" },
                { name: "Tornillería", percentage: 30, color: "#f9bc1d" },
                { name: "Pinturas y Acabados", percentage: 15, color: "#1c6ea4" },
                { name: "Otros", percentage: 10, color: "#6b7280" }
            ]
        };

        res.render('dashboard', { data: dashboardData });
    }

    async login(req, res) {
        try {
            const { email, password } = req.body;
            const result = await authService.authenticate(email, password);

            if (result.success) {
                res.status(200).json(result);
            } else {
                res.status(401).json(result);
            }
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    async createClient(req, res) {
        try {
            const result = await clientService.createClient(req.body);
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    async getClients(req, res) {
        try {
            const q = req.query.q;
            const result = q !== undefined
                ? await clientService.searchClients(q, Number(req.query.limit) || 8)
                : await clientService.getAllClients();
            res.status(result.statusCode).json(result);
        } catch (error) {
            console.error(error);
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }
}

export default new AuthController();
