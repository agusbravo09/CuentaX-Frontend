document.addEventListener('DOMContentLoaded', function() {
    // Referencias a los modales
    const signupModal = document.getElementById('signupModal');
    const forgotPasswordModal = document.getElementById('forgotPasswordModal');
    const confirmationModal = document.getElementById('confirmationModal');
    
    // Referencias a los enlaces que abren modales
    const signupLink = document.getElementById('signupLink');
    const forgotPasswordLink = document.getElementById('forgotPasswordLink');
    
    // Botones de cierre de modales
    const closeModalButtons = document.querySelectorAll('.close-modal');
    const confirmationButton = document.getElementById('confirmationButton');
    
    // Formularios
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    const forgotPasswordForm = document.getElementById('forgotPasswordForm');
    
    // Botones para mostrar/ocultar contraseña
    const togglePasswordButtons = document.querySelectorAll('.toggle-password');
    
    // Elementos para la fuerza de la contraseña
    const passwordStrength = document.getElementById('passwordStrength');
    const passwordStrengthText = document.getElementById('passwordStrengthText');
    
    // Verificar si ya hay una sesión activa
    if (getLocalStorage('authToken')) {
        redirectToDashboard();
    }

    // Función para abrir modales
    function openModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.style.display = 'flex';
            setTimeout(() => {
                modal.classList.add('show');
            }, 10);
            document.body.style.overflow = 'hidden';
        }
    }
    
    // Función para cerrar modales
    function closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
            }, 300);
            document.body.style.overflow = '';
        }
    }
    
    // Función para verificar la fuerza de la contraseña
    function checkPasswordStrength(password) {
        let strength = 0;
        
        // Si la contraseña está vacía, reiniciar la barra
        if (password.length === 0) {
            passwordStrength.style.width = '0%';
            passwordStrength.style.backgroundColor = '#e2e8f0';
            passwordStrengthText.textContent = 'Seguridad de la contraseña';
            return;
        }
        
        // Verificar longitud
        if (password.length >= 8) strength += 25;
        
        // Verificar si tiene letras minúsculas y mayúsculas
        if (password.match(/([a-z].*[A-Z])|([A-Z].*[a-z])/)) strength += 25;
        
        // Verificar si tiene números
        if (password.match(/([0-9])/)) strength += 25;
        
        // Verificar si tiene caracteres especiales
        if (password.match(/([!,@,#,$,%,^,&,*,?,_,~])/)) strength += 25;
        
        // Actualizar la barra de progreso y texto
        passwordStrength.style.width = strength + '%';
        
        if (strength < 50) {
            passwordStrength.style.backgroundColor = '#EF4444';
            passwordStrengthText.textContent = 'Débil';
        } else if (strength < 75) {
            passwordStrength.style.backgroundColor = '#F59E0B';
            passwordStrengthText.textContent = 'Moderada';
        } else {
            passwordStrength.style.backgroundColor = '#10B981';
            passwordStrengthText.textContent = 'Fuerte';
        }
    }
    
    // Event listeners para abrir modales
    signupLink.addEventListener('click', function(e) {
        e.preventDefault();
        openModal('signupModal');
    });
    
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        openModal('forgotPasswordModal');
    });
    
    // Event listeners para cerrar modales
    closeModalButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal.id);
        });
    });
    
    confirmationButton.addEventListener('click', function() {
        closeModal('confirmationModal');
    });
    
    // Cerrar modal al hacer clic fuera del contenido
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });
    
    // Mostrar/ocultar contraseña
    togglePasswordButtons.forEach(button => {
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
    
    // Validar fuerza de la contraseña en tiempo real
    const signupPasswordInput = document.getElementById('signupPassword');
    if (signupPasswordInput) {
        signupPasswordInput.addEventListener('input', function() {
            checkPasswordStrength(this.value);
        });
    }
    
    // Validación del formulario de login
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        // Validaciones básicas
        if (!email) {
            showNotification('Por favor, ingresa tu correo electrónico.', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showNotification('Por favor, ingresa un correo electrónico válido.', 'error');
            return;
        }
        
        if (!password) {
            showNotification('Por favor, ingresa tu contraseña.', 'error');
            return;
        }
        
        // Mostrar estado de carga
        const submitBtn = loginForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Iniciando sesión...';
        submitBtn.disabled = true;
        
        // Intentar login con la API
        const result = await AuthAPI.login(email, password);
        
        // Restaurar botón
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        if (result.success) {
            // Almacenar datos de usuario y credenciales
            setLocalStorage('currentUser', result.data);
            
            // Codificar y almacenar credenciales para futuras requests
            const authToken = btoa(`${email}:${password}`);
            setLocalStorage('authToken', authToken);
            setLocalStorage('userEmail', email);
            
            showNotification('¡Inicio de sesión exitoso! Redirigiendo...', 'success');
            
            // Redirección al dashboard después de un breve delay
            setTimeout(() => {
                redirectToDashboard();
            }, 1500);
        } else {
            showNotification(result.error, 'error');
        }
    });
    
    // Validación del formulario de registro
    signupForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        
        // Validaciones
        if (!name) {
            showNotification('Por favor, ingresa tu nombre completo.', 'error');
            return;
        }
        
        if (!email) {
            showNotification('Por favor, ingresa tu correo electrónico.', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showNotification('Por favor, ingresa un correo electrónico válido.', 'error');
            return;
        }
        
        if (!password) {
            showNotification('Por favor, crea una contraseña.', 'error');
            return;
        }
        
        if (password.length < 6) {
            showNotification('La contraseña debe tener al menos 6 caracteres.', 'error');
            return;
        }
        
        if (password !== confirmPassword) {
            showNotification('Las contraseñas no coinciden.', 'error');
            return;
        }
        
        // Mostrar estado de carga
        const submitBtn = signupForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Creando cuenta...';
        submitBtn.disabled = true;
        
        // Intentar registro con la API
        const userData = { name, email, password };
        const result = await AuthAPI.register(userData);
        
        // Restaurar botón
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
        
        if (result.success) {
            showNotification('Cuenta creada exitosamente. Ahora puedes iniciar sesión.', 'success');
            
            // Cerrar modal de registro después de éxito
            closeModal('signupModal');
            
            // Limpiar formulario
            signupForm.reset();
            passwordStrength.style.width = '0%';
            passwordStrength.style.backgroundColor = '#e2e8f0';
            passwordStrengthText.textContent = 'Seguridad de la contraseña';
        } else {
            showNotification(result.error, 'error');
        }
    });
    
    // Validación del formulario de recuperación de contraseña
    forgotPasswordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('recoveryEmail').value.trim();
        
        if (!email) {
            showNotification('Por favor, ingresa tu correo electrónico.', 'error');
            return;
        }
        
        if (!isValidEmail(email)) {
            showNotification('Por favor, ingresa un correo electrónico válido.', 'error');
            return;
        }
        
        // Esta funcionalidad no está implementada en el backend
        showNotification('Funcionalidad de recuperación de contraseña no disponible.', 'warning');
        
        // Cerrar modal de recuperación
        closeModal('forgotPasswordModal');
    });
});