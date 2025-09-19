document.addEventListener('DOMContentLoaded', () => {
    
    if (getLocalStorage('authToken')) {
        redirectToDashboard();
        return;
    }
    
    setupPasswordStrengthMeter();
    setupEventListeners();
});

function setupEventListeners() {
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const toggleButtons = document.querySelectorAll('.toggle-password');
    const signupLink = document.getElementById('signupLink');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    const closeButtons = document.querySelectorAll('.close-modal');
    
    if (loginForm) loginForm.addEventListener('submit', handleLogin);
    if (signupForm) signupForm.addEventListener('submit', handleRegister);
    
    toggleButtons.forEach(button => {
        button.addEventListener('click', function() {
            const input = this.parentElement.querySelector('input');
            const icon = this.querySelector('i');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.classList.replace('fa-eye', 'fa-eye-slash');
            } else {
                input.type = 'password';
                icon.classList.replace('fa-eye-slash', 'fa-eye');
            }
        });
    });
    
    if (signupLink) {
        signupLink.addEventListener('click', e => {
            e.preventDefault();
            openModal('signupModal');
        });
    }
    
    if (forgotPasswordLink) {
        forgotPasswordLink.addEventListener('click', e => {
            e.preventDefault();
            openModal('forgotPasswordModal');
        });
    }
    
    closeButtons.forEach(button => {
        button.addEventListener('click', function() {
            closeModal(this.closest('.modal').id);
        });
    });
}

async function handleLogin(e) {
    e.preventDefault();
    
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    
    if (!email || !password) {
        showNotification('Por favor, completa todos los campos', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Por favor, ingresa un email válido', 'error');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
    submitBtn.disabled = true;
    
    const result = await login(email, password);
    
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    
    if (result.success) {
        setLocalStorage('authToken', result.authToken);
        setLocalStorage('userEmail', email);
        setLocalStorage('currentUser', result.data);
        
        showNotification('¡Login exitoso! Redirigiendo...', 'success');
        
        setTimeout(redirectToDashboard, 1000);
    } else {
        showNotification(result.error, 'error');
    }
}

async function handleRegister(e) {
    e.preventDefault();
    
    const name = document.getElementById('signupName').value.trim();
    const email = document.getElementById('signupEmail').value.trim();
    const password = document.getElementById('signupPassword').value;
    const confirmPassword = document.getElementById('signupConfirmPassword').value;
    
    if (!name || !email || !password || !confirmPassword) {
        showNotification('Por favor, completa todos los campos', 'error');
        return;
    }
    
    if (!isValidEmail(email)) {
        showNotification('Por favor, ingresa un email válido', 'error');
        return;
    }
    
    if (password.length < 6) {
        showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Las contraseñas no coinciden', 'error');
        return;
    }
    
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando cuenta...';
    submitBtn.disabled = true;
    
    const userData = { name, email, password };
    const result = await register(userData);
    
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;
    
    if (result.success) {
        showNotification('Cuenta creada exitosamente. Ahora puedes iniciar sesión.', 'success');
        closeModal('signupModal');
        e.target.reset();
    } else {
        showNotification(result.error, 'error');
    }
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        setTimeout(() => modal.classList.add('show'), 10);
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        modal.classList.add('hide');
        setTimeout(() => {
            modal.style.display = 'none';
            modal.classList.remove('hide');
        }, 300);
    }
}

function updatePasswordStrength() {
    const password = document.getElementById('signupPassword').value;
    const { strength, feedback } = checkPasswordStrength(password);
    
    const strengthBar = document.getElementById('passwordStrength');
    const strengthText = document.getElementById('passwordStrengthText');
    
    if (strengthBar && strengthText) {
        strengthBar.style.width = strength + '%';
        
        if (strength < 50) strengthBar.style.backgroundColor = '#EF4444';
        else if (strength < 75) strengthBar.style.backgroundColor = '#F59E0B';
        else strengthBar.style.backgroundColor = '#10B981';
        
        strengthText.textContent = feedback;
    }
}

function setupPasswordStrengthMeter() {
    const passwordInput = document.getElementById('signupPassword');
    if (passwordInput) passwordInput.addEventListener('input', updatePasswordStrength);
}