// transactions.js - Gestión de transacciones
console.log('Transactions cargado');

// Variables globales
let transactionsData = [];
let internalTransfersData = []; // Nueva variable para transferencias internas
let accountsData = [];
let categoriesData = [];
let paymentMethodsData = [];
let currentTransactionId = null;
let currentIsTransfer = false; // Nueva variable para saber si es transferencia
let currentPage = 1;
const transactionsPerPage = 10;
let isLoading = false;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado - Inicializando gestión de transacciones');
    
    // Verificar autenticación
    if (!isUserAuthenticated()) {
        redirectToLogin();
        return;
    }
    // Configurar eventos de los modales
    setupModalEvents();
    
    // Cargar datos iniciales
    loadInitialData();
});

// Configurar eventos de los modales
function setupModalEvents() {
    // Botones para abrir modales
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
    
    // Botones de paginación
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    
    // Filtros
    const searchInput = document.getElementById('search-transactions');
    const typeFilter = document.getElementById('filter-type');
    const accountFilter = document.getElementById('filter-account');
    
    // Abrir modal para agregar transacción
    if (addTransactionBtn) {
        addTransactionBtn.addEventListener('click', function() {
            openTransactionModal();
        });
    }
    
    // Abrir modal para transferencia
    if (addTransferBtn) {
        addTransferBtn.addEventListener('click', function() {
            openTransferModal();
        });
    }
    
    // Abrir modal desde el botón de "primera transacción"
    if (firstTransactionBtn) {
        firstTransactionBtn.addEventListener('click', function() {
            openTransactionModal();
        });
    }
    
    // Cerrar modales al hacer clic en la X
    closeModalButtons.forEach(button => {
        button.addEventListener('click', function() {
            closeModals();
        });
    });
    
    // Cerrar modales al hacer clic fuera del contenido
    [transactionModal, transferModal, deleteModal].forEach(modal => {
        if (modal) {
            modal.addEventListener('click', function(e) {
                if (e.target === modal) {
                    closeModals();
                }
            });
        }
    });
    
    // Enviar formulario de transacción
    if (transactionForm) {
        transactionForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveTransaction();
        });
    }
    
    // Enviar formulario de transferencia
    if (transferForm) {
        transferForm.addEventListener('submit', function(e) {
            e.preventDefault();
            saveTransfer();
        });
    }
    
    // Cancelar eliminación
    if (cancelDeleteBtn) {
        cancelDeleteBtn.addEventListener('click', function() {
            closeModals();
        });
    }
    
    // Confirmar eliminación - MODIFICADO
    if (confirmDeleteBtn) {
        confirmDeleteBtn.addEventListener('click', function() {
            deleteTransaction(currentTransactionId, currentIsTransfer);
        });
    }
    
    // Paginación
    if (prevPageBtn) {
        prevPageBtn.addEventListener('click', function() {
            if (currentPage > 1) {
                currentPage--;
                updateTransactionsList();
            }
        });
    }
    
    if (nextPageBtn) {
        nextPageBtn.addEventListener('click', function() {
            // Calcular total de páginas con todas las transacciones
            const allTransactions = getAllTransactions();
            const totalPages = Math.ceil(allTransactions.length / transactionsPerPage);
            if (currentPage < totalPages) {
                currentPage++;
                updateTransactionsList();
            }
        });
    }
    
    // Filtros
    if (searchInput) {
        searchInput.addEventListener('input', function() {
            currentPage = 1;
            filterTransactions();
        });
    }
    
    if (typeFilter) {
        typeFilter.addEventListener('change', function() {
            currentPage = 1;
            filterTransactions();
        });
    }
    
    if (accountFilter) {
        accountFilter.addEventListener('change', function() {
            currentPage = 1;
            filterTransactions();
        });
    }
    
    // Cerrar con tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModals();
        }
    });
    
    // Validar monto en tiempo real
    const amountInputs = document.querySelectorAll('#transaction-amount, #transfer-amount');
    amountInputs.forEach(input => {
        input.addEventListener('input', function() {
            validateAmountInput(this);
        });
    });
    
    // Establecer fecha actual por defecto
    setCurrentDate();
    
    // Agregar estilos para transferencias
    addTransferStyles();
}

