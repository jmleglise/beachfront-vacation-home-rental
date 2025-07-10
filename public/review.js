const botToken = document.body.dataset.bot;
const chatId = document.body.dataset.chat;

const stars = document.querySelectorAll(".stars");
const form = document.getElementById("form");
const submitBtn = document.getElementById("submit");
const message = document.getElementById("message");
const textarea = document.getElementById("reviewText");

let selectedRating = 0;

// Initial state bouton désactivé
submitBtn.disabled = true;
submitBtn.classList.remove("enabled");

textarea.addEventListener("input", () => {
  if (textarea.value.trim().length > 0) {
    submitBtn.disabled = false;
    submitBtn.classList.add("enabled");
  } else {
    submitBtn.disabled = true;
    submitBtn.classList.remove("enabled");
  }
});

stars.forEach((star, index) => {
  star.addEventListener("mouseenter", () => {
    stars.forEach((s, i) => s.classList.toggle("hovered", i <= index));
  });

  star.addEventListener("mouseleave", () => {
    stars.forEach((s, i) => s.classList.toggle("hovered", i < selectedRating));
  });

  if (index <4) {
  star.addEventListener("click", () => {
    selectedRating = index + 1;
    stars.forEach((s, i) => s.classList.toggle("hovered", i < selectedRating));
    if (selectedRating === 5) {
      window.top.location.href = "https://g.page/r/CTOZ9gJDprgQEAE/review";
    } else {
      form.style.display = "flex";
      // On remet à jour l'état du bouton selon textarea
      if (textarea.value.trim().length > 0) {
        submitBtn.disabled = false;
        submitBtn.classList.add("enabled");
      } else {
        submitBtn.disabled = true;
        submitBtn.classList.remove("enabled");
      }
    }
  });
  }
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const text = textarea.value;
  const month = document.getElementById("month").value;
  const year = document.getElementById("year").value;

  const msg = `⭐ ${selectedRating}/5\nDate: ${month} ${year}\n\n${text}`;

  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text: msg }),
    });

    form.remove();
    document.getElementById("stars-container").remove();
    message.textContent = res.ok ? "Merci pour votre avis !" : "Erreur d'envoi. Veuillez vérifier votre connexion.";
    message.style.display = "block";
  } catch {
    message.textContent = "Erreur d'envoi. Veuillez vérifier votre connexion.";
    message.style.display = "block";
  }
});
