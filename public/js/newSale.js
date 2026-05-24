console.log("newSale.js cargado.");

// ────────────────────────────────────────────────────────────────────────────
// Estado de la venta
// ────────────────────────────────────────────────────────────────────────────
const state = {
    cliente: null,           // { id, nombre, documento, ... }
    items: [],               // [{ productId, sku, nombre, descripcion, precio, stock, cantidad }]
    ivaRate: window.SALE_INIT?.ivaRate ?? 0.19,
    descuentoPct: 0          // porcentaje de descuento (0-100)
};

const fmt = new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 2 });
const money = n => fmt.format(Number(n) || 0);

const debounce = (fn, ms = 200) => {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), ms);
    };
};

function escapeHtml(str = '') {
    return String(str)
        .replaceAll('&', '&amp;').replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

// ────────────────────────────────────────────────────────────────────────────
// Fecha del encabezado
// ────────────────────────────────────────────────────────────────────────────
function setHeaderDate() {
    const span = document.getElementById('fechaVenta');
    if (!span) return;
    const now = new Date();
    const meses = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
    span.textContent = `${now.getDate()} ${meses[now.getMonth()]}, ${now.getFullYear()}`;
}

// ────────────────────────────────────────────────────────────────────────────
// Autocomplete: clientes
// ────────────────────────────────────────────────────────────────────────────
const clientSearch = () => document.getElementById('clientSearch');
const clientResults = () => document.getElementById('clientResults');

async function fetchClients(q) {
    try {
        const res = await fetch(`/api/clientes?q=${encodeURIComponent(q)}&limit=8`);
        const data = await res.json();
        return data.data || [];
    } catch (err) {
        console.error(err);
        return [];
    }
}

function renderClientResults(list) {
    const ul = clientResults();
    ul.innerHTML = '';
    if (list.length === 0) {
        ul.innerHTML = '<li class="empty">Sin coincidencias</li>';
    } else {
        list.forEach(c => {
            const li = document.createElement('li');
            li.innerHTML = `
                <i class="fa-regular fa-user"></i>
                <div>
                    <p>${escapeHtml(c.nombre)}</p>
                    <small>Doc: ${escapeHtml(c.documento)}${c.correo ? ' · ' + escapeHtml(c.correo) : ''}</small>
                </div>
            `;
            li.addEventListener('click', () => selectClient(c));
            ul.appendChild(li);
        });
    }
    ul.hidden = false;
}

function selectClient(c) {
    state.cliente = c;
    document.getElementById('clienteId').value = c.id;

    const sel = document.getElementById('selectedClient');
    sel.querySelector('.selected-name').textContent = c.nombre;
    sel.querySelector('.selected-doc').textContent = `Doc: ${c.documento}${c.correo ? ' · ' + c.correo : ''}`;
    sel.hidden = false;

    clientSearch().value = '';
    clientResults().hidden = true;
    document.querySelector('.client-search-wrap .autocomplete').style.display = 'none';
}

function clearClient() {
    state.cliente = null;
    document.getElementById('clienteId').value = '';
    document.getElementById('selectedClient').hidden = true;
    document.querySelector('.client-search-wrap .autocomplete').style.display = '';
}

// ────────────────────────────────────────────────────────────────────────────
// Autocomplete: productos
// ────────────────────────────────────────────────────────────────────────────
const productSearch = () => document.getElementById('productSearch');
const productResults = () => document.getElementById('productResults');

async function fetchProducts(q) {
    try {
        const [nameRes, skuRes] = await Promise.all([
            fetch(`/api/productos?nombre=${encodeURIComponent(q)}`),
            fetch(`/api/productos?sku=${encodeURIComponent(q)}`)
        ]);
        const [n, s] = await Promise.all([nameRes.json(), skuRes.json()]);
        const map = new Map();
        (n.data || []).concat(s.data || []).forEach(p => map.set(p.id, p));
        return [...map.values()].slice(0, 8);
    } catch (err) {
        console.error(err);
        return [];
    }
}

function renderProductResults(list) {
    const ul = productResults();
    ul.innerHTML = '';
    if (list.length === 0) {
        ul.innerHTML = '<li class="empty">Sin coincidencias</li>';
    } else {
        list.forEach(p => {
            const agotado = p.stock <= 0;
            const li = document.createElement('li');
            li.className = agotado ? 'disabled' : '';
            li.innerHTML = `
                <i class="fa-solid fa-box"></i>
                <div>
                    <p>${escapeHtml(p.nombre)}</p>
                    <small>SKU: ${escapeHtml(p.sku)} · Stock: ${p.stock} · ${money(p.precio)}</small>
                </div>
                ${agotado ? '<span class="tag-agotado">Agotado</span>' : ''}
            `;
            if (!agotado) li.addEventListener('click', () => addItem(p));
            ul.appendChild(li);
        });
    }
    ul.hidden = false;
}

// ────────────────────────────────────────────────────────────────────────────
// Líneas de venta
// ────────────────────────────────────────────────────────────────────────────
function addItem(p) {
    const existing = state.items.find(it => it.productId === p.id);
    if (existing) {
        if (existing.cantidad + 1 > p.stock) {
            alert(`No hay más stock disponible para "${p.nombre}". Stock: ${p.stock}.`);
            return;
        }
        existing.cantidad += 1;
    } else {
        state.items.push({
            productId: p.id,
            sku: p.sku,
            nombre: p.nombre,
            descripcion: p.descripcion || '',
            precio: Number(p.precio),
            stock: Number(p.stock),
            cantidad: 1
        });
    }
    productSearch().value = '';
    productResults().hidden = true;
    renderItems();
}

function changeQty(productId, delta) {
    const it = state.items.find(i => i.productId === productId);
    if (!it) return;
    const next = it.cantidad + delta;
    if (next <= 0) {
        removeItem(productId);
        return;
    }
    if (next > it.stock) {
        alert(`Solo hay ${it.stock} unidades disponibles de "${it.nombre}".`);
        return;
    }
    it.cantidad = next;
    renderItems();
}

function setQty(productId, value) {
    const it = state.items.find(i => i.productId === productId);
    if (!it) return;
    let n = parseInt(value, 10);
    if (Number.isNaN(n) || n < 1) n = 1;
    if (n > it.stock) {
        alert(`Solo hay ${it.stock} unidades disponibles de "${it.nombre}".`);
        n = it.stock;
    }
    it.cantidad = n;
    renderItems();
}

function removeItem(productId) {
    state.items = state.items.filter(i => i.productId !== productId);
    renderItems();
}

function renderItems() {
    const tbody = document.getElementById('itemsBody');
    tbody.innerHTML = '';

    if (state.items.length === 0) {
        tbody.innerHTML = `
            <tr class="empty-row">
                <td colspan="6">Aún no hay productos en esta venta. Busca un producto arriba para añadirlo.</td>
            </tr>`;
        recomputeTotals();
        return;
    }

    state.items.forEach(it => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="cell-sku">${escapeHtml(it.sku)}</td>
            <td>
                <p class="cell-name">${escapeHtml(it.nombre)}</p>
                ${it.descripcion ? `<p class="cell-desc">${escapeHtml(it.descripcion)}</p>` : ''}
            </td>
            <td class="col-qty">
                <div class="qty-control">
                    <button type="button" class="qty-btn" data-action="dec" data-id="${it.productId}">−</button>
                    <input type="number" class="qty-input" data-id="${it.productId}" value="${it.cantidad}" min="1" max="${it.stock}">
                    <button type="button" class="qty-btn" data-action="inc" data-id="${it.productId}">+</button>
                </div>
                <small class="stock-hint">Stock: ${it.stock}</small>
            </td>
            <td class="col-num">${money(it.precio)}</td>
            <td class="col-num cell-subtotal">${money(it.precio * it.cantidad)}</td>
            <td class="col-action">
                <button type="button" class="btn-remove" data-id="${it.productId}" title="Eliminar">
                    <i class="fa-regular fa-trash-can"></i>
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    tbody.querySelectorAll('.qty-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.dataset.id;
            changeQty(id, btn.dataset.action === 'inc' ? 1 : -1);
        });
    });
    tbody.querySelectorAll('.qty-input').forEach(inp => {
        inp.addEventListener('change', () => setQty(inp.dataset.id, inp.value));
    });
    tbody.querySelectorAll('.btn-remove').forEach(btn => {
        btn.addEventListener('click', () => removeItem(btn.dataset.id));
    });

    recomputeTotals();
}

