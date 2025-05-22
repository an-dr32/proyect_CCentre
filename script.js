const canvas = document.getElementById("asciiCanvas");
const ctx = canvas.getContext("2d");
const cursor = document.getElementById("customCursor");
const dpr = window.devicePixelRatio || 1;

const explosionRadius = 100;
const explosionForce = 25;
const explosionDecay = 1000; // ms before force fades

const asciiChars = "!@#$%^&*()_+=-[]{}|;:,.<>?/0123456789";
const fontSize = 20;
const columnSpacing = 4;

let columnCount,
  maxHeight,
  columns = [];
let mouse = { x: -9999, y: -9999 };

// === CONFIG ===
const waveSpeed = 0.001; // Speed of wave animation
const waveLength = 0.05; // Spatial frequency of wave
const waveAmplitude = 10; // Wave height in characters
const minHeight = 11; // Minimum characters per column
const repelRadius = 80; // Radius of mouse repulsion
const characterRefreshRate = 80; // Time in ms to refresh characters

// === INIT ===
function initEqualizer() {
  columnCount = Math.floor(window.innerWidth / (fontSize + columnSpacing));
  maxHeight = minHeight + waveAmplitude;

  columns = Array.from({ length: columnCount }).map((_, x) => ({
    x: x * (fontSize + columnSpacing),
    charOffsets: [],
  }));
}

function resizeCanvas() {
  const dpr = window.devicePixelRatio || 1;

  // Get desired CSS size
  const cssWidth = window.innerWidth * 0.97; // 97vw
  const cssHeight = window.innerHeight * 0.65; // 65vh

  // Apply CSS size explicitly
  canvas.style.width = `${cssWidth}px`;
  canvas.style.height = `${cssHeight}px`;

  // Set actual canvas pixel size
  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;

  ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset transform
  ctx.scale(dpr, dpr); // Match drawing scale to screen

  initEqualizer(); // Recalculate ASCII layout
}

function randomChar() {
  return asciiChars[Math.floor(Math.random() * asciiChars.length)];
}

// === MOUSE TRACKING ===
window.addEventListener("mousemove", (e) => {
  const dpr = window.devicePixelRatio || 1;

  // Adjust to canvas drawing scale
  const rect = canvas.getBoundingClientRect();
  mouse.x = e.clientX - rect.left;
  mouse.y = e.clientY - rect.top;

  // Still move the cursor in screen space
  cursor.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`;
});

let explosions = [];

canvas.addEventListener("click", (e) => {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  explosions.push({
    x,
    y,
    time: performance.now(),
  });
});

// === DRAW LOOP ===
function draw(time) {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  for (let i = 0; i < columns.length; i++) {
    const col = columns[i];

    // Sine wave height control (added to minimum height)
    const wave = Math.sin(time * waveSpeed + i * waveLength);
    const dynamicHeight = Math.floor(
      (wave + 1) * 0.5 * waveAmplitude + minHeight
    );

    for (let j = 0; j < dynamicHeight; j++) {
      const baseX = col.x;
      const baseY = canvas.height - j * fontSize;

      // Explosion force
      if (!col.charOffsets[j]) {
        col.charOffsets[j] = { x: baseX, y: baseY };
      }
      const offset = col.charOffsets[j];

      // ✅ Now it's safe to apply explosion forces
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

      // Spring back to wave position
      offset.x += (baseX - offset.x) * 0.1;
      offset.y += (baseY - offset.y) * 0.1;

      // Random character every frame
      if (!col.chars) col.chars = [];
      if (!col.lastUpdate || time - col.lastUpdate > characterRefreshRate) {
        // 100ms delay
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

  explosions = explosions.filter((e) => time - e.time < explosionDecay);

  requestAnimationFrame(draw);
}

// === START ===
document.addEventListener("DOMContentLoaded", () => {
  resizeCanvas();
  requestAnimationFrame(draw);
});

// === LOGO ANIMATION ==
const logoInstances = [
  {
    line1Id: "navbar-line1",
    line2Id: "navbar-line2",
    text: ["CODE", "CENTRE"],
  },
  {
    line1Id: "hero-line1",
    line2Id: "hero-line2",
    text: ["CODE", "CENTRE"],
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
document.addEventListener("DOMContentLoaded", () => {
  const hamburger = document.getElementById("hamburger");
  const mobileMenu = document.getElementById("mobileMenu");

  hamburger.addEventListener("click", () => {
    mobileMenu.classList.toggle("open");
    console.log("Hamburger menu clicked");
  });
});

// Scroll cue disappears when user scrolls to the classes section
const scrollCue = document.getElementById("scrollCue");
const targetSection = document.getElementById("college-classes");

if (scrollCue && targetSection) {
  const scrollCueObserver = new IntersectionObserver(
    ([entry]) => {
      if (entry.isIntersecting) {
        scrollCue.classList.add("hidden");
      } else {
        scrollCue.classList.remove("hidden");
      }
    },
    { threshold: 0.1 }
  );

  scrollCueObserver.observe(targetSection);
} else {
  console.warn("Scroll cue or target section not found.");
}

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

      classes.forEach((cls) => {
        const card = document.createElement("div");
        card.classList.add("class-card");
        card.innerHTML = `
         
          <div class="class-content">
            <h3>${cls.title}</h3>
             <img src="${cls.image}" alt="${cls.title}" />
            <p>${cls.description}</p>
            <div class="class-actions">
              <a href="${cls.detailsLink}" class="btn primary">View Details</a>
              <a href="${cls.enrollLink}" class="btn secondary">Enroll Now</a>
            </div>
          </div>
        `;
        container.appendChild(card);
      });
    })
    .catch((err) => {
      console.error("Failed to load class data:", err);
    });
});
