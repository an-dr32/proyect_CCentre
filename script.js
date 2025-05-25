const asciiChars = "!@#$%^&*()_+=-[]{}|;:,.<>?/0123456789";

document.addEventListener("DOMContentLoaded", () => {
  const canvas = document.getElementById("asciiCanvas");
  const ctx = canvas.getContext("2d");
  const dpr = window.devicePixelRatio || 1;

  // Your state
  let explosions = [];
  const MAX_EXPLOSIONS = 2;
  let ripples = [];
  let columns = [];
  let columnCount, maxHeight;
  const fontSize = 20;
  const columnSpacing = 4;
  const minHeight = 11;
  const waveAmplitude = 10;
  const waveSpeed = 0.001;
  const waveLength = 0.05;
  const characterRefreshRate = 80;
  const explosionRadius = 100;
  const explosionForce = 25;
  const explosionDecay = 1000;
  const repelRadius = 80;
  const mouse = { x: -9999, y: -9999 };

  function randomChar() {
    return asciiChars[Math.floor(Math.random() * asciiChars.length)];
  }

  function initEqualizer() {
    columnCount = Math.floor(window.innerWidth / (fontSize + columnSpacing));
    maxHeight = minHeight + waveAmplitude;
    columns = Array.from({ length: columnCount }).map((_, x) => ({
      x: x * (fontSize + columnSpacing),
      charOffsets: [],
    }));
    console.log("Columns initialized:", {
      columnCount,
      columnsLength: columns.length,
    });
  }

  let canvasCssHeight = 0;

  function resizeCanvas() {
    const dpr = window.devicePixelRatio || 1;

    const cssWidth = window.innerWidth * 0.97;
    const cssHeight = window.innerHeight * 0.65;
    canvasCssHeight = cssHeight; // <-- store it in CSS pixels

    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);

    console.log("Canvas resized:", {
      dpr,
      cssWidth,
      cssHeight,
      actualWidth: canvas.width,
      actualHeight: canvas.height,
    });

    initEqualizer();
  }

  // Call once
  resizeCanvas();
  requestAnimationFrame(draw);

  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("pageshow", resizeCanvas);

  // Add event listeners
  window.addEventListener("resize", resizeCanvas);
  window.addEventListener("pageshow", resizeCanvas);

  document.addEventListener("mousemove", (e) => {
    const button = document.querySelector(".cta-button");
    const rect = button.getBoundingClientRect();

    if (
      e.clientX >= rect.left &&
      e.clientX <= rect.right &&
      e.clientY >= rect.top &&
      e.clientY <= rect.bottom
    ) {
      canvas.style.pointerEvents = "none";
    } else if (!mobileMenu.classList.contains("open")) {
      canvas.style.pointerEvents = "auto";
    }
  });

  function draw(time) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < columns.length; i++) {
      const col = columns[i];
      const wave = Math.sin(time * waveSpeed + i * waveLength);
      const dynamicHeight = Math.floor(
        (wave + 1) * 0.5 * waveAmplitude + minHeight
      );

      for (let j = 0; j < dynamicHeight; j++) {
        const baseX = col.x;
        const baseY = canvasCssHeight - j * fontSize;

        if (!col.charOffsets[j]) {
          col.charOffsets[j] = { x: baseX, y: baseY };
        }
        const offset = col.charOffsets[j];

        // Explosion force
        for (const explosion of explosions) {
          const dx = offset.x - explosion.x;
          const dy = offset.y - explosion.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < explosionRadius) {
            const strength = (explosionRadius - dist) / explosionRadius;
            const angle = Math.atan2(dy, dx);
            const timeElapsed = time - explosion.time;
            const decay = Math.max(0, 1 - timeElapsed / explosionDecay);
            const force = explosionForce * strength * decay;

            offset.x += Math.cos(angle) * force;
            offset.y += Math.sin(angle) * force;
            offset.x += (Math.random() - 0.5) * 0.5;
            offset.y += (Math.random() - 0.5) * 0.5;
          }
        }

        // Mouse repulsion
        const dx = baseX - mouse.x;
        const dy = baseY - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < repelRadius) {
          const strength = (repelRadius - dist) / repelRadius;
          const angle = Math.atan2(dy, dx);
          const force = strength * 20;
          offset.x += Math.cos(angle) * force;
          offset.y += Math.sin(angle) * force;
        }

        offset.x += (baseX - offset.x) * 0.1;
        offset.y += (baseY - offset.y) * 0.1;

        if (!col.chars) col.chars = [];
        if (!col.lastUpdate || time - col.lastUpdate > characterRefreshRate) {
          for (let k = 0; k < dynamicHeight; k++) {
            col.chars[k] = randomChar();
          }
          col.lastUpdate = time;
        }

        const char = col.chars[j] || randomChar();
        ctx.fillStyle = `rgb(90, 205, 250)`;
        ctx.font = `${fontSize}px 'Space Mono', monospace`;
        ctx.fillText(char, offset.x, offset.y);
      }
    }

    // Ripples
    for (let i = ripples.length - 1; i >= 0; i--) {
      const ripple = ripples[i];
      const age = time - ripple.start;
      const duration = 500;
      if (age > duration) {
        ripples.splice(i, 1);
        continue;
      }
      const progress = age / duration;
      const radius = progress * explosionRadius * 2;
      const opacity = 1 - progress;

      ctx.beginPath();
      ctx.arc(ripple.x, ripple.y, radius, 0, Math.PI * 2);
      ctx.strokeStyle = `rgba(90, 205, 250, ${opacity})`;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    explosions = explosions.filter((e) => time - e.time < explosionDecay);
    requestAnimationFrame(draw);
  }

  canvas.addEventListener("click", (e) => {
    if (explosions.length >= MAX_EXPLOSIONS) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    explosions.push({ x, y, time: performance.now() });
    ripples.push({ x, y, start: performance.now() });
    console.log("click at", x, y);
  });

  window.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
    const cursor = document.getElementById("customCursor");
    if (cursor) {
      cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
    }
  });

  function getTouchPos(e) {
    const touch = e.touches[0];
    const rect = canvas.getBoundingClientRect();
    return {
      x: touch.clientX - rect.left,
      y: touch.clientY - rect.top,
    };
  }

  canvas.addEventListener("touchstart", (e) => {
    e.preventDefault();
    if (explosions.length >= MAX_EXPLOSIONS) return;
    const { x, y } = getTouchPos(e);
    explosions.push({ x, y, time: performance.now() });
    ripples.push({ x, y, start: performance.now() });
  });
});

