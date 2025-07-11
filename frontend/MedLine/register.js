document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('registerForm');
    const termsCheckbox = document.getElementById('terms');

    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const formData = {
            name: document.getElementById('name').value,
            surname: document.getElementById('surname').value,
            email: document.getElementById('email').value,
            password: document.getElementById('password').value,
            confirmPassword: document.getElementById('confirmPassword').value
        };

        if (!termsCheckbox.checked) {
            alert('Lütfen kullanım şartlarını kabul edin!');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            alert('Şifreler uyuşmuyor!');
            return;
        }

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(formData.email)) {
            alert('Geçersiz email adresi!');
            return;
        }

        try {
            const response = await fetch('http://localhost:3005/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: formData.name,
                    surname: formData.surname,
                    email: formData.email,
                    password: formData.password
                })
            });

            const data = await response.json();

            if (data.success) {
                alert('Kayıt başarılı!');
                window.location.href = 'login.html';
            } else {
                alert(data.message || 'Kayıt başarısız!');
            }
        } catch (error) {
            console.error('Registration error:', error);
            alert('Sunucu ile bağlantı kurulamadı!');
        }
    });
});
