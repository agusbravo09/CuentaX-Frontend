// js/services/utils.js
// Funciones de utilidad generales

/**
 * Almacena un elemento en localStorage
 * @param {string} key - Clave para almacenar el valor
 * @param {*} value - Valor a almacenar
 */
function setLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
        console.error('Error al guardar en localStorage:', error);
    }
}

/**
 * Obtiene un elemento de localStorage
 * @param {string} key - Clave del valor a obtener
 * @returns {*} Valor almacenado o null si no existe
 */
function getLocalStorage(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error('Error al obtener de localStorage:', error);
        return null;
    }
}

/**
 * Elimina un elemento de localStorage
 * @param {string} key - Clave del valor a eliminar
 */
function removeLocalStorage(key) {
    try {
        localStorage.removeItem(key);
    } catch (error) {
        console.error('Error al eliminar de localStorage:', error);
    }
}

/**
 * Formatea una cantidad como moneda
 * @param {number} amount - Cantidad a formatear
 * @param {string} currency - Código de moneda (por defecto 'USD')
 * @returns {string} Cantidad formateada como moneda
 */
function formatCurrency(amount, currency = 'USD') {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: currency
    }).format(amount);
}

/**
 * Formatea una fecha
 * @param {string|Date} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
function formatDate(date) {
    const options = { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    return new Date(date).toLocaleDateString('es-ES', options);
}

/**
 * Muestra un mensaje de notificación (será reemplazado por el componente de notificación)
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
    // Esta es una implementación temporal
    // Será reemplazada cuando se implemente el componente de notificación
    alert(`${type.toUpperCase()}: ${message}`);
}