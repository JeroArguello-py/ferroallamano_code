console.log("newProduct.js cargado.");

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

    // ── Imagen ────────────────────────────────────────────────────────────────
    const imageUpload = document.getElementById('imageUpload');
    const imagenInput = document.getElementById('imagenInput');
    const imagePreview = document.getElementById('imagePreview');
    const btnRemoveImage = document.getElementById('btnRemoveImage');
    let imagenBase64 = '';

    function showPreview(dataUrl) {
        imagePreview.innerHTML = `<img src="${dataUrl}" alt="Vista previa">`;
        imagePreview.classList.add('has-image');
        btnRemoveImage.hidden = false;
    }

    function resetPreview() {
        imagenBase64 = '';
        imagenInput.value = '';
        imagePreview.classList.remove('has-image');
        imagePreview.innerHTML = `
            <i class="fa-solid fa-image"></i>
            <p>Haz clic para subir una imagen</p>
            <span class="image-hint">JPG o PNG · se ajusta automáticamente</span>`;
        btnRemoveImage.hidden = true;
    }

    imagePreview?.addEventListener('click', () => imagenInput.click());

    imagenInput?.addEventListener('change', async () => {
        const file = imagenInput.files?.[0];
        if (!file) return;
        try {
            imagenBase64 = await window.fileToResizedDataURL(file);
            showPreview(imagenBase64);
        } catch (err) {
            alert(err.message || 'No se pudo procesar la imagen.');
            resetPreview();
        }
    });

    btnRemoveImage?.addEventListener('click', resetPreview);

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
            descripcion: form.descripcion.value.trim(),
            imagen: imagenBase64 || ''
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
