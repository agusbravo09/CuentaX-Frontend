class StorageService {
    static setItem(key, value) {
        try {
            localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
            console.error('Error al guardar en localStorage:', error);
        }
    }

    static getItem(key) {
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : null;
        } catch (error) {
            console.error('Error al obtener de localStorage:', error);
            return null;
        }
    }

    static removeItem(key) {
        try {
            localStorage.removeItem(key);
        } catch (error) {
            console.error('Error al eliminar de localStorage:', error);
        }
    }

    // Métodos específicos para la autenticación
    static setUser(user) {
        this.setItem('currentUser', user);
    }

    static getUser() {
        return this.getItem('currentUser');
    }

    static setAuthCredentials(email, password) {
        // Almacenar credenciales codificadas para futuras requests
        const authToken = btoa(`${email}:${password}`);
        this.setItem('authToken', authToken);
        this.setItem('userEmail', email);
    }

    static getAuthToken() {
        return this.getItem('authToken');
    }

    static getUserEmail() {
        return this.getItem('userEmail');
    }

    static clearAuth() {
        this.removeItem('currentUser');
        this.removeItem('authToken');
        this.removeItem('userEmail');
    }

    static isLoggedIn() {
        return this.getAuthToken() !== null;
    }
}