window.addEventListener("DOMContentLoaded", () => {
  const scrollContainer = document.getElementById("productScroll");
  const leftBtn = document.getElementById("scrollLeftBtn");
  const rightBtn = document.getElementById("scrollRightBtn");

  if (!scrollContainer || !leftBtn || !rightBtn) return;

  leftBtn.addEventListener("click", () => {
    const item = scrollContainer.querySelector(".product");
    if (item) {
      const itemWidth = item.offsetWidth + 16;
      scrollContainer.scrollBy({ left: itemWidth, behavior: "smooth" }); 
    }
  });

  rightBtn.addEventListener("click", () => {
    const item = scrollContainer.querySelector(".product");
    if (item) {
      const itemWidth = item.offsetWidth + 16;
      scrollContainer.scrollBy({ left: -itemWidth, behavior: "smooth" });
    }
  });
});
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

