// API Configuration
const API_BASE = "https://movo-cwim.onrender.com/api/orders";
const AUTH_HEADER = { 
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
};

const ordersTable = document.getElementById('orders-body');
const orderModal = document.getElementById('order-modal');
const closeModalBtn = document.querySelector('.close-modal');
const backBtn = document.getElementById('back-btn');
const cancelBtn = document.getElementById('cancel-btn');
const confirmBtn = document.getElementById('confirm-btn');
const prevPageBtn = document.getElementById('prev-page');
const nextPageBtn = document.getElementById('next-page');
const pageInfo = document.getElementById('page-info');
const filterButtons = document.querySelectorAll('.filter-btn');

// State Management
let currentPage = 1;
const ordersPerPage = 10;
let isLoading = false;
let currentFilter = 'all';
let totalOrders = 0;
let currentOrderId = null;

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
  loadOrders();
  setupEventListeners();
});

// Event Listeners Setup
function setupEventListeners() {
  closeModalBtn.addEventListener('click', closeModal);
  backBtn.addEventListener('click', closeModal);
  window.addEventListener('click', (e) => e.target === orderModal && closeModal());
  document.addEventListener('keydown', (e) => e.key === 'Escape' && closeModal());
  
  cancelBtn.addEventListener('click', () => updateOrderStatus('canceled'));
  confirmBtn.addEventListener('click', () => updateOrderStatus('confirmed'));
  
  prevPageBtn.addEventListener('click', goToPreviousPage);
  nextPageBtn.addEventListener('click', goToNextPage);
  
  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filterButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.status;
      currentPage = 1;
      loadOrders();
    });
  });
}

function closeModal() {
  orderModal.style.display = 'none';
  document.body.style.overflow = 'auto';
}

function openOrderModal(orderId) {
  fetchOrderDetails(orderId);
  orderModal.style.display = 'block';
  document.body.style.overflow = 'hidden';
}

// Loading Indicators
function showLoadingIndicator() {
  document.getElementById('orders-body').innerHTML = `
    <tr>
      <td colspan="6" class="loading-indicator">
        <i class="fas fa-spinner fa-spin"></i> Loading orders...
      </td>
    </tr>
  `;
}

function hideLoadingIndicator() {
  const loadingElement = document.querySelector('.loading-indicator');
  if (loadingElement) {
    loadingElement.remove();
  }
}

async function loadOrders() {
  if (isLoading) return;
  isLoading = true;
  
  try {
    showLoadingIndicator();
    
    let url = `${API_BASE}?page=${currentPage}&limit=${ordersPerPage}`;
    if (currentFilter !== 'all') url += `&status=${currentFilter}`;
    
    const response = await fetch(url, { headers: AUTH_HEADER });
    const data = await response.json();

    if (!response.ok) throw new Error(data.message || `HTTP error! status: ${response.status}`);

    totalOrders = data.total || 0;
    renderOrders(data.data || []);
    updatePaginationControls();
  } catch (error) {
    showNotification(`Error loading orders: ${error.message}`, 'error');
  } finally {
    isLoading = false;
    hideLoadingIndicator();
  }
}

async function fetchOrderDetails(orderId) {
  try {
    const response = await fetch(`${API_BASE}/${orderId}`, { headers: AUTH_HEADER });
    const data = await response.json();

    if (!response.ok) throw new Error(data.message || `HTTP error! status: ${response.status}`);

    const order = data.data || data;
    if (!order) throw new Error('Order data not found in response');

    document.getElementById('order-id').textContent = `#${order._id ? order._id.slice(-6).toUpperCase() : 'N/A'}`;
    document.getElementById('customer-name').textContent = `${order.firstName || ''} ${order.lastName || ''}`.trim() || 'N/A';
    document.getElementById('customer-phone').textContent = order.phoneNumber || 'N/A';
    document.getElementById('customer-address').textContent = order.address || 'N/A';
    
    const status = order.status || 'unknown';
    document.getElementById('order-status').textContent = capitalizeFirst(status);
    document.getElementById('order-status').className = `info-value status-badge status-${status}`;
    
    document.getElementById('order-date').textContent = order.createdAt ? 
      new Date(order.createdAt).toLocaleString() : 'N/A';

    const itemsBody = document.getElementById('order-items-body');
    itemsBody.innerHTML = (order.cartItems || []).map(item => `
      <tr>
        <td>${item.productId?.name || item.productName || 'Product not available'}</td>
        <td>${(item.price || 0).toFixed(2)}</td>
        <td>${item.quantity || 0}</td>
        <td>${((item.price || 0) * (item.quantity || 0)).toFixed(2)}</td>
      </tr>
    `).join('');

    const totalPrice = order.totalPrice || 0;
    document.getElementById('subtotal-price').textContent = `${totalPrice.toFixed(2)}`;
    document.getElementById('total-price').textContent = `${totalPrice.toFixed(2)}`;

    const isPending = status.toLowerCase() === 'pending';
    cancelBtn.style.display = isPending ? 'block' : 'none';
    confirmBtn.style.display = isPending ? 'block' : 'none';

  } catch (error) {
    console.error('Error loading order details:', error);
    showNotification(`Error loading order details: ${error.message}`, 'error');
    closeModal();
  }
}

