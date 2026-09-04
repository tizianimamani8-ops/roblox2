document.querySelectorAll(".faq-item").forEach((item) => {
  item.addEventListener("click", () => {
    const answer = item.nextElementSibling;
    const icon = item.querySelector("span:last-child");
    const isOpen = answer.classList.toggle("open");
    icon.textContent = isOpen ? "−" : "+";
  });
});
