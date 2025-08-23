// js/pages/login.js
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
    
    // Función para abrir modales
    function openModal(modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden'; // Previene el scroll del body
    }
    
    // Función para cerrar modales
    function closeModal(modal) {
        modal.classList.remove('show');
        document.body.style.overflow = ''; // Restaura el scroll del body
    }
    
    // Función para mostrar mensaje de confirmación
    function showConfirmation(title, message) {
        document.getElementById('confirmationTitle').textContent = title;
        document.getElementById('confirmationMessage').textContent = message;
        openModal(confirmationModal);
    }
    
    // Función para validar email
    function isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
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
            passwordStrengthText.text.textContent = 'Moderada';
        } else {
            passwordStrength.style.backgroundColor = '#10B981';
            passwordStrengthText.textContent = 'Fuerte';
        }
    }
    
    // Event listeners para abrir modales
    signupLink.addEventListener('click', function(e) {
        e.preventDefault();
        openModal(signupModal);
    });
    
    forgotPasswordLink.addEventListener('click', function(e) {
        e.preventDefault();
        openModal(forgotPasswordModal);
    });
    
    // Event listeners para cerrar modales
    closeModalButtons.forEach(button => {
        button.addEventListener('click', function() {
            const modal = this.closest('.modal');
            closeModal(modal);
        });
    });
    
    confirmationButton.addEventListener('click', function() {
        closeModal(confirmationModal);
    });
    
    // Cerrar modal al hacer clic fuera del contenido
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this);
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
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value.trim();
        const password = document.getElementById('password').value;
        
        // Validaciones básicas
        if (!email) {
            showConfirmation('Error', 'Por favor, ingresa tu correo electrónico.');
            return;
        }
        
        if (!isValidEmail(email)) {
            showConfirmation('Error', 'Por favor, ingresa un correo electrónico válido.');
            return;
        }
        
        if (!password) {
            showConfirmation('Error', 'Por favor, ingresa tu contraseña.');
            return;
        }
        
        // Aquí iría la llamada a la API (por implementar después)
        console.log('Iniciando sesión con:', { email, password });
        
        // Simulación de inicio de sesión exitoso
        showConfirmation('Éxito', 'Has iniciado sesión correctamente.');
        
        // Redirección simulada (reemplazar con la real después)
        setTimeout(() => {
            // window.location.href = 'dashboard.html';
            console.log('Redirigiendo al dashboard...');
        }, 2000);
    });
    
    // Validación del formulario de registro
    signupForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const name = document.getElementById('signupName').value.trim();
        const email = document.getElementById('signupEmail').value.trim();
        const password = document.getElementById('signupPassword').value;
        const confirmPassword = document.getElementById('signupConfirmPassword').value;
        
        // Validaciones
        if (!name) {
            showConfirmation('Error', 'Por favor, ingresa tu nombre completo.');
            return;
        }
        
        if (!email) {
            showConfirmation('Error', 'Por favor, ingresa tu correo electrónico.');
            return;
        }
        
        if (!isValidEmail(email)) {
            showConfirmation('Error', 'Por favor, ingresa un correo electrónico válido.');
            return;
        }
        
        if (!password) {
            showConfirmation('Error', 'Por favor, crea una contraseña.');
            return;
        }
        
        if (password.length < 8) {
            showConfirmation('Error', 'La contraseña debe tener al menos 8 caracteres.');
            return;
        }
        
        if (password !== confirmPassword) {
            showConfirmation('Error', 'Las contraseñas no coinciden.');
            return;
        }
        
        // Aquí iría la llamada a la API (por implementar después)
        console.log('Registrando usuario:', { name, email, password });
        
        // Simulación de registro exitoso
        showConfirmation('Éxito', 'Cuenta creada exitosamente. Ahora puedes iniciar sesión.');
        
        // Cerrar modal de registro después de éxito
        setTimeout(() => {
            closeModal(signupModal);
        }, 2000);
    });
    
    // Validación del formulario de recuperación de contraseña
    forgotPasswordForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const email = document.getElementById('recoveryEmail').value.trim();
        
        if (!email) {
            showConfirmation('Error', 'Por favor, ingresa tu correo electrónico.');
            return;
        }
        
        if (!isValidEmail(email)) {
            showConfirmation('Error', 'Por favor, ingresa un correo electrónico válido.');
            return;
        }
        
        // Aquí iría la llamada a la API (por implementar después)
        console.log('Solicitando recuperación para:', email);
        
        // Simulación de envío exitoso
        showConfirmation('Éxito', 'Se ha enviado un enlace de recuperación a tu correo electrónico.');
        
        // Cerrar modal de recuperación después de éxito
        setTimeout(() => {
            closeModal(forgotPasswordModal);
        }, 2000);
    });
});