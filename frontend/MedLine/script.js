document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('loginForm');
    const rememberCheckbox = document.getElementById('remember');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = emailInput.value;
        const password = passwordInput.value;
        
        if (!email || !password) {
            alert('Lütfen tüm alanları doldurun!');
            return;
        }

        if (rememberCheckbox.checked) {
            localStorage.setItem('rememberEmail', email);
        } else {
            localStorage.removeItem('rememberEmail');
        }

        try {
            const response = await fetch('http://localhost:3004/api/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (data.success) {
                alert('Giriş başarılı!');
                window.location.href = 'dashboard.html';
            } else {
                alert(data.message || 'Giriş başarısız!');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('Sunucu ile bağlantı kurulamadı!');
        }
    });

    const savedEmail = localStorage.getItem('rememberEmail');
    if (savedEmail) {
        emailInput.value = savedEmail;
        rememberCheckbox.checked = true;
    }
});
