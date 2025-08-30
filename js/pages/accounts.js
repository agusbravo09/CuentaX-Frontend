let accountsData = [];
let currentAccountId = null;

document.addEventListener('DOMContentLoaded', () => {
    
    if (!isUserAuthenticated()) {
        redirectToLogin();
        return;
    }
    
    setupModalEvents();
    loadAccountsData();
});

function setupModalEvents() {
    const addAccountBtn = document.getElementById('add-account-btn');
    const firstAccountBtn = document.getElementById('first-account-btn');
    const accountModal = document.getElementById('account-modal');
    const deleteModal = document.getElementById('delete-modal');
    const accountForm = document.getElementById('account-form');
    const closeModalButtons = document.querySelectorAll('.close-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const balanceInput = document.getElementById('account-balance');
    
    const openModalHandler = () => openAccountModal();
    if (addAccountBtn) addAccountBtn.addEventListener('click', openModalHandler);
    if (firstAccountBtn) firstAccountBtn.addEventListener('click', openModalHandler);
    
    closeModalButtons.forEach(button => {
        button.addEventListener('click', closeModals);
    });
    
    [accountModal, deleteModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', e => {
                if (e.target === modal) closeModals();
            });
        }
    });
    
    if (accountForm) {
        accountForm.addEventListener('submit', e => {
            e.preventDefault();
            saveAccount();
        });
    }
    
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeModals);
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', () => deleteAccount(currentAccountId));
    
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeModals();
    });
    
    if (balanceInput) {
        balanceInput.addEventListener('input', () => validateBalanceInput(balanceInput));
    }
}

function validateBalanceInput(input) {
    const value = parseFloat(input.value);
    input.setCustomValidity(isNaN(value) || value < 0 ? 'El balance no puede ser negativo' : '');
}

function openAccountModal(accountId = null) {
    const modal = document.getElementById('account-modal');
    const modalTitle = document.getElementById('modal-title');
    const accountForm = document.getElementById('account-form');
    
    accountForm.setAttribute('autocomplete', 'off');
    
    if (accountId) {
        modalTitle.textContent = 'Editar Cuenta';
        const account = accountsData.find(acc => acc.id == accountId);
        
        if (account) {
            document.getElementById('account-id').value = account.id;
            document.getElementById('account-name').value = account.name || '';
            document.getElementById('account-balance').value = account.currentBalance || 0;
            
            const typeMap = {
                'BANK': 'bank',
                'VIRTUAL_WALLET': 'virtual_wallet', 
                'CASH': 'cash'
            };
            
            document.getElementById('account-type').value = typeMap[account.type] || account.type.toLowerCase();
        } else {
            console.error('No se encontró la cuenta con ID:', accountId);
            showNotification('Error al cargar los datos de la cuenta', 'error');
            return;
        }
    } else {
        modalTitle.textContent = 'Agregar Cuenta';
        accountForm.reset();
        document.getElementById('account-id').value = '';
    }
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
        document.getElementById('account-name').focus();
    }, 100);
}

function openDeleteModal(accountId) {
    const modal = document.getElementById('delete-modal');
    const accountNameElement = document.getElementById('delete-account-name');
    
    const account = accountsData.find(acc => acc.id == accountId);
    if (account) {
        accountNameElement.textContent = account.name || 'esta cuenta';
        currentAccountId = accountId;
        modal.setAttribute('autocomplete', 'off');
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('show'));
    document.body.style.overflow = 'auto';
    currentAccountId = null;
}

async function loadAccountsData() {
    
    try {
        const userData = getLocalStorage('currentUser');
        if (!userData?.id) {
            showNotification('Error al cargar datos de usuario', 'error');
            return;
        }
        
        showLoadingState(true);
        accountsData = await accountService.getAccountsByUserId(userData.id);
        updateAccountsList(accountsData);
        showLoadingState(false);
        
    } catch (error) {
        console.error('Error cargando datos de cuentas:', error);
        showNotification('Error al cargar las cuentas', 'error');
        showLoadingState(false);
    }
}

