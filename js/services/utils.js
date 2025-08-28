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
    if (!dateString) return 'Fecha no disponible';
    
    try {
        // Intentar parsear la fecha directamente
        const date = new Date(dateString);
        
        // Verificar si la fecha es válida
        if (isNaN(date.getTime())) {
            console.error('Fecha inválida:', dateString);
            return 'Fecha inválida';
        }
        
        // Formatear a dd/mm/aaaa
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        
        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error('Error formateando fecha:', error, dateString);
        return 'Fecha inválida';
    }
}

function formatDateForPostgres(dateString) {
    if (!dateString) return new Date().toISOString().split('T')[0];
    
    // Si ya está en formato YYYY-MM-DD, devolver tal cual
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        return dateString;
    }
    
    // Convertir de formato DD/MM/YYYY a YYYY-MM-DD
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        const parts = dateString.split('/');
        return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
    
    // Convertir de formato MM/DD/YYYY a YYYY-MM-DD
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
        const parts = dateString.split('/');
        const year = parts[2];
        const month = parts[0].padStart(2, '0');
        const day = parts[1].padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    // Para otros formatos, usar el objeto Date
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        // Si no es una fecha válida, usar la fecha actual
        return new Date().toISOString().split('T')[0];
    }
    
    // Formatear a YYYY-MM-DD
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

function formatDateAccounts(dateString) {
    return formatDate(dateString); // Usar la misma función
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