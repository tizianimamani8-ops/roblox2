// ---------- Partículas ----------
const particleHost = document.getElementById("particles");
for (let i = 0; i < 38; i++) {
  const p = document.createElement("span");
  p.className = "spark";
  p.style.left = `${Math.random() * 100}%`;
  p.style.animationDelay = `${Math.random() * 7}s`;
  p.style.animationDuration = `${5 + Math.random() * 6}s`;
  particleHost.appendChild(p);
}

// ---------- Tarjeta 3D ----------
const heroCard = document.getElementById("heroCard");
if (window.matchMedia("(pointer:fine)").matches) {
  heroCard.addEventListener("mousemove", (e) => {
    const r = heroCard.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    heroCard.style.transform = `perspective(900px) rotateY(${x * 8}deg) rotateX(${y * -8}deg)`;
  });
  heroCard.addEventListener("mouseleave", () => heroCard.style.transform = "");
}

// ---------- Countdown ----------
const countdown = document.getElementById("countdown");
let remaining = 7 * 60 * 60;
setInterval(() => {
  if (remaining > 0) remaining--;
  const h = String(Math.floor(remaining / 3600)).padStart(2, "0");
  const m = String(Math.floor((remaining % 3600) / 60)).padStart(2, "0");
  const s = String(remaining % 60).padStart(2, "0");
  countdown.textContent = `${h}:${m}:${s}`;
}, 1000);

// ---------- FAQ ----------
document.querySelectorAll(".faq-item").forEach((item) => {
  item.addEventListener("click", () => {
    const answer = item.nextElementSibling;
    const icon = item.querySelector("span:last-child");
    const isOpen = answer.classList.toggle("open");
    icon.textContent = isOpen ? "−" : "+";
  });
});

// ---------- Mini-juego ----------
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const startButton = document.getElementById("startGame");
const overlay = document.getElementById("gameOverlay");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const timeEl = document.getElementById("time");

let player, blocks, score, timeLeft, gameRunning, lastSpawn, animationId, lastTime;
let best = Number(localStorage.getItem("blockverse-best") || 0);
bestEl.textContent = best;

const keys = { left: false, right: false };

function resetGame() {
  player = { x: canvas.width / 2 - 30, y: canvas.height - 58, w: 60, h: 40, speed: 420 };
  blocks = [];
  score = 0;
  timeLeft = 30;
  lastSpawn = 0;
  lastTime = performance.now();
  scoreEl.textContent = "0";
  timeEl.textContent = "30";
}

function spawnBlock() {
  const size = 24 + Math.random() * 18;
  blocks.push({
    x: Math.random() * (canvas.width - size),
    y: -size,
    size,
    speed: 130 + Math.random() * 180,
    hue: Math.floor(Math.random() * 3)
  });
}

function rectsOverlap(a, b) {
  return a.x < b.x + b.size &&
         a.x + a.w > b.x &&
         a.y < b.y + b.size &&
         a.y + a.h > b.y;
}

function drawBackground() {
  ctx.fillStyle = "#0a1330";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.strokeStyle = "rgba(86,150,220,.12)";
  ctx.lineWidth = 1;
  for (let x = 0; x < canvas.width; x += 45) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.height); ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += 45) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.width, y); ctx.stroke();
  }
}

function drawBlock(b) {
  const palettes = [
    ["#39a7ff", "#8fd7ff"],
    ["#8d6cff", "#c1b3ff"],
    ["#ffd64a", "#fff0a6"]
  ];
  const [main, light] = palettes[b.hue];
  ctx.fillStyle = main;
  ctx.fillRect(b.x, b.y, b.size, b.size);
  ctx.fillStyle = light;
  ctx.fillRect(b.x, b.y, b.size, Math.max(4, b.size * .18));
  ctx.strokeStyle = "rgba(255,255,255,.5)";
  ctx.strokeRect(b.x + .5, b.y + .5, b.size - 1, b.size - 1);
}

function drawPlayer() {
  ctx.fillStyle = "#f2b486";
  ctx.fillRect(player.x + 10, player.y - 22, 40, 40);
  ctx.fillStyle = "#7d70ff";
  ctx.fillRect(player.x + 5, player.y + 15, 50, 25);
  ctx.fillStyle = "#303a61";
  ctx.fillRect(player.x + 9, player.y + 40, 15, 16);
  ctx.fillRect(player.x + 36, player.y + 40, 15, 16);
  ctx.fillStyle = "#10182f";
  ctx.fillRect(player.x + 17, player.y - 10, 5, 5);
  ctx.fillRect(player.x + 38, player.y - 10, 5, 5);
}

function endGame() {
  gameRunning = false;
  cancelAnimationFrame(animationId);
  if (score > best) {
    best = score;
    localStorage.setItem("blockverse-best", String(best));
    bestEl.textContent = best;
  }
  overlay.innerHTML = `
    <div class="overlay-box">
      <div class="overlay-emoji">🏆</div>
      <h3>FIN DE PARTIDA</h3>
      <p>Conseguiste <b>${score}</b> puntos.</p>
      <button class="primary-button" id="restartGame">JUGAR DE NUEVO</button>
    </div>`;
  overlay.style.display = "grid";
  document.getElementById("restartGame").addEventListener("click", startGame);
}

function gameLoop(now) {
  if (!gameRunning) return;
  const dt = Math.min((now - lastTime) / 1000, 0.05);
  lastTime = now;
  timeLeft -= dt;

  if (keys.left) player.x -= player.speed * dt;
  if (keys.right) player.x += player.speed * dt;
  player.x = Math.max(0, Math.min(canvas.width - player.w, player.x));

  lastSpawn += dt * 1000;
  if (lastSpawn > 520) {
    lastSpawn = 0;
    spawnBlock();
  }

  for (let i = blocks.length - 1; i >= 0; i--) {
    const b = blocks[i];
    b.y += b.speed * dt;

    if (rectsOverlap(player, b)) {
      blocks.splice(i, 1);
      score++;
      scoreEl.textContent = score;
      continue;
    }
    if (b.y > canvas.height + 40) blocks.splice(i, 1);
  }

  drawBackground();
  blocks.forEach(drawBlock);
  drawPlayer();

  timeEl.textContent = String(Math.max(0, Math.ceil(timeLeft)));
  if (timeLeft <= 0) return endGame();

  animationId = requestAnimationFrame(gameLoop);
}

function startGame() {
  resetGame();
  overlay.style.display = "none";
  gameRunning = true;
  lastTime = performance.now();
  animationId = requestAnimationFrame(gameLoop);
}

startButton.addEventListener("click", startGame);

window.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") keys.left = true;
  if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") keys.right = true;
});
window.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key.toLowerCase() === "a") keys.left = false;
  if (e.key === "ArrowRight" || e.key.toLowerCase() === "d") keys.right = false;
});

canvas.addEventListener("pointermove", (e) => {
  if (!gameRunning) return;
  const r = canvas.getBoundingClientRect();
  const localX = (e.clientX - r.left) / r.width * canvas.width;
  player.x = localX - player.w / 2;
});
