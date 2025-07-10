document.addEventListener('DOMContentLoaded', () => {
    // Update user name in the dashboard
    const usernameElement = document.querySelector('.username');
    const user = JSON.parse(localStorage.getItem('user')) || { name: 'Admin', surname: 'Kullanıcı' };
    usernameElement.textContent = `${user.name} ${user.surname}`;

    // Handle sidebar navigation
    const navLinks = document.querySelectorAll('nav ul li a');
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            // Add your navigation logic here
            console.log(`Navigating to: ${link.textContent.trim()}`);
        });
    });

    // Handle search functionality
    const searchInput = document.querySelector('.search-bar input');
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        // Add your search logic here
        console.log(`Searching for: ${searchTerm}`);
    });

    // Handle notifications
    const notifications = document.querySelector('.notifications');
    notifications.addEventListener('click', () => {
        // Add your notification logic here
        console.log('Notifications clicked');
    });

    // Handle logout
    const logoutLink = document.querySelector('.logout a');
    logoutLink.addEventListener('click', (e) => {
        e.preventDefault();
        localStorage.removeItem('user');
        window.location.href = 'login.html';
    });

    // Update statistics (in a real app, this would come from an API)
    const stats = {
        totalPatients: 1245,
        todayAppointments: 15,
        newFiles: 7,
        totalAppointments: 548
    };

    Object.entries(stats).forEach(([key, value]) => {
        const statElement = document.querySelector(`.stat-info:has(h3:contains(${key})) p`);
        if (statElement) {
            statElement.textContent = value;
        }
    });

    // Update appointments (in a real app, this would come from an API)
    const appointments = [
        {
            name: 'Ali Veli',
            date: '10 Temmuz 2025, 14:00',
            status: 'pending'
        },
        {
            name: 'Ayşe Yılmaz',
            date: '10 Temmuz 2025, 15:00',
            status: 'completed'
        },
        {
            name: 'Hasan Uğur',
            date: '11 Temmuz 2025, 10:00',
            status: 'pending'
        }
    ];

    const appointmentsGrid = document.querySelector('.appointments-grid');
    appointments.forEach(appointment => {
        const appointmentCard = document.createElement('div');
        appointmentCard.className = 'appointment-card';
        appointmentCard.innerHTML = `
            <div class="appointment-info">
                <h3>${appointment.name}</h3>
                <p class="date">${appointment.date}</p>
                <p class="status ${appointment.status}">${appointment.status === 'pending' ? 'Bekliyor' : 'Tamamlandı'}</p>
            </div>
        `;
        appointmentsGrid.appendChild(appointmentCard);
    });
});
