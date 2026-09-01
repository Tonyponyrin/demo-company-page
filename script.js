const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const progressBar = document.querySelector("[data-scroll-progress]");
const filterButtons = document.querySelectorAll("[data-filter]");
const sections = document.querySelectorAll("[data-section]");
const revealElements = document.querySelectorAll(".reveal, .reveal-item");
const counters = document.querySelectorAll("[data-count]");
const parallaxItems = document.querySelectorAll("[data-parallax]");
const navLinks = document.querySelectorAll(".site-nav a[href^='#']");
const languageButtons = document.querySelectorAll("[data-lang]");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const snapSections = Array.from(sections).filter((section) => section.id || section.classList.contains("hero"));
const snapCooldown = 850;
let isSnapping = false;
let lastSnapAt = 0;

const getProjectCards = () => document.querySelectorAll("[data-category]");

const LANGUAGES = ["th", "en", "zh"];
const DEFAULT_LANGUAGE = "th";

if (window.lucide) {
  window.lucide.createIcons();
}

// All copy for every language lives in content/site.json and content/projects.json
// and is applied by cms.js. This only tracks which language is active.
const applyLanguage = (language) => {
  const nextLanguage = LANGUAGES.includes(language) ? language : DEFAULT_LANGUAGE;

  document.documentElement.lang = nextLanguage === "zh" ? "zh-Hans" : nextLanguage;
  window.tonyponyLanguage = nextLanguage;
  languageButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === nextLanguage);
  });
  localStorage.setItem("tonypony-language", nextLanguage);
  window.dispatchEvent(new CustomEvent("tonypony:languagechange", { detail: { language: nextLanguage } }));
};

applyLanguage(localStorage.getItem("tonypony-language") || DEFAULT_LANGUAGE);

const syncHeader = () => {
  header?.classList.toggle("scrolled", window.scrollY > 20);
};

const syncProgress = () => {
  if (!progressBar) return;

  const scrollable = document.documentElement.scrollHeight - window.innerHeight;
  const progress = scrollable > 0 ? window.scrollY / scrollable : 0;
  progressBar.style.transform = `scaleX(${Math.min(Math.max(progress, 0), 1)})`;
};

const syncParallax = () => {
  if (reduceMotion) return;

  parallaxItems.forEach((item) => {
    const strength = Number(item.dataset.parallax || 0);
    const movement = Math.min(window.scrollY * strength, 80);
    item.style.setProperty("--parallax-y", `${movement}px`);
  });
};

const setActiveNav = (id) => {
  navLinks.forEach((link) => {
    link.classList.toggle("active", link.getAttribute("href") === `#${id}`);
  });
};

const getSectionId = (section) => section.id || "top";

const getHeaderOffset = () => {
  if (!header) return 0;

  return header.getBoundingClientRect().height + 28;
};

const getSnapTop = (section) => {
  if (section.classList.contains("hero")) {
    return 0;
  }

  return Math.max(section.offsetTop - getHeaderOffset(), 0);
};

const getCurrentSnapIndex = () => {
  const anchor = window.scrollY + Math.min(window.innerHeight * 0.45, 380);
  let index = 0;

  snapSections.forEach((section, sectionIndex) => {
    if (section.offsetTop <= anchor) {
      index = sectionIndex;
    }
  });

  return index;
};

const snapToSection = (targetIndex) => {
  const section = snapSections[targetIndex];
  if (!section) return;

  isSnapping = true;
  lastSnapAt = Date.now();
  window.scrollTo({ top: getSnapTop(section), behavior: reduceMotion ? "auto" : "smooth" });

  window.setTimeout(() => {
    isSnapping = false;
    setActiveNav(getSectionId(section));
  }, snapCooldown);
};

const shouldSkipSnap = (event) => {
  if (reduceMotion || window.innerWidth < 900 || event.ctrlKey || event.metaKey || event.shiftKey) {
    return true;
  }

  const target = event.target;
  if (!(target instanceof Element)) {
    return false;
  }

  return Boolean(target.closest("iframe, input, textarea, select, button, [data-no-snap]"));
};

