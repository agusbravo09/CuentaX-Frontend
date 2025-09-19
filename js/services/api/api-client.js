const API_BASE_URL = 'http://localhost:8080';

function getAuthHeader() {
    let authToken = getLocalStorage('authToken');

    if (!authToken) {
        console.error('No hay token de autenticación');
        return null;
    }

    // Si el token es un objeto (no debería serlo), convertirlo a string
    if (typeof authToken === 'object') {
        authToken = JSON.stringify(authToken);
    }

    // Limpiar comillas si las tiene
    authToken = authToken.replace(/^['"]|['"]$/g, '').trim();


    return 'Basic ' + authToken;
}


async function fetchAPI(endpoint, options = {}) {
    const url = API_BASE_URL + endpoint;
    const authHeader = getAuthHeader();

    if (!authHeader) {
        redirectToLogin();
        return null;
    }

    try {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': authHeader,
                ...options.headers,
            },
            ...options,
        };

        if (config.body && typeof config.body === 'object') {
            config.body = JSON.stringify(config.body);
        }

        const response = await fetch(url, config);

        if (response.status === 401) {
            ['authToken', 'userEmail', 'currentUser'].forEach(key => removeLocalStorage(key));
            redirectToLogin();
            return null;
        }

        if (!response.ok) {
            console.warn(`API warning: ${response.status} for ${endpoint}`);
            return null;
        }

        if (response.status === 204) return null;

        return await response.json();
    } catch (error) {
        console.error('Error en la petición API:', error);
        showNotification('Error de conexión con el servidor', 'error');
        return null;
    }
}

const userService = {
    getUserByEmail: (email) => fetchAPI('/api/v1/users/email/' + encodeURIComponent(email)),
    getUserById: (id) => fetchAPI('/api/v1/users/' + id),
    updateUser: (id, userData) => fetchAPI('/api/v1/users/' + id, {
        method: 'PUT',
        body: userData
    })
};

const accountService = {
    getAccountsByUserId: (userId) => fetchAPI('/api/v1/accounts/user/' + userId),
    getAccountById: (id) => fetchAPI('/api/v1/accounts/' + id),
    getAccountBalance: (id) => fetchAPI('/api/v1/accounts/' + id + '/balance'),
    createAccount: (accountData) => fetchAPI('/api/v1/accounts', {
        method: 'POST',
        body: accountData
    }),
    updateAccount: (id, accountData) => fetchAPI('/api/v1/accounts/' + id, {
        method: 'PUT',
        body: accountData
    }),
    deleteAccount: (id) => fetchAPI('/api/v1/accounts/' + id, {
        method: 'DELETE'
    })
};

const transactionService = {
    getTransactionsByUserId: (userId) => fetchAPI('/api/v1/transactions/user/' + userId),
    getRecentTransactions: (userId, limit = 5) =>
        fetchAPI('/api/v1/transactions/user/' + userId + '?limit=' + limit),
    getTransactionsByAccountId: (accountId) =>
        fetchAPI('/api/v1/transactions/account/' + accountId),
    createTransaction: (transactionData) => fetchAPI('/api/v1/transactions', {
        method: 'POST',
        body: transactionData
    }),
    deleteTransaction: async (id) => {
        return await fetchAPI(`/api/v1/transactions/${id}`, {
            method: 'DELETE'
        });
    }
};

const categoryService = {
    getCategories: () => fetchAPI('/api/v1/categories/all'),
    getCategoryById: (id) => fetchAPI('/api/v1/categories/' + id)
};

const internalTransferService = {
    createInternalTransfer: async (transferData) => {
        return await fetchAPI('/api/v1/internal-transfers', {
            method: 'POST',
            body: JSON.stringify(transferData)
        });
    },

    getInternalTransferById: async (id) => {
        return await fetchAPI(`/api/v1/internal-transfers/${id}`);
    },

    deleteInternalTransfer: async (id) => {
        return await fetchAPI(`/api/v1/internal-transfers/${id}`, {
            method: 'DELETE'
        });
    },

    getAllInternalTransfers: async () => {
        return await fetchAPI('/api/v1/internal-transfers/all');
    },

    getTransfersByAccount: async (accountId) => {
        return await fetchAPI(`/api/v1/internal-transfers/account/${accountId}`);
    }
};

const notesService = {
    getAllNotes: () => fetchAPI('/api/v1/notes'),
    getNoteById: (id) => fetchAPI('/api/v1/notes/' + id),
    getNotesByUser: (userId) => fetchAPI('/api/v1/notes/user/' + userId),
    searchByTitle: (title) => fetchAPI('/api/v1/notes/search/title?title=' + encodeURIComponent(title)),
    searchByContent: (content) => fetchAPI('/api/v1/notes/search/content?content=' + encodeURIComponent(content)),
    createNote: (noteData) => fetchAPI('/api/v1/notes', {
        method: 'POST',
        body: noteData
    }),
    updateNote: (id, noteData) => fetchAPI('/api/v1/notes/' + id, {
        method: 'PUT',
        body: noteData
    }),
    deleteNote: (id) => fetchAPI('/api/v1/notes/' + id, {
        method: 'DELETE'
    }),
    addComment: (id, comment) => fetchAPI(`/api/v1/notes/${id}/comment?comment=${encodeURIComponent(comment)}`, {
        method: 'POST'
    })
};