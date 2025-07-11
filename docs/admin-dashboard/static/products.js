
        document.addEventListener('DOMContentLoaded', function() {
    const productsContainer = document.getElementById('products-container');
    const editModal = document.getElementById('edit-product-modal');
    const editForm = document.getElementById('edit-product-form');
    const createModal = document.getElementById('create-product-modal');
    const createForm = document.getElementById('create-product-form');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const cancelEditBtn = document.getElementById('cancel-edit-btn');
    const cancelCreateBtn = document.getElementById('cancel-create-btn');
    const saveProductBtn = document.getElementById('save-product-btn');
    const submitProductBtn = document.getElementById('submit-product-btn');
    const addProductBtn = document.getElementById('add-product-btn');
    const notificationContainer = document.getElementById('notification-container');
    const categorySelect = document.getElementById('create-product-category');
    
    const API_BASE_URL = 'https://movo-ea16.onrender.com/api/products';
    const CATEGORIES_API_URL = 'https://movo-ea16.onrender.com/api/categories';
    let currentProductId = null;

    closeModalBtns.forEach(btn => btn.addEventListener('click', closeAllModals));
    cancelEditBtn.addEventListener('click', closeAllModals);
    cancelCreateBtn.addEventListener('click', closeAllModals);
    addProductBtn.addEventListener('click', openCreateModal);

    fetchProducts();
    fetchCategories();

    function showNotification(message, type = 'success') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas ${type === 'success' ? 'fa-check-circle' : type === 'error' ? 'fa-exclamation-circle' : 'fa-exclamation-triangle'}"></i>
            <span>${message}</span>
        `;
        
        notificationContainer.appendChild(notification);
        
        void notification.offsetWidth;
        
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => {
                notification.remove();
            }, 300);
        }, 5000);
    }

    async function fetchCategories() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                redirectToLogin();
                return;
            }

            const response = await fetch(CATEGORIES_API_URL, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch categories');
            }

            const { categories } = await response.json();
            populateCategoryDropdown(categories);
        } catch (error) {
            console.error('Error fetching categories:', error);
            showNotification('Failed to load categories', 'error');
        }
    }

    function populateCategoryDropdown(categories) {
        categorySelect.innerHTML = '<option value="">Select a category</option>';
        categories.forEach(category => {
            const option = document.createElement('option');
            option.value = category._id;
            option.textContent = category.name;
            categorySelect.appendChild(option);
        });
    }

    async function fetchProducts() {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                redirectToLogin();
                return;
            }

            // Changed this to match the correct endpoint
            const response = await fetch(`${API_BASE_URL}/getallproduct?page=1&limit=10`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                if (response.status === 401) {
                    redirectToLogin();
                    return;
                }
                throw new Error('Failed to fetch products');
            }

            const data = await response.json();
            displayProducts(data.data.products);
        } catch (error) {
            console.error('Error fetching products:', error);
            productsContainer.innerHTML = `
                <div class="error-message" style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                    Failed to load products. Please try again later.
                </div>
            `;
            showNotification('Failed to load products', 'error');
        }
    }

            function displayProducts(products) {
                if (!products || products.length === 0) {
                    productsContainer.innerHTML = `
                        <div style="grid-column: 1/-1; text-align: center; padding: 2rem;">
                            No products found. Click "Add Product" to create one.
                        </div>
                    `;
                    return;
                }

                productsContainer.innerHTML = products.map(product => `
                    <div class="product-card">
                        <img src="${product.image?.url || 'https://via.placeholder.com/300x200?text=No+Image'}" 
                             alt="${product.name}" 
                             class="product-image">
                        <div class="product-info">
                            <h3 class="product-name">${product.name}</h3>
                            <p class="product-description">${product.description || 'No description available'}</p>
                            <div class="product-price">$${product.price?.toFixed(2) || '0.00'}</div>
                            <div class="product-meta">
                                <span>Qty: ${product.quantity || 0}</span>
                                <span>ID: ${product._id?.substring(0, 6)}...</span>
                            </div>
                        </div>
                        <div class="product-actions">
                            <div class="dropdown">
                                <button class="dropdown-btn">
                                    <i class="fas fa-ellipsis-v"></i>
                                </button>
                                <div class="dropdown-content">
                                    <a href="#" class="edit-action" data-id="${product._id}">
                                        <i class="fas fa-edit"></i> Edit
                                    </a>
                                    <a href="#" class="delete-action" data-id="${product._id}">
                                        <i class="fas fa-trash"></i> Delete
                                    </a>
                                </div>
                            </div>
                        </div>
                    </div>
                `).join('');

                document.querySelectorAll('.edit-action').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        const productId = btn.getAttribute('data-id');
                        openEditModal(productId);
                    });
                });

                document.querySelectorAll('.delete-action').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.preventDefault();
                        const productId = btn.getAttribute('data-id');
                        deleteProduct(productId);
                    });
                });
            }

            function openCreateModal() {
                createModal.style.display = 'flex';
            }

            async function openEditModal(productId) {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        redirectToLogin();
                        return;
                    }

                    const response = await fetch(`${API_BASE_URL}/${productId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (!response.ok) {
                        throw new Error('Failed to fetch product details');
                    }

                    const { product } = await response.json();
                    
                    document.getElementById('edit-product-id').value = product._id;
                    document.getElementById('edit-product-name').value = product.name;
                    document.getElementById('edit-product-description').value = product.description || '';
                    document.getElementById('edit-product-price').value = product.price;
                    document.getElementById('edit-product-quantity').value = product.quantity || 1;
                    
                    const currentImage = document.getElementById('current-product-image');
                    if (product.image?.url) {
                        currentImage.src = product.image.url;
                        currentImage.style.display = 'block';
                    } else {
                        currentImage.style.display = 'none';
                    }

                    currentProductId = product._id;
                    editModal.style.display = 'flex';
                } catch (error) {
                    console.error('Error opening edit modal:', error);
                    showNotification('Failed to load product details', 'error');
                }
            }

            function closeAllModals() {
                editModal.style.display = 'none';
                createModal.style.display = 'none';
                editForm.reset();
                createForm.reset();
                currentProductId = null;
            }

            async function deleteProduct(productId) {
                if (!confirm('Are you sure you want to delete this product?')) {
                    return;
                }

                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        redirectToLogin();
                        return;
                    }

                    const response = await fetch(`${API_BASE_URL}/${productId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to delete product');
                    }

                    showNotification('Product deleted successfully');
                    fetchProducts();
                } catch (error) {
                    console.error('Error deleting product:', error);
                    showNotification(error.message || 'Failed to delete product', 'error');
                }
            }

            saveProductBtn.addEventListener('click', async () => {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        redirectToLogin();
                        return;
                    }

                    const formData = new FormData();
                    formData.append('name', document.getElementById('edit-product-name').value);
                    formData.append('description', document.getElementById('edit-product-description').value);
                    formData.append('price', document.getElementById('edit-product-price').value);
                    formData.append('quantity', document.getElementById('edit-product-quantity').value);
                    
                    const imageInput = document.getElementById('edit-product-image');
                    if (imageInput.files[0]) {
                        formData.append('image', imageInput.files[0]);
                    }

                    const response = await fetch(`${API_BASE_URL}/${currentProductId}`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: formData
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to update product');
                    }

                    showNotification('Product updated successfully');
                    closeAllModals();
                    fetchProducts();
                } catch (error) {
                    console.error('Error updating product:', error);
                    showNotification(error.message || 'Failed to update product', 'error');
                }
            });

            submitProductBtn.addEventListener('click', async () => {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        redirectToLogin();
                        return;
                    }

                    const name = document.getElementById('create-product-name').value;
                    const description = document.getElementById('create-product-description').value;
                    const price = document.getElementById('create-product-price').value;
                    const quantity = document.getElementById('create-product-quantity').value;
                    const category = document.getElementById('create-product-category').value;
                    const imageInput = document.getElementById('create-product-image');
                    
                    if (!name || !description || !price || !category || !imageInput.files[0]) {
                        showNotification('Please fill all required fields', 'error');
                        return;
                    }

                    const formData = new FormData();
                    formData.append('name', name);
                    formData.append('description', description);
                    formData.append('price', price);
                    formData.append('quantity', quantity);
                    formData.append('category', category);
                    formData.append('image', imageInput.files[0]);

                    const response = await fetch(API_BASE_URL, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        },
                        body: formData
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to create product');
                    }

                    showNotification('Product created successfully');
                    closeAllModals();
                    fetchProducts();
                } catch (error) {
                    console.error('Error creating product:', error);
                    showNotification(error.message || 'Failed to create product', 'error');
                }
            });

            function redirectToLogin() {
                window.location.href = 'login.html';
            }

            window.addEventListener('click', (e) => {
                if (e.target === editModal || e.target === createModal) {
                    closeAllModals();
                }
            });
        });
