console.log("🟢 app.js cargado correctamente en el navegador.");

document.addEventListener("DOMContentLoaded", () => {
    console.log("🟢 El DOM está listo. Buscando elementos...");

    const togglePassword = document.querySelector("#togglePassword");
    const passwordInput = document.querySelector("#password");

    if (togglePassword && passwordInput) {
        togglePassword.addEventListener("click", function () {
            const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
            passwordInput.setAttribute("type", type);
            this.classList.toggle("fa-eye");
            this.classList.toggle("fa-eye-slash");
        });
    } else {
        console.warn("⚠️ No se encontró el botón del ojito o el input de contraseña.");
    }

    
    const loginForm = document.querySelector("#loginForm");

    if (loginForm) {
        console.log("🟢 Formulario 'loginForm' encontrado. Escuchando clics en Entrar...");
        
        loginForm.addEventListener("submit", async function(event) {
            event.preventDefault(); 
            
            console.log("⏳ Se presionó 'Entrar'. Enviando datos al servidor...");

            const email = document.querySelector("#email").value;
            const password = document.querySelector("#password").value;

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ email, password })
                });

                console.log("📡 Respuesta recibida del servidor con status:", response.status);

                const data = await response.json();

                if (data.success) {
                    console.log("✅ Inicio de sesión exitoso. Redirigiendo a Dashboard...");
                    window.location.replace('/dashboard'); 
                } else {
                    console.log("❌ Datos incorrectos:", data.message);
                    alert("Credenciales incorrectas: " + data.message);
                }
            } catch (error) {
                console.error("🚨 Error grave al intentar conectar:", error);
                alert("Error de conexión con el servidor. Revisa la consola.");
            }
        });
    } else {
        console.error("🚨 CRÍTICO: No se encontró el elemento con id='loginForm'. El botón Entrar no funcionará.");
    }
});