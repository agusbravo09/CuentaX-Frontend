// accounts.js - Gestión de cuentas
console.log('Accounts cargado');

// Variables globales
let accountsData = [];
let currentAccountId = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado - Inicializando gestión de cuentas');
    
    // Verificar autenticación
    if (!isUserAuthenticated()) {
        redirectToLogin();
        return;
    }
    
    // Configurar eventos de los modales
    setupModalEvents();
    
    // Cargar datos de cuentas
    loadAccountsData();
});

// Configurar eventos de los modales
function setupModalEvents() {
    // Botón para abrir modal de agregar cuenta
    const addAccountBtn = document.getElementById('add-account-btn');
    const firstAccountBtn = document.getElementById('first-account-btn');
    const accountModal = document.getElementById('account-modal');
    const deleteModal = document.getElementById('delete-modal');
    const accountForm = document.getElementById('account-form');
    const closeModalButtons = document.querySelectorAll('.close-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    
    // Abrir modal para agregar cuenta
    if (addAccountBtn) {
        addAccountBtn.addEventListener('click', function() {
            openAccountModal();
        });
    }
    
    // Abrir modal desde el botón de "primera cuenta"
    if (firstAccountBtn) {
        firstAccountBtn.addEventListener('click', function() {
            openAccountModal();
        });
    }
    
    // Cerrar modales al hacer clic en la X
    closeModalButtons.forEach(button => {
        button.addEventListener('click', function() {
            closeModals();
        });
    });
    
    // Cerrar modales al hacer clic fuera del contenido
    [accountModal, deleteModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closeModals();
                }
            });
        }
    });
    
    // Enviar formulario de cuenta
    if (accountForm) {
        accountForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveAccount();
        });
    }
    
    // Cancelar eliminación
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', function() {
            closeModals();
        });
    }
    
    // Confirmar eliminación
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            deleteAccount(currentAccountId);
        });
    }
    
    // Cerrar con tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModals();
        }
    });
    
    // Validar saldo en tiempo real
    const balanceInput = document.getElementById('account-balance');
    if (balanceInput) {
        balanceInput.addEventListener('input', function() {
            validateBalanceInput(this);
        });
    }
}

// Validar que el saldo no sea negativo
function validateBalanceInput(input) {
    const value = parseFloat(input.value);
    if (isNaN(value) || value < 0) {
        input.setCustomValidity('El balance no puede ser negativo');
    } else {
        input.setCustomValidity('');
    }
}

// Abrir modal para agregar/editar cuenta
function openAccountModal(accountId = null) {
    const modal = document.getElementById('account-modal');
    const modalTitle = document.getElementById('modal-title');
    const accountForm = document.getElementById('account-form');
    
    // Desactivar autocompletar
    accountForm.setAttribute('autocomplete', 'off');
    
    if (accountId) {
        // Modo edición - cargar datos de la cuenta
        modalTitle.textContent = 'Editar Cuenta';
        const account = accountsData.find(acc => acc.id == accountId);
        
        if (account) {
            document.getElementById('account-id').value = account.id;
            document.getElementById('account-name').value = account.name || '';
            document.getElementById('account-balance').value = account.currentBalance || 0;
            
            // Mapear el tipo de cuenta del backend al frontend
            let frontendType;
            switch(account.type) {
                case 'BANK':
                    frontendType = 'bank';
                    break;
                case 'VIRTUAL_WALLET':
                    frontendType = 'virtual_wallet';
                    break;
                case 'CASH':
                    frontendType = 'cash';
                    break;
                default:
                    frontendType = account.type.toLowerCase();
            }
            
            document.getElementById('account-type').value = frontendType;
            
            console.log('Cargando datos para edición:', {
                id: account.id,
                name: account.name,
                balance: account.currentBalance,
                type: account.type,
                frontendType: frontendType
            });
        } else {
            console.error('No se encontró la cuenta con ID:', accountId);
            showNotification('Error al cargar los datos de la cuenta', 'error');
            return;
        }
    } else {
        // Modo agregar - limpiar formulario
        modalTitle.textContent = 'Agregar Cuenta';
        accountForm.reset();
        document.getElementById('account-id').value = '';
    }
    
    // Mostrar modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Enfocar el primer campo
    setTimeout(() => {
        document.getElementById('account-name').focus();
    }, 100);
}

