(() => {
  const siteNav = document.querySelector("[data-site-nav]");
  const mobileNav = document.querySelector("[data-mobile-nav]");
  const mobileNavBackdrop = document.querySelector(
    "[data-mobile-nav-backdrop]",
  );
  const mobileNavButton = document.querySelector("[data-mobile-nav-button]");
  const mobileMenuIcon = document.querySelector("[data-mobile-menu-icon]");
  const mobileCloseIcon = document.querySelector("[data-mobile-close-icon]");
  const pageContent = document.querySelector("[data-page-content]");
  let focusBeforeMobileMenu;

  function setMobileMenu(open) {
    if (!mobileNav || !mobileNavButton) return;
    const focusWasInside = mobileNav.contains(document.activeElement);
    if (open) focusBeforeMobileMenu = document.activeElement;

    mobileNav.classList.toggle("translate-x-full", !open);
    mobileNav.classList.toggle("translate-x-0", open);
    mobileNav.setAttribute("aria-hidden", String(!open));
    mobileNav.inert = !open;
    if (pageContent) pageContent.inert = open;
    mobileNavBackdrop?.classList.toggle("pointer-events-none", !open);
    mobileNavBackdrop?.classList.toggle("opacity-0", !open);
    mobileNavBackdrop?.classList.toggle("opacity-100", open);
    document.documentElement.classList.toggle("overflow-hidden", open);
    mobileNavButton.setAttribute("aria-expanded", String(open));
    mobileNavButton.setAttribute(
      "aria-label",
      open ? "Close navigation menu" : "Open navigation menu",
    );
    mobileMenuIcon?.classList.toggle("hidden", open);
    mobileCloseIcon?.classList.toggle("hidden", !open);

    if (open) {
      requestAnimationFrame(() =>
        mobileNav.querySelector("[data-mobile-nav-link]")?.focus(),
      );
    } else if (focusWasInside) {
      (focusBeforeMobileMenu ?? mobileNavButton).focus();
    }
  }

  if (siteNav && mobileNav && mobileNavButton) {
    mobileNavButton.addEventListener("click", (event) => {
      event.stopPropagation();
      setMobileMenu(mobileNavButton.getAttribute("aria-expanded") !== "true");
    });

    mobileNav.querySelectorAll("[data-mobile-nav-link]").forEach((link) => {
      link.addEventListener("click", () => setMobileMenu(false));
    });

    mobileNavBackdrop?.addEventListener("click", () => setMobileMenu(false));

    document.addEventListener("click", (event) => {
      if (!siteNav.contains(event.target)) setMobileMenu(false);
    });

    window
      .matchMedia("(min-width: 768px)")
      .addEventListener("change", (event) => {
        if (event.matches) setMobileMenu(false);
      });
  }

  const githubMenu = document.querySelector("[data-github-menu]");
  const githubButton = document.querySelector("[data-github-button]");
  const githubDropdown = document.querySelector("[data-github-dropdown]");

  function setGithubMenu(open) {
    if (!githubMenu || !githubButton || !githubDropdown) return;
    githubMenu.dataset.open = String(open);
    githubButton.setAttribute("aria-expanded", String(open));
    githubDropdown.classList.toggle("hidden", !open);
  }

  if (githubMenu && githubButton && githubDropdown) {
    githubButton.addEventListener("click", (event) => {
      event.stopPropagation();
      setGithubMenu(githubMenu.dataset.open !== "true");
    });

    githubMenu.addEventListener("focusout", (event) => {
      if (!githubMenu.contains(event.relatedTarget)) setGithubMenu(false);
    });

    document.addEventListener("click", (event) => {
      if (!githubMenu.contains(event.target)) setGithubMenu(false);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && githubMenu.dataset.open === "true") {
        setGithubMenu(false);
        githubButton.focus();
      }
    });
  }

  document.addEventListener("keydown", (event) => {
    if (
      event.key === "Escape" &&
      mobileNavButton?.getAttribute("aria-expanded") === "true"
    ) {
      setMobileMenu(false);
      mobileNavButton.focus();
    }
  });

  const celebrationButton = document.querySelector("[data-celebrate]");
  const celebrationSound = document.querySelector("[data-celebration-sound]");
  const reducedMotionQuery = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  );

  if (celebrationButton && !reducedMotionQuery.matches) {
    celebrationButton.querySelector("svg")?.animate(
      [
        { transform: "rotate(0deg) scale(1)", offset: 0 },
        { transform: "rotate(-10deg) scale(1.06)", offset: 0.04 },
        { transform: "rotate(10deg) scale(1.06)", offset: 0.08 },
        { transform: "rotate(-8deg) scale(1.04)", offset: 0.12 },
        { transform: "rotate(8deg) scale(1.04)", offset: 0.16 },
        { transform: "rotate(0deg) scale(1)", offset: 0.2 },
        { transform: "rotate(0deg) scale(1)", offset: 1 },
      ],
      { duration: 2800, easing: "ease-in-out", iterations: Infinity },
    );
  }

  let confettiCanvas;
  let confettiFrame;

  function clearConfetti() {
    if (confettiFrame) cancelAnimationFrame(confettiFrame);
    confettiCanvas?.remove();
    confettiCanvas = undefined;
    confettiFrame = undefined;
  }

  function launchConfetti(origin) {
    clearConfetti();

    confettiCanvas = document.createElement("canvas");
    confettiCanvas.className =
      "pointer-events-none fixed inset-0 z-[80] h-full w-full";
    document.body.appendChild(confettiCanvas);

    const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    confettiCanvas.width = window.innerWidth * pixelRatio;
    confettiCanvas.height = window.innerHeight * pixelRatio;

    const context = confettiCanvas.getContext("2d");
    if (!context) return clearConfetti();
    context.scale(pixelRatio, pixelRatio);

    const colors = ["#ff7900", "#fff3e4", "#54300a", "#ffd9b0", "#000000"];
    const particles = Array.from({ length: 170 }, (_, index) => {
      const angle = Math.random() * Math.PI * 2;
      const velocity = 6 + Math.random() * 9;

      return {
        color: colors[index % colors.length],
        height: 8 + Math.random() * 8,
        rotation: Math.random() * Math.PI,
        rotationVelocity: (Math.random() - 0.5) * 0.3,
        velocityX: Math.cos(angle) * velocity,
        velocityY: Math.sin(angle) * velocity - 7,
        width: 5 + Math.random() * 6,
        x: origin.x,
        y: origin.y,
      };
    });

    let startedAt;
    function draw(timestamp) {
      startedAt ??= timestamp;
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);

      particles.forEach((particle) => {
        particle.velocityY += 0.35;
        particle.x += particle.velocityX;
        particle.y += particle.velocityY;
        particle.rotation += particle.rotationVelocity;

        context.save();
        context.translate(particle.x, particle.y);
        context.rotate(particle.rotation);
        context.fillStyle = particle.color;
        context.fillRect(
          -particle.width / 2,
          -particle.height / 2,
          particle.width,
          particle.height,
        );
        context.restore();
      });

      if (timestamp - startedAt < 3000) {
        confettiFrame = requestAnimationFrame(draw);
      } else {
        clearConfetti();
      }
    }

    confettiFrame = requestAnimationFrame(draw);
  }

  celebrationButton?.addEventListener("click", () => {
    if (celebrationSound) {
      celebrationSound.currentTime = 0;
      celebrationSound.play().catch(() => {});
    }

    if (!reducedMotionQuery.matches) {
      const bounds = celebrationButton.getBoundingClientRect();
      launchConfetti({
        x: bounds.left + bounds.width / 2,
        y: bounds.top + bounds.height / 2,
      });
    }
  });

  const progressBar = document.querySelector("[data-scroll-progress]");
  const timeline = document.querySelector("[data-timeline]");
  const timelineFill = document.querySelector("[data-timeline-fill]");
  const navigationLinks = Array.from(
    document.querySelectorAll("[data-nav-link]"),
  );
  const linkedSections = navigationLinks
    .map((link) => ({
      link,
      section: document.querySelector(link.getAttribute("href")),
    }))
    .filter(({ section }) => section);

  let scrollFrame;
  function updateScrollUI() {
    scrollFrame = undefined;
    const viewportHeight = window.innerHeight;
    const documentHeight =
      document.documentElement.scrollHeight - viewportHeight;

    if (progressBar) {
      const progress = documentHeight > 0 ? window.scrollY / documentHeight : 0;
      progressBar.style.width = `${Math.min(1, Math.max(0, progress)) * 100}%`;
    }

    if (timeline && timelineFill) {
      const bounds = timeline.getBoundingClientRect();
      const progress = (viewportHeight * 0.72 - bounds.top) / bounds.height;
      timelineFill.style.height = `${Math.min(1, Math.max(0, progress)) * 100}%`;
    }

    let activeSection = linkedSections[0]?.section;
    linkedSections.forEach((item) => {
      if (item.section.getBoundingClientRect().top <= viewportHeight * 0.4)
        activeSection = item.section;
    });

    linkedSections.forEach(({ link, section }) => {
      const isActive = section === activeSection;
      const isMobileLink = link.hasAttribute("data-mobile-nav-link");
      link.classList.toggle(
        "shadow-[inset_0_-3px_0_#ff7900]",
        isActive && !isMobileLink,
      );
      link.classList.toggle("bg-[#1a1a1a]", isActive && isMobileLink);
      link.classList.toggle("text-[#ff7900]", isActive && isMobileLink);
      link.setAttribute("aria-current", isActive ? "page" : "false");
    });
  }

  function scheduleScrollUpdate() {
    if (!scrollFrame) scrollFrame = requestAnimationFrame(updateScrollUI);
  }

  window.addEventListener("scroll", scheduleScrollUpdate, { passive: true });
  window.addEventListener("resize", scheduleScrollUpdate, { passive: true });
  updateScrollUI();
})();
