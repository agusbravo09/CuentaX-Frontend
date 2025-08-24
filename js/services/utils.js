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
 * Muestra un mensaje de notificación
 * @param {string} message - Mensaje a mostrar
 * @param {string} type - Tipo de notificación (success, error, warning, info)
 */
function showNotification(message, type = 'info') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${type === 'success' ? 'fa-check-circle' : 
                          type === 'error' ? 'fa-exclamation-circle' : 
                          type === 'warning' ? 'fa-exclamation-triangle' : 
                          'fa-info-circle'}"></i>
            <span>${message}</span>
        </div>
    `;

    // Agregar al documento
    document.body.appendChild(notification);

    // Mostrar con animación
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);

    // Ocultar y eliminar después de 3 segundos
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

/**
 * Valida si un email tiene formato válido
 * @param {string} email - Email a validar
 * @returns {boolean} True si el email es válido
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Redirige al dashboard
 */
function redirectToDashboard() {
    window.location.href = 'dashboard.html';
}

/**
 * Muestra un modal de confirmación
 * @param {string} title - Título del modal
 * @param {string} message - Mensaje del modal
 */
function showConfirmation(title, message) {
    document.getElementById('confirmationTitle').textContent = title;
    document.getElementById('confirmationMessage').textContent = message;
    openModal('confirmationModal');
}

/**
 * Formatea una cantidad como moneda
 * @param {number} amount - Cantidad a formatear
 * @returns {string} Cantidad formateada como moneda
 */
function formatCurrency(amount) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'USD'
    }).format(amount);
}

/**
 * Formatea una fecha en formato corto
 * @param {string} dateString - Fecha a formatear
 * @returns {string} Fecha formateada
 */
function formatDate(dateString) {
    const options = { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric' 
    };
    return new Date(dateString).toLocaleDateString('es-ES', options);
}