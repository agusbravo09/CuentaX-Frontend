// Funcionalidad del menú hamburguesa
document.addEventListener('DOMContentLoaded', function() {
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const logoutBtn = document.getElementById('logout-btn');
    
    // Verificar que los elementos existan
    if (!hamburgerMenu || !dropdownMenu) {
        console.error('Elementos del menú hamburguesa no encontrados');
        return;
    }
    
    // Alternar menú desplegable
    hamburgerMenu.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
        
        // Cambiar icono cuando el menú está abierto
        const icon = hamburgerMenu.querySelector('i');
        if (dropdownMenu.classList.contains('show')) {
            icon.classList.remove('fa-bars');
            icon.classList.add('fa-times');
        } else {
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
    
    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (dropdownMenu.classList.contains('show') && 
            !hamburgerMenu.contains(e.target) && 
            !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('show');
            
            // Restaurar icono de hamburguesa
            const icon = hamburgerMenu.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    });
    
    // Prevenir que el clic en el menú lo cierre
    dropdownMenu.addEventListener('click', function(e) {
        e.stopPropagation();
    });
    
    // Funcionalidad de cerrar sesión
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function() {
            // Aquí iría la lógica para cerrar sesión
            console.log('Cerrando sesión...');
            
            // Limpiar localStorage
            localStorage.removeItem('authToken');
            localStorage.removeItem('userEmail');
            localStorage.removeItem('currentUser');
            
            // Redirigir al login
            window.location.href = 'index.html';
        });
    }
});