(() => {
  const config = {
    siteFile: "./content/site.json",
    projectsFile: "./content/projects.json",
    languages: ["th", "en", "zh"],
    defaultLanguage: "th",
  };

  const state = {
    site: {},
    projects: [],
    loaded: false,
  };

  const normalize = (value) => String(value ?? "").trim();

  const getLanguage = () => {
    const saved = localStorage.getItem("tonypony-language") || window.tonyponyLanguage || config.defaultLanguage;
    return config.languages.includes(saved) ? saved : config.defaultLanguage;
  };

  // Decap i18n "single_file" nests every locale at the top level of the JSON,
  // so a value is read as site[language].<dotted.path>.
  const readPath = (source, path) =>
    path.split(".").reduce((node, part) => (node == null ? undefined : node[part]), source);

  const getText = (path, language) => {
    for (const candidate of [language, config.defaultLanguage, "en"]) {
      const value = normalize(readPath(state.site[candidate], path));
      if (value) return value;
    }
    return "";
  };

  const getLocalized = (entry, field, language) =>
    normalize(entry[`${field}_${language}`]) ||
    normalize(entry[`${field}_${config.defaultLanguage}`]) ||
    normalize(entry[`${field}_en`]) ||
    normalize(entry[field]);

  const escapeHtml = (value) =>
    normalize(value).replace(/[&<>"']/g, (character) => {
      const entities = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" };
      return entities[character];
    });

  const fetchJson = async (path) => {
    const response = await fetch(path, { cache: "no-cache" });
    if (!response.ok) {
      throw new Error(`Could not load ${path} (${response.status})`);
    }
    return response.json();
  };

  const applySiteText = (language) => {
    document.querySelectorAll("[data-cms]").forEach((element) => {
      const value = getText(element.dataset.cms, language);
      if (value) element.textContent = value;
    });

    document.querySelectorAll("[data-cms-src]").forEach((element) => {
      const source = getText(element.dataset.cmsSrc, language);
      if (source) element.setAttribute("src", source);

      const alt = element.dataset.cmsAlt && getText(element.dataset.cmsAlt, language);
      if (alt) element.setAttribute("alt", alt);
    });

    const pageTitle = getText("meta.pageTitle", language);
    if (pageTitle) document.title = pageTitle;
  };

  const renderProjects = (language) => {
    const grid = document.querySelector("[data-project-grid]");
    if (!grid || state.projects.length === 0) return;

    grid.innerHTML = state.projects
      .map((item) => {
        const category = escapeHtml(item.category || "home");
        const image = escapeHtml(item.image || "./assets/images/residential-project.png");
        const title = escapeHtml(getLocalized(item, "title", language) || "Untitled project");
        const label = escapeHtml(getLocalized(item, "label", language) || category);
        const description = escapeHtml(getLocalized(item, "description", language));
        const alt = escapeHtml(getLocalized(item, "alt", language) || title);

        return `
          <article class="project-card reveal-item is-visible" data-category="${category}">
            <img src="${image}" alt="${alt}">
            <div class="project-content">
              <p>${label}</p>
              <h3>${title}</h3>
              <span>${description}</span>
            </div>
          </article>
        `;
      })
      .join("");
  };

  const applyCms = () => {
    if (!state.loaded) return;

    const language = getLanguage();
    applySiteText(language);
    renderProjects(language);
  };

  const boot = async () => {
    try {
      const [site, projects] = await Promise.all([
        fetchJson(config.siteFile),
        fetchJson(config.projectsFile),
      ]);

      state.site = site || {};
      state.projects = (projects?.projects || [])
        .filter((item) => item.image || item.title_th || item.title_en || item.title_zh)
        .sort((a, b) => Number(a.order || 999) - Number(b.order || 999));
      state.loaded = true;
      applyCms();
    } catch (error) {
      console.info("CMS content unavailable. Using built-in fallback content.", error);
    }
  };

  window.addEventListener("tonypony:languagechange", applyCms);
  window.TonyponyCMS = { apply: applyCms, config, state };
  boot();
})();
