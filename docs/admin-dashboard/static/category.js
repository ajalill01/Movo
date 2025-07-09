
        document.addEventListener('DOMContentLoaded', function() {
            const categoriesList = document.getElementById('categories-list');
            const addCategoryBtn = document.getElementById('add-category-btn');
            const createModal = document.getElementById('create-category-modal');
            const createForm = document.getElementById('create-category-form');
            const editModal = document.getElementById('edit-category-modal');
            const editForm = document.getElementById('edit-category-form');
            const closeModalBtns = document.querySelectorAll('.close-modal');
            const cancelCreateBtn = document.getElementById('cancel-category-btn');
            const cancelEditBtn = document.getElementById('cancel-edit-category-btn');
            const submitCategoryBtn = document.getElementById('submit-category-btn');
            const saveCategoryBtn = document.getElementById('save-category-btn');
            const notificationContainer = document.getElementById('notification-container');
            
            const CATEGORIES_API_URL = 'http://localhost:3000/api/categories';
            let currentCategoryId = null;

            closeModalBtns.forEach(btn => btn.addEventListener('click', closeAllModals));
            cancelCreateBtn.addEventListener('click', closeAllModals);
            cancelEditBtn.addEventListener('click', closeAllModals);
            addCategoryBtn.addEventListener('click', () => createModal.style.display = 'flex');

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
                    displayCategories(categories);
                } catch (error) {
                    console.error('Error fetching categories:', error);
                    categoriesList.innerHTML = `
                        <div class="error-message" style="text-align: center; padding: 2rem;">
                            Failed to load categories. Please try again later.
                        </div>
                    `;
                    showNotification('Failed to load categories', 'error');
                }
            }

            function displayCategories(categories) {
                if (!categories || categories.length === 0) {
                    categoriesList.innerHTML = `
                        <div class="category-item" style="justify-content: center;">
                            No categories found. Click "Add Category" to create one.
                        </div>
                    `;
                    return;
                }

                categoriesList.innerHTML = categories.map(category => `
                    <div class="category-item" data-id="${category._id}">
                        <span class="category-name">${category.name}</span>
                        <div class="category-actions">
                            <div class="action-btn edit-btn" data-id="${category._id}">
                                <i class="fas fa-edit"></i>
                            </div>
                            <div class="action-btn delete-btn" data-id="${category._id}">
                                <i class="fas fa-trash"></i>
                            </div>
                        </div>
                    </div>
                `).join('');

                document.querySelectorAll('.edit-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const categoryId = btn.getAttribute('data-id');
                        openEditModal(categoryId);
                    });
                });

                document.querySelectorAll('.delete-btn').forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        const categoryId = btn.getAttribute('data-id');
                        deleteCategory(categoryId);
                    });
                });
            }

            async function openEditModal(categoryId) {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        redirectToLogin();
                        return;
                    }

                    const response = await fetch(`${CATEGORIES_API_URL}/${categoryId}`, {
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (!response.ok) {
                        throw new Error('Failed to fetch category details');
                    }

                    const { category } = await response.json();
                    
                    document.getElementById('edit-category-id').value = category._id;
                    document.getElementById('edit-category-name').value = category.name;
                    
                    currentCategoryId = category._id;
                    editModal.style.display = 'flex';
                } catch (error) {
                    console.error('Error opening edit modal:', error);
                    showNotification('Failed to load category details', 'error');
                }
            }

            async function deleteCategory(categoryId) {
                if (!confirm('Are you sure you want to delete this category?')) {
                    return;
                }

                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        redirectToLogin();
                        return;
                    }

                    const response = await fetch(`${CATEGORIES_API_URL}/${categoryId}`, {
                        method: 'DELETE',
                        headers: {
                            'Authorization': `Bearer ${token}`
                        }
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to delete category');
                    }

                    showNotification('Category deleted successfully');
                    fetchCategories();
                } catch (error) {
                    console.error('Error deleting category:', error);
                    showNotification(error.message || 'Failed to delete category', 'error');
                }
            }

            submitCategoryBtn.addEventListener('click', async () => {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        redirectToLogin();
                        return;
                    }

                    const name = document.getElementById('category-name').value;
                    
                    if (!name) {
                        showNotification('Please enter a category name', 'error');
                        return;
                    }

                    const response = await fetch(CATEGORIES_API_URL, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ name })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to create category');
                    }

                    showNotification('Category created successfully');
                    closeAllModals();
                    fetchCategories();
                } catch (error) {
                    console.error('Error creating category:', error);
                    showNotification(error.message || 'Failed to create category', 'error');
                }
            });

            saveCategoryBtn.addEventListener('click', async () => {
                try {
                    const token = localStorage.getItem('token');
                    if (!token) {
                        redirectToLogin();
                        return;
                    }

                    const name = document.getElementById('edit-category-name').value;
                    
                    if (!name) {
                        showNotification('Please enter a category name', 'error');
                        return;
                    }

                    const response = await fetch(`${CATEGORIES_API_URL}/${currentCategoryId}`, {
                        method: 'PATCH',
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({ name })
                    });

                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.error || 'Failed to update category');
                    }

                    showNotification('Category updated successfully');
                    closeAllModals();
                    fetchCategories();
                } catch (error) {
                    console.error('Error updating category:', error);
                    showNotification(error.message || 'Failed to update category', 'error');
                }
            });

            function closeAllModals() {
                createModal.style.display = 'none';
                editModal.style.display = 'none';
                createForm.reset();
                editForm.reset();
                currentCategoryId = null;
            }

            function redirectToLogin() {
                window.location.href = 'login.html';
            }

            window.addEventListener('click', (e) => {
                if (e.target === createModal || e.target === editModal) {
                    closeAllModals();
                }
            });
        });
