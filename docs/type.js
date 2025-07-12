document.addEventListener("DOMContentLoaded", () => {
  loadCategoryPage();
});

async function loadCategoryPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const categoryId = urlParams.get('id');

  if (!categoryId) {
    //document.getElementById('allCategories').innerHTML = '<p style="color: red;">لا يوجد معرف الفئة</p>';
    return;
  }

  try {
   
    const catRes = await fetch(`https://movo-cwim.onrender.com/api/categories/${categoryId}`);
    const catData = await catRes.json();

    if (!catData.success) {
      document.getElementById('allCategories').innerHTML = '<p style="color: red;">فشل تحميل الفئة</p>';
      return;
    }

    const cat = catData.category;

    const container = document.getElementById('allCategories');
     container.innerHTML = '';

    
    const typeWrapper = document.createElement('div');
    typeWrapper.className = 'type';
    typeWrapper.id = cat._id;

    const headerHTML = `
      <div class="onetype">
        <div class="typeinfo22222">
          <img src="./assets/angle-small-down (1).png" alt="Dropdown Icon" class="dropdown-icon1">
          <p>${cat.name}</p>
        </div>
      </div>
    `;

    typeWrapper.innerHTML = headerHTML;

    
    const productContainer = document.createElement('div');
    productContainer.className = 'procuctcontinair';
    typeWrapper.appendChild(productContainer);

    container.appendChild(typeWrapper);

   
    let page = 1;
    let allLoaded = false;
    let isLoading = false;

    async function loadProductPage() {
      if (allLoaded || isLoading) return;
      isLoading = true;

      try {
        const res = await fetch(`https://movo-cwim.onrender.com/api/products/getallproduct?category=${cat._id}&page=${page}`);
        const prodData = await res.json();
        isLoading = false;

        if (!prodData.success || prodData.data.products.length === 0) {
          allLoaded = true;
          if (page === 1) {
            productContainer.innerHTML = '<p style="color: gray;">لا توجد منتجات</p>';
          }
          return;
        }

        prodData.data.products.forEach(p => {
          const productHTML = `
            <div class="product">
              <div class="productimg2">
                <img src="${p.image?.url || './assets/placeholder.png'}" class="productimg">
              </div>
              <div class="productinfo">
                <p class="price">${p.price} دج</p>
                <p>${p.name}</p>
              </div>
              <div class="description">${p.description || ''}</div>
              <div class="buybutton">
                <button class="buy">شراء</button>
              </div>
            </div>
          `;

          const temp = document.createElement('div');
          temp.innerHTML = productHTML.trim();
          const productElement = temp.firstChild;

          productElement.addEventListener('click', () => {
            window.location.href = `product.html?id=${p._id}`;
          });

          productContainer.appendChild(productElement);
        });

        page++;
      } catch (err) {
        isLoading = false;
        console.error('Product fetch error:', err);
        productContainer.innerHTML += '<p style="color: red;">فشل تحميل المنتجات</p>';
      }
    }

    
    loadProductPage();

    
    window.addEventListener('scroll', () => {
      if (
        window.innerHeight + window.scrollY >= document.body.offsetHeight - 200
      ) {
        loadProductPage();
      }
    });

  } catch (err) {
    console.error('Fetch error:', err);
    document.getElementById('allCategories').innerHTML = '<p style="color: red;">حدث خطأ في تحميل الفئة</p>';
  }
}