// Abrir modal de confirmación para eliminar
function openDeleteModal(accountId) {
    const modal = document.getElementById('delete-modal');
    const accountNameElement = document.getElementById('delete-account-name');
    
    const account = accountsData.find(acc => acc.id == accountId);
    if (account) {
        accountNameElement.textContent = account.name || 'esta cuenta';
        currentAccountId = accountId;
        
        // Desactivar autocompletar
        modal.setAttribute('autocomplete', 'off');
        
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

// Cerrar todos los modales
function closeModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('show');
    });
    document.body.style.overflow = 'auto';
    currentAccountId = null;
}

// Cargar datos de cuentas
async function loadAccountsData() {
    console.log('Cargando datos de cuentas...');
    
    try {
        // Obtener usuario actual
        const userData = getLocalStorage('currentUser');
        if (!userData || !userData.id) {
            showNotification('Error al cargar datos de usuario', 'error');
            return;
        }
        
        // Mostrar loading state
        showLoadingState(true);
        
        // Obtener cuentas del usuario
        accountsData = await accountService.getAccountsByUserId(userData.id);
        updateAccountsList(accountsData);
        
        // Ocultar loading state
        showLoadingState(false);
        
    } catch (error) {
        console.error('Error cargando datos de cuentas:', error);
        showNotification('Error al cargar las cuentas', 'error');
        showLoadingState(false);
    }
}

// Actualizar lista de cuentas en la UI
function updateAccountsList(accounts) {
    const accountsGrid = document.getElementById('accounts-grid');
    if (!accountsGrid) return;
    
    if (!accounts || accounts.length === 0) {
        accountsGrid.innerHTML = `
            <div class="no-data">
                <i class="fas fa-wallet"></i>
                <p>No tienes cuentas registradas</p>
                <button class="btn btn-primary" id="first-account-btn">Agregar primera cuenta</button>
            </div>
        `;
        
        // Reconfigurar evento del botón
        const firstAccountBtn = document.getElementById('first-account-btn');
        if (firstAccountBtn) {
            firstAccountBtn.addEventListener('click', function() {
                openAccountModal();
            });
        }
        
        return;
    }
    
    let accountsHTML = '';
    
    accounts.forEach(account => {
        // Determinar tipo de cuenta y colores
        let typeText = 'Cuenta';
        let typeClass = '';
        
        if (account.type === 'BANK') {
            typeText = 'Cuenta Bancaria';
            typeClass = 'bank';
        } else if (account.type === 'VIRTUAL_WALLET') {
            typeText = 'Billetera Virtual';
            typeClass = 'virtual_wallet';
        } else if (account.type === 'CASH') {
            typeText = 'Efectivo';
            typeClass = 'cash';
        }
        
        // Formatear fecha de creación
        const createdDate = account.createdAt ? formatDateAccounts(account.createdAt) : 'Fecha no disponible';
        
        accountsHTML += `
            <div class="account-card ${typeClass}">
                <div class="account-header">
                    <div class="account-icon ${typeClass}">
                        <i class="fas ${typeClass === 'bank' ? 'fa-university' : typeClass === 'virtual_wallet' ? 'fa-wallet' : 'fa-money-bill-wave'}"></i>
                    </div>
                    <div class="account-actions">
                        <button class="account-action-btn edit" data-id="${account.id}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="account-action-btn delete" data-id="${account.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="account-info">
                    <h3 class="account-name">${account.name || 'Cuenta sin nombre'}</h3>
                    <p class="account-type">${typeText}</p>
                </div>
                <div class="account-balance">
                    ${formatCurrency(account.currentBalance || 0)}
                </div>
                <div class="account-footer">
                    <span class="account-date">Creada: ${createdDate}</span>
                </div>
            </div>
        `;
    });
    
    accountsGrid.innerHTML = accountsHTML;
    
    // Agregar eventos a los botones de editar y eliminar
    const editButtons = document.querySelectorAll('.account-action-btn.edit');
    const deleteButtons = document.querySelectorAll('.account-action-btn.delete');
    
    editButtons.forEach(button => {
        button.addEventListener('click', function() {
            const accountId = this.getAttribute('data-id');
            openAccountModal(accountId);
        });
    });
    
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const accountId = this.getAttribute('data-id');
            openDeleteModal(accountId);
        });
    });
}

