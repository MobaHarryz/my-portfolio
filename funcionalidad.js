// ===== Mobile menu =====
const header = document.getElementById("header");
const nav = document.getElementById("nav");
const navToggle = document.getElementById("nav-toggle");

function setMenu(open) {
    nav.classList.toggle("open", open);
    header.classList.toggle("menu-open", open);
    navToggle.setAttribute("aria-expanded", open);
    navToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    navToggle.querySelector("i").className = open ? "fa-solid fa-xmark" : "fa-solid fa-bars";
}

navToggle.addEventListener("click", () => setMenu(!nav.classList.contains("open")));

// Hide the menu once an option is selected
nav.querySelectorAll("a").forEach(link => link.addEventListener("click", () => setMenu(false)));

// ===== Header background on scroll =====
function onScroll() {
    header.classList.toggle("scrolled", window.scrollY > 20);
}
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ===== Active link while scrolling =====
const navLinks = [...nav.querySelectorAll("a")];
const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        navLinks.forEach(link => {
            link.classList.toggle("active", link.getAttribute("href") === "#" + entry.target.id);
        });
    });
}, { rootMargin: "-45% 0px -50% 0px" });

document.querySelectorAll("main section[id]").forEach(section => sectionObserver.observe(section));

// ===== Light / dark mode =====
const root = document.documentElement;
const themeToggle = document.getElementById("theme-toggle");

function paintThemeIcon() {
    const dark = root.dataset.theme !== "light";
    themeToggle.querySelector("i").className = dark ? "fa-solid fa-sun" : "fa-solid fa-moon";
    themeToggle.setAttribute("aria-label", dark ? "Switch to light mode" : "Switch to dark mode");
}

themeToggle.addEventListener("click", () => {
    root.dataset.theme = root.dataset.theme === "light" ? "dark" : "light";
    try { localStorage.setItem("theme", root.dataset.theme); } catch (e) {}
    paintThemeIcon();
});
paintThemeIcon();

// ===== Rotating role text in the hero =====
const typed = document.getElementById("typed");
const roles = ["Consultant", "Backend", "Frontend"];
let roleIndex = 0;

if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    setInterval(() => {
        roleIndex = (roleIndex + 1) % roles.length;
        typed.style.opacity = 0;
        setTimeout(() => {
            typed.textContent = roles[roleIndex];
            typed.style.opacity = 1;
        }, 250);
    }, 2800);
    typed.style.transition = "opacity .25s";
}

// ===== Skill bars (built from data-level, animated when visible) =====
document.querySelectorAll(".bars li").forEach(item => {
    const level = item.dataset.level;
    item.querySelector("span").dataset.level = level + "%";
    item.insertAdjacentHTML("beforeend",
        `<div class="bar" role="progressbar" aria-valuenow="${level}" aria-valuemin="0" aria-valuemax="100"><div class="bar-fill"></div></div>`);
});

const barObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.querySelectorAll(".bars li").forEach(item => {
            item.querySelector(".bar-fill").style.width = item.dataset.level + "%";
        });
        observer.unobserve(entry.target);
    });
}, { threshold: 0.3 });

document.querySelectorAll(".skill-card").forEach(card => barObserver.observe(card));

// ===== Reveal on scroll =====
const revealObserver = new IntersectionObserver((entries, observer) => {
    entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
    });
}, { threshold: 0.12 });

document.querySelectorAll(".reveal").forEach(el => revealObserver.observe(el));

// ===== Image lightbox =====
const lightbox = document.getElementById("lightbox");
const lightboxImg = lightbox.querySelector("img");
const lightboxClose = lightbox.querySelector(".lightbox-close");
let lastFocused = null;

function openLightbox(trigger) {
    lastFocused = trigger;
    const img = trigger.querySelector("img");
    lightboxImg.src = trigger.dataset.full;
    lightboxImg.alt = img.alt;
    lightbox.hidden = false;
    document.body.style.overflow = "hidden";
    lightboxClose.focus();
}

function closeLightbox() {
    lightbox.hidden = true;
    lightboxImg.src = "";
    document.body.style.overflow = "";
    if (lastFocused) lastFocused.focus();
}

// Only image previews open the lightbox; live projects are regular external links
document.querySelectorAll("button.project-media").forEach(trigger => {
    trigger.addEventListener("click", () => openLightbox(trigger));
});

lightbox.addEventListener("click", event => {
    if (event.target !== lightboxImg) closeLightbox();
});

document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !lightbox.hidden) closeLightbox();
});

// ===== Footer year =====
document.getElementById("year").textContent = new Date().getFullYear();
