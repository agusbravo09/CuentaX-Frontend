function isUserAuthenticated() {
    return !!(getLocalStorage('authToken') && getLocalStorage('userEmail'));
}

// Almacenamiento localStorage
function setLocalStorage(key, value) {
    try {
        localStorage.setItem(key, JSON.stringify(value));
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
        const date = new Date(dateString);
        if (isNaN(date.getTime())) {
            console.error('Fecha inválida:', dateString);
            return 'Fecha inválida';
        }
        
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
    
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) return dateString;
    
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(dateString)) {
        const [day, month, year] = dateString.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(dateString)) {
        const [month, day, year] = dateString.split('/');
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return new Date().toISOString().split('T')[0];
    
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}-${month}-${day}`;
}

function formatDateAccounts(dateString) {
    return formatDate(dateString);
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
    const iconMap = {
        'success': 'fa-check-circle',
        'error': 'fa-exclamation-circle', 
        'warning': 'fa-exclamation-triangle',
        'info': 'fa-info-circle'
    };
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas ${iconMap[type]}"></i>
            <span>${message}</span>
        </div>
    `;

    document.body.appendChild(notification);

    setTimeout(() => notification.classList.add('show'), 100);

    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => notification.parentNode?.removeChild(notification), 300);
    }, 3000);
}

function checkPasswordStrength(password) {
    if (password.length === 0) return { strength: 0, feedback: 'Seguridad de la contraseña' };
    
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (password.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)) strength += 25;
    if (password.match(/([0-9])/)) strength += 25;
    if (password.match(/([!,@,#,$,%,^,&,*,?,_,~])/)) strength += 25;
    
    const feedback = strength < 50 ? 'Débil' : strength < 75 ? 'Moderada' : 'Fuerte';
    
    return { strength, feedback };
}