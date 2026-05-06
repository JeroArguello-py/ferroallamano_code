console.log("🟢 newClient.js cargado correctamente.");

document.addEventListener("DOMContentLoaded", () => {

    const form = document.querySelector("#newClientForm");
    const btnGuardar = document.querySelector("#btnGuardar");

    if (!form) {
        console.error("🚨 No se encontró el formulario #newClientForm.");
        return;
    }

    // ── Validación básica en tiempo real ──
    const requiredFields = form.querySelectorAll("input[required], textarea[required]");
    requiredFields.forEach(field => {
        field.addEventListener("blur", () => validateField(field));
        field.addEventListener("input", () => {
            if (field.classList.contains("is-invalid")) validateField(field);
        });
    });

    function validateField(field) {
        const errorEl = field.closest(".form-group")?.querySelector(".field-error");
        if (!field.value.trim()) {
            field.classList.add("is-invalid");
            if (errorEl) {
                errorEl.textContent = "Este campo es obligatorio.";
                errorEl.classList.add("visible");
            }
            return false;
        }
        field.classList.remove("is-invalid");
        if (errorEl) errorEl.classList.remove("visible");
        return true;
    }

    // ── Submit: aquí se conectará con el endpoint POST /api/clientes ──
    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Validar todos los campos requeridos
        let isValid = true;
        requiredFields.forEach(field => {
            if (!validateField(field)) isValid = false;
        });

        if (!isValid) return;

        const payload = {
            nombre:    form.nombre.value.trim(),
            documento: form.documento.value.trim(),
            telefono:  form.telefono.value.trim(),
            correo:    form.correo.value.trim(),
            direccion: form.direccion.value.trim(),
        };

        console.log("📦 Datos del cliente listos para enviar:", payload);

        // Estado loading
        btnGuardar.classList.add("loading");
        btnGuardar.querySelector("span").textContent = "Guardando...";

        try {
            const response = await fetch("/api/clientes", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            const data = await response.json();

            if (data.success) {
                console.log("✅ Cliente guardado exitosamente.");
                alert("Cliente registrado exitosamente.");
                form.reset();
            } else {
                console.warn("⚠️ Error al guardar:", data.message);
                alert("Error: " + data.message);
            }
        } catch (err) {
            console.error("🚨 Error de conexión:", err);
            alert("Error de conexión con el servidor.");
        } finally {
            btnGuardar.classList.remove("loading");
            btnGuardar.querySelector("span").textContent = "Guardar Cliente";
        }
    });
});
