console.log("🟢 newProduct.js cargado.");

function getCurrentUser() {
    try { return JSON.parse(localStorage.getItem('ferro_user')) || null; }
    catch { return null; }
}

function isAdmin() {
    const u = getCurrentUser();
    return u && u.role === 'admin';
}

document.addEventListener('DOMContentLoaded', () => {
    // Guard del lado cliente: solo admins pueden ver / enviar este formulario.
    if (!isAdmin()) {
        alert('Solo un administrador puede registrar productos.');
        window.location.href = '/dashboard';
        return;
    }

    const form = document.getElementById('newProductForm');
    const btnGuardar = document.getElementById('btnGuardar');
    const btnCancelar = document.getElementById('btnCancelar');

    btnCancelar?.addEventListener('click', () => {
        window.location.href = '/productos';
    });

    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const payload = {
            nombre: form.nombre.value.trim(),
            sku: form.sku.value.trim(),
            categoria: form.categoria.value,
            precio: Number(form.precio.value),
            stock: Number(form.stock.value),
            descripcion: form.descripcion.value.trim()
        };

        if (!payload.nombre || !payload.sku || !payload.categoria) {
            alert('Por favor completa los campos obligatorios.');
            return;
        }

        btnGuardar.classList.add('loading');
        const labelSpan = btnGuardar.querySelector('span');
        const original = labelSpan ? labelSpan.textContent : 'Guardar Producto';
        if (labelSpan) labelSpan.textContent = 'Guardando...';

        try {
            const user = getCurrentUser();
            const res = await fetch('/api/productos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-role': user?.role || ''
                },
                body: JSON.stringify(payload)
            });

            const data = await res.json();

            if (data.success) {
                alert('Producto registrado exitosamente.');
                form.reset();
                window.location.href = '/productos';
            } else {
                alert('Error: ' + (data.message || 'No se pudo registrar el producto.'));
            }
        } catch (err) {
            console.error(err);
            alert('Error de conexión con el servidor.');
        } finally {
            btnGuardar.classList.remove('loading');
            if (labelSpan) labelSpan.textContent = original;
        }
    });
});