const syncActiveSection = () => {
  const anchor = window.scrollY + Math.min(window.innerHeight * 0.42, 360);
  let currentId = "";

  sections.forEach((section) => {
    if (!section.id) return;
    if (section.offsetTop <= anchor) {
      currentId = section.id;
    }
  });

  if (currentId) {
    setActiveNav(currentId);
  }
};

const animateCounter = (element) => {
  if (element.dataset.counted === "true") return;

  element.dataset.counted = "true";
  const target = Number(element.dataset.count);
  const decimals = Number(element.dataset.decimals || 0);
  const suffix = element.dataset.suffix || "";

  if (reduceMotion || Number.isNaN(target)) {
    element.textContent = `${target.toFixed(decimals)}${suffix}`;
    return;
  }

  const duration = 1100;
  const start = performance.now();

  const tick = (now) => {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = `${(target * eased).toFixed(decimals)}${suffix}`;

    if (progress < 1) {
      requestAnimationFrame(tick);
    }
  };

  requestAnimationFrame(tick);
};

syncHeader();
syncProgress();
syncParallax();
syncActiveSection();

window.addEventListener(
  "scroll",
  () => {
    syncHeader();
    syncProgress();
    syncParallax();
    syncActiveSection();
  },
  { passive: true }
);

navToggle?.addEventListener("click", () => {
  const isOpen = nav?.classList.toggle("open");
  navToggle.setAttribute("aria-expanded", String(Boolean(isOpen)));
});

nav?.addEventListener("click", (event) => {
  if (event.target instanceof HTMLAnchorElement) {
    nav.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");

    const hash = event.target.getAttribute("href");
    if (hash?.startsWith("#") && hash.length > 1) {
      const section = document.querySelector(hash);
      const targetIndex = snapSections.indexOf(section);

      if (targetIndex >= 0) {
        event.preventDefault();
        snapToSection(targetIndex);
      }
    }
  }
});

languageButtons.forEach((button) => {
  button.addEventListener("click", () => {
    applyLanguage(button.dataset.lang || "en");
  });
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const filter = button.dataset.filter;

    filterButtons.forEach((item) => item.classList.remove("active"));
    button.classList.add("active");

    getProjectCards().forEach((card) => {
      const shouldShow = filter === "all" || card.dataset.category === filter;
      card.classList.toggle("is-hidden", !shouldShow);
    });
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;

      entry.target.classList.add("is-visible");
      if (entry.target.matches("[data-count]")) {
        animateCounter(entry.target);
      }
      entry.target.querySelectorAll?.("[data-count]").forEach(animateCounter);
      revealObserver.unobserve(entry.target);
    });
  },
  { rootMargin: "0px 0px -12% 0px", threshold: 0.12 }
);

revealElements.forEach((element) => revealObserver.observe(element));
counters.forEach((counter) => revealObserver.observe(counter));

window.addEventListener(
  "wheel",
  (event) => {
    if (shouldSkipSnap(event)) return;

    const now = Date.now();
    if (isSnapping || now - lastSnapAt < snapCooldown) {
      event.preventDefault();
      return;
    }

    const direction = Math.sign(event.deltaY);
    if (direction === 0) return;

    const currentIndex = getCurrentSnapIndex();
    const targetIndex = Math.min(Math.max(currentIndex + direction, 0), snapSections.length - 1);

    if (targetIndex !== currentIndex) {
      event.preventDefault();
      snapToSection(targetIndex);
    }
  },
  { passive: false }
);

window.addEventListener("keydown", (event) => {
  if (reduceMotion || event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
    return;
  }

  const nextKeys = ["PageDown", "ArrowDown", " "];
  const prevKeys = ["PageUp", "ArrowUp"];

  if (![...nextKeys, ...prevKeys].includes(event.key)) {
    return;
  }

  event.preventDefault();
  const direction = nextKeys.includes(event.key) ? 1 : -1;
  const targetIndex = Math.min(Math.max(getCurrentSnapIndex() + direction, 0), snapSections.length - 1);
  snapToSection(targetIndex);
});
