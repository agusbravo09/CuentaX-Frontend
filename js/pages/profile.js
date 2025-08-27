// profile.js - Gestión del perfil de usuario (Conectado al backend)
console.log('Profile cargado');

// Variables globales
let userData = null;
let originalData = null;
let isEditing = false;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado - Inicializando perfil');
    
    // Verificar autenticación
    if (!isUserAuthenticated()) {
        redirectToLogin();
        return;
    }
    
    // Configurar eventos
    setupEventListeners();
    
    // Cargar datos del perfil
    loadProfileData();
});

// Configurar event listeners
function setupEventListeners() {
    const profileForm = document.getElementById('profile-form');
    const cancelBtn = document.getElementById('cancel-btn');
    
    // Enviar formulario
    if (profileForm) {
        profileForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveProfile();
        });
    }
    
    // Cancelar edición
    if (cancelBtn) {
        cancelBtn.addEventListener('click', function() {
            cancelEdit();
        });
    }
    
    // Habilitar edición al hacer clic en inputs
    const inputs = document.querySelectorAll('#profile-name, #profile-email');
    inputs.forEach(input => {
        input.addEventListener('focus', function() {
            if (!isEditing) {
                enableEditing();
            }
        });
    });
    
    // Validar contraseña en tiempo real
    setupPasswordValidation();
}

// Configurar validación de contraseña
function setupPasswordValidation() {
    const newPassword = document.getElementById('new-password');
    const confirmPassword = document.getElementById('confirm-password');
    
    if (newPassword) {
        newPassword.addEventListener('input', function() {
            validatePasswordStrength(this.value);
            checkPasswordMatch();
        });
    }
    
    if (confirmPassword) {
        confirmPassword.addEventListener('input', checkPasswordMatch);
    }
    
    // Agregar toggles para mostrar/ocultar contraseña
    addPasswordToggles();
}

// Agregar toggles para mostrar/ocultar contraseña
function addPasswordToggles() {
    const passwordInputs = document.querySelectorAll('input[type="password"]');
    
    passwordInputs.forEach(input => {
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'password-toggle';
        toggle.innerHTML = '<i class="fas fa-eye"></i>';
        
        toggle.addEventListener('click', function() {
            const type = input.type === 'password' ? 'text' : 'password';
            input.type = type;
            this.innerHTML = type === 'password' ? '<i class="fas fa-eye"></i>' : '<i class="fas fa-eye-slash"></i>';
        });
        
        input.parentNode.appendChild(toggle);
    });
}

// Validar fortaleza de contraseña (6 caracteres mínimo)
function validatePasswordStrength(password) {
    const strengthMeter = document.querySelector('.strength-meter');
    const feedback = document.querySelector('.password-feedback');
    
    if (!strengthMeter || !feedback) return;
    
    let strength = 0;
    let message = '';
    
    if (password.length === 0) {
        strengthMeter.className = 'strength-meter';
        strengthMeter.style.width = '0%';
        feedback.textContent = '';
        return;
    }
    
    // Verificar longitud mínima (6 caracteres)
    if (password.length >= 6) strength++;
    
    // Verificar mayúsculas
    if (/[A-Z]/.test(password)) strength++;
    
    // Verificar números
    if (/[0-9]/.test(password)) strength++;
    
    // Verificar caracteres especiales
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    // Actualizar UI
    switch(strength) {
        case 0:
            strengthMeter.className = 'strength-meter strength-weak';
            message = 'Muy débil (mínimo 6 caracteres)';
            break;
        case 1:
            strengthMeter.className = 'strength-meter strength-weak';
            message = 'Débil';
            break;
        case 2:
            strengthMeter.className = 'strength-meter strength-medium';
            message = 'Media';
            break;
        case 3:
        case 4:
            strengthMeter.className = 'strength-meter strength-strong';
            message = 'Fuerte';
            break;
    }
    
    feedback.textContent = message;
}

