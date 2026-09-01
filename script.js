const header = document.querySelector("[data-header]");
const nav = document.querySelector("[data-nav]");
const navToggle = document.querySelector("[data-nav-toggle]");
const progressBar = document.querySelector("[data-scroll-progress]");
const filterButtons = document.querySelectorAll("[data-filter]");
const projectCards = document.querySelectorAll("[data-category]");
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

const pageTitles = {
  en: "Tonypony's Company | Design, Architecture & Build",
  th: "Tonypony's Company | ออกแบบ สถาปัตยกรรม และก่อสร้าง",
  zh: "Tonypony's Company | 设计、建筑与施工",
};

const translations = {
  th: {
    "Company": "บริษัท",
    "Approach": "แนวทาง",
    "Services": "บริการ",
    "Projects": "ผลงาน",
    "Process": "กระบวนการ",
    "Studio": "สตูดิโอ",
    "Start a Project": "เริ่มโปรเจกต์",
    "Design - Architecture - Build": "ออกแบบ - สถาปัตยกรรม - ก่อสร้าง",
    "Tonypony's Company shapes spaces from first sketch to final handover.": "Tonypony's Company สร้างพื้นที่ตั้งแต่สเก็ตช์แรกจนถึงส่งมอบงานจริง",
    "A fictional full-service studio for thoughtful homes, workplaces, retail interiors, and civic buildings that feel precise, warm, and built to last.": "สตูดิโอสมมติแบบครบวงจรสำหรับบ้าน ที่ทำงาน ร้านค้า และอาคารสาธารณะที่ใส่ใจรายละเอียด อบอุ่น และคงทน",
    "View Projects": "ดูผลงาน",
    "Request Consultation": "ขอคำปรึกษา",
    "Fictional years combined experience": "ปีประสบการณ์รวมสมมติ",
    "Concept-to-completion builds": "งานตั้งแต่แนวคิดถึงเสร็จจริง",
    "Average client satisfaction": "คะแนนความพึงพอใจเฉลี่ย",
    "What we do": "สิ่งที่เราทำ",
    "One coordinated team for design clarity, technical control, and construction delivery.": "ทีมเดียวที่ประสานงานครบ เพื่อความชัดเจนของงานออกแบบ การควบคุมเทคนิค และการส่งมอบงานก่อสร้าง",
    "Tonypony's Company is made up for this demo, but the workflow is realistic: site study, architecture, interior direction, permits, procurement, construction supervision, and final styling under one accountable studio.": "Tonypony's Company เป็นบริษัทสมมติสำหรับเดโมนี้ แต่ขั้นตอนทำงานอิงจากงานจริง ตั้งแต่สำรวจพื้นที่ ออกแบบสถาปัตยกรรม วางทิศทางอินทีเรีย ขออนุญาต จัดซื้อ คุมงานก่อสร้าง ไปจนถึงเก็บรายละเอียดสุดท้ายโดยสตูดิโอเดียวที่รับผิดชอบครบ",
    "Site strategy": "กลยุทธ์พื้นที่",
    "Coordinated drawings": "แบบประสานงาน",
    "Build oversight": "ควบคุมงานก่อสร้าง",
    "Concept to keys": "จากแนวคิดถึงส่งมอบ",
    "Architecture, interiors, procurement, and site review handled as one connected workflow.": "สถาปัตยกรรม อินทีเรีย จัดซื้อ และตรวจไซต์ เชื่อมเป็นขั้นตอนเดียวกัน",
    "Built around the full project lifecycle.": "บริการครอบคลุมทั้งวงจรของโปรเจกต์",
    "Architecture": "สถาปัตยกรรม",
    "Concept design, planning layouts, facade studies, construction drawings, and authority-ready documentation.": "ออกแบบแนวคิด วางผัง ศึกษาฟาซาด จัดทำแบบก่อสร้าง และเอกสารพร้อมยื่นหน่วยงาน",
    "Interior Design": "ออกแบบภายใน",
    "Material palettes, lighting strategy, furniture planning, custom joinery, and immersive mood direction.": "พาเลตวัสดุ กลยุทธ์แสง วางแผนเฟอร์นิเจอร์ งานบิลต์อิน และทิศทางบรรยากาศโดยรวม",
    "Building Delivery": "ส่งมอบงานก่อสร้าง",
    "Cost planning, contractor coordination, site supervision, quality reviews, and closeout management.": "วางแผนงบประมาณ ประสานผู้รับเหมา คุมไซต์ ตรวจคุณภาพ และจัดการปิดงาน",
    "Sustainable Upgrades": "อัปเกรดอย่างยั่งยืน",
    "Passive shading, envelope improvements, efficient systems, low-impact materials, and lifecycle planning.": "กันแดดแบบพาสซีฟ ปรับปรุงเปลือกอาคาร ระบบประหยัดพลังงาน วัสดุผลกระทบต่ำ และแผนการใช้งานระยะยาว",
    "Selected Projects": "ผลงานที่เลือก",
    "Fictional work samples for the demo portfolio.": "ตัวอย่างผลงานสมมติสำหรับพอร์ตเดโม",
    "All": "ทั้งหมด",
    "Homes": "บ้าน",
    "Commercial": "เชิงพาณิชย์",
    "Interiors": "อินทีเรีย",
    "Private Residence - Made Up": "บ้านพักอาศัย - สมมติ",
    "Willow Court House": "วิลโลว์ คอร์ต เฮาส์",
    "Architecture, interiors, landscape coordination": "สถาปัตยกรรม อินทีเรีย และประสานงานภูมิทัศน์",
    "Commercial Build - Made Up": "อาคารพาณิชย์ - สมมติ",
    "Northline Works": "นอร์ธไลน์ เวิร์กส์",
    "Design management, build delivery, site quality": "บริหารงานออกแบบ ส่งมอบงานก่อสร้าง และคุณภาพไซต์",
    "Interior Fit-Out - Made Up": "งานตกแต่งภายใน - สมมติ",
    "Atrium House Lobby": "เอเทรียม เฮาส์ ล็อบบี้",
    "Interior architecture, lighting, custom joinery": "สถาปัตยกรรมภายใน แสง และงานบิลต์อิน",
    "Clear steps, practical decisions, fewer surprises.": "ขั้นตอนชัด ตัดสินใจได้จริง และลดเรื่องไม่คาดคิด",
    "Discover": "สำรวจ",
    "We map the site, goals, budget range, approvals, and must-have outcomes before design starts.": "เราวิเคราะห์พื้นที่ เป้าหมาย ช่วงงบประมาณ การอนุมัติ และผลลัพธ์สำคัญก่อนเริ่มออกแบบ",
    "Design": "ออกแบบ",
    "Concepts become plans, elevations, materials, lighting, and a coordinated construction package.": "แนวคิดถูกพัฒนาเป็นผัง รูปด้าน วัสดุ แสง และชุดแบบก่อสร้างที่ประสานกัน",
    "Build": "ก่อสร้าง",
    "Procurement, contractor communication, site checks, and change tracking stay visible throughout.": "การจัดซื้อ การสื่อสารกับผู้รับเหมา การตรวจไซต์ และการติดตามเปลี่ยนแปลงมองเห็นได้ตลอดงาน",
    "Handover": "ส่งมอบ",
    "Final defects, manuals, styling, and maintenance guidance close the project cleanly.": "ตรวจแก้ defect สุดท้าย คู่มือ การจัด styling และคำแนะนำดูแลปิดงานอย่างเรียบร้อย",
    "Design-led, construction-aware, client-focused.": "นำด้วยงานออกแบบ เข้าใจงานก่อสร้าง และโฟกัสลูกค้า",
    "The fictional Tonypony's team combines architects, interior designers, site coordinators, and cost planners. The result is a calmer project experience where beauty and buildability are considered together.": "ทีมสมมติของ Tonypony's รวมสถาปนิก นักออกแบบภายใน ผู้ประสานงานไซต์ และนักวางแผนต้นทุน เพื่อให้โปรเจกต์เดินอย่างนิ่งขึ้น โดยคิดเรื่องความสวยงามและการก่อสร้างไปพร้อมกัน",
    "Core studio roles": "บทบาทหลักในสตูดิโอ",
    "Material partners": "พาร์ตเนอร์วัสดุ",
    "Project scales": "ระดับโปรเจกต์",
    "Detailed documentation before site work": "เอกสารละเอียดก่อนเริ่มงานไซต์",
    "Transparent budget checkpoints": "จุดตรวจงบประมาณที่โปร่งใส",
    "Quality reviews at key milestones": "ตรวจคุณภาพในช่วงสำคัญ",
    "Finishing details planned early": "วางรายละเอียดงานจบตั้งแต่ต้น",
    "Contact": "ติดต่อ",
    "Plan a fictional project with Tonypony's Company.": "วางแผนโปรเจกต์สมมติกับ Tonypony's Company",
    "Send project details through the embedded Google Form below without leaving the page.": "ส่งรายละเอียดโปรเจกต์ผ่าน Google Form ด้านล่างโดยไม่ต้องออกจากหน้านี้",
    "Demo Studio, Riverside District": "Demo Studio, Riverside District",
    "Fictional architecture and design-build studio demo.": "เดโมสตูดิโอสถาปัตยกรรมและออกแบบก่อสร้างสมมติ",
    "Back to top": "กลับขึ้นด้านบน",
  },
  zh: {
    "Company": "公司",
    "Approach": "方法",
    "Services": "服务",
    "Projects": "项目",
    "Process": "流程",
    "Studio": "工作室",
    "Start a Project": "启动项目",
    "Design - Architecture - Build": "设计 - 建筑 - 施工",
    "Tonypony's Company shapes spaces from first sketch to final handover.": "Tonypony's Company 从第一张草图到最终交付塑造空间",
    "A fictional full-service studio for thoughtful homes, workplaces, retail interiors, and civic buildings that feel precise, warm, and built to last.": "一个虚构的全服务工作室，服务于住宅、办公空间、零售室内和公共建筑，注重精准、温度与耐久性",
    "View Projects": "查看项目",
    "Request Consultation": "预约咨询",
    "Fictional years combined experience": "虚构综合经验年限",
    "Concept-to-completion builds": "从概念到完工的项目",
    "Average client satisfaction": "平均客户满意度",
    "What we do": "我们做什么",
    "One coordinated team for design clarity, technical control, and construction delivery.": "一个协同团队，负责清晰设计、技术控制与施工交付",
    "Tonypony's Company is made up for this demo, but the workflow is realistic: site study, architecture, interior direction, permits, procurement, construction supervision, and final styling under one accountable studio.": "Tonypony's Company 是本演示中的虚构公司，但流程贴近真实项目：场地研究、建筑设计、室内方向、许可、采购、施工监督和最终陈设都由同一个负责团队统筹",
    "Site strategy": "场地策略",
    "Coordinated drawings": "协同图纸",
    "Build oversight": "施工监督",
    "Concept to keys": "从概念到交钥匙",
    "Architecture, interiors, procurement, and site review handled as one connected workflow.": "建筑、室内、采购和现场审查作为一个连贯流程处理",
    "Built around the full project lifecycle.": "围绕完整项目生命周期构建",
    "Architecture": "建筑设计",
    "Concept design, planning layouts, facade studies, construction drawings, and authority-ready documentation.": "概念设计、平面布局、立面研究、施工图以及可提交审批的文件",
    "Interior Design": "室内设计",
    "Material palettes, lighting strategy, furniture planning, custom joinery, and immersive mood direction.": "材料搭配、照明策略、家具规划、定制木作与整体氛围方向",
    "Building Delivery": "施工交付",
    "Cost planning, contractor coordination, site supervision, quality reviews, and closeout management.": "成本规划、承包商协调、现场监督、质量审查与收尾管理",
    "Sustainable Upgrades": "可持续升级",
    "Passive shading, envelope improvements, efficient systems, low-impact materials, and lifecycle planning.": "被动遮阳、围护结构优化、高效系统、低影响材料和生命周期规划",
    "Selected Projects": "精选项目",
    "Fictional work samples for the demo portfolio.": "用于演示作品集的虚构项目样本",
    "All": "全部",
    "Homes": "住宅",
    "Commercial": "商业",
    "Interiors": "室内",
    "Private Residence - Made Up": "私人住宅 - 虚构",
    "Willow Court House": "柳庭住宅",
    "Architecture, interiors, landscape coordination": "建筑、室内与景观协调",
    "Commercial Build - Made Up": "商业建筑 - 虚构",
    "Northline Works": "北线工坊",
    "Design management, build delivery, site quality": "设计管理、施工交付与现场质量",
    "Interior Fit-Out - Made Up": "室内精装 - 虚构",
    "Atrium House Lobby": "中庭大堂",
    "Interior architecture, lighting, custom joinery": "室内建筑、照明与定制木作",
    "Clear steps, practical decisions, fewer surprises.": "步骤清晰，决策务实，减少意外",
    "Discover": "调研",
    "We map the site, goals, budget range, approvals, and must-have outcomes before design starts.": "设计开始前，我们梳理场地、目标、预算范围、审批要求和关键成果",
    "Design": "设计",
    "Concepts become plans, elevations, materials, lighting, and a coordinated construction package.": "概念会转化为平面、立面、材料、照明和协同施工文件",
    "Build": "施工",
    "Procurement, contractor communication, site checks, and change tracking stay visible throughout.": "采购、承包商沟通、现场检查和变更跟踪在全过程保持可见",
    "Handover": "交付",
    "Final defects, manuals, styling, and maintenance guidance close the project cleanly.": "最终缺陷修复、手册、陈设和维护指导让项目顺利收尾",
    "Design-led, construction-aware, client-focused.": "以设计为导向，理解施工，关注客户",
    "The fictional Tonypony's team combines architects, interior designers, site coordinators, and cost planners. The result is a calmer project experience where beauty and buildability are considered together.": "虚构的 Tonypony's 团队由建筑师、室内设计师、现场协调员和成本规划师组成，让项目体验更从容，同时兼顾美感与可建造性",
    "Core studio roles": "核心工作室角色",
    "Material partners": "材料合作伙伴",
    "Project scales": "项目尺度",
    "Detailed documentation before site work": "现场施工前完成详细文件",
    "Transparent budget checkpoints": "透明的预算检查点",
    "Quality reviews at key milestones": "关键节点质量审查",
    "Finishing details planned early": "提前规划收口细节",
    "Contact": "联系",
    "Plan a fictional project with Tonypony's Company.": "与 Tonypony's Company 规划一个虚构项目",
    "Send project details through the embedded Google Form below without leaving the page.": "无需离开页面，即可通过下方嵌入的 Google 表单提交项目详情",
    "Demo Studio, Riverside District": "Demo Studio, Riverside District",
    "Fictional architecture and design-build studio demo.": "虚构建筑与设计施工工作室演示",
    "Back to top": "返回顶部",
  },
};

