// profile.js - Gestión del perfil de usuario
console.log('Profile cargado');

let userData = null;
let originalData = null;
let isEditing = false;

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado - Inicializando perfil');
    
    if (!isUserAuthenticated()) {
        redirectToLogin();
        return;
    }
    
    setupEventListeners();
    loadProfileData();
});

function setupEventListeners() {
    const profileForm = document.getElementById('profile-form');
    const cancelBtn = document.getElementById('cancel-btn');
    
    if (profileForm) profileForm.addEventListener('submit', e => {
        e.preventDefault();
        saveProfile();
    });
    
    if (cancelBtn) cancelBtn.addEventListener('click', cancelEdit);
    
    document.querySelectorAll('#profile-name, #profile-email').forEach(input => {
        input.addEventListener('focus', () => {
            if (!isEditing) enableEditing();
        });
    });
    
    setupPasswordValidation();
}

function setupPasswordValidation() {
    const newPassword = document.getElementById('new-password');
    const confirmPassword = document.getElementById('confirm-password');
    
    if (newPassword) newPassword.addEventListener('input', function() {
        validatePasswordStrength(this.value);
        checkPasswordMatch();
    });
    
    if (confirmPassword) confirmPassword.addEventListener('input', checkPasswordMatch);
    
    addPasswordToggles();
}

function addPasswordToggles() {
    document.querySelectorAll('input[type="password"]').forEach(input => {
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

function validatePasswordStrength(password) {
    const strengthMeter = document.querySelector('.strength-meter');
    const feedback = document.querySelector('.password-feedback');
    
    if (!strengthMeter || !feedback) return;
    
    if (password.length === 0) {
        strengthMeter.className = 'strength-meter';
        strengthMeter.style.width = '0%';
        feedback.textContent = '';
        return;
    }
    
    let strength = 0;
    if (password.length >= 6) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    
    const strengthConfig = {
        0: { class: 'strength-weak', message: 'Muy débil (mínimo 6 caracteres)' },
        1: { class: 'strength-weak', message: 'Débil' },
        2: { class: 'strength-medium', message: 'Media' },
        3: { class: 'strength-strong', message: 'Fuerte' },
        4: { class: 'strength-strong', message: 'Fuerte' }
    };
    
    const config = strengthConfig[strength] || { class: '', message: '' };
    strengthMeter.className = `strength-meter ${config.class}`;
    feedback.textContent = config.message;
}

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

async function loadProfileData() {
    try {
        showLoading(true);
        
        userData = getLocalStorage('currentUser');
        if (!userData?.id) {
            showNotification('Error al cargar datos de usuario', 'error');
            return;
        }
        
        const updatedUser = await userService.getUserById(userData.id);
        if (updatedUser) {
            userData = updatedUser;
            setLocalStorage('currentUser', userData);
        }
        
        await loadUserStatistics();
        populateProfileForm();
        
        console.log('Datos de perfil cargados:', userData);
        
    } catch (error) {
        console.error('Error cargando perfil:', error);
        showNotification('Error al cargar el perfil', 'error');
    } finally {
        showLoading(false);
    }
}

async function loadUserStatistics() {
    try {
        const accounts = await accountService.getAccountsByUserId(userData.id) || [];
        const transactions = await transactionService.getTransactionsByUserId(userData.id) || [];
        
        document.getElementById('total-accounts').textContent = accounts.length;
        document.getElementById('total-transactions').textContent = transactions.length;
        
        if (userData.createdDate) {
            document.getElementById('register-date').textContent = formatDateAccounts(userData.createdDate);
        }
        
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

function populateProfileForm() {
    document.getElementById('profile-name').value = userData.name || '';
    document.getElementById('profile-email').value = userData.email || '';
    
    originalData = {
        name: userData.name,
        email: userData.email
    };
    
    document.querySelectorAll('#profile-name, #profile-email').forEach(input => {
        input.setAttribute('readonly', true);
    });
}

function enableEditing() {
    isEditing = true;
    document.getElementById('cancel-btn').classList.remove('hidden');
    document.querySelector('.profile-card').classList.add('editing');
    
    document.querySelectorAll('#profile-name, #profile-email').forEach(input => {
        input.removeAttribute('readonly');
    });
}

function cancelEdit() {
    isEditing = false;
    
    if (originalData) {
        document.getElementById('profile-name').value = originalData.name;
        document.getElementById('profile-email').value = originalData.email;
    }
    
    document.getElementById('current-password').value = '';
    document.getElementById('new-password').value = '';
    document.getElementById('confirm-password').value = '';
    
    const strengthMeter = document.querySelector('.strength-meter');
    const feedback = document.querySelector('.password-feedback');
    if (strengthMeter) strengthMeter.className = 'strength-meter';
    if (feedback) feedback.textContent = '';
    
    checkPasswordMatch();
    document.getElementById('cancel-btn').classList.add('hidden');
    document.querySelector('.profile-card').classList.remove('editing');
    
    document.querySelectorAll('#profile-name, #profile-email').forEach(input => {
        input.setAttribute('readonly', true);
    });
}

async function saveProfile() {
    const saveBtn = document.getElementById('save-btn');
    const name = document.getElementById('profile-name').value.trim();
    const email = document.getElementById('profile-email').value.trim();
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

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
        const originalText = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        saveBtn.disabled = true;

        const updateData = {
            name: name,
            email: email
        };

        if (changingPassword) updateData.password = newPassword;

        console.log('Actualizando perfil:', updateData);

        const updatedUser = await userService.updateUser(userData.id, updateData);

        if (updatedUser) {
            userData.name = updatedUser.name || name;
            userData.email = updatedUser.email || email;
            setLocalStorage('currentUser', userData);

            if (changingPassword) {
                document.getElementById('new-password').value = '';
                document.getElementById('confirm-password').value = '';
                const strengthMeter = document.querySelector('.strength-meter');
                const feedback = document.querySelector('.password-feedback');
                if (strengthMeter) strengthMeter.className = 'strength-meter';
                if (feedback) feedback.textContent = '';
                
                showNotification('Contraseña actualizada correctamente. Ya puedes iniciar sesión con tu nueva contraseña.', 'success');
            } else {
                showNotification('Perfil actualizado correctamente', 'success');
            }

            isEditing = false;
            document.getElementById('cancel-btn').classList.add('hidden');
            document.querySelector('.profile-card').classList.remove('editing');

            document.querySelectorAll('#profile-name, #profile-email').forEach(input => {
                input.setAttribute('readonly', true);
            });
        } else {
            throw new Error('Error en la actualización');
        }

    } catch (error) {
        console.error('Error guardando perfil:', error);
        showNotification('Error al guardar el perfil: ' + (error.message || 'Verifica tus datos'), 'error');
    } finally {
        saveBtn.innerHTML = '<i class="fas fa-save"></i> Guardar Cambios';
        saveBtn.disabled = false;
    }
}

function showLoading(show) {
    const container = document.querySelector('.profile-container');
    container.classList.toggle('loading', show);
}