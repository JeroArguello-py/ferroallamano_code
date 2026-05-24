console.log("products.js cargado.");

// ────────────────────────────────────────────────────────────────────────────
// Estado y utilidades
// ────────────────────────────────────────────────────────────────────────────
const PAGE_SIZE = 6;
let allProducts = [];
let filtered = [];
let currentPage = 1;

function getCurrentUser() {
    try {
        return JSON.parse(localStorage.getItem('ferro_user')) || null;
    } catch {
        return null;
    }
}

function isAdmin() {
    const u = getCurrentUser();
    return u && u.role === 'admin';
}

function authHeaders() {
    const u = getCurrentUser();
    return {
        'Content-Type': 'application/json',
        ...(u?.role ? { 'x-user-role': u.role } : {})
    };
}

function formatPrice(value) {
    const num = Number(value) || 0;
    return num.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function escapeHtml(str = '') {
    return String(str)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;');
}

// ────────────────────────────────────────────────────────────────────────────
// Render
// ────────────────────────────────────────────────────────────────────────────
function renderProducts() {
    const grid = document.getElementById('productsGrid');
    grid.innerHTML = '';

    if (filtered.length === 0) {
        const sinDatos = allProducts.length === 0;
        const titulo = sinDatos
            ? 'Aún no hay productos registrados'
            : 'No se encontraron productos';
        const detalle = sinDatos
            ? (isAdmin()
                ? 'Empieza añadiendo tu primer producto desde el botón "+ Nuevo producto".'
                : 'El administrador todavía no ha registrado productos en el catálogo.')
            : 'Ajusta los filtros o limpia la búsqueda para ver más resultados.';

        grid.innerHTML = `
            <div class="empty-state">
                <i class="fa-solid fa-box-open"></i>
                <h3>${titulo}</h3>
                <p>${detalle}</p>
            </div>`;
        renderPagination();
        return;
    }

    const start = (currentPage - 1) * PAGE_SIZE;
    const pageItems = filtered.slice(start, start + PAGE_SIZE);

    pageItems.forEach(p => {
        const stockClass = p.stock > 0 ? 'badge-stock' : 'badge-agotado';
        const stockText = p.stock > 0 ? '● Stock' : '● Agotado';
        const cardClass = p.stock > 0 ? '' : 'card-agotado';

        let stockLevelClass = 'level-ok';
        let stockLabel = `${p.stock} en stock`;
        if (p.stock <= 0) {
            stockLevelClass = 'level-out';
            stockLabel = 'Sin existencias';
        } else if (p.stock <= 5) {
            stockLevelClass = 'level-low';
            stockLabel = `${p.stock} en stock · bajo`;
        }

        const imagenHtml = p.imagen
            ? `<img src="${p.imagen}" alt="${escapeHtml(p.nombre)}" class="product-photo">`
            : '<i class="fa-solid fa-image placeholder-icon"></i>';

        const card = document.createElement('article');
        card.className = `product-card ${cardClass}`.trim();
        card.innerHTML = `
            <div class="product-image">
                <span class="badge ${stockClass}">${stockText}</span>
                ${imagenHtml}
            </div>
            <div class="product-body">
                <h4 class="product-name">${escapeHtml(p.nombre)}</h4>
                <p class="product-price">$${formatPrice(p.precio)}</p>
                <p class="product-sku">SKU: ${escapeHtml(p.sku)}</p>
                <p class="product-stock ${stockLevelClass}">
                    <i class="fa-solid fa-cubes-stacked"></i>
                    <span>${stockLabel}</span>
                </p>
                ${p.stock <= 0 ? '<button type="button" class="btn-notify" disabled><i class="fa-regular fa-bell"></i> Avisar Stock</button>' : ''}
                <button type="button" class="btn-edit" data-id="${p.id}" title="Editar producto">
                    <i class="fa-solid fa-pen"></i> Editar
                </button>
            </div>
        `;
        grid.appendChild(card);
    });

    grid.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', () => openEditModal(btn.dataset.id));
    });

    renderPagination();
}

