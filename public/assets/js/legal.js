(() => {
  const validThemes = ["default", "dark", "blue", "crimson", "purple", "teal", "sunset"];
  const sections = [...document.querySelectorAll("[data-language-section]")];
  const languageButton = document.querySelector(".language-toggle");
  const pageTitles = {
    about: { id: "Tentang Kami | Chips-in", en: "About Us | Chips-in" },
    terms: { id: "Ketentuan Layanan | Chips-in", en: "Terms of Service | Chips-in" },
    privacy: { id: "Kebijakan Privasi | Chips-in", en: "Privacy Policy | Chips-in" },
  };
  const page = location.pathname.split("/").pop();
  const title = pageTitles[page];

  function applyLanguage(language) {
    const selectedLanguage = language === "en" ? "en" : "id";
    document.documentElement.lang = selectedLanguage;
    sections.forEach((section) => {
      section.hidden = section.lang !== selectedLanguage;
    });
    document.querySelectorAll("[data-id][data-en]").forEach((element) => {
      element.textContent = element.dataset[selectedLanguage];
    });
    const footer = document.querySelector(".legal-footer");
    if (footer) {
      footer.setAttribute(
        "aria-label",
        selectedLanguage === "en" ? footer.dataset.enLabel : footer.dataset.idLabel,
      );
    }
    if (languageButton) {
      languageButton.textContent =
        selectedLanguage === "id" ? "English" : "Bahasa Indonesia";
    }
    if (title) document.title = title[selectedLanguage];
  }

  function toggleLanguage() {
    const nextLanguage = document.documentElement.lang === "en" ? "id" : "en";
    localStorage.cb_language = nextLanguage;
    applyLanguage(nextLanguage);
  }

  const theme = localStorage.cb_theme;
  document.documentElement.setAttribute(
    "data-theme",
    validThemes.includes(theme) ? theme : "default",
  );
  if (languageButton) languageButton.addEventListener("click", toggleLanguage);
  window.addEventListener("chipsin-language-change", () => {
    applyLanguage(localStorage.cb_language);
  });
  applyLanguage(localStorage.cb_language);
})();
