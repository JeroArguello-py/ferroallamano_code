// ─────────────────────────────────────────────────────────────────────────────
// Utilidad de imagen: redimensiona en el navegador y devuelve un data URL base64.
// Esto mantiene las imágenes pequeñas para guardarlas en MongoDB sin sobrecargar.
// ─────────────────────────────────────────────────────────────────────────────
(function () {
    const MAX_DIM = 600;      // lado más largo, en píxeles
    const QUALITY = 0.8;      // calidad JPEG (0..1)
    const MAX_INPUT_MB = 8;   // tamaño máximo del archivo original

    /**
     * Convierte un File de imagen en un data URL JPEG redimensionado.
     * @param {File} file
     * @returns {Promise<string>} data URL (data:image/jpeg;base64,...)
     */
    window.fileToResizedDataURL = function (file) {
        return new Promise((resolve, reject) => {
            if (!file) return reject(new Error('No se recibió ningún archivo.'));
            if (!file.type.startsWith('image/')) {
                return reject(new Error('El archivo debe ser una imagen.'));
            }
            if (file.size > MAX_INPUT_MB * 1024 * 1024) {
                return reject(new Error(`La imagen supera los ${MAX_INPUT_MB}MB.`));
            }

            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    let { width, height } = img;
                    if (width > height && width > MAX_DIM) {
                        height = Math.round((height * MAX_DIM) / width);
                        width = MAX_DIM;
                    } else if (height >= width && height > MAX_DIM) {
                        width = Math.round((width * MAX_DIM) / height);
                        height = MAX_DIM;
                    }

                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    const ctx = canvas.getContext('2d');
                    // Fondo blanco por si la imagen tiene transparencia (PNG).
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);

                    try {
                        resolve(canvas.toDataURL('image/jpeg', QUALITY));
                    } catch (err) {
                        reject(err);
                    }
                };
                img.onerror = () => reject(new Error('No se pudo leer la imagen.'));
                img.src = e.target.result;
            };
            reader.onerror = () => reject(new Error('No se pudo leer el archivo.'));
            reader.readAsDataURL(file);
        });
    };
})();
