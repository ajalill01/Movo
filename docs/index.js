// window.addEventListener("DOMContentLoaded", () => {
//   const scrollContainer = document.getElementById("productScroll");
//   const leftBtn = document.getElementById("scrollLeftBtn");
//   const rightBtn = document.getElementById("scrollRightBtn");

//   if (!scrollContainer || !leftBtn || !rightBtn) return;

//   leftBtn.addEventListener("click", () => {
//     const item = scrollContainer.querySelector(".product");
//     if (item) {
//       const itemWidth = item.offsetWidth + 16;
//       scrollContainer.scrollBy({ left: itemWidth, behavior: "smooth" }); 
//     }
//   });

//   rightBtn.addEventListener("click", () => {
//     const item = scrollContainer.querySelector(".product");
//     if (item) {
//       const itemWidth = item.offsetWidth + 16;
//       scrollContainer.scrollBy({ left: -itemWidth, behavior: "smooth" });
//     }
//   });
// });
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.getElementById("categoryToggle");
  const menu = document.getElementById("categoryMenu");
  const arrow = document.getElementById("dropdownArrow");

  if (!toggle || !menu || !arrow) return;

  toggle.addEventListener("click", () => {
    const isOpen = menu.style.display === "block";
    menu.style.display = isOpen ? "none" : "block";

    
    arrow.classList.toggle("flipped", !isOpen);
  });

  
  document.addEventListener("click", (e) => {
    if (!toggle.contains(e.target) && !menu.contains(e.target)) {
      menu.style.display = "none";
      arrow.classList.remove("flipped");
    }
  });
});


async function loadCategories() {
  try {
    const res = await fetch('https://movo-ea16.onrender.com/api/categories');
    const data = await res.json();

    if (data.success) {

        const menu = document.getElementById('categoryMenu');
        menu.innerHTML = ''; 

      data.categories.forEach(cat => {
      const li = document.createElement('li');
     li.textContent = cat.name;
  li.style.cursor = 'pointer';

     li.addEventListener('click', () => {
       const section = document.getElementById(cat._id);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
    menu.style.display = 'none';
    document.getElementById("dropdownArrow").classList.remove("flipped");
  });

  menu.appendChild(li);
});


      const container = document.getElementById('allCategories');
      container.innerHTML = '';





      data.categories.forEach(cat => {
        let page = 1; 
        let allLoaded = false;
        const typeWrapper = document.createElement('div');
        typeWrapper.className = 'type';
        typeWrapper.id = cat._id;

        const headerHTML = `
          <div class="onetype">
            <div class="leftright">
           <button class="scrollbutton">←</button>
          <button class="scrollbutton">→</button>
            </div>
            <div class="typeinfo22222">
           <img src="./assets/angle-small-down (1).png" alt="Dropdown Icon" class="dropdown-icon1">
            <p class="goToType" data-id="${cat._id}" style="cursor: pointer;">${cat.name}</p>
            </div>
          </div>
        `;

        const productContainer = document.createElement('div');
        productContainer.className = 'procuctcontinair';

        typeWrapper.innerHTML = headerHTML;
        const goToType = typeWrapper.querySelector(".goToType");
    if (goToType) {
      goToType.addEventListener("click", () => {
     const id = goToType.dataset.id;
    window.location.href = `type.html?id=${id}`;
  });
}
        typeWrapper.appendChild(productContainer);
        container.appendChild(typeWrapper);

        let isLoading = false;

        function loadProductPage() {

          if (allLoaded||isLoading) return;
          isLoading = true;
          fetch(`https://movo-ea16.onrender.com/api/products/getallproduct?category=${cat._id}&page=${page}`)
            .then(res => res.json())
            .then(prodData => {
              isLoading = false;
              if (prodData.success ) {
                  const products = prodData.data.products;
                  
        if (products.length === 0) {
          allLoaded = true; 
          return;
        }
               products.forEach(p => {
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
        </div>`;

  
        const temp = document.createElement('div');
       temp.innerHTML = productHTML.trim();
       const productElement = temp.firstChild;

  
     productElement.addEventListener('click', () => {
         window.location.href = `product.html?id=${p._id}`;
       });

  
         productContainer.appendChild(productElement);
        });

                page++; 
              }
            })
            .catch(err => {
              console.error('Product fetch error:', err);
              productContainer.innerHTML += '<p style="color: red;">فشل تحميل المنتجات</p>';
            });
        }
        loadProductPage();
                     productContainer.addEventListener("scroll", () => {
  const scrollLeft = productContainer.scrollLeft;
  const clientWidth = productContainer.clientWidth;

  
  if (scrollLeft <= 100) {
    loadProductPage();
  }
});
        const scrollButtons = typeWrapper.querySelectorAll(".scrollbutton");
        if (scrollButtons.length === 2) {
          const [leftBtn, rightBtn] = scrollButtons;

          leftBtn.addEventListener("click", () => {
            const item = productContainer.querySelector(".product");
            if (item) {
              const itemWidth = item.offsetWidth + 16;
              productContainer.scrollBy({ left: itemWidth, behavior: "smooth" });
            }

           
           
          });

          rightBtn.addEventListener("click", () => {
            const item = productContainer.querySelector(".product");
            if (item) {
              const itemWidth = item.offsetWidth + 16;
              productContainer.scrollBy({ left: -itemWidth, behavior: "smooth" });
            }
          });
        }
      });
    } else {
      console.error('Category error:', data.message);
    }
  } catch (err) {
    console.error('Fetch error:', err);
  }
}

loadCategories();