// Guardar cuenta (crear o actualizar)
async function saveAccount() {
    const saveButton = document.getElementById('save-account-btn');
    const accountId = document.getElementById('account-id').value;
    const accountName = document.getElementById('account-name').value;
    const accountBalance = parseFloat(document.getElementById('account-balance').value);
    const accountType = document.getElementById('account-type').value;
    
    // Validaciones básicas
    if (!accountName.trim()) {
        showNotification('El nombre de la cuenta es requerido', 'error');
        return;
    }
    
    if (isNaN(accountBalance) || accountBalance < 0) {
        showNotification('El balance debe ser un número válido y no puede ser negativo', 'error');
        return;
    }
    
    if (!accountType) {
        showNotification('Debes seleccionar un tipo de cuenta', 'error');
        return;
    }
    
    try {
        // Cambiar estado del botón a loading
        const originalText = saveButton.innerHTML;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        saveButton.disabled = true;
        
        // Obtener usuario actual
        const userData = getLocalStorage('currentUser');
        if (!userData || !userData.id) {
            showNotification('Error al identificar el usuario', 'error');
            return;
        }
        
        // Mapear los valores del frontend a los que espera el backend
        let backendAccountType;
        switch(accountType) {
            case 'bank':
                backendAccountType = 'BANK';
                break;
            case 'virtual_wallet':
                backendAccountType = 'VIRTUAL_WALLET';
                break;
            case 'cash':
                backendAccountType = 'CASH';
                break;
            default:
                backendAccountType = accountType.toUpperCase();
        }
        
        // FORMATO MÍNIMO - solo enviar lo esencial
        const accountData = {
            name: accountName,
            currentBalance: accountBalance,
            type: backendAccountType,
            userId: userData.id
        };
        
        console.log('Enviando datos al backend:', accountData);
        
        let result;
        
        if (accountId) {
            // Actualizar cuenta existente - NO enviar campos de fecha
            const updateData = {
                name: accountName,
                currentBalance: accountBalance,
                type: backendAccountType
                // No enviar userId en updates
            };
            
            result = await accountService.updateAccount(accountId, updateData);
            if (result) {
                showNotification('Cuenta actualizada correctamente', 'success');
            }
        } else {
            // Crear nueva cuenta
            result = await accountService.createAccount(accountData);
            if (result) {
                showNotification('Cuenta creada correctamente', 'success');
            }
        }
        
        // Cerrar modal y recargar datos
        closeModals();
        await loadAccountsData();
        
    } catch (error) {
        console.error('Error guardando cuenta:', error);
        // Mostrar mensaje de error más específico
        const errorMessage = error.message || 'Error al guardar la cuenta. Verifica la consola para más detalles.';
        showNotification(errorMessage, 'error');
    } finally {
        // Restaurar estado del botón
        saveButton.innerHTML = 'Guardar Cuenta';
        saveButton.disabled = false;
    }
}

// Eliminar cuenta
async function deleteAccount(accountId) {
    try {
        const confirmButton = document.getElementById('confirm-delete');
        const originalText = confirmButton.innerHTML;
        confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
        confirmButton.disabled = true;
        
        await accountService.deleteAccount(accountId); // si falla, lanza excepción
        
        // Si llega acá, significa que fue exitoso
        showNotification('Cuenta eliminada correctamente', 'success');
        closeModals();
        await loadAccountsData();
        
    } catch (error) {
        console.error('Error eliminando cuenta:', error);
        showNotification('Error al eliminar la cuenta', 'error');
    } finally {
        const confirmButton = document.getElementById('confirm-delete');
        confirmButton.innerHTML = 'Eliminar';
        confirmButton.disabled = false;
    }
}

// Mostrar/ocultar estado de carga
function showLoadingState(show) {
    const accountsGrid = document.getElementById('accounts-grid');
    if (!accountsGrid) return;
    
    if (show) {
        accountsGrid.innerHTML = `
            <div class="no-data">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Cargando cuentas...</p>
            </div>
        `;
    }
}