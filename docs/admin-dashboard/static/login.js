document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    const resetLink = document.getElementById('resetLink');
    const errorMessage = document.getElementById('errorMessage');

    // Toggle password visibility
    window.togglePasswordVisibility = function() {
        const passwordInput = document.getElementById('password');
        const eyeIcon = document.querySelector('.toggle-password');
        
        if (passwordInput.type === 'password') {
            passwordInput.type = 'text';
            eyeIcon.classList.remove('fa-eye');
            eyeIcon.classList.add('fa-eye-slash');
        } else {
            passwordInput.type = 'password';
            eyeIcon.classList.remove('fa-eye-slash');
            eyeIcon.classList.add('fa-eye');
        }
    };

    // Handle login form submission
    loginForm.addEventListener('submit', async function(e) {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        try {
            const response = await fetch('https://movo-cwim.onrender.com/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Store the token in localStorage or sessionStorage
                localStorage.setItem('token', data.token);
                
                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            } else {
                showError(data.message || 'Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            showError('Something went wrong. Please try again later.');
        }
    });
    
    // Handle reset password link
    resetLink.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'reset.html';
    });
    
    // Function to display error messages
    function showError(message) {
        errorMessage.textContent = message;
        errorMessage.style.display = 'block';
        
        // Hide error after 5 seconds
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 5000);
    }
});