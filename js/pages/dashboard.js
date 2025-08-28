// dashboard.js - Versión modificada sin transferencias internas
console.log('Dashboard cargado');

// Variables globales
let userData = null;

document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM cargado - Inicializando dashboard');
    
    // Verificar autenticación
    if (!isUserAuthenticated()) {
        redirectToLogin();
        return;
    }
    
    // Cargar datos del dashboard
    loadDashboardData();
});

// Verificar si el usuario está autenticado
function isUserAuthenticated() {
    const token = getLocalStorage('authToken');
    if (!token) {
        console.log('No hay token de autenticación');
        return false;
    }
    return true;
}

// Configurar menú hamburguesa
function setupHamburgerMenu() {
    const hamburgerMenu = document.getElementById('hamburger-menu');
    const dropdownMenu = document.getElementById('dropdown-menu');
    
    if (!hamburgerMenu || !dropdownMenu) return;
    
    hamburgerMenu.addEventListener('click', function(e) {
        e.stopPropagation();
        dropdownMenu.classList.toggle('show');
    });
    
    // Cerrar menú al hacer clic fuera
    document.addEventListener('click', function(e) {
        if (dropdownMenu.classList.contains('show') && 
            !hamburgerMenu.contains(e.target) && 
            !dropdownMenu.contains(e.target)) {
            dropdownMenu.classList.remove('show');
        }
    });
}

// Configurar funcionalidad de logout
function setupLogout() {
    const logoutBtn = document.getElementById('logout-btn');
    if (!logoutBtn) return;
    
    logoutBtn.addEventListener('click', function() {
        // Limpiar localStorage
        removeLocalStorage('authToken');
        removeLocalStorage('userEmail');
        removeLocalStorage('currentUser');
        
        // Redirigir al login
        redirectToLogin();
    });
}

// Cargar todos los datos del dashboard
async function loadDashboardData() {
    console.log('Cargando datos del dashboard...');
    
    try {
        // Obtener email del usuario logueado
        const userEmail = getLocalStorage('userEmail');
        if (!userEmail) {
            showNotification('Error al cargar datos de usuario', 'error');
            return;
        }
        
        // Mostrar loading state
        showLoadingState(true);
        
        // 1. Obtener datos del usuario
        userData = await userService.getUserByEmail(userEmail);
        if (!userData) {
            showNotification('Error al cargar información del usuario', 'error');
            return;
        }
        
        // Guardar datos completos del usuario
        setLocalStorage('currentUser', userData);
        
        // 2. Actualizar UI con datos del usuario
        updateUserInfo(userData);
        
        // 3. Cargar cuentas del usuario y mostrar solo las 4 con mayor saldo
        const accounts = await accountService.getAccountsByUserId(userData.id);
        updateAccounts(accounts);
        
        // 4. Cargar solo las últimas 5 transacciones (sin transferencias)
        const transactions = await transactionService.getRecentTransactions(userData.id, 5);
        updateRecentTransactions(transactions);
        
        // 5. Calcular y mostrar resumen financiero
        await updateFinancialSummary(accounts, transactions);
        
        // Ocultar loading state
        showLoadingState(false);
        
    } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
        showNotification('Error al cargar datos del dashboard', 'error');
        showLoadingState(false);
    }
}

// Actualizar información del usuario en la UI
function updateUserInfo(user) {
    // Actualizar nombre de usuario
    const userNameElement = document.getElementById('user-name');
    if (userNameElement && user.name) {
        userNameElement.textContent = user.name;
    }
    
    // Actualizar saludo según la hora del día
    updateGreeting();
}

// Actualizar saludo según la hora
function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = 'Buenos días';
    
    if (hour >= 12 && hour < 19) {
        greeting = 'Buenas tardes';
    } else if (hour >= 19 || hour < 5) {
        greeting = 'Buenas noches';
    }
    
    const greetingElement = document.getElementById('greeting-text');
    const userName = document.getElementById('user-name').textContent;
    
    if (greetingElement) {
        greetingElement.innerHTML = `${greeting}, <span id="user-name">${userName}</span> ¿Cómo has estado?`;
    }
}

// Actualizar lista de cuentas (mostrar solo las 4 con mayor saldo)
function updateAccounts(accounts) {
    const accountsList = document.querySelector('.accounts-list');
    if (!accountsList) return;
    
    if (!accounts || accounts.length === 0) {
        accountsList.innerHTML = `
            <div class="no-data">
                <i class="fas fa-wallet"></i>
                <p>No tienes cuentas registradas</p>
                <a href="accounts.html" class="btn-link">Agregar cuenta</a>
            </div>
        `;
        return;
    }
    
    // Ordenar cuentas por saldo (mayor a menor) y tomar las primeras 4
    const topAccounts = [...accounts]
        .sort((a, b) => (b.currentBalance || 0) - (a.currentBalance || 0))
        .slice(0, 4);
    
    let accountsHTML = '';
    
    topAccounts.forEach(account => {
        // Determinar icono según el tipo de cuenta
        let iconClass = 'fa-university'; // Por defecto
        let accountType = 'Cuenta Bancaria';
        let iconBackground = 'bank';
        if (account.type && account.type.toLowerCase().includes('wallet')) {
            iconClass = 'fa-wallet';
            accountType = 'Billetera Virtual';
            iconBackground = 'wallet';
        } else if (account.type && account.type.toLowerCase().includes('cash')) {
            iconClass = 'fa-money-bill-wave';
            iconBackground = 'cash';
            accountType = 'Efectivo';
        }
        
        accountsHTML += `
            <div class="account-item">
                <div class="account-info">
                    <div class="account-icon ${iconBackground}">
                        <i class="fas ${iconClass}"></i>
                    </div>
                    <div class="account-details">
                        <h4>${account.name || 'Cuenta sin nombre'}</h4>
                        <p>${accountType || 'Cuenta'}</p>
                    </div>
                </div>
                <div class="account-balance">
                    ${formatCurrency(account.currentBalance || 0)}
                </div>
            </div>
        `;
    });
    
    // Si hay más de 4 cuentas, mostrar mensaje
    if (accounts.length > 4) {
        accountsHTML += `
            <div class="more-accounts">
                <p>Y ${accounts.length - 4} cuenta(s) más...</p>
                <a href="accounts.html" class="btn-link">Ver todas</a>
            </div>
        `;
    }
    
    accountsList.innerHTML = accountsHTML;
}