// ────────────────────────────────────────────────────────────────────────────
// Totales (con descuento por porcentaje)
// ────────────────────────────────────────────────────────────────────────────
function getDescuentoPct() {
    const input = document.getElementById('descuentoPct');
    let pct = parseFloat(input?.value);
    if (Number.isNaN(pct) || pct < 0) pct = 0;
    if (pct > 100) pct = 100;
    return pct;
}

function recomputeTotals() {
    const subtotal = state.items.reduce((acc, it) => acc + it.precio * it.cantidad, 0);
    const pct = getDescuentoPct();
    state.descuentoPct = pct;

    const descuento = subtotal * (pct / 100);
    const base = Math.max(0, subtotal - descuento);
    const iva = base * state.ivaRate;
    const total = base + iva;

    document.getElementById('totSubtotal').textContent = money(subtotal);
    document.getElementById('totIva').textContent = money(iva);
    document.getElementById('totDescuento').textContent = '-' + money(descuento);
    document.getElementById('totTotal').textContent = money(total);
}

// ────────────────────────────────────────────────────────────────────────────
// Submit
// ────────────────────────────────────────────────────────────────────────────
async function submitSale(e) {
    e.preventDefault();

    if (!state.cliente) {
        alert('Selecciona un cliente para continuar.');
        return;
    }
    if (state.items.length === 0) {
        alert('Agrega al menos un producto a la venta.');
        return;
    }

    const payload = {
        clienteId: state.cliente.id,
        notas: document.getElementById('notas').value.trim(),
        descuentoPorcentaje: getDescuentoPct(),
        items: state.items.map(it => ({
            productId: it.productId,
            cantidad: it.cantidad
        }))
    };

    const btn = document.getElementById('btnGenerar');
    btn.disabled = true;
    const original = btn.innerHTML;
    btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando...';

    try {
        const res = await fetch('/api/ventas', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!data.success) {
            alert('Error: ' + (data.message || 'No se pudo registrar la venta.'));
            return;
        }
        // Venta creada: vamos a la pantalla de factura (se genera el borrador).
        window.location.href = `/facturas/venta/${data.data.id}`;
    } catch (err) {
        console.error(err);
        alert('Error de conexión con el servidor.');
    } finally {
        btn.disabled = false;
        btn.innerHTML = original;
    }
}

