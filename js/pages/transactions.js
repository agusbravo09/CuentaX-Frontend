let transactionsData = [];
let internalTransfersData = [];
let accountsData = [];
let categoriesData = [];
let paymentMethodsData = [];
let currentTransactionId = null;
let currentIsTransfer = false;
let currentPage = 1;
const transactionsPerPage = 10;
let isLoading = false;

document.addEventListener('DOMContentLoaded', () => {
    
    if (!isUserAuthenticated()) {
        redirectToLogin();
        return;
    }
    
    setupModalEvents();
    loadInitialData();
});

function setupModalEvents() {
    const addTransactionBtn = document.getElementById('add-transaction-btn');
    const addTransferBtn = document.getElementById('add-transfer-btn');
    const firstTransactionBtn = document.getElementById('first-transaction-btn');
    const transactionModal = document.getElementById('transaction-modal');
    const transferModal = document.getElementById('transfer-modal');
    const deleteModal = document.getElementById('delete-modal');
    const transactionForm = document.getElementById('transaction-form');
    const transferForm = document.getElementById('transfer-form');
    const closeModalButtons = document.querySelectorAll('.close-modal');
    const cancelDeleteBtn = document.getElementById('cancel-delete');
    const confirmDeleteBtn = document.getElementById('confirm-delete');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    const searchInput = document.getElementById('search-transactions');
    const typeFilter = document.getElementById('filter-type');
    const accountFilter = document.getElementById('filter-account');
    const amountInputs = document.querySelectorAll('#transaction-amount, #transfer-amount');
    
    if (addTransactionBtn) addTransactionBtn.addEventListener('click', openTransactionModal);
    if (addTransferBtn) addTransferBtn.addEventListener('click', openTransferModal);
    if (firstTransactionBtn) firstTransactionBtn.addEventListener('click', openTransactionModal);
    
    closeModalButtons.forEach(button => button.addEventListener('click', closeModals));
    
    [transactionModal, transferModal, deleteModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', e => {
                if (e.target === modal) closeModals();
            });
        }
    });
    
    if (transactionForm) transactionForm.addEventListener('submit', e => {
        e.preventDefault();
        saveTransaction();
    });
    
    if (transferForm) transferForm.addEventListener('submit', e => {
        e.preventDefault();
        saveTransfer();
    });
    
    if (cancelDeleteBtn) cancelDeleteBtn.addEventListener('click', closeModals);
    
    if (confirmDeleteBtn) confirmDeleteBtn.addEventListener('click', () => {
        deleteTransaction(currentTransactionId, currentIsTransfer);
    });
    
    if (prevPageBtn) prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            updateTransactionsList();
        }
    });
    
    if (nextPageBtn) nextPageBtn.addEventListener('click', () => {
        const allTransactions = getAllTransactions();
        const totalPages = Math.ceil(allTransactions.length / transactionsPerPage);
        if (currentPage < totalPages) {
            currentPage++;
            updateTransactionsList();
        }
    });
    
    if (searchInput) searchInput.addEventListener('input', () => {
        currentPage = 1;
        filterTransactions();
    });
    
    if (typeFilter) typeFilter.addEventListener('change', () => {
        currentPage = 1;
        filterTransactions();
    });
    
    if (accountFilter) accountFilter.addEventListener('change', () => {
        currentPage = 1;
        filterTransactions();
    });
    
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') closeModals();
    });
    
    amountInputs.forEach(input => {
        input.addEventListener('input', () => validateAmountInput(input));
    });
    
    setCurrentDate();
    addTransferStyles();
}

function addTransferStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .transaction-item.transfer { background-color: #fff3cd; border-left: 4px solid #ffc107; }
        .transaction-item.transfer:hover { background-color: #ffeaa7; }
        .transfer-badge { background-color: #ffc107; color: #000; padding: 2px 8px; border-radius: 12px; font-size: 0.8em; font-weight: bold; }
        .transaction-amount.transfer { color: #ffc107; font-weight: bold; }
    `;
    document.head.appendChild(style);
}

function validateAmountInput(input) {
    const value = parseFloat(input.value);
    input.setCustomValidity(isNaN(value) || value <= 0 ? 'El monto debe ser mayor a 0' : '');
}

function setCurrentDate() {
    const today = new Date().toISOString().split('T')[0];
    document.querySelectorAll('#transaction-date, #transfer-date').forEach(input => {
        input.value = today;
    });
}

async function loadInitialData() {
    if (isLoading) return;
    
    try {
        isLoading = true;
        showLoadingState(true);
        
        const userData = getLocalStorage('currentUser');
        if (!userData?.id) {
            showNotification('Error al cargar datos de usuario', 'error');
            return;
        }
        
        await loadAccounts(userData.id);
        
        if (accountsData.length === 0) {
            updateUI();
            showLoadingState(false);
            return;
        }

        await loadInternalTransfers();
        
        await Promise.all([
            loadTransactions(userData.id),
            loadCategories(),
            loadPaymentMethods()
        ]);
        updateUI();
        
    } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        showNotification('Error al cargar los datos: ' + error.message, 'error');
    } finally {
        isLoading = false;
        showLoadingState(false);
    }
}

async function loadInternalTransfers() {
    try {
        const userData = getLocalStorage('currentUser');
        if (!userData?.id) {
            internalTransfersData = [];
            return;
        }
        
        const allTransfers = await internalTransferService.getAllInternalTransfers() || [];
        
        internalTransfersData = allTransfers.filter(transfer => {
            const originBelongsToUser = accountsData.some(acc => acc.id === transfer.originAccountId);
            const destinationBelongsToUser = accountsData.some(acc => acc.id === transfer.destinationAccountId);
            
            return originBelongsToUser && destinationBelongsToUser;
        });
        
    } catch (error) {
        console.error('Error cargando transferencias internas:', error);
        internalTransfersData = [];
    }
}

function updateUI() {
    populateAccountFilter();
    populateAccountDropdowns();
    populateCategoryDropdown();
    populatePaymentMethodDropdown();
    updateTransactionsList();
}

async function loadTransactions(userId) {
    try {
        transactionsData = await transactionService.getTransactionsByUserId(userId) || [];
    } catch (error) {
        console.error('Error cargando transacciones:', error);
        showNotification('Error al cargar transacciones', 'error');
        transactionsData = [];
        throw error;
    }
}

async function loadAccounts(userId) {
    try {
        accountsData = await accountService.getAccountsByUserId(userId) || [];
        
        if (accountsData.length === 0) {
            console.warn('No se encontraron cuentas para el usuario');
            showNotification('No tienes cuentas registradas. Crea una cuenta primero.', 'warning');
        }
    } catch (error) {
        console.error('Error cargando cuentas:', error);
        showNotification('Error al cargar cuentas', 'error');
        accountsData = [];
        throw error;
    }
}

async function loadCategories() {
    try {
        categoriesData = await categoryService.getCategories() || [];
    } catch (error) {
        console.error('Error cargando categorías:', error);
        showNotification('Error al cargar categorías', 'error');
        categoriesData = [];
        throw error;
    }
}

async function loadPaymentMethods() {
    try {
        paymentMethodsData = await fetchAPI('/api/v1/payment-methods/all') || [
            { id: 1, name: 'Efectivo' }, { id: 2, name: 'Tarjeta de Débito' },
            { id: 3, name: 'Tarjeta de Crédito' }, { id: 4, name: 'Transferencia Bancaria' }
        ];
    } catch (error) {
        console.error('Error cargando métodos de pago:', error);
        paymentMethodsData = [
            { id: 1, name: 'Efectivo' }, { id: 2, name: 'Tarjeta de Débito' },
            { id: 3, name: 'Tarjeta de Crédito' }, { id: 4, name: 'Transferencia Bancaria' }
        ];
    }
}

function populateAccountFilter() {
    const accountFilter = document.getElementById('filter-account');
    if (!accountFilter) {
        console.error('Elemento filter-account no encontrado');
        return;
    }
    
    accountFilter.innerHTML = '<option value="">Todas las cuentas</option>';
    
    accountsData.forEach(account => {
        const option = document.createElement('option');
        option.value = account.id;
        option.textContent = account.name || `Cuenta ${account.id}`;
        accountFilter.appendChild(option);
    });
    
}

function populateAccountDropdowns() {
    const dropdowns = [
        'transaction-account',
        'transfer-origin-account',
        'transfer-destination-account'
    ];

    
    dropdowns.forEach(dropdownId => {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) {
            console.error('Elemento', dropdownId, 'no encontrado');
            return;
        }
        
        dropdown.innerHTML = dropdownId === 'transaction-account' ? 
            '<option value="">Selecciona una cuenta</option>' :
            '<option value="">Selecciona cuenta</option>';
        
        accountsData.forEach(account => {
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = account.name || `Cuenta ${account.id}`;
            dropdown.appendChild(option);
        });
        
    });
}

function populateCategoryDropdown() {
    const dropdown = document.getElementById('transaction-category');
    if (!dropdown) {
        console.error('Elemento transaction-category no encontrado');
        return;
    }
    
    dropdown.innerHTML = '<option value="">Selecciona una categoría</option>';
    
    categoriesData.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name || `Categoría ${category.id}`;
        dropdown.appendChild(option);
    });
    
}

function populatePaymentMethodDropdown() {
    const dropdown = document.getElementById('transaction-payment-method');
    if (!dropdown) {
        console.error('Elemento transaction-payment-method no encontrado');
        return;
    }
    
    dropdown.innerHTML = '<option value="">Selecciona un método de pago</option>';
    
    paymentMethodsData.forEach(method => {
        const option = document.createElement('option');
        option.value = method.id;
        option.textContent = method.name;
        dropdown.appendChild(option);
    });
    
}

function openTransactionModal() {
    if (accountsData.length === 0) {
        showNotification('Primero debes crear una cuenta', 'warning');
        return;
    }
    
    const modal = document.getElementById('transaction-modal');
    const form = document.getElementById('transaction-form');
    
    form.setAttribute('autocomplete', 'off');
    form.reset();
    setCurrentDate();
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
        document.getElementById('transaction-type').focus();
    }, 100);
}

function openTransferModal() {
    if (accountsData.length < 2) {
        showNotification('Necesitas al menos 2 cuentas para hacer transferencias', 'warning');
        return;
    }
    
    const modal = document.getElementById('transfer-modal');
    const form = document.getElementById('transfer-form');
    
    form.setAttribute('autocomplete', 'off');
    form.reset();
    setCurrentDate();
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
        document.getElementById('transfer-amount').focus();
    }, 100);
}

function openDeleteModal(transactionId, isTransfer = false) {
    const modal = document.getElementById('delete-modal');
    const descriptionElement = document.getElementById('delete-transaction-description');
    
    let description = '';
    
    if (isTransfer) {
        const transfer = internalTransfersData.find(t => t.id == transactionId);
        description = transfer ? `transferencia de ${formatCurrency(transfer.amount)}` : 'esta transferencia';
    } else {
        const transaction = transactionsData.find(t => t.id == transactionId);
        description = transaction ? `"${transaction.description}"` : 'esta transacción';
    }
    
    descriptionElement.textContent = description;
    currentTransactionId = transactionId;
    currentIsTransfer = isTransfer;
    
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
}

function closeModals() {
    document.querySelectorAll('.modal').forEach(modal => modal.classList.remove('show'));
    document.body.style.overflow = 'auto';
    currentTransactionId = null;
    currentIsTransfer = false;
}

function getAllTransactions() {
    const transferTransactions = internalTransfersData.map(transfer => ({
        id: transfer.id,
        type: 'TRANSFER',
        amount: transfer.amount,
        description: `Transferencia: ${transfer.originAccountName} → ${transfer.destinationAccountName}`,
        date: transfer.date,
        accountName: transfer.originAccountName,
        categoryName: 'Transferencia Interna',
        paymentMethodName: 'Transferencia Interna',
        isTransfer: true,
        originAccountId: transfer.originAccountId, 
        destinationAccountId: transfer.destinationAccountId, 
        transferData: transfer
    }));

    const allTransactions = [...transactionsData, ...transferTransactions];
    
    return allTransactions.sort((a, b) => {
        if (a.id && b.id) return b.id - a.id;
        const dateA = a.date ? new Date(a.date) : new Date(0);
        const dateB = b.date ? new Date(b.date) : new Date(0);
        return dateB - dateA;
    });
}

function filterTransactions() {
    const searchTerm = document.getElementById('search-transactions').value.toLowerCase();
    const typeFilterValue = document.getElementById('filter-type').value;
    const accountFilterValue = document.getElementById('filter-account').value;
    
    let allTransactions = getAllTransactions();
    let filteredTransactions = allTransactions;
    
    if (searchTerm) {
        filteredTransactions = filteredTransactions.filter(transaction =>
            transaction.description.toLowerCase().includes(searchTerm)
        );
    }
    
    if (typeFilterValue) {
        if (typeFilterValue === 'TRANSFER') {
            filteredTransactions = filteredTransactions.filter(transaction =>
                transaction.type === 'TRANSFER' || transaction.isTransfer
            );
        } else {
            filteredTransactions = filteredTransactions.filter(transaction =>
                transaction.type === typeFilterValue && !transaction.isTransfer
            );
        }
    }
    
    if (accountFilterValue) {
    const selectedAccount = accountsData.find(acc => acc.id == accountFilterValue);
    const accountName = selectedAccount ? selectedAccount.name : '';
    
    filteredTransactions = filteredTransactions.filter(transaction => {
        if (transaction.isTransfer) {
            const transferOriginAccount = accountsData.find(acc => acc.name === transaction.accountName);
            return transferOriginAccount && transferOriginAccount.id == accountFilterValue;
        }

        return transaction.accountName === accountName;
    });
}
    
    currentPage = 1;
    updateTransactionsList(filteredTransactions);
}

function updateTransactionsList(transactions = null) {
    const transactionsList = document.getElementById('transactions-list');
    const pagination = document.getElementById('pagination');
    const pageInfo = document.getElementById('page-info');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    
    if (!transactionsList) return;
    
    const displayTransactions = transactions || getAllTransactions();
    const totalPages = Math.ceil(displayTransactions.length / transactionsPerPage);
    const startIndex = (currentPage - 1) * transactionsPerPage;
    const endIndex = startIndex + transactionsPerPage;
    const paginatedTransactions = displayTransactions.slice(startIndex, endIndex);
    
    if (displayTransactions.length === 0) {
        transactionsList.innerHTML = `
            <div class="no-data">
                <i class="fas fa-exchange-alt"></i>
                <p>No tienes transacciones registradas</p>
                <button class="btn btn-primary" id="first-transaction-btn">Agregar primera transacción</button>
            </div>
        `;
        
        pagination.style.display = 'none';
        
        const firstTransactionBtn = document.getElementById('first-transaction-btn');
        if (firstTransactionBtn) {
            firstTransactionBtn.addEventListener('click', openTransactionModal);
        }
        
        return;
    }
    
    pagination.style.display = 'flex';
    
    const transactionsHTML = paginatedTransactions.map(transaction => {
        const typeConfig = {
            'INCOME': { class: 'income', icon: 'fa-arrow-down' },
            'EGRESS': { class: 'expense', icon: 'fa-arrow-up' },
            'TRANSFER': { class: 'transfer', icon: 'fa-exchange-alt' }
        };
        
        const typeKey = transaction.transactionType || transaction.type;
        const config = typeConfig[typeKey] || { class: '', icon: 'fa-exchange-alt' };
        
        const transactionDate = transaction.date ? formatDate(transaction.date) : 'Fecha no disponible';
        const accountName = transaction.accountName || 'Cuenta no disponible';
        const categoryName = transaction.categoryName || 
                            (transaction.categoryId ? getCategoryName(transaction.categoryId) : 'Sin categoría');
        
        const amountPrefix = config.class === 'expense' || config.class === 'transfer' ? '-' : '+';
        
        return `
<div class="transaction-item ${config.class}">
    <div class="transaction-icon ${config.class}">
        <i class="fas ${config.icon}"></i>
    </div>
    <div class="transaction-details">
        <h4 class="transaction-description">${transaction.description || 'Sin descripción'}</h4>
        <div class="transaction-meta">
            <span><i class="fas fa-calendar"></i> ${transactionDate}</span>
            <span><i class="fas fa-wallet"></i> ${accountName}</span>
            ${categoryName ? `<span><i class="fas fa-tag"></i> ${categoryName}</span>` : ''}
            ${transaction.paymentMethodName ? `<span class="payment-badge"><i class="fas fa-credit-card"></i> ${transaction.paymentMethodName}</span>` : ''}
        </div>
    </div>
    <div class="transaction-amount ${config.class}">
        ${amountPrefix}${formatCurrency(transaction.amount || 0)}
    </div>
    <div class="transaction-actions">
        <button class="transaction-action-btn delete" data-id="${transaction.id}" data-is-transfer="${transaction.isTransfer || false}">
            <i class="fas fa-trash"></i>
        </button>
    </div>
</div>
        `;
    }).join('');
    
    transactionsList.innerHTML = transactionsHTML;
    
    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages || totalPages === 0;
    
    document.querySelectorAll('.transaction-action-btn.delete').forEach(button => {
        button.addEventListener('click', function() {
            const transactionId = this.getAttribute('data-id');
            const isTransfer = this.getAttribute('data-is-transfer') === 'true';
            openDeleteModal(transactionId, isTransfer);
        });
    });
}

function getCategoryName(categoryId) {
    const category = categoriesData.find(cat => cat.id == categoryId);
    return category ? category.name : 'Categoría desconocida';
}

async function saveTransaction() {
    const saveButton = document.getElementById('save-transaction-btn');
    const type = document.getElementById('transaction-type').value;
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const description = document.getElementById('transaction-description').value;
    const date = document.getElementById('transaction-date').value;
    const accountId = document.getElementById('transaction-account').value;
    const categoryId = document.getElementById('transaction-category').value;
    const paymentMethodId = document.getElementById('transaction-payment-method').value;
    
    if (!type) {
        showNotification('Debes seleccionar un tipo de transacción', 'error');
        return;
    }
    
    if (isNaN(amount) || amount <= 0) {
        showNotification('El monto debe ser un número válido y mayor a 0', 'error');
        return;
    }
    
    if (!description.trim()) {
        showNotification('La descripción es requerida', 'error');
        return;
    }
    
    if (!date) {
        showNotification('La fecha es requerida', 'error');
        return;
    }
    
    if (!accountId) {
        showNotification('Debes seleccionar una cuenta', 'error');
        return;
    }
    
    if (!categoryId) {
        showNotification('Debes seleccionar una categoría', 'error');
        return;
    }
    
    if (!paymentMethodId) {
        showNotification('Debes seleccionar un método de pago', 'error');
        return;
    }
    
    try {
        const originalText = saveButton.innerHTML;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        saveButton.disabled = true;
        
        if (type === 'EGRESS') {
            const account = accountsData.find(acc => acc.id == accountId);
            if (account) {
                const currentBalance = await accountService.getAccountBalance(accountId);
                
                if (currentBalance !== null && currentBalance < amount) {
                    showNotification(`Saldo insuficiente. Balance disponible en la cuenta: ${formatCurrency(currentBalance)}`, 'error');
                    saveButton.innerHTML = 'Guardar Transacción';
                    saveButton.disabled = false;
                    return;
                }
            }
        }
        
        const transactionData = {
            type: type,
            amount: amount,
            description: description,
            date: date,
            accountId: parseInt(accountId),
            categoryId: parseInt(categoryId),
            paymentMethodId: parseInt(paymentMethodId),
            userId: getLocalStorage('currentUser').id
        };
        
        
        const result = await transactionService.createTransaction(transactionData);
        
        if (result) {
            showNotification('Transacción creada correctamente', 'success');
            closeModals();
            await loadInitialData();
        }
        
    } catch (error) {
        console.error('Error guardando transacción:', error);
        showNotification('Error al guardar la transacción', 'error');
    } finally {
        saveButton.innerHTML = 'Guardar Transacción';
        saveButton.disabled = false;
    }
}

async function saveTransfer() {
    const saveButton = document.getElementById('save-transfer-btn');
    const amount = parseFloat(document.getElementById('transfer-amount').value);
    const originAccountId = document.getElementById('transfer-origin-account').value;
    const destinationAccountId = document.getElementById('transfer-destination-account').value;
    
    if (isNaN(amount) || amount <= 0) {
        showNotification('El monto debe ser un número válido y mayor a 0', 'error');
        return;
    }
    
    if (!originAccountId) {
        showNotification('Debes seleccionar una cuenta de origen', 'error');
        return;
    }
    
    if (!destinationAccountId) {
        showNotification('Debes seleccionar una cuenta de destino', 'error');
        return;
    }
    
    if (originAccountId === destinationAccountId) {
        showNotification('La cuenta de origen y destino no pueden ser la misma', 'error');
        return;
    }
    
    try {
        const originalText = saveButton.innerHTML;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        saveButton.disabled = true;
        
        const originAccount = accountsData.find(acc => acc.id == originAccountId);
        if (originAccount) {
            const currentBalance = await accountService.getAccountBalance(originAccountId);
            
            if (currentBalance !== null && currentBalance < amount) {
                showNotification(`Saldo insuficiente en la cuenta de origen. Balance disponible: ${formatCurrency(currentBalance)}`, 'error');
                saveButton.innerHTML = 'Realizar Transferencia';
                saveButton.disabled = false;
                return;
            }
        }
        
        const transferData = {
            amount: amount,
            originAccountId: parseInt(originAccountId),
            destinationAccountId: parseInt(destinationAccountId)
        };
        
        
        await internalTransferService.createInternalTransfer(transferData);
        
        showNotification('Transferencia interna realizada correctamente', 'success');
        closeModals();
        await loadInitialData();
        
    } catch (error) {
        console.error('Error realizando transferencia interna:', error);
        showNotification('Error al realizar la transferencia interna: ' + (error.message || 'Error desconocido'), 'error');
    } finally {
        saveButton.innerHTML = 'Realizar Transferencia';
        saveButton.disabled = false;
    }
}

async function deleteTransaction(transactionId, isTransfer = false) {
    try {
        const confirmButton = document.getElementById('confirm-delete');
        const originalText = confirmButton.innerHTML;
        confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Eliminando...';
        confirmButton.disabled = true;
        
        let result;
        
        if (isTransfer) {
            result = await internalTransferService.deleteInternalTransfer(transactionId);
        } else {
            result = await transactionService.deleteTransaction(transactionId);
        }
        
        showNotification(isTransfer ? 'Transferencia eliminada correctamente' : 'Transacción eliminada correctamente', 'success');
        closeModals();
        await loadInitialData();
        
    } catch (error) {
        console.error('Error eliminando:', error);
        showNotification(`Error al eliminar ${isTransfer ? 'la transferencia' : 'la transacción'}`, 'error');
    } finally {
        const confirmButton = document.getElementById('confirm-delete');
        confirmButton.innerHTML = 'Eliminar';
        confirmButton.disabled = false;
    }
}

function showLoadingState(show) {
    const transactionsList = document.getElementById('transactions-list');
    if (!transactionsList) return;
    
    if (show) {
        transactionsList.innerHTML = `
            <div class="no-data">
                <i class="fas fa-spinner fa-spin"></i>
                <p>Cargando transacciones...</p>
            </div>
        `;
    }
}