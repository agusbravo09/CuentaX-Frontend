// auth-api.js - Servicio de autenticación

const API_BASE_URL = 'http://localhost:8080';

async function login(email, password) {
    
    try {
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
                return { 
                    success: true, 
                    data: userData,
                    authToken: credentials
                };
            } else {
                return { 
                    success: true, 
                    data: { email: email, name: email.split('@')[0] },
                    authToken: credentials
                };
            }
        } else if (response.status === 401) {
            return { 
                success: false, 
                error: 'Credenciales inválidas. Verifica tu email y contraseña.'
               
            };
        } else {
            return { 
                success: false, 
                error: 'Error del servidor. Intenta nuevamente.' 
            };
        }
    } catch (error) {
        console.error('Error en login:', error);
        return { 
            success: false, 
            error: 'Error de conexión. Verifica que el servidor esté funcionando.' 
        };
    }
}

async function register(userData) {
    
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
            let errorMessage = 'Error al crear la cuenta. Intenta nuevamente.';
            
            try {
                const errorData = JSON.parse(errorText);
                errorMessage = errorData.message || errorMessage;
            } catch (e) {
                if (errorText) errorMessage = errorText;
            }
            
            return { success: false, error: errorMessage };
        }
    } catch (error) {
        console.error('Error en registro:', error);
        return { 
            success: false, 
            error: 'Error de conexión. Verifica que el servidor esté funcionando.' 
        };
    }
}