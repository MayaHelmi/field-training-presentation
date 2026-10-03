(() => {
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

  const celebrationButton = document.querySelector("[data-celebrate]");
  const celebrationSound = document.querySelector("[data-celebration-sound]");
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  if (celebrationButton && !prefersReducedMotion) {
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

    const bounds = celebrationButton.getBoundingClientRect();
    launchConfetti({
      x: bounds.left + bounds.width / 2,
      y: bounds.top + bounds.height / 2,
    });
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

    let active = linkedSections[0];
    linkedSections.forEach((item) => {
      if (item.section.getBoundingClientRect().top <= viewportHeight * 0.4)
        active = item;
    });

    linkedSections.forEach(({ link }) => {
      const isActive = link === active?.link;
      link.classList.toggle("shadow-[inset_0_-3px_0_#ff7900]", isActive);
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