function renderPagination() {
    const container = document.getElementById('pagination');
    container.innerHTML = '';

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (currentPage > totalPages) currentPage = totalPages;

    const mkBtn = (label, page, opts = {}) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = label;
        if (opts.active) btn.classList.add('active');
        if (opts.disabled) btn.disabled = true;
        btn.addEventListener('click', () => {
            currentPage = page;
            renderProducts();
        });
        return btn;
    };

    container.appendChild(mkBtn('‹', Math.max(1, currentPage - 1), { disabled: currentPage === 1 }));
    for (let i = 1; i <= totalPages; i++) {
        container.appendChild(mkBtn(String(i), i, { active: i === currentPage }));
    }
    container.appendChild(mkBtn('›', Math.min(totalPages, currentPage + 1), { disabled: currentPage === totalPages }));
}

// ────────────────────────────────────────────────────────────────────────────
// Filtros
// ────────────────────────────────────────────────────────────────────────────
function applyFilters() {
    const nombre = document.getElementById('searchNombre').value.trim().toLowerCase();
    const sku = document.getElementById('filterSku').value.trim().toLowerCase();
    const categoria = document.getElementById('filterCategoria')?.value || '';
    const min = parseFloat(document.getElementById('filterPrecioMin').value);
    const max = parseFloat(document.getElementById('filterPrecioMax').value);
    const stockOk = document.getElementById('filterStock').checked;
    const agotadoOk = document.getElementById('filterAgotado').checked;
    const sort = document.getElementById('sortBy').value;

    filtered = allProducts.filter(p => {
        if (nombre && !p.nombre.toLowerCase().includes(nombre)) return false;
        if (sku && !(p.sku || '').toLowerCase().includes(sku)) return false;
        if (categoria && p.categoria !== categoria) return false;
        if (!Number.isNaN(min) && p.precio < min) return false;
        if (!Number.isNaN(max) && p.precio > max) return false;

        const enStock = p.stock > 0;
        if (stockOk && !agotadoOk && !enStock) return false;
        if (!stockOk && agotadoOk && enStock) return false;
        if (!stockOk && !agotadoOk) return false; // ningún checkbox = nada
        return true;
    });

    filtered.sort((a, b) => {
        const av = a[sort];
        const bv = b[sort];
        if (typeof av === 'number') return av - bv;
        return String(av).localeCompare(String(bv), 'es');
    });

    currentPage = 1;
    renderProducts();
}

function clearFilters() {
    document.getElementById('searchNombre').value = '';
    document.getElementById('filterSku').value = '';
    const catSel = document.getElementById('filterCategoria');
    if (catSel) catSel.value = '';
    document.getElementById('filterPrecioMin').value = '';
    document.getElementById('filterPrecioMax').value = '';
    document.getElementById('filterStock').checked = true;
    document.getElementById('filterAgotado').checked = false;
    document.getElementById('sortBy').value = 'nombre';
    applyFilters();
}

// ────────────────────────────────────────────────────────────────────────────
// Edición
// ────────────────────────────────────────────────────────────────────────────
// Estado de la imagen en edición:
//   null   -> sin cambios (se conserva la actual)
//   ''     -> el usuario quitó la foto
//   string -> nueva imagen en base64
let editImagenState = null;

function openEditModal(id) {
    const p = allProducts.find(x => x.id === id);
    if (!p) return;

    document.getElementById('editId').value = p.id;
    document.getElementById('editNombre').value = p.nombre;
    document.getElementById('editSku').value = p.sku;
    document.getElementById('editCategoria').value = p.categoria;
    document.getElementById('editPrecio').value = p.precio;
    document.getElementById('editStock').value = p.stock;
    document.getElementById('editDescripcion').value = p.descripcion || '';

    // Reset del estado de imagen y pintar la actual (si la hay)
    editImagenState = null;
    document.getElementById('editImagenInput').value = '';
    renderEditImagePreview(p.imagen || '');

    document.getElementById('editModal').hidden = false;
}

function renderEditImagePreview(dataUrl) {
    const preview = document.getElementById('editImagePreview');
    const btnRemove = document.getElementById('editBtnRemoveImage');
    if (dataUrl) {
        preview.innerHTML = `<img src="${dataUrl}" alt="Vista previa">`;
        preview.classList.add('has-image');
        btnRemove.hidden = false;
    } else {
        preview.classList.remove('has-image');
        preview.innerHTML = `
            <i class="fa-solid fa-image"></i>
            <p>Haz clic para subir una imagen</p>
            <span class="image-hint">JPG o PNG · se ajusta automáticamente</span>`;
        btnRemove.hidden = true;
    }
}

