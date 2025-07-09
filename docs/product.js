 const minusBtn = document.getElementById('minus-btn');
  const plusBtn = document.getElementById('plus-btn');
  const numberDisplay = document.getElementById('quantity-number');

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
form.addEventListener("submit", function (e) {
  e.preventDefault();
  const quantity = document.getElementById("quantity-number").textContent;

  const data = {
    firstName: this.firstName.value,
    lastName: this.lastName.value,
    phoneNumber: this.phoneNumber.value,
    address: this.address.value,
    cartItems: quantity
  };

  console.log("تم الإرسال:", data);

  
  const toast = document.getElementById("toastMessage");
  toast.classList.add("show");

  setTimeout(() => {
    toast.classList.remove("show");
  }, 1000);

  closePopup(); 
});