// Actualizar transacciones recientes (solo las últimas 5 transacciones normales)
function updateRecentTransactions(transactions) {
    const transactionsList = document.getElementById('transactions-list');
    if (!transactionsList) return;
    
    if (!transactions || transactions.length === 0) {
        transactionsList.innerHTML = `
            <div class="no-data">
                <i class="fas fa-exchange-alt"></i>
                <p>No hay transacciones recientes</p>
                <a href="transactions.html" class="btn-link">Realizar transacción</a>
            </div>
        `;
        return;
    }
    
    // Limitar a solo las últimas 5 transacciones
    const recentTransactions = [...transactions]
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .slice(0, 5);
    
    let transactionsHTML = '';
    
    recentTransactions.forEach(transaction => {
        // Determinar si es ingreso o gasto
        const isIncome = transaction.type && (
            transaction.type.toLowerCase() === 'income' || 
            transaction.type.toLowerCase() === 'ingreso' ||
            transaction.transactionType === 'INCOME'
        );
        
        const typeClass = isIncome ? 'income' : 'expense';
        const iconClass = isIncome ? 'fa-arrow-down income' : 'fa-arrow-up expense';
        const amountClass = isIncome ? 'positive' : 'negative';
        const amountPrefix = isIncome ? '+' : '-';
        
        // Formatear fecha
        const transactionDate = transaction.date ? formatDate(transaction.date) : 'Fecha no disponible';
        
        transactionsHTML += `
            <div class="transaction-item ${typeClass}">
                <div class="transaction-icon ${typeClass}">
                    <i class="fas ${iconClass}"></i>
                </div>
                <div class="transaction-details">
                    <h4>${transaction.description || 'Transacción sin descripción'}</h4>
                    <p>${transactionDate} · ${transaction.categoryName || 'Sin categoría'}</p>
                </div>
                <div class="transaction-amount ${amountClass}">
                    ${amountPrefix}${formatCurrency(transaction.amount || 0)}
                </div>
            </div>
        `;
    });
    
    transactionsList.innerHTML = transactionsHTML;
}

// Calcular y actualizar resumen financiero
async function updateFinancialSummary(accounts, transactions) {
    if (!accounts) return;
    
    // Calcular balance total
    let totalBalance = 0;
    if (accounts.length > 0) {
        totalBalance = accounts.reduce((sum, account) => sum + (account.currentBalance || 0), 0);
    }
    
    // Actualizar balance total
    const balanceElement = document.getElementById('total-balance-amount');
    if (balanceElement) {
        balanceElement.textContent = formatCurrency(totalBalance);
    }
    
    // Calcular ingresos y gastos del mes actual
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    let monthlyIncome = 0;
    let monthlyExpenses = 0;
    
    if (transactions && transactions.length > 0) {
        transactions.forEach(transaction => {
            // Obtener la fecha de la transacción
            const transactionDate = transaction.date ? new Date(transaction.date) : null;

            if (!transactionDate) {
                console.warn('Transacción sin fecha válida:', transaction);
                return;
            }
            
            // Verificar si la transacción es del mes actual
            if (transactionDate >= startOfMonth && transactionDate <= endOfMonth) {
                // Determinar si es ingreso o gasto
                const isIncome = transaction.type && (
                    transaction.type.toLowerCase() === 'income' || 
                    transaction.type.toLowerCase() === 'ingreso' ||
                    transaction.transactionType === 'INCOME'
                );
                
                if (isIncome) {
                    monthlyIncome += transaction.amount || 0;
                } else {
                    monthlyExpenses += transaction.amount || 0;
                }
            }
        });
    }
    
    // Actualizar ingresos mensuales
    const incomeElement = document.querySelector('.amount.income');
    if (incomeElement) {
        incomeElement.textContent = formatCurrency(monthlyIncome);
    }
    
    // Actualizar gastos mensuales
    const expenseElement = document.querySelector('.amount.expense');
    if (expenseElement) {
        expenseElement.textContent = formatCurrency(monthlyExpenses);
    }
}

// Mostrar/ocultar estado de carga
function showLoadingState(show) {
    if (show) {
        console.log('Mostrando estado de carga...');
        document.body.classList.add('loading');
    } else {
        console.log('Ocultando estado de carga...');
        document.body.classList.remove('loading');
    }
}