// Verificar coincidencia de contraseñas
function checkPasswordMatch() {
    const newPassword = document.getElementById('new-password');
    const confirmPassword = document.getElementById('confirm-password');
    const feedback = document.getElementById('password-match-feedback');
    
    if (!newPassword || !confirmPassword) return;
    
    if (newPassword.value && confirmPassword.value) {
        if (newPassword.value === confirmPassword.value) {
            confirmPassword.style.borderColor = '#10B981';
            if (feedback) {
                feedback.textContent = 'Las contraseñas coinciden';
                feedback.className = 'password-feedback password-match';
            }
        } else {
            confirmPassword.style.borderColor = '#EF4444';
            if (feedback) {
                feedback.textContent = 'Las contraseñas no coinciden';
                feedback.className = 'password-feedback password-mismatch';
            }
        }
    } else {
        confirmPassword.style.borderColor = '#e2e8f0';
        if (feedback) feedback.textContent = '';
    }
}

// Cargar datos del perfil
async function loadProfileData() {
    try {
        showLoading(true);
        
        // Obtener usuario actual del localStorage
        userData = getLocalStorage('currentUser');
        if (!userData || !userData.id) {
            showNotification('Error al cargar datos de usuario', 'error');
            return;
        }
        
        // Cargar datos actualizados del usuario desde el backend
        const updatedUser = await userService.getUserById(userData.id);
        if (updatedUser) {
            userData = updatedUser;
            setLocalStorage('currentUser', userData);
        }
        
        // Cargar estadísticas
        await loadUserStatistics();
        
        // Mostrar datos en el formulario
        populateProfileForm();
        
        console.log('Datos de perfil cargados:', userData);
        
    } catch (error) {
        console.error('Error cargando perfil:', error);
        showNotification('Error al cargar el perfil', 'error');
    } finally {
        showLoading(false);
    }
}

// Cargar estadísticas del usuario
async function loadUserStatistics() {
    try {
        // Cargar cuentas del usuario
        const accounts = await accountService.getAccountsByUserId(userData.id) || [];
        
        // Cargar transacciones del usuario
        const transactions = await transactionService.getTransactionsByUserId(userData.id) || [];
        
        // Actualizar UI con estadísticas
        document.getElementById('total-accounts').textContent = accounts.length;
        document.getElementById('total-transactions').textContent = transactions.length;
        
        // Mostrar fecha de registro si está disponible
        if (userData.createdDate) {
            document.getElementById('register-date').textContent = formatDateAccounts(userData.createdDate);
        }
        
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
        // No mostrar error al usuario para estas estadísticas
    }
}

// Poblar formulario con datos del usuario
function populateProfileForm() {
    document.getElementById('profile-name').value = userData.name || '';
    document.getElementById('profile-email').value = userData.email || '';
    
    // Guardar datos originales para posible cancelación
    originalData = {
        name: userData.name,
        email: userData.email
    };
    
    // Deshabilitar inputs inicialmente
    const inputs = document.querySelectorAll('#profile-name, #profile-email');
    inputs.forEach(input => {
        input.setAttribute('readonly', true);
    });
}

// Habilitar modo edición
function enableEditing() {
    isEditing = true;
    
    // Mostrar botón de cancelar
    document.getElementById('cancel-btn').classList.remove('hidden');
    
    // Cambiar estilo del formulario
    document.querySelector('.profile-card').classList.add('editing');
    
    // Habilitar inputs
    const inputs = document.querySelectorAll('#profile-name, #profile-email');
    inputs.forEach(input => {
        input.removeAttribute('readonly');
    });
}

// Cancelar edición
function cancelEdit() {
    isEditing = false;
    
    // Restaurar valores originales
    if (originalData) {
        document.getElementById('profile-name').value = originalData.name;
        document.getElementById('profile-email').value = originalData.email;
    }
    
    // Limpiar campos de contraseña
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
    
    // Resetear validaciones de contraseña
    const strengthMeter = document.querySelector('.strength-meter');
    const feedback = document.querySelector('.password-feedback');
    if (strengthMeter) strengthMeter.className = 'strength-meter';
    if (feedback) feedback.textContent = '';
    
    checkPasswordMatch();
    
    // Ocultar botón de cancelar
    document.getElementById('cancel-btn').classList.add('hidden');
    
    // Restaurar estilo del formulario
    document.querySelector('.profile-card').classList.remove('editing');
    
    // Deshabilitar inputs
    const inputs = document.querySelectorAll('#profile-name, #profile-email');
    inputs.forEach(input => {
        input.setAttribute('readonly', true);
    });
}