const originalText = new WeakMap();
const textNodes = [];

if (window.lucide) {
  window.lucide.createIcons();
}

const collectTextNodes = () => {
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, {
    acceptNode(node) {
      const parent = node.parentElement;
      if (!parent || !node.nodeValue?.trim()) {
        return NodeFilter.FILTER_REJECT;
      }

      if (parent.closest("script, style, iframe, svg, .language-switch")) {
        return NodeFilter.FILTER_REJECT;
      }

      return NodeFilter.FILTER_ACCEPT;
    },
  });

  let node = walker.nextNode();
  while (node) {
    originalText.set(node, node.nodeValue);
    textNodes.push(node);
    node = walker.nextNode();
  }
};

const translateNodeValue = (originalValue, language) => {
  const key = originalValue.trim();
  const leading = originalValue.match(/^\s*/)?.[0] || "";
  const trailing = originalValue.match(/\s*$/)?.[0] || "";

  if (language === "en") {
    return originalValue;
  }

  return `${leading}${translations[language]?.[key] || key}${trailing}`;
};

const applyLanguage = (language) => {
  const nextLanguage = language === "en" || translations[language] ? language : "en";

  textNodes.forEach((node) => {
    const originalValue = originalText.get(node);
    if (originalValue) {
      node.nodeValue = translateNodeValue(originalValue, nextLanguage);
    }
  });

  document.documentElement.lang = nextLanguage === "zh" ? "zh-Hans" : nextLanguage;
  document.title = pageTitles[nextLanguage] || pageTitles.en;
  languageButtons.forEach((button) => {
    button.classList.toggle("active", button.dataset.lang === nextLanguage);
  });
  localStorage.setItem("tonypony-language", nextLanguage);
};

collectTextNodes();
applyLanguage(localStorage.getItem("tonypony-language") || "en");

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

    projectCards.forEach((card) => {
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
