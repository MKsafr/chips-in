      function localizeTree(root) {
        if (currentLanguage !== "en" || !root) return;
        const walker = document.createTreeWalker(
          root,
          NodeFilter.SHOW_TEXT,
        );
        let node;
        while ((node = walker.nextNode())) {
          if (node.parentElement.closest("[data-player-name]")) continue;
          node.nodeValue = translateText(node.nodeValue);
        }
        root.querySelectorAll("[placeholder], [title], [aria-label]").forEach(
          (element) => {
            ["placeholder", "title", "aria-label"].forEach((attribute) => {
              if (element.hasAttribute(attribute))
                element.setAttribute(
                  attribute,
                  translateText(element.getAttribute(attribute)),
                );
            });
          },
        );
      }
      function updateLanguage(language) {
        currentLanguage = LANGUAGES[language] ? language : "id";
        localStorage.cb_language = currentLanguage;
        document.documentElement.lang = currentLanguage;
        document.title =
          currentLanguage === "en"
            ? "Chips-in - Virtual Casino Chips"
            : "Chips-in - Chip Kasino Virtual";
        render();
        if (settingsOpen) renderSettings();
        window.dispatchEvent(new Event("chipsin-language-change"));
      }
      function changeTheme(th) {
        if (!THEMES[th]) th = "default";
        currentTheme = th;
        localStorage.cb_theme = th;
        document.documentElement.setAttribute("data-theme", th);
        syncThemeColor();
      }
