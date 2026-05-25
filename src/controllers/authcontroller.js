import authService from '../services/authService.js';
import clientService from '../services/clientService.js';
import dashboardService from '../services/dashboardService.js';

const money = (n) => '$ ' + (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const trendClass = (t) => t > 0 ? 'positive' : (t < 0 ? 'negative' : 'neutral');
const trendText = (t) => `${t > 0 ? '+' : ''}${t}%`;

class AuthController {
    renderLogin(req, res) {
        res.render('index');
    }

    renderNewClient(req, res) {
        res.render('newClient');
    }

    async renderDashboard(req, res) {
        try {
            const hoy = new Date();
            const fechaActual = hoy
                .toLocaleDateString('es-CO', { day: 'numeric', month: 'long', year: 'numeric' })
                .replace(/ de (\d{4})$/, ' $1');

            const r = await dashboardService.getResumen();

            const dashboardData = {
                resumen: {
                    fecha: fechaActual,
                    metricaPrincipal: 'Indicadores de tu operación comercial'
                },
                cards: [
                    {
                        title: 'TOTAL VENDIDO',
                        value: money(r.totalVendido),
                        vsAyer: `Hoy: ${money(r.totalHoy)}`,
                        trend: trendText(r.trendTotal),
                        trendClass: trendClass(r.trendTotal),
                        iconClass: 'fa-solid fa-dollar-sign'
                    },
                    {
                        title: 'TRANSACCIONES',
                        value: String(r.transacciones),
                        vsAyer: `${r.txHoy} hoy · ${r.txAyer} ayer`,
                        trend: trendText(r.trendTx),
                        trendClass: trendClass(r.trendTx),
                        iconClass: 'fa-solid fa-receipt'
                    },
                    {
                        title: 'PROMEDIO POR VENTA',
                        value: money(r.promedio),
                        vsAyer: 'Ticket promedio',
                        trend: '',
                        trendClass: 'neutral',
                        iconClass: 'fa-solid fa-chart-line'
                    }
                ],
                resumenRapido: [
                    { label: 'Productos en stock', value: `${r.productosActivos} / ${r.productosTotal}`, icon: 'fa-solid fa-boxes-stacked' },
                    { label: 'Clientes registrados', value: String(r.clientes), icon: 'fa-solid fa-users' },
                    { label: 'Ventas hoy', value: String(r.txHoy), icon: 'fa-solid fa-cart-shopping' }
                ],
                categorias: r.categorias
            };

            res.render('dashboard', { data: dashboardData });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error interno del servidor');
        }
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