function renderOrders(orders) {
  if (orders.length === 0) {
    ordersTable.innerHTML = `<tr><td colspan="6" class="no-orders">No orders found</td></tr>`;
    return;
  }
  
  ordersTable.innerHTML = orders.map(order => `
    <tr>
      <td>#${order._id.slice(-6).toUpperCase()}</td>
      <td>${order.firstName} ${order.lastName}</td>
      <td>${new Date(order.createdAt).toLocaleDateString()}</td>
      <td>${order.totalPrice.toFixed(2)}</td>
      <td><span class="status-badge status-${order.status}">${capitalizeFirst(order.status)}</span></td>
      <td>
        <button class="action-btn view-btn" data-order-id="${order._id}">
          <i class="fas fa-eye"></i> View
        </button>
      </td>
    </tr>
  `).join('');

  document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      currentOrderId = btn.dataset.orderId;
      openOrderModal(currentOrderId);
    });
  });
}

async function updateOrderStatus(newStatus) {
  if (!currentOrderId) return;
  
  try {
    setActionButtonsLoading(true);
    
    const response = await fetch(`${API_BASE}/${currentOrderId}/change`, {
      method: 'PATCH',
      headers: AUTH_HEADER,
      body: JSON.stringify({ status: newStatus })
    });
    
    const data = await response.json();
    
    if (!response.ok) throw new Error(data.message || `HTTP error! status: ${response.status}`);

    showNotification(`Order status updated to ${newStatus}`, 'success');
    closeModal();
    loadOrders();
  } catch (error) {
    showNotification(`Failed to update order status: ${error.message}`, 'error');
  } finally {
    setActionButtonsLoading(false);
  }
}

function goToPreviousPage() {
  if (currentPage > 1) {
    currentPage--;
    loadOrders();
  }
}

function goToNextPage() {
  if (currentPage * ordersPerPage < totalOrders) {
    currentPage++;
    loadOrders();
  }
}

function updatePaginationControls() {
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage * ordersPerPage >= totalOrders;
  pageInfo.textContent = `Page ${currentPage}`;
}

function setActionButtonsLoading(isLoading) {
  const loadingHTML = '<i class="fas fa-spinner fa-spin"></i> Processing';
  if (isLoading) {
    cancelBtn.disabled = true;
    confirmBtn.disabled = true;
    cancelBtn.innerHTML = loadingHTML;
    confirmBtn.innerHTML = loadingHTML;
  } else {
    cancelBtn.disabled = false;
    confirmBtn.disabled = false;
    cancelBtn.innerHTML = '<i class="fas fa-times"></i> Cancel Order';
    confirmBtn.innerHTML = '<i class="fas fa-check"></i> Confirm Order';
  }
}

function showNotification(message, type) {
  const notification = document.createElement('div');
  notification.className = `notification ${type}`;
  notification.innerHTML = `
    <i class="fas ${type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}"></i>
    <span>${message}</span>
  `;
  document.body.appendChild(notification);
  setTimeout(() => notification.remove(), 5000);
}

function capitalizeFirst(str) {
  return str?.charAt(0).toUpperCase() + str?.slice(1) || '';
}