// Agregar estilos CSS para transferencias
function addTransferStyles() {
    const style = document.createElement('style');
    style.textContent = `
        .transaction-item.transfer {
            background-color: #fff3cd;
            border-left: 4px solid #ffc107;
        }
        
        .transaction-item.transfer:hover {
            background-color: #ffeaa7;
        }
        
        .transfer-badge {
            background-color: #ffc107;
            color: #000;
            padding: 2px 8px;
            border-radius: 12px;
            font-size: 0.8em;
            font-weight: bold;
        }
        
        .transaction-amount.transfer {
            color: #ffc107;
            font-weight: bold;
        }
    `;
    document.head.appendChild(style);
}

// Validar que el monto no sea negativo
function validateAmountInput(input) {
    const value = parseFloat(input.value);
    if (isNaN(value) || value <= 0) {
        input.setCustomValidity('El monto debe ser mayor a 0');
    } else {
        input.setCustomValidity('');
    }
}

// Establecer fecha actual por defecto
function setCurrentDate() {
    const today = new Date().toISOString().split('T')[0];
    const dateInputs = document.querySelectorAll('#transaction-date, #transfer-date');
    dateInputs.forEach(input => {
        input.value = today;
    });
}

// Cargar datos iniciales
async function loadInitialData() {
    if (isLoading) return;
    
    try {
        isLoading = true;
        showLoadingState(true);
        
        // Obtener usuario actual
        const userData = getLocalStorage('currentUser');
        if (!userData || !userData.id) {
            showNotification('Error al cargar datos de usuario', 'error');
            return;
        }
        
        console.log('Cargando datos iniciales...');
        
        // Primero cargar las cuentas (son esenciales para los dropdowns)
        await loadAccounts(userData.id);
        console.log('Cuentas cargadas:', accountsData.length);
        
        // Luego cargar el resto de datos en paralelo
        await Promise.all([
            loadTransactions(userData.id),
            loadInternalTransfers(), // Cargar transferencias internas
            loadCategories(),
            loadPaymentMethods()
        ]);
        
        console.log('Todos los datos cargados correctamente');
        console.log('Transacciones:', transactionsData.length);
        console.log('Transferencias internas:', internalTransfersData.length);
        console.log('Categorías:', categoriesData.length);
        console.log('Métodos de pago:', paymentMethodsData.length);
        
        // Forzar la actualización de la UI
        updateUI();
        
    } catch (error) {
        console.error('Error cargando datos iniciales:', error);
        showNotification('Error al cargar los datos: ' + error.message, 'error');
    } finally {
        isLoading = false;
        showLoadingState(false);
    }
}

// Cargar transferencias internas
async function loadInternalTransfers() {
    try {
        console.log('Cargando transferencias internas...');
        internalTransfersData = await internalTransferService.getAllInternalTransfers() || [];
        console.log('Transferencias internas cargadas:', internalTransfersData.length);
    } catch (error) {
        console.error('Error cargando transferencias internas:', error);
        internalTransfersData = [];
    }
}

// Actualizar toda la UI después de cargar los datos
function updateUI() {
    populateAccountFilter();
    populateAccountDropdowns();
    populateCategoryDropdown();
    populatePaymentMethodDropdown();
    updateTransactionsList();
}

// Cargar transacciones
async function loadTransactions(userId) {
    try {
        console.log('Cargando transacciones...');
        transactionsData = await transactionService.getTransactionsByUserId(userId) || [];
        console.log('Transacciones cargadas:', transactionsData.length);
    } catch (error) {
        console.error('Error cargando transacciones:', error);
        showNotification('Error al cargar transacciones', 'error');
        transactionsData = [];
        throw error;
    }
}

