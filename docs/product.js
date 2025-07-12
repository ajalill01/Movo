 const minusBtn = document.getElementById('minus-btn');
  const plusBtn = document.getElementById('plus-btn');
  const numberDisplay = document.getElementById('quantity-number');

document.addEventListener("DOMContentLoaded", async () => {
  const params = new URLSearchParams(window.location.search);
  const productId = params.get("id");

  if (!productId) {
    console.error("No product ID found in URL.");
    return;
  }

  try {
    const res = await fetch(`https://movo-cwim.onrender.com/api/products/${productId}`);
    const data = await res.json();

    if (!data.success) {
      console.error("Product fetch failed:", data.error);
      return;
    }

    const product = data.product;

    
    document.querySelector(".product-title").textContent = product.name;
    document.querySelector(".product-description").textContent = product.description || "لا يوجد وصف متاح";
    document.querySelector(".price").textContent = `${product.price} دج`;
    document.querySelector(".soooooom").textContent = "الدفع عند الاستلام";

    const imageEl = document.getElementById("productImage");
    imageEl.src = product.image?.url ;
    imageEl.alt = product.name;

    
    document.querySelectorAll(".skeleton").forEach(el => {
      el.classList.remove("skeleton");
    });

  } catch (err) {
    console.error("Fetch error:", err);
  }
});









  let count = parseInt(numberDisplay.textContent);





  minusBtn.addEventListener('click', () => {
    if (count > 1) {
      count--;
      numberDisplay.textContent = count;
    }
  });

  plusBtn.addEventListener('click', () => {
    if (count < 5) {
      count++;
      numberDisplay.textContent = count;
    }
  });


  function openPopup() {
  document.getElementById("popupOverlay").style.display = "flex";
}
function closePopup() {
  document.getElementById("popupOverlay").style.display = "none";
}


const selectedCity = document.getElementById("selectedCity");
const cityList = document.getElementById("cityList");
const addressInput = document.getElementById("addressInput");

selectedCity.addEventListener("click", () => {
  cityList.style.display = cityList.style.display === "block" ? "none" : "block";
});

cityList.querySelectorAll("li").forEach((item) => {
  item.addEventListener("click", () => {
    selectedCity.textContent = item.textContent;
    addressInput.value = item.textContent;
    cityList.style.display = "none";
  });
});

document.addEventListener("click", (e) => {
  if (!e.target.closest(".custom-dropdown")) {
    cityList.style.display = "none";
  }
});


const form = document.getElementById("purchaseForm");
    form.addEventListener("submit", async function (e) {
     e.preventDefault();

  const quantity = parseInt(document.getElementById("quantity-number").textContent);
  const productId = new URLSearchParams(window.location.search).get("id");
      const data = {
    firstName: this.firstName.value,
    lastName: this.lastName.value,
    phoneNumber: this.phoneNumber.value,
    address: this.address.value,
    paymentMethod: "cash", 
    cartItems: [
      {
        productId,
        quantity
      }
    ]
  };

  try {
    const res = await fetch("https://movo-cwim.onrender.com/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });

    const result = await res.json();

    if (result.success) {
      console.log("تم الإرسال:", result.data);

      const toast = document.getElementById("toastMessage");
      toast.classList.add("show");

      setTimeout(() => {
        toast.classList.remove("show");
      }, 2000);

      closePopup();
    } else {
      console.error("فشل الطلب:", result.message);
      
    }
  } catch (error) {
    console.error("خطأ في إرسال الطلب:", error.message);
   
  }
});



 document.addEventListener("DOMContentLoaded", () => {
    const copyIcon = document.getElementById("copyPhoneIcon");
   const phoneNumber = document.getElementById("number").textContent;
    const notify = document.getElementById("copyNotification");

    copyIcon.addEventListener("click", () => {
      navigator.clipboard.writeText(phoneNumber).then(() => {
        notify.textContent = " تم نسخ الرقم: " + phoneNumber;
        notify.classList.add("show");
        setTimeout(() => notify.classList.remove("show"), 1500);
      }).catch(err => {
        notify.textContent = "حدث خطأ أثناء النسخ";
        notify.classList.add("show");
        setTimeout(() => notify.classList.remove("show"), 2500);
        console.error(err);
      });
    });
  });