// Guardar perfil (conectado al backend)
async function saveProfile() {
    const saveBtn = document.getElementById('save-btn');
    const name = document.getElementById('profile-name').value.trim();
    const email = document.getElementById('profile-email').value.trim();
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // Validaciones básicas
    if (!name) {
        showNotification('El nombre es requerido', 'error');
        return;
    }

    if (!email) {
        showNotification('El email es requerido', 'error');
        return;
    }

    if (!isValidEmail(email)) {
        showNotification('Ingresa un email válido', 'error');
        return;
    }

    // Validaciones de contraseña si se intenta cambiar
    const changingPassword = newPassword || confirmPassword;

    if (changingPassword) {
        if (!newPassword) {
            showNotification('Debes ingresar una nueva contraseña', 'error');
            return;
        }

        if (newPassword.length < 6) {
            showNotification('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        if (newPassword !== confirmPassword) {
            showNotification('Las contraseñas no coinciden', 'error');
            return;
        }
    }

    try {
        // Cambiar estado del botón a loading
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        saveBtn.disabled = true;

        // Preparar datos para actualizar (según UserRequestDTO)
        const updateData = {
            name: name,
            email: email
        };

        // Agregar la nueva contraseña al campo "password" (no "newPassword")
        if (changingPassword) {
            updateData.password = newPassword;  // ← Campo correcto: "password"
        }

        console.log('Actualizando perfil:', updateData);

        // Llamar al backend para actualizar
        const updatedUser = await userService.updateUser(userData.id, updateData);

        if (updatedUser) {
            // Actualizar datos locales
            userData.name = updatedUser.name || name;
            userData.email = updatedUser.email || email;
            setLocalStorage('currentUser', userData);

            // Limpiar campos de contraseña si se cambiaron
            if (changingPassword) {
                document.getElementById('new-password').value = '';
                document.getElementById('confirm-password').value = '';
                // Resetear indicador de fortaleza
                const strengthMeter = document.querySelector('.strength-meter');
                const feedback = document.querySelector('.password-feedback');
                if (strengthMeter) strengthMeter.className = 'strength-meter';
                if (feedback) feedback.textContent = '';
                
                // Mostrar mensaje específico para cambio de contraseña
                showNotification('Contraseña actualizada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.', 'success');
            } else {
                showNotification('Perfil actualizado correctamente', 'success');
            }

            // Salir del modo edición
            isEditing = false;
            document.getElementById('cancel-btn').classList.add('hidden');
            document.querySelector('.profile-card').classList.remove('editing');

            // Deshabilitar inputs
            const inputs = document.querySelectorAll('#profile-name, #profile-email');
            inputs.forEach(input => {
                input.setAttribute('readonly', true);
            });
        } else {
            throw new Error('Error en la actualización');
        }

    } catch (error) {
        console.error('Error guardando perfil:', error);
        showNotification('Error al guardar el perfil: ' + (error.message || 'Verifica tus datos'), 'error');
    } finally {
        // Restaurar estado del botón
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
        saveBtn.disabled = false;
    }
}

// Validar email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Mostrar/ocultar loading
function showLoading(show) {
    const container = document.querySelector('.profile-container');
    if (show) {
        container.classList.add('loading');
    } else {
        container.classList.remove('loading');
    }
}

// Formatear fecha para cuentas
function formatDateAccounts(dateString) {
    if (!dateString) return 'Fecha no disponible';
    
    try {
        // Dividir la fecha ISO directamente (YYYY-MM-DD)
        const [year, month, day] = dateString.split('T')[0].split('-');
        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error('Error formateando fecha:', error, dateString);
        return 'Fecha inválida';
    }
}