// Cargar cuentas
async function loadAccounts(userId) {
    try {
        console.log('Cargando cuentas...');
        accountsData = await accountService.getAccountsByUserId(userId) || [];
        console.log('Cuentas cargadas:', accountsData.length);
        
        // Si no hay cuentas, mostrar advertencia
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

// Cargar categorías
async function loadCategories() {
    try {
        console.log('Cargando categorías...');
        categoriesData = await categoryService.getCategories() || [];
        console.log('Categorías cargadas:', categoriesData.length);
    } catch (error) {
        console.error('Error cargando categorías:', error);
        showNotification('Error al cargar categorías', 'error');
        categoriesData = [];
        throw error;
    }
}

// Cargar métodos de pago
async function loadPaymentMethods() {
    try {
        console.log('Cargando métodos de pago...');
        paymentMethodsData = await fetchAPI('/api/v1/payment-methods/all') || [
            { id: 1, name: 'Efectivo' },
            { id: 2, name: 'Tarjeta de Débito' },
            { id: 3, name: 'Tarjeta de Crédito' },
            { id: 4, name: 'Transferencia Bancaria' }
        ];
        console.log('Métodos de pago cargados:', paymentMethodsData.length);
    } catch (error) {
        console.error('Error cargando métodos de pago:', error);
        paymentMethodsData = [
            { id: 1, name: 'Efectivo' },
            { id: 2, name: 'Tarjeta de Débito' },
            { id: 3, name: 'Tarjeta de Crédito' },
            { id: 4, name: 'Transferencia Bancaria' }
        ];
    }
}

// Poblar dropdown de filtro de cuentas
function populateAccountFilter() {
    const accountFilter = document.getElementById('filter-account');
    if (!accountFilter) {
        console.error('Elemento filter-account no encontrado');
        return;
    }
    
    console.log('Poblando filtro de cuentas con', accountsData.length, 'cuentas');
    
    // Limpiar opciones excepto la primera
    accountFilter.innerHTML = '<option value="">Todas las cuentas</option>';
    
    // Agregar cuentas
    accountsData.forEach(account => {
        const option = document.createElement('option');
        option.value = account.id;
        option.textContent = account.name || `Cuenta ${account.id}`;
        accountFilter.appendChild(option);
    });
    
    console.log('Filtro de cuentas poblado con', accountFilter.options.length, 'opciones');
}

// Poblar dropdowns de cuentas
function populateAccountDropdowns() {
    const dropdowns = [
        'transaction-account',
        'transfer-origin-account',
        'transfer-destination-account'
    ];
    
    console.log('Poblando dropdowns de cuentas con', accountsData.length, 'cuentas');
    
    dropdowns.forEach(dropdownId => {
        const dropdown = document.getElementById(dropdownId);
        if (!dropdown) {
            console.error('Elemento', dropdownId, 'no encontrado');
            return;
        }
        
        // Limpiar opciones
        dropdown.innerHTML = dropdownId === 'transaction-account' ? 
            '<option value="">Selecciona una cuenta</option>' :
            '<option value="">Selecciona cuenta</option>';
        
        // Agregar cuentas
        accountsData.forEach(account => {
            const option = document.createElement('option');
            option.value = account.id;
            option.textContent = account.name || `Cuenta ${account.id}`;
            dropdown.appendChild(option);
        });
        
        console.log('Dropdown', dropdownId, 'poblado con', dropdown.options.length, 'opciones');
    });
}

// Poblar dropdown de categorías
function populateCategoryDropdown() {
    const dropdown = document.getElementById('transaction-category');
    if (!dropdown) {
        console.error('Elemento transaction-category no encontrado');
        return;
    }
    
    console.log('Poblando dropdown de categorías con', categoriesData.length, 'categorías');
    
    // Limpiar opciones
    dropdown.innerHTML = '<option value="">Selecciona una categoría</option>';
    
    // Agregar categorías
    categoriesData.forEach(category => {
        const option = document.createElement('option');
        option.value = category.id;
        option.textContent = category.name || `Categoría ${category.id}`;
        dropdown.appendChild(option);
    });
    
    console.log('Dropdown de categorías poblado con', dropdown.options.length, 'opciones');
}

// Poblar dropdown de métodos de pago
function populatePaymentMethodDropdown() {
    const dropdown = document.getElementById('transaction-payment-method');
    if (!dropdown) {
        console.error('Elemento transaction-payment-method no encontrado');
        return;
    }
    
    console.log('Poblando dropdown de métodos de pago con', paymentMethodsData.length, 'métodos');
    
    // Limpiar opciones
    dropdown.innerHTML = '<option value="">Selecciona un método de pago</option>';
    
    // Agregar métodos de pago
    paymentMethodsData.forEach(method => {
        const option = document.createElement('option');
        option.value = method.id;
        option.textContent = method.name;
        dropdown.appendChild(option);
    });
    
    console.log('Dropdown de métodos de pago poblado con', dropdown.options.length, 'opciones');
}

// Abrir modal para agregar transacción
function openTransactionModal() {
    // Verificar que tenemos cuentas cargadas
    if (accountsData.length === 0) {
        showNotification('Primero debes crear una cuenta', 'warning');
        return;
    }
    
    const modal = document.getElementById('transaction-modal');
    const form = document.getElementById('transaction-form');
    
    // Desactivar autocompletar
    form.setAttribute('autocomplete', 'off');
    
    // Limpiar formulario
    form.reset();
    setCurrentDate();
    
    // Mostrar modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Enfocar el primer campo
    setTimeout(() => {
        document.getElementById('transaction-type').focus();
    }, 100);
}

// Abrir modal para transferencia
function openTransferModal() {
    // Verificar que tenemos al menos 2 cuentas
    if (accountsData.length < 2) {
        showNotification('Necesitas al menos 2 cuentas para hacer transferencias', 'warning');
        return;
    }
    
    const modal = document.getElementById('transfer-modal');
    const form = document.getElementById('transfer-form');
    
    // Desactivar autocompletar
    form.setAttribute('autocomplete', 'off');
    
    // Limpiar formulario
    form.reset();
    setCurrentDate();
    
    // Mostrar modal
    modal.classList.add('show');
    document.body.style.overflow = 'hidden';
    
    // Enfocar el primer campo
    setTimeout(() => {
        document.getElementById('transfer-amount').focus();
    }, 100);
}

// Abrir modal de confirmación para eliminar - MODIFICADO
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

// Cerrar todos los modales
function closeModals() {
    const modals = document.querySelectorAll('.modal');
    modals.forEach(modal => {
        modal.classList.remove('show');
    });
    document.body.style.overflow = 'auto';
    currentTransactionId = null;
    currentIsTransfer = false;
}

// Obtener todas las transacciones (normales + transferencias)
function getAllTransactions() {
    const transferTransactions = internalTransfersData.map(transfer => ({
        id: transfer.id,
        type: 'TRANSFER',
        amount: transfer.amount,
        description: `${transfer.originAccountName} → ${transfer.destinationAccountName}`,
        date: transfer.date,
        accountName: transfer.originAccountName,
        categoryName: 'Transferencia',
        paymentMethodName: 'Transferencia Interna',
        isInternalTransfer: true,
        transferData: transfer
    }));

    const allTransactions = [...transactionsData, ...transferTransactions];
    
    return allTransactions.sort((a, b) => b.id - a.id);
}

// Filtrar transacciones - CORREGIDO
function filterTransactions() {
    const searchTerm = document.getElementById('search-transactions').value.toLowerCase();
    const typeFilterValue = document.getElementById('filter-type').value;
    const accountFilter = document.getElementById('filter-account');
    const accountFilterValue = accountFilter.value;
    const accountFilterText = accountFilter.options[accountFilter.selectedIndex].text;
    
    let allTransactions = getAllTransactions();
    let filteredTransactions = allTransactions;
    
    // Aplicar filtros
    if (searchTerm) {
        filteredTransactions = filteredTransactions.filter(transaction =>
            transaction.description.toLowerCase().includes(searchTerm)
        );
    }
    
    if (typeFilterValue) {
        filteredTransactions = filteredTransactions.filter(transaction =>
            transaction.type === typeFilterValue
        );
    }

if (accountFilterValue) {
        // Obtener el nombre de la cuenta seleccionada
        const accountOption = document.querySelector(`#filter-account option[value="${accountFilterValue}"]`);
        const accountName = accountOption ? accountOption.textContent : '';
        
        filteredTransactions = filteredTransactions.filter(transaction =>
            transaction.accountName === accountName
        );
    }
    
    updateTransactionsList(filteredTransactions);
}

// Actualizar lista de transacciones en la UI - MODIFICADO
function updateTransactionsList(transactions = null) {
    const transactionsList = document.getElementById('transactions-list');
    const pagination = document.getElementById('pagination');
    const pageInfo = document.getElementById('page-info');
    const prevPageBtn = document.getElementById('prev-page');
    const nextPageBtn = document.getElementById('next-page');
    
    if (!transactionsList) return;
    
    // Usar transacciones proporcionadas o todas
    const displayTransactions = transactions || getAllTransactions();
    
    // Calcular paginación
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
        
        // Reconfigurar evento del botón
        const firstTransactionBtn = document.getElementById('first-transaction-btn');
        if (firstTransactionBtn) {
            firstTransactionBtn.addEventListener('click', function() {
                openTransactionModal();
            });
        }
        
        return;
    }
    
    pagination.style.display = 'flex';
    
    let transactionsHTML = '';
    
    paginatedTransactions.forEach(transaction => {
        // Determinar tipo de transacción
        let typeClass = '';
        let iconClass = '';
        
        if (transaction.type === 'INCOME') {
            typeClass = 'income';
            iconClass = 'fa-arrow-down'; // Entrada de dinero
        } else if (transaction.type === 'EGRESS') {
            typeClass = 'expense';
            iconClass = 'fa-arrow-up'; // Salida de dinero
        } else if (transaction.type === 'TRANSFER') {
            typeClass = 'transfer';
            iconClass = 'fa-exchange-alt';
        }
        
        // Formatear fecha
        const transactionDate = transaction.date ? formatDate(transaction.date) : 'Fecha no disponible';
        console.log(transaction.date);
        
        // Obtener nombre de la cuenta
        const accountName = transaction.accountName || 'Cuenta no disponible';
        
        transactionsHTML += `
<div class="transaction-item ${typeClass}">
    <div class="transaction-icon ${typeClass}">
        <i class="fas ${iconClass}"></i>
    </div>
    <div class="transaction-details">
        <h4 class="transaction-description">${transaction.description || 'Sin descripción'}</h4>
        <div class="transaction-meta">
            <span><i class="fas fa-calendar"></i> ${transactionDate}</span>
            <span><i class="fas fa-wallet"></i> ${accountName}</span>
            ${transaction.categoryName ? `<span><i class="fas fa-tag"></i> ${transaction.categoryName}</span>` : ''}
            ${transaction.paymentMethodName ? `<span class="payment-badge"><i class="fas fa-credit-card"></i> ${transaction.paymentMethodName}</span>` : ''}
        </div>
    </div>
    <div class="transaction-amount ${typeClass}">
        ${transaction.type === 'EGRESS' || transaction.type === 'TRANSFER' ? '-' : ''}${formatCurrency(transaction.amount || 0)}
    </div>
    <div class="transaction-actions">
        <button class="transaction-action-btn delete" data-id="${transaction.id}" data-is-transfer="${transaction.isInternalTransfer || false}">
            <i class="fas fa-trash"></i>
        </button>
    </div>
</div>
        `;
    });
    
    transactionsList.innerHTML = transactionsHTML;
    
    // Actualizar información de paginación
    pageInfo.textContent = `Página ${currentPage} de ${totalPages}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === totalPages;
    
    // Agregar eventos a los botones de eliminar - MODIFICADO
    const deleteButtons = document.querySelectorAll('.transaction-action-btn.delete');
    deleteButtons.forEach(button => {
        button.addEventListener('click', function() {
            const transactionId = this.getAttribute('data-id');
            const isTransfer = this.getAttribute('data-is-transfer') === 'true';
            openDeleteModal(transactionId, isTransfer);
        });
    });
}

// Obtener nombre de categoría
function getCategoryName(categoryId) {
    const category = categoriesData.find(cat => cat.id == categoryId);
    return category ? category.name : 'Categoría desconocida';
}

// Guardar transacción
async function saveTransaction() {
    const saveButton = document.getElementById('save-transaction-btn');
    const type = document.getElementById('transaction-type').value;
    const amount = parseFloat(document.getElementById('transaction-amount').value);
    const description = document.getElementById('transaction-description').value;
    const date = document.getElementById('transaction-date').value;
    const accountId = document.getElementById('transaction-account').value;
    const categoryId = document.getElementById('transaction-category').value;
    const paymentMethodId = document.getElementById('transaction-payment-method').value;
    
    // Validaciones
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
        // Cambiar estado del botón a loading
        const originalText = saveButton.innerHTML;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Guardando...';
        saveButton.disabled = true;
        
        const transactionData = {
            type: type,
            amount: amount,
            description: description,
            date: date,
            accountId: parseInt(accountId),
            categoryId: parseInt(categoryId),
            paymentMethodId: parseInt(paymentMethodId)
        };
        
        console.log('Enviando datos de transacción:', transactionData);
        
        const result = await transactionService.createTransaction(transactionData);
        
        if (result) {
            showNotification('Transacción creada correctamente', 'success');
            closeModals();
            await loadInitialData(); // Recargar todos los datos
        }
        
    } catch (error) {
        console.error('Error guardando transacción:', error);
        showNotification('Error al guardar la transacción', 'error');
    } finally {
        // Restaurar estado del botón
        saveButton.innerHTML = 'Guardar Transacción';
        saveButton.disabled = false;
    }
}

// Guardar transferencia
async function saveTransfer() {
    const saveButton = document.getElementById('save-transfer-btn');
    const amount = parseFloat(document.getElementById('transfer-amount').value);
    const originAccountId = document.getElementById('transfer-origin-account').value;
    const destinationAccountId = document.getElementById('transfer-destination-account').value;
    
    // Validaciones
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
        // Cambiar estado del botón a loading
        const originalText = saveButton.innerHTML;
        saveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
        saveButton.disabled = true;
        
        // Crear el objeto para la transferencia interna
        const transferData = {
            amount: amount,
            originAccountId: parseInt(originAccountId),
            destinationAccountId: parseInt(destinationAccountId)
        };
        
        console.log('Enviando datos de transferencia interna:', transferData);
        
        // Usar el servicio de transferencias internas
        await internalTransferService.createInternalTransfer(transferData);
        
        showNotification('Transferencia interna realizada correctamente', 'success');
        closeModals();
        await loadInitialData(); // Recargar todos los datos
        
    } catch (error) {
        console.error('Error realizando transferencia interna:', error);
        showNotification('Error al realizar la transferencia interna: ' + (error.message || 'Error desconocido'), 'error');
    } finally {
        // Restaurar estado del botón
        saveButton.innerHTML = 'Realizar Transferencia';
        saveButton.disabled = false;
    }
}

// Obtener nombre de cuenta
function getAccountName(accountId) {
    const account = accountsData.find(acc => acc.id == accountId);
    return account ? account.name : 'Cuenta desconocida';
}

// Eliminar transacción - MODIFICADO
async function deleteTransaction(transactionId, isTransfer = false) {
    try {
        // Cambiar estado del botón a loading
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
        
        // Para DELETE, asumimos que si no hay error, fue exitoso
        showNotification(isTransfer ? 'Transferencia eliminada correctamente' : 'Transacción eliminada correctamente', 'success');
        closeModals();
        await loadInitialData(); // Recargar todos los datos
        
    } catch (error) {
        console.error('Error eliminando:', error);
        showNotification(`Error al eliminar ${isTransfer ? 'la transferencia' : 'la transacción'}`, 'error');
    } finally {
        // Restaurar estado del botón
        const confirmButton = document.getElementById('confirm-delete');
        confirmButton.innerHTML = 'Eliminar';
        confirmButton.disabled = false;
    }
}

// Mostrar/ocultar estado de carga
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