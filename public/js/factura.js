console.log("factura.js cargado.");

document.addEventListener('DOMContentLoaded', () => {
    const area = document.querySelector('.dashboard-area[data-factura-id]');
    if (!area) return;
    const facturaId = area.dataset.facturaId;
    const codigoFactura = area.dataset.codigo || 'factura';

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

    // ── Descargar PDF ─────────────────────────────────────────────────────────
    if (btnPdf) {
        btnPdf.addEventListener('click', async () => {
            const printable = document.getElementById('facturaPrintable');
            if (!printable) return;

            if (typeof window.html2pdf === 'undefined') {
                alert('No se pudo cargar el generador de PDF. Verifica tu conexión a internet e intenta de nuevo.');
                return;
            }

            const original = btnPdf.innerHTML;
            btnPdf.disabled = true;
            btnPdf.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Generando...';

            const opt = {
                margin: 8,
                filename: `Factura-${codigoFactura}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
                jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
                pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
            };

            try {
                await window.html2pdf().set(opt).from(printable).save();
            } catch (err) {
                console.error(err);
                alert('Ocurrió un error al generar el PDF.');
            } finally {
                btnPdf.disabled = false;
                btnPdf.innerHTML = original;
            }
        });
    }
});
