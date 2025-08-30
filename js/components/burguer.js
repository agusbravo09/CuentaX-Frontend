// Funcionalidad del menú hamburguesa
document.addEventListener('DOMContentLoaded', () => {
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const logoutBtn = document.getElementById('logout-btn');
    
    if (!hamburgerMenu || !dropdownMenu) {
        console.error('Elementos del menú hamburguesa no encontrados');
        return;
    }
    
    const toggleMenu = (e) => {
        e.stopPropagation();
        const isOpen = dropdownMenu.classList.toggle('show');
        const icon = hamburgerMenu.querySelector('i');
        icon.classList.toggle('fa-bars', !isOpen);
        icon.classList.toggle('fa-times', isOpen);
    };
    
    const closeMenu = (e) => {
        if (dropdownMenu.classList.contains('show') && 
            !hamburgerMenu.contains(e.target) && 
            !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('show');
            const icon = hamburgerMenu.querySelector('i');
            icon.classList.remove('fa-times');
            icon.classList.add('fa-bars');
        }
    };
    
    hamburgerMenu.addEventListener('click', toggleMenu);
    document.addEventListener('click', closeMenu);
    dropdownMenu.addEventListener('click', e => e.stopPropagation());
    
    if (logoutBtn) {
        logoutBtn.addEventListener('click', () => {
            console.log('Cerrando sesión...');
            ['authToken', 'userEmail', 'currentUser'].forEach(key => localStorage.removeItem(key));
            window.location.href = 'index.html';
        });
    }
});