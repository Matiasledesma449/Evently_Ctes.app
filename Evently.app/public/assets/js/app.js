// public/assets/js/app.js
// Leer parámetros de la URL
function getParam(param) {
    const params = new URLSearchParams(window.location.search);
    return params.get(param);
}

// Redirigir a otra página (relativa a la raíz del proyecto)
function redirectTo(path) {
    window.location.href = path;
}

// Generar un ID de compra aleatorio (simulación)
function generarIdCompra() {
    return 'CMP-' + Math.random().toString(36).substring(2, 8).toUpperCase();
}

// Calcular total basado en cantidad y precio unitario
function calcularTotal(cantidad, precioUnitario) {
    return cantidad * precioUnitario;
}