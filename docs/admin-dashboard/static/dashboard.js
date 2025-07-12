document.addEventListener('DOMContentLoaded', function() {
    fetchIncomeData();
});

async function fetchIncomeData() {
    try {
        document.getElementById('income-value').textContent = 'Loading...';

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch('https://movo-cwim.onrender.com/api/finances', {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            if (response.status === 401) {
                window.location.href = '/login';
                return;
            }
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        if (data.success) {
            const income = data.finances.incomes || 0;
            document.getElementById('income-value').textContent = formatCurrency(income);
        } else {
            throw new Error(data.error || 'Failed to fetch income data');
        }
    } catch (error) {
        console.error('Error fetching income data:', error);
        document.getElementById('income-value').textContent = 'Error';
        
        if (error.message.includes('token') || error.message.includes('auth')) {
            window.location.href = 'login.html';
        }
    }
}

function formatCurrency(amount) {
    return amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + 'DA';
}