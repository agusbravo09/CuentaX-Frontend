// utils.js - Funciones globales básicas
console.log('Utils cargado');

function isUserAuthenticated() {
    const token = getLocalStorage('authToken');
    const userEmail = getLocalStorage('userEmail');
    return !!(token && userEmail);
}

// Almacenamiento localStorage
function setLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
        console.log('Guardado en localStorage:', key);
    } catch (error) {
        console.error('Error al guardar en localStorage:', error);
    }
}

function getLocalStorage(key) {
    try {
        const item = localStorage.getItem(key);
        return item ? JSON.parse(item) : null;
    } catch (error) {
        console.error('Error al obtener de localStorage:', error);
        return null;
    }
}

function removeLocalStorage(key) {
    try {
        localStorage.removeItem(key);
        console.log('Eliminado de localStorage:', key);
    } catch (error) {
        console.error('Error al eliminar de localStorage:', error);
    }
}

// Formateo
function formatCurrency(amount) {
    const num = parseFloat(amount) || 0;
    return '$' + num.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,');
}

function formatDate(dateString) {
    try {
        const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
        return new Date(dateString).toLocaleDateString('es-ES', options);
    } catch (error) {
        return 'Fecha inválida';
    }
}

// Validaciones
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Redirecciones
function redirectToDashboard() {
    window.location.href = 'dashboard.html';
}

function redirectToLogin() {
    window.location.href = 'index.html';
}

// Notificaciones básicas
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

function checkPasswordStrength(password) {
    let strength = 0;
    let feedback = '';
    
    // Si la contraseña está vacía
    if (password.length === 0) {
        return { strength: 0, feedback: 'Seguridad de la contraseña' };
    }
    
    // Verificar longitud
    if (password.length >= 8) strength += 25;
    
    // Verificar si tiene letras minúsculas y mayúsculas
    if (password.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)) strength += 25;
    
    // Verificar si tiene números
    if (password.match(/([0-9])/)) strength += 25;
    
    // Verificar si tiene caracteres especiales
    if (password.match(/([!,@,#,$,%,^,&,*,?,_,~])/)) strength += 25;
    
    // Determinar retroalimentación
    if (strength < 50) {
        feedback = 'Débil';
    } else if (strength < 75) {
        feedback = 'Moderada';
    } else {
        feedback = 'Fuerte';
    }
    
    return { strength, feedback };
}