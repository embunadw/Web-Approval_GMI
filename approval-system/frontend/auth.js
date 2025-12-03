// auth.js 

document.addEventListener('DOMContentLoaded', function() {
    console.log('Auth.js loaded');
    
    // Redirect kalo udah login
    if (auth.isAuthenticated()) {
        window.location.href = 'dashboard.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');
    const errorMessage = document.getElementById('errorMessage');

    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        console.log('Attempting login with:', email);

        // Disable button sama show loading
        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';
        errorMessage.classList.remove('show');

        try {
            console.log('Calling API login...');
            const response = await API.auth.login(email, password);
            console.log('Login response:', response);

            if (response.success) {
                // Save token sama user data
                auth.setToken(response.token);
                auth.setUser(response.user);

                console.log('Login successful! Redirecting...');
                // Balik ke dashboard
                window.location.href = 'dashboard.html';
            } else {
                showError('errorMessage', response.message || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('errorMessage', error.message || 'Login failed. Please try again.');
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    });
    
    console.log('Login form handler attached');
});