function updateAccountsList(accounts) {
    const accountsGrid = document.getElementById('accounts-grid');
    if (!accountsGrid) return;
    
    if (!accounts?.length) {
        accountsGrid.innerHTML = `
            <div class="no-data">
                <i class="fas fa-wallet"></i>
                <p>No tienes cuentas registradas</p>
                <button class="btn btn-primary" id="first-account-btn">Agregar primera cuenta</button>
            </div>
        `;
        
        const firstAccountBtn = document.getElementById('first-account-btn');
        if (firstAccountBtn) {
            firstAccountBtn.addEventListener('click', () => openAccountModal());
        }
        return;
    }
    
    const accountsHTML = accounts.map(account => {
        const typeConfig = {
            'BANK': { text: 'Cuenta Bancaria', class: 'bank', icon: 'fa-university' },
            'VIRTUAL_WALLET': { text: 'Billetera Virtual', class: 'virtual_wallet', icon: 'fa-wallet' },
            'CASH': { text: 'Efectivo', class: 'cash', icon: 'fa-money-bill-wave' }
        };
        
        const config = typeConfig[account.type] || { text: 'Cuenta', class: '', icon: 'fa-wallet' };
        const createdDate = account.createdAt ? formatDateAccounts(account.createdAt) : 'Fecha no disponible';
        
        return `
            <div class="account-card ${config.class}">
                <div class="account-header">
                    <div class="account-icon ${config.class}">
                        <i class="fas ${config.icon}"></i>
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
                    <p class="account-type">${config.text}</p>
                </div>
                <div class="account-balance">
                    ${formatCurrency(account.currentBalance || 0)}
                </div>
                <div class="account-footer">
                    <span class="account-date">Creada: ${createdDate}</span>
                </div>
            </div>
        `;
    }).join('');
    
    accountsGrid.innerHTML = accountsHTML;
    
    document.querySelectorAll('.account-action-btn.edit').forEach(button => {
        button.addEventListener('click', () => openAccountModal(button.getAttribute('data-id')));
    });
    
    document.querySelectorAll('.account-action-btn.delete').forEach(button => {
        button.addEventListener('click', () => openDeleteModal(button.getAttribute('data-id')));
    });
}

async function saveAccount() {
    const saveButton = document.getElementById('save-account-btn');
    const accountId = document.getElementById('account-id').value;
    const accountName = document.getElementById('account-name').value;
    const accountBalance = parseFloat(document.getElementById('account-balance').value);
    const accountType = document.getElementById('account-type').value;
    
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
        const originalText = saveButton.innerHTML;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        saveButton.disabled = true;
        
        const userData = getLocalStorage('currentUser');
        if (!userData?.id) {
            showNotification('Error al identificar el usuario', 'error');
            return;
        }
        
        const typeMap = {
            'bank': 'BANK',
            'virtual_wallet': 'VIRTUAL_WALLET', 
            'cash': 'CASH'
        };
        
        const backendAccountType = typeMap[accountType] || accountType.toUpperCase();
        
        const accountData = {
            name: accountName,
            currentBalance: accountBalance,
            type: backendAccountType,
            userId: userData.id
        };
        
        
        let result;
        
        if (accountId) {
            const updateData = {
                name: accountName,
                currentBalance: accountBalance,
                type: backendAccountType
            };
            
            result = await accountService.updateAccount(accountId, updateData);
            if (result) showNotification('Cuenta actualizada correctamente', 'success');
        } else {
            result = await accountService.createAccount(accountData);
            if (result) showNotification('Cuenta creada correctamente', 'success');
        }
        
        closeModals();
        await loadAccountsData();
        
    } catch (error) {
        console.error('Error guardando cuenta:', error);
        showNotification(error.message || 'Error al guardar la cuenta', 'error');
    } finally {
        saveButton.innerHTML = 'Guardar Cuenta';
        saveButton.disabled = false;
    }
}

async function deleteAccount(accountId) {
    try {
        const confirmButton = document.getElementById('confirm-delete');
        const originalText = confirmButton.innerHTML;
        confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
        confirmButton.disabled = true;
        
        await accountService.deleteAccount(accountId);
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