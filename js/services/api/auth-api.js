const API_BASE_URL = 'http://localhost:8080';

class AuthAPI {
    static async login(email, password) {
        try {
            // Codificar credenciales en Base64 para Basic Auth
            const credentials = btoa(`${email}:${password}`);
            
            const response = await fetch(`${API_BASE_URL}/api/v1/users/all`, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${credentials}`,
                    'Content-Type': 'application/json'
                }
            });

            if (response.ok) {
                const userResponse = await fetch(`${API_BASE_URL}/api/v1/users/email/${encodeURIComponent(email)}`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `Basic ${credentials}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (userResponse.ok) {
                    const userData = await userResponse.json();
                    return { success: true, data: userData };
                } else {
                    return { 
                        success: true, 
                        data: { email: email, name: 'Usuario' } // Datos mínimos si no se puede obtener el perfil
                    };
                }
            } else if (response.status === 401) {
                return { 
                    success: false, 
                    error: 'Credenciales inválidas. Por favor, verifica tu email y contraseña.' 
                };
            } else {
                return { 
                    success: false, 
                    error: 'Error del servidor. Por favor, intenta nuevamente.' 
                };
            }
        } catch (error) {
            console.error('Error en login:', error);
            return { 
                success: false, 
                error: 'Error de conexión. Por favor, verifica que el servidor esté funcionando.' 
            };
        }
    }

    static async register(userData) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(userData)
            });

            if (response.ok) {
                const newUser = await response.json();
                return { success: true, data: newUser };
            } else {
                const errorText = await response.text();
                let errorMessage = 'Error al crear la cuenta. Por favor, intenta nuevamente.';
                
                try {
                    const errorData = JSON.parse(errorText);
                    errorMessage = errorData.message || errorMessage;
                } catch (e) {
                    // Si no es JSON, usar el texto plano
                    if (errorText) {
                        errorMessage = errorText;
                    }
                }
                
                return { 
                    success: false, 
                    error: errorMessage
                };
            }
        } catch (error) {
            console.error('Error en registro:', error);
            return { 
                success: false, 
                error: 'Error de conexión. Por favor, verifica que el servidor esté funcionando.' 
            };
        }
    }

    // Método para verificar si el usuario actual está autenticado
    static async verifyAuth() {
        try {
            const authToken = getLocalStorage('authToken');
            if (!authToken) return false;

            const response = await fetch(`${API_BASE_URL}/api/v1/users/all`, {
                method: 'GET',
                headers: {
                    'Authorization': `Basic ${authToken}`,
                    'Content-Type': 'application/json'
                }
            });

            return response.ok;
        } catch (error) {
            console.error('Error verificando autenticación:', error);
            return false;
        }
    }
}