function cancelSale() {
    if (state.items.length === 0 && !state.cliente) {
        window.location.href = '/dashboard';
        return;
    }
    if (confirm('¿Cancelar esta venta? Se perderá la información ingresada.')) {
        window.location.href = '/dashboard';
    }
}

// ────────────────────────────────────────────────────────────────────────────
// Bootstrap
// ────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    setHeaderDate();
    renderItems();

    // Búsqueda de cliente
    const onClientInput = debounce(async () => {
        const q = clientSearch().value.trim();
        if (!q) { clientResults().hidden = true; return; }
        const list = await fetchClients(q);
        renderClientResults(list);
    }, 200);
    clientSearch().addEventListener('input', onClientInput);
    clientSearch().addEventListener('focus', () => {
        if (clientSearch().value.trim()) onClientInput();
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.client-search-wrap')) clientResults().hidden = true;
    });
    document.getElementById('btnClearClient').addEventListener('click', clearClient);

    // Búsqueda de producto
    const onProductInput = debounce(async () => {
        const q = productSearch().value.trim();
        if (!q) { productResults().hidden = true; return; }
        const list = await fetchProducts(q);
        renderProductResults(list);
    }, 200);
    productSearch().addEventListener('input', onProductInput);
    productSearch().addEventListener('focus', () => {
        if (productSearch().value.trim()) onProductInput();
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#productResults') && e.target.id !== 'productSearch') {
            productResults().hidden = true;
        }
    });

    // Descuento: recalcular cuando cambia el porcentaje
    const descuentoInput = document.getElementById('descuentoPct');
    if (descuentoInput) {
        descuentoInput.addEventListener('input', recomputeTotals);
        descuentoInput.addEventListener('change', () => {
            // Normalizar el valor mostrado (clamp 0-100)
            descuentoInput.value = getDescuentoPct();
            recomputeTotals();
        });
    }

    // Acciones
    document.getElementById('newSaleForm').addEventListener('submit', submitSale);
    document.getElementById('btnCancelar').addEventListener('click', cancelSale);
});
