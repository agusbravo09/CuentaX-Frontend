let userData = null;

document.addEventListener('DOMContentLoaded', () => {
    
    if (!isUserAuthenticated()) {
        redirectToLogin();
        return;
    }
    
    loadDashboardData();
});

function isUserAuthenticated() {
    return !!getLocalStorage('authToken');
}

async function loadDashboardData() {
    
    try {
        const userEmail = getLocalStorage('userEmail');
        if (!userEmail) {
            showNotification('Error al cargar datos de usuario', 'error');
            return;
        }
        
        showLoadingState(true);
        
        userData = await userService.getUserByEmail(userEmail);
        if (!userData) {
            showNotification('Error al cargar información del usuario', 'error');
            return;
        }
        
        setLocalStorage('currentUser', userData);
        updateUserInfo(userData);
        
        const accounts = await accountService.getAccountsByUserId(userData.id);
        updateAccounts(accounts);
        
        const transactions = await transactionService.getRecentTransactions(userData.id, 5);
        updateRecentTransactions(transactions);
        
        await updateFinancialSummary(accounts, transactions);
        showLoadingState(false);
        
    } catch (error) {
        console.error('Error cargando datos del dashboard:', error);
        showNotification('Error al cargar datos del dashboard', 'error');
        showLoadingState(false);
    }
}

function updateUserInfo(user) {
    const userNameElement = document.getElementById('user-name');
    if (userNameElement && user.name) userNameElement.textContent = user.name;
    updateGreeting();
}

function updateGreeting() {
    const hour = new Date().getHours();
    let greeting = 'Buenos días';
    
    if (hour >= 12 && hour < 19) greeting = 'Buenas tardes';
    else if (hour >= 19 || hour < 5) greeting = 'Buenas noches';
    
    const greetingElement = document.getElementById('greeting-text');
    const userName = document.getElementById('user-name').textContent;
    
    if (greetingElement) {
        greetingElement.innerHTML = `${greeting}, <span id="user-name">${userName}</span> ¿Cómo has estado?`;
    }
}

function updateAccounts(accounts) {
    const accountsList = document.querySelector('.accounts-list');
    if (!accountsList) return;
    
    if (!accounts?.length) {
        accountsList.innerHTML = `
            <div class="no-data">
                <i class="fas fa-wallet"></i>
                <p>No tienes cuentas registradas</p>
                <a href="accounts.html" class="btn-link">Agregar cuenta</a>
            </div>
        `;
        return;
    }
    
    const accountIcons = {
        'bank': { icon: 'fa-university', text: 'Cuenta Bancaria', class: 'bank' },
        'wallet': { icon: 'fa-wallet', text: 'Billetera Virtual', class: 'wallet' },
        'cash': { icon: 'fa-money-bill-wave', text: 'Efectivo', class: 'cash' }
    };
    
    const topAccounts = [...accounts]
        .sort((a, b) => (b.currentBalance || 0) - (a.currentBalance || 0))
        .slice(0, 4);
    
    let accountsHTML = topAccounts.map(account => {
        const typeKey = account.type?.toLowerCase().includes('wallet') ? 'wallet' : 
                       account.type?.toLowerCase().includes('cash') ? 'cash' : 'bank';
        const iconConfig = accountIcons[typeKey] || accountIcons.bank;
        
        return `
            <div class="account-item">
                <div class="account-info">
                    <div class="account-icon ${iconConfig.class}">
                        <i class="fas ${iconConfig.icon}"></i>
                    </div>
                    <div class="account-details">
                        <h4>${account.name || 'Cuenta sin nombre'}</h4>
                        <p>${iconConfig.text}</p>
                    </div>
                </div>
                <div class="account-balance">
                    ${formatCurrency(account.currentBalance || 0)}
                </div>
            </div>
        `;
    }).join('');
    
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

function updateRecentTransactions(transactions) {
    const transactionsList = document.getElementById('transactions-list');
    if (!transactionsList) return;
    
    if (!transactions?.length) {
        transactionsList.innerHTML = `
            <div class="no-data">
                <i class="fas fa-exchange-alt"></i>
                <p>No hay transacciones recientes</p>
                <a href="transactions.html" class="btn-link">Realizar transacción</a>
            </div>
        `;
        return;
    }
    
    const recentTransactions = [...transactions]
        .sort((a, b) => new Date(b.date) - new Date(a.date))
        .slice(0, 5);
    
    const transactionsHTML = recentTransactions.map(transaction => {
        const isIncome = transaction.type && (
            transaction.type.toLowerCase() === 'income' || 
            transaction.type.toLowerCase() === 'ingreso' ||
            transaction.transactionType === 'INCOME'
        );
        
        const typeClass = isIncome ? 'income' : 'expense';
        const iconClass = isIncome ? 'fa-arrow-down income' : 'fa-arrow-up expense';
        const amountClass = isIncome ? 'positive' : 'negative';
        const amountPrefix = isIncome ? '+' : '-';
        const transactionDate = transaction.date ? formatDate(transaction.date) : 'Fecha no disponible';
        
        return `
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
    }).join('');
    
    transactionsList.innerHTML = transactionsHTML;
}

async function updateFinancialSummary(accounts, transactions) {
    if (!accounts) return;
    
    let totalBalance = 0;
    if (accounts.length > 0) {
        totalBalance = accounts.reduce((sum, account) => sum + (account.currentBalance || 0), 0);
    }
    
    const balanceElement = document.getElementById('total-balance-amount');
    if (balanceElement) balanceElement.textContent = formatCurrency(totalBalance);
    
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    let monthlyIncome = 0;
    let monthlyExpenses = 0;
    
    if (transactions?.length) {
        transactions.forEach(transaction => {
            const transactionDate = transaction.date ? new Date(transaction.date) : null;
            if (!transactionDate) return;
            
            if (transactionDate >= startOfMonth && transactionDate <= endOfMonth) {
                const isIncome = transaction.type && (
                    transaction.type.toLowerCase() === 'income' || 
                    transaction.type.toLowerCase() === 'ingreso' ||
                    transaction.transactionType === 'INCOME'
                );
                
                if (isIncome) monthlyIncome += transaction.amount || 0;
                else monthlyExpenses += transaction.amount || 0;
            }
        });
    }
    
    const incomeElement = document.querySelector('.amount.income');
    if (incomeElement) incomeElement.textContent = formatCurrency(monthlyIncome);
    
    const expenseElement = document.querySelector('.amount.expense');
    if (expenseElement) expenseElement.textContent = formatCurrency(monthlyExpenses);
}

function showLoadingState(show) {
    document.body.classList.toggle('loading', show);
}