// === LOGO ANIMATION ==
const logoInstances = [
  {
    line1Id: "navbar-line1",
    line2Id: "navbar-line2",
    text: ["C0D3", "CENTRE"],
  },
  {
    line1Id: "hero-line1",
    line2Id: "hero-line2",
    text: ["C0D3", "CENTRE"],
  },
];

function setupText(line1Id, line2Id, text) {
  const line1 = document.getElementById(line1Id);
  const line2 = document.getElementById(line2Id);

  line1.innerHTML = "";
  line2.innerHTML = "";

  for (let char of text[0]) {
    const span = document.createElement("span");
    span.textContent = char;
    line1.appendChild(span);
  }

  for (let char of text[1]) {
    const span = document.createElement("span");
    span.textContent = char;
    line2.appendChild(span);
  }

  alignSecondLine(line1, line2);
}

function alignSecondLine(line1, line2) {
  const spans = line1.querySelectorAll("span");
  const lastChar = spans[spans.length - 1];
  if (lastChar) {
    const offsetX = lastChar.offsetLeft;
    line2.style.left = `${offsetX}px`;
  }
}

function glitchLetter(span, originalChar, duration) {
  const glitchInterval = setInterval(() => {
    const randomChar =
      asciiChars[Math.floor(Math.random() * asciiChars.length)];
    const randomFontClass =
      "glitch-font-" + (1 + Math.floor(Math.random() * 3));
    span.className = randomFontClass;
    span.textContent = randomChar;
  }, 100);

  setTimeout(() => {
    clearInterval(glitchInterval);
    span.textContent = originalChar;
    span.className = "";
  }, duration);
}

function animateLogo(line1Id, line2Id, text) {
  const spans1 = document.getElementById(line1Id).querySelectorAll("span");
  const spans2 = document.getElementById(line2Id).querySelectorAll("span");

  spans1.forEach((span, i) => {
    setTimeout(() => {
      glitchLetter(span, text[0][i], 1000 + Math.random() * 1500);
    }, i * 80);
  });

  spans2.forEach((span, i) => {
    setTimeout(() => {
      glitchLetter(span, text[1][i], 1000 + Math.random() * 1500);
    }, i * 80);
  });
}

logoInstances.forEach(({ line1Id, line2Id, text }) => {
  setupText(line1Id, line2Id, text);
  animateLogo(line1Id, line2Id, text);
  setInterval(() => {
    setupText(line1Id, line2Id, text);
    animateLogo(line1Id, line2Id, text);
  }, 10000);
});

// === CYCLE THROUGH COLORS ===

const logo = document.querySelector(".navbar .logo");

const colorVars = [
  "--color-dark",
  "--color-text",
  "--color-bg",
  "--color-text",
  "--color-dark",
];

let currentIndex = 0;

function cycleLogoColor() {
  const nextColor = getComputedStyle(document.documentElement).getPropertyValue(
    colorVars[currentIndex]
  );
  logo.style.color = nextColor.trim();
  currentIndex = (currentIndex + 1) % colorVars.length;
}

setInterval(cycleLogoColor, 800); // Change every 800ms

// === FADE-IN ANIMATION ===
const fadeEls = document.querySelectorAll(".fade-in");
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add("visible");
    }
  });
});
fadeEls.forEach((el) => observer.observe(el));

// === HAMBURGER MENU ===

function enableCanvasInteraction() {
  const menuOpen = document
    .getElementById("mobileMenu")
    ?.classList.contains("open");
  if (!menuOpen) canvas.style.pointerEvents = "auto";
}

function disableCanvasInteraction() {
  canvas.style.pointerEvents = "none";
}

document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");

  hamburger.addEventListener("click", () => {
    mobileMenu.classList.toggle("open");

    if (mobileMenu.classList.contains("open")) {
      disableCanvasInteraction();
    } else {
      enableCanvasInteraction();
    }
  });
  document.addEventListener("mousemove", (e) => {
    const hovered = document.elementFromPoint(e.clientX, e.clientY);
    if (hovered.closest(".navbar") || hovered.closest("#mobileMenu")) {
      disableCanvasInteraction();
    } else {
      enableCanvasInteraction();
    }
  });
});

// Scroll cue disappears when user scrolls to the classes section
const scrollCue = document.getElementById("scrollCue");
const targetSection = document.getElementById("college-classes");

// Observer to hide scroll cue when the user reaches target section
const hideCueObserver = new IntersectionObserver(
  ([entry]) => {
    if (entry.isIntersecting) {
      scrollCue.classList.add("hidden");
    }
  },
  {
    threshold: 0.1,
    rootMargin: "100px 0px",
  }
);

// Observer to show scroll cue when user scrolls back to top
const showCueObserver = new IntersectionObserver(
  ([entry]) => {
    if (entry.isIntersecting) {
      scrollCue.classList.remove("hidden");
    }
  },
  { threshold: 0.9 }
);

// Use a dummy element at the very top of the page
const topSentinel = document.createElement("div");
topSentinel.style.position = "absolute";
topSentinel.style.top = "0";
topSentinel.style.height = "1px";
topSentinel.style.width = "100%";
document.body.prepend(topSentinel);

// Start observing
setTimeout(() => {
  if (scrollCue && targetSection) {
    hideCueObserver.observe(targetSection);
    showCueObserver.observe(topSentinel);
  }
}, 100); // slight buffer

// JSON DATA FOR COLLEGE CLASSES
// Fetching college classes data from JSON file
document.addEventListener("DOMContentLoaded", () => {
  fetch("data/classes.json")
    .then((response) => {
      if (!response.ok)
        throw new Error(`HTTP error! Status: ${response.status}`);
      return response.json();
    })
    .then((classes) => {
      const container = document.getElementById("college-classes");
      if (!container) {
        console.error("Element #college-classes not found in DOM.");
        return;
      }

      classes.forEach((cls, i) => {
        const card = document.createElement("div");
        card.classList.add("class-card");

        card.style.transitionDelay = `${i * 100}ms`;
        card.innerHTML = `
         
          <div class="class-content">
            <h3>${cls.title}</h3>
            <span>${cls.date}</span>
             <img src="${cls.image}" alt="${cls.title}" />
            <p>${cls.description}</p>
            <div class="class-actions">
              <a href="${cls.detailsLink}" class="btn primary">View Details</a>
              <a href="${cls.enrollLink}" class="btn secondary">Enroll Now</a>
            </div>
              <ul class="class-tags">
                <li><span class="check">✓</span><span class="text">${cls.time}</span></li>
                <li><span class="check">✓</span><span class="text">${cls.duration}</span></li>
                <li><span class="check">✓</span><span class="text">${cls.level}</span></li>
                <li><span class="check">✓</span><span class="text">${cls.location}</span></li>
              </ul>
          </div>
          <div class="class-price-banner">${cls.price}</div>
        `;
        container.appendChild(card);
      });
    })
    .catch((err) => {
      console.error("Failed to load class data:", err);
    });
});

const mobileMenu = document.getElementById("mobileMenu");

let isDown = false;
let startX;
let scrollLeft;

mobileMenu.addEventListener("mousedown", (e) => {
  isDown = true;
  mobileMenu.classList.add("scrolling");
  startX = e.pageX - mobileMenu.offsetLeft;
  scrollLeft = mobileMenu.scrollLeft;
});

mobileMenu.addEventListener("mouseleave", () => {
  isDown = false;
  mobileMenu.classList.remove("scrolling");
});

mobileMenu.addEventListener("mouseup", () => {
  isDown = false;
  mobileMenu.classList.remove("scrolling");
});

mobileMenu.addEventListener("mousemove", (e) => {
  if (!isDown) return;
  e.preventDefault();
  const x = e.pageX - mobileMenu.offsetLeft;
  const walk = (x - startX) * 2; // scroll speed multiplier
  mobileMenu.scrollLeft = scrollLeft - walk;
});

document.getElementById("scrollCue").addEventListener("click", () => {
  const target = document.getElementById("college-classes");
  if (target) {
    target.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }
});

const classesSection = document.getElementById("college-classes");

const revealObserver = new IntersectionObserver(
  ([entry]) => {
    if (entry.isIntersecting) {
      classesSection.classList.add("visible");
      revealObserver.unobserve(classesSection); // animate only once
    }
  },
  {
    threshold: 0.1,
  }
);

// Start observing after content has been rendered
if (classesSection) {
  // Delay slightly to ensure layout is ready
  setTimeout(() => {
    revealObserver.observe(classesSection);
  }, 100);
}