function closeEditModal() {
    document.getElementById('editModal').hidden = true;
}

async function submitEdit(e) {
    e.preventDefault();
    const id = document.getElementById('editId').value;

    const payload = {
        nombre: document.getElementById('editNombre').value.trim(),
        sku: document.getElementById('editSku').value.trim(),
        categoria: document.getElementById('editCategoria').value,
        precio: Number(document.getElementById('editPrecio').value),
        stock: Number(document.getElementById('editStock').value),
        descripcion: document.getElementById('editDescripcion').value.trim()
    };

    // Solo enviamos imagen si el usuario la cambió o la quitó.
    // (null = sin cambios -> se conserva la actual en el servidor)
    if (editImagenState !== null) {
        payload.imagen = editImagenState;
    }

    if (!isAdmin()) {
        alert('Solo un administrador puede modificar productos.');
        return;
    }

    try {
        const res = await fetch(`/api/productos/${id}`, {
            method: 'PUT',
            headers: authHeaders(),
            body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (!data.success) {
            alert('Error: ' + data.message);
            return;
        }

        // Actualizar en memoria
        const idx = allProducts.findIndex(p => p.id === id);
        if (idx !== -1) allProducts[idx] = data.data;
        applyFilters();
        closeEditModal();
        alert('Producto actualizado.');
    } catch (err) {
        console.error(err);
        alert('Error de conexión con el servidor.');
    }
}

// ────────────────────────────────────────────────────────────────────────────
// Bootstrap
// ────────────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    // Cargar datos iniciales (renderizados desde el servidor)
    try {
        const raw = document.getElementById('initial-products')?.textContent || '[]';
        allProducts = JSON.parse(raw);
    } catch {
        allProducts = [];
    }
    filtered = [...allProducts];

    // Mostrar/ocultar acciones de admin
    const btnNuevo = document.getElementById('btnNuevoProducto');
    if (btnNuevo) {
        btnNuevo.hidden = !isAdmin();
        btnNuevo.addEventListener('click', () => {
            window.location.href = '/productos/nuevo';
        });
    }

    if (!isAdmin()) {
        // Si el usuario no es admin, ocultamos el botón de editar
        document.body.classList.add('role-user');
    }

    // Listeners de filtros
    document.getElementById('btnAplicarFiltros').addEventListener('click', applyFilters);
    document.getElementById('btnLimpiarFiltros').addEventListener('click', clearFilters);
    document.getElementById('searchNombre').addEventListener('input', applyFilters);
    document.getElementById('sortBy').addEventListener('change', applyFilters);
    document.getElementById('filterCategoria')?.addEventListener('change', applyFilters);

    // Modal
    document.getElementById('modalClose').addEventListener('click', closeEditModal);
    document.getElementById('modalCancel').addEventListener('click', closeEditModal);
    document.getElementById('editForm').addEventListener('submit', submitEdit);
    document.getElementById('editModal').addEventListener('click', (e) => {
        if (e.target.id === 'editModal') closeEditModal();
    });

    // Imagen dentro del modal de edición
    const editPreview = document.getElementById('editImagePreview');
    const editImagenInput = document.getElementById('editImagenInput');
    const editBtnRemove = document.getElementById('editBtnRemoveImage');

    editPreview?.addEventListener('click', () => editImagenInput.click());

    editImagenInput?.addEventListener('change', async () => {
        const file = editImagenInput.files?.[0];
        if (!file) return;
        try {
            const dataUrl = await window.fileToResizedDataURL(file);
            editImagenState = dataUrl;       // nueva imagen
            renderEditImagePreview(dataUrl);
        } catch (err) {
            alert(err.message || 'No se pudo procesar la imagen.');
        }
    });

    editBtnRemove?.addEventListener('click', () => {
        editImagenState = '';                // marcar como quitada
        editImagenInput.value = '';
        renderEditImagePreview('');
    });

    applyFilters();
});
