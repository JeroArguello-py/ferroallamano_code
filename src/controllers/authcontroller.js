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
        
        const dashboardData = {
            resumenDiario: {
                fecha: "22 de abril 2026",   
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
                },
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

   
    login(req, res) {
        try {
            const { email, password } = req.body;
            const result = authService.authenticate(email, password);

            if (result.success) {
                res.status(200).json(result);
            } else {
                res.status(401).json(result);
            }
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }

    createClient(req, res) {
        try {
            const result = clientService.createClient(req.body);
            res.status(result.statusCode).json(result);
        } catch (error) {
            res.status(500).json({ success: false, message: 'Error interno del servidor' });
        }
    }
}

export default new AuthController();