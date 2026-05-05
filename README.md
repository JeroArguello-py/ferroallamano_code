# ProyectoArquitecturaSoftware
Desarrollo de prototipo
# 🛠️ Ferroallamano - Sistema de Gestión Web

![Arquitectura](https://img.shields.io/badge/Arquitectura-Monol%C3%ADtica-blue)
![Stack](https://img.shields.io/badge/Stack-Node.js%20%7C%20Express%20%7C%20EJS-success)
![Patrón](https://img.shields.io/badge/Patr%C3%B3n-MVC%20%7C%20Singleton-orange)

Aplicación web desarrollada para la gestión interna, control de inventario y módulo de ventas de la ferretería **Ferroallamano**. Este proyecto busca digitalizar y optimizar los procesos ventas del negocio, mejorando la eficiencia y la atención al cliente.

## 🚀 Tecnologías Utilizadas

* **Backend:** Node.js, Express.js
* **Frontend:** HTML5, CSS3, Vanilla JavaScript, EJS (Embedded JavaScript templates)
* **Arquitectura:** Monolítica basada en el patrón MVC (Modelo-Vista-Controlador)
* **Principios aplicados:** SOLID (énfasis en SRP - Responsabilidad Única)

## 📁 Estructura del Proyecto

El proyecto está rigurosamente organizado en capas para separar la lógica de negocio, las rutas y la interfaz de usuario:

```text
📦 app_2.0
 ┣ 📂 public             # Archivos estáticos públicos (Frontend)
 ┃ ┣ 📂 css              # Estilos visuales (style.css)
 ┃ ┗ 📂 js               # Lógica del navegador (app.js)
 ┣ 📂 src                # Código fuente del Servidor (Backend)
 ┃ ┣ 📂 controllers      # Controladores (Intermediarios HTTP)
 ┃ ┣ 📂 models           # Definición de estructuras de datos
 ┃ ┣ 📂 repositories     # Acceso a datos (Implementa Singleton)
 ┃ ┣ 📂 routes           # Definición de endpoints de la API
 ┃ ┣ 📂 services         # Reglas de negocio puras
 ┃ ┣ 📂 views            # Plantillas EJS (Vistas renderizadas)
 ┃ ┗ 📜 app.js           # Archivo principal de configuración del servidor
 ┣ 📜 package.json       # Dependencias del proyecto
 ┗ 📜 README.md          # Documentación
Jeronimo Arguello Quintero
Daniel Alejandro Moreno Bravo
