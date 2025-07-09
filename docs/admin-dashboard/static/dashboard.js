
document.addEventListener('DOMContentLoaded', function() {
    fetchFinancialData();
});

async function fetchFinancialData() {
    try {
        document.getElementById('income-value').textContent = 'Loading...';
        document.getElementById('expense-value').textContent = 'Loading...';
        document.getElementById('benefit-value').textContent = 'Loading...';

        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('No authentication token found');
        }

        const response = await fetch('http://localhost:3000/api/finances', {
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
            const finances = data.finances;
            const income = finances.incomes || 0;
            const expense = finances.expenses || 0;
            const benefit = income - expense;
            

            document.getElementById('income-value').textContent = formatCurrency(income);
            document.getElementById('expense-value').textContent = formatCurrency(expense);
            document.getElementById('benefit-value').textContent = formatCurrency(benefit);
            
            const benefitElement = document.getElementById('benefit-value');
            if (benefit < 0) {
                benefitElement.style.color = 'var(--danger-color)';
            } else if (benefit > 0) {
                benefitElement.style.color = 'var(--success-color)';
            } else {
                benefitElement.style.color = 'var(--warning-color)';
            }
        } else {
            throw new Error(data.error || 'Failed to fetch financial data');
        }
    } catch (error) {
        console.error('Error fetching financial data:', error);
        document.getElementById('income-value').textContent = 'Error';
        document.getElementById('expense-value').textContent = 'Error';
        document.getElementById('benefit-value').textContent = 'Error';
        
        if (error.message.includes('token') || error.message.includes('auth')) {
            window.location.href = 'login.html';
        }
    }
}

function formatCurrency(amount) {
    return amount.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,') + 'DA';
} 