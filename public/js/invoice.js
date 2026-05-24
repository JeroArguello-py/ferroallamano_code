console.log("🟢 invoice.js cargado.");

document.addEventListener('DOMContentLoaded', () => {
    const init = window.INVOICE_INIT || {};

    // ── Descargar PDF ───────────────────────────────────────────────────────
    // Implementación simple: usar la función nativa del navegador "Imprimir →
    // Guardar como PDF". El CSS @media print oculta sidebar, botones, etc.
    const btnPdf = document.getElementById('btnDescargarPdf');
    if (btnPdf) {
        btnPdf.addEventListener('click', () => {
            window.print();
        });
    }

    // ── Emitir Factura ──────────────────────────────────────────────────────
    const btnEmitir = document.getElementById('btnEmitir');
    if (!btnEmitir) return;

    if (init.estado === 'Emitida') {
        // Ya estaba emitida; no hace nada al hacer clic.
        btnEmitir.disabled = true;
        return;
    }

    btnEmitir.addEventListener('click', async () => {
        if (!confirm('¿Confirmas la emisión de esta factura? Una vez emitida no se podrá modificar.')) {
            return;
        }

        btnEmitir.disabled = true;
        const original = btnEmitir.innerHTML;
        btnEmitir.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Emitiendo...';

        try {
            const res = await fetch(`/api/facturas/${encodeURIComponent(init.id)}/emit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });
            const data = await res.json();

            if (!data.success) {
                alert('Error: ' + (data.message || 'No se pudo emitir la factura.'));
                btnEmitir.disabled = false;
                btnEmitir.innerHTML = original;
                return;
            }

            // Reflejar el nuevo estado en la UI
            const badge = document.getElementById('estadoFactura');
            if (badge) {
                badge.classList.remove('pill-borrador');
                badge.classList.add('pill-emitida');
                badge.innerHTML = '<i class="fa-solid fa-circle-check"></i> Emitida';
            }
            btnEmitir.innerHTML = '<i class="fa-solid fa-circle-check"></i> Factura Emitida';
            btnEmitir.classList.add('emitted');
            alert(`Factura ${init.codigo} emitida correctamente.`);
        } catch (err) {
            console.error(err);
            alert('Error de conexión con el servidor.');
            btnEmitir.disabled = false;
            btnEmitir.innerHTML = original;
        }
    });
});
