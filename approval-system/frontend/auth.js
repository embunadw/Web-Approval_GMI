// auth.js 

document.addEventListener('DOMContentLoaded', function () {
    console.log('Auth.js loaded');

    
    if (auth.isAuthenticated()) {
        window.location.href = 'dashboard.html';
        return;
    }

    const loginForm = document.getElementById('loginForm');
    const loginBtn = document.getElementById('loginBtn');


    function showMessage(type, message) {
        let container = document.getElementById('messageContainer');

     
        if (!container) {
            container = document.createElement('div');
            container.id = 'messageContainer';
            container.style.position = 'fixed';
            container.style.top = '20px';
            container.style.right = '20px';
            container.style.zIndex = '99999';
            document.body.appendChild(container);
        }

        let box = document.getElementById('messageBox');

        if (!box) {
            box = document.createElement('div');
            box.id = 'messageBox';
            box.style.minWidth = '230px';
            box.style.padding = '12px 16px';
            box.style.borderRadius = '10px';
            box.style.color = '#fff';
            box.style.fontSize = '15px';
            box.style.fontWeight = '500';
            box.style.boxShadow = '0 4px 12px rgba(0,0,0,0.2)';
            box.style.opacity = '0';
            box.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
            box.style.transform = 'translateY(-10px)';
            container.appendChild(box);
        }

  
        box.style.backgroundColor = type === 'success' ? '#28a745' : '#dc3545';
        box.textContent = message;

    
        box.style.opacity = '1';
        box.style.transform = 'translateY(0)';

        setTimeout(() => {
            box.style.opacity = '0';
            box.style.transform = 'translateY(-10px)';
        }, 5000); 
    }
 
    loginForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        loginBtn.disabled = true;
        loginBtn.textContent = 'Logging in...';

        try {
            const response = await API.auth.login(email, password);

            if (response.success) {
                auth.setToken(response.token);
                auth.setUser(response.user);

 
                showMessage('success', 'Login successful! Redirecting to dashboard');

                setTimeout(() => {
                    window.location.href = 'dashboard.html';
                }, 1500);

            } else {
                // Pesan error
                showMessage('error', response.message || 'Login failed!');
            }

        } catch (error) {
            showMessage('error', 'An error occurred. Please try again.');
            console.error(error);
        } finally {
            loginBtn.disabled = false;
            loginBtn.textContent = 'Login';
        }
    });

    console.log('Login form handler attached');
});
