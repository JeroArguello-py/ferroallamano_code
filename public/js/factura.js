console.log("factura.js cargado.");

document.addEventListener('DOMContentLoaded', () => {
    const area = document.querySelector('.dashboard-area[data-factura-id]');
    if (!area) return;
    const facturaId = area.dataset.facturaId;

    const btnEmitir = document.getElementById('btnEmitir');
    const btnEmitirText = document.getElementById('btnEmitirText');
    const btnPdf = document.getElementById('btnDescargarPdf');
    const badgeFactura = document.getElementById('badgeFactura');

    // ── Emitir factura ──────────────────────────────────────────────────────
    if (btnEmitir && !btnEmitir.disabled) {
        btnEmitir.addEventListener('click', async () => {
            if (!confirm('¿Emitir esta factura? Una vez emitida no podrá editarse.')) return;

            btnEmitir.disabled = true;
            const original = btnEmitirText.textContent;
            btnEmitirText.textContent = 'Emitiendo...';

            try {
                const res = await fetch(`/api/facturas/${facturaId}/emitir`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });
                const data = await res.json();

                if (!data.success) {
                    alert('Error: ' + (data.message || 'No se pudo emitir la factura.'));
                    btnEmitir.disabled = false;
                    btnEmitirText.textContent = original;
                    return;
                }

                // Actualizar UI a estado "Emitida"
                btnEmitirText.textContent = 'Factura Emitida';
                btnEmitir.disabled = true;
                if (badgeFactura) {
                    badgeFactura.className = 'badge badge-green';
                    badgeFactura.innerHTML = '<i class="fa-solid fa-circle-check"></i> Emitida';
                }
                alert('Factura emitida correctamente: ' + (data.data?.codigoFactura || ''));
            } catch (err) {
                console.error(err);
                alert('Error de conexión con el servidor.');
                btnEmitir.disabled = false;
                btnEmitirText.textContent = original;
            }
        });
    }

    // ── Descargar PDF (placeholder visual por ahora) ──────────────────────────
    if (btnPdf) {
        btnPdf.addEventListener('click', () => {
            alert('La descarga en PDF estará disponible próximamente.');
        });
    }
});
