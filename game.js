const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const title = document.getElementById('overlay-title');
const copy = document.getElementById('overlay-copy');
const startButton = document.getElementById('start-button');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');
const siteLink = document.getElementById('site-link');

const W = 480, H = 720, GROUND = 35;
canvas.width = W;
canvas.height = H;
let state = 'ready', score = 0, best = Number(localStorage.getItem('pipeHopperBest') || 0);
let player, pipes, particles, frame, lastTime;
bestEl.textContent = best;

function reset() { score = 0; scoreEl.textContent = score; player = { x: 112, y: H / 2, radius: 18, velocity: 0, rotation: 0 }; pipes = []; particles = []; frame = 0; }
function start() { reset(); state = 'playing'; overlay.classList.add('hidden'); canvas.focus(); flap(); }
function endGame() {
  if (state !== 'playing') return;
  state = 'gameover';
  if (score > best) { best = score; localStorage.setItem('pipeHopperBest', best); bestEl.textContent = best; }
  title.textContent = 'Pipe blocked!';
  copy.textContent = `You fixed ${score} pipe${score === 1 ? '' : 's'} today. Give it another go!`;
  startButton.innerHTML = 'Try Again <span>↻</span>';
  // Keep the death screen focused on replaying; the website link is start-menu only.
  siteLink.hidden = true;
  overlay.classList.remove('hidden');
}
function flap() { if (state !== 'playing') return; player.velocity = -330; for (let i = 0; i < 6; i++) particles.push({ x: player.x - 18, y: player.y + 8, vx: -Math.random() * 60, vy: (Math.random() - .5) * 90, life: .5 }); }
function addPipe() { const gap = Math.max(138, 220 - score * 3); const drift = Math.min(140, 28 + score * 4.5); const gapCenter = H / 2 + (Math.random() - .5) * 2 * drift; const top = Math.max(60, Math.min(H - GROUND - gap - 60, gapCenter - gap / 2)); pipes.push({ x: W + 30, width: 72, top, bottom: top + gap, passed: false }); }
function hitPipe(pipe) { const overlapsHorizontally = player.x + player.radius > pipe.x && player.x - player.radius < pipe.x + pipe.width; if (!overlapsHorizontally) return false; return player.y - player.radius < pipe.top || player.y + player.radius > pipe.bottom; }
function update(dt) {
  frame++; player.velocity += 1050 * dt; player.y += player.velocity * dt; player.rotation = Math.min(Math.PI / 2, Math.max(-.55, player.velocity / 650));
  const spawnInterval = Math.max(80, 125 - score * 2); if (frame === 1 || frame % spawnInterval === 0) addPipe();
  const speed = 180 + Math.min(score * 7, 170);
  pipes.forEach(pipe => { pipe.x -= speed * dt; if (!pipe.passed && pipe.x + pipe.width < player.x) { pipe.passed = true; score++; scoreEl.textContent = score; } if (hitPipe(pipe)) endGame(); });
  pipes = pipes.filter(pipe => pipe.x + pipe.width > -20);
  particles.forEach(p => { p.x += p.vx * dt; p.y += p.vy * dt; p.life -= dt; }); particles = particles.filter(p => p.life > 0);
  if (player.y - player.radius < 0 || player.y + player.radius > H - GROUND) endGame();
}
function roundedRect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#70d7fa'); sky.addColorStop(1, '#d9f8ff'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  // Cartoon neighborhood background.
  ctx.fillStyle = '#f7c66b'; ctx.fillRect(0, 410, W, 120);
  ctx.fillStyle = '#e9a957'; ctx.fillRect(0, 520, W, 70);
  ctx.fillStyle = '#88c77c'; ctx.fillRect(0, 590, W, H - 590);
  ctx.fillStyle = '#6fae6b'; ctx.fillRect(0, 620, W, H - 620);
  ctx.fillStyle = '#d9d1c2'; ctx.fillRect(0, 555, W, 38);
  ctx.fillStyle = '#f8f2e6'; ctx.fillRect(0, 572, W, 5);
  drawHouse(35, 315, 125, 150, '#fff1d2', '#c95b48');
  drawHouse(310, 340, 135, 125, '#d9ebf2', '#547e9d');
  ctx.fillStyle = '#7897a6'; ctx.fillRect(205, 435, 46, 125); ctx.fillStyle = '#5e7e8d'; ctx.fillRect(215, 445, 26, 115);
  ctx.save(); ctx.setLineDash([8, 12]); ctx.strokeStyle = 'rgba(9, 115, 155, .2)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke(); ctx.restore();
  ctx.fillStyle = '#8cda83'; ctx.fillRect(0, H - GROUND, W, GROUND); ctx.fillStyle = '#65bd68'; ctx.fillRect(0, H - GROUND, W, 6);
}
function drawHouse(x, y, w, h, wall, roof) { ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(x - 12, y); ctx.lineTo(x + w / 2, y - 58); ctx.lineTo(x + w + 12, y); ctx.closePath(); ctx.fill(); ctx.fillStyle = wall; ctx.fillRect(x, y, w, h); ctx.fillStyle = '#8bc9e5'; ctx.fillRect(x + 18, y + 30, 29, 31); ctx.fillRect(x + w - 47, y + 30, 29, 31); ctx.fillStyle = '#8b5a3c'; ctx.fillRect(x + w / 2 - 16, y + h - 58, 32, 58); }
function drawPipe(pipe, topOnly) { if (topOnly) { ctx.fillStyle = '#0878a5'; roundedRect(pipe.x, 0, pipe.width, pipe.top, 7); ctx.fill(); ctx.fillStyle = '#15a7cf'; ctx.fillRect(pipe.x + 9, 4, 13, Math.max(0, pipe.top - 8)); ctx.fillStyle = '#075d86'; roundedRect(pipe.x - 9, pipe.top - 30, pipe.width + 18, 30, 8); ctx.fill(); ctx.fillStyle = '#20b9d8'; ctx.fillRect(pipe.x, pipe.top - 25, pipe.width, 9); return; } ctx.fillStyle = '#0878a5'; roundedRect(pipe.x, pipe.bottom, pipe.width, H - GROUND - pipe.bottom, 7); ctx.fill(); ctx.fillStyle = '#15a7cf'; ctx.fillRect(pipe.x + 9, pipe.bottom + 4, 13, Math.max(0, H - GROUND - pipe.bottom - 8)); ctx.fillStyle = '#075d86'; roundedRect(pipe.x - 9, pipe.bottom, pipe.width + 18, 30, 8); ctx.fill(); ctx.fillStyle = '#20b9d8'; ctx.fillRect(pipe.x, pipe.bottom + 5, pipe.width, 9); }
function drawWrench() { ctx.save(); ctx.translate(18, 8); ctx.rotate(-0.45); ctx.strokeStyle = '#a9b4bd'; ctx.lineWidth = 7; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(-2, 13); ctx.lineTo(18, -9); ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = '#e3ebef'; ctx.beginPath(); ctx.arc(22, -13, 8, .45, 5.75); ctx.stroke(); ctx.restore(); }
function drawPlayer() { ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(player.rotation); ctx.fillStyle = '#1768a8'; roundedRect(-18, -1, 36, 27, 9); ctx.fill(); ctx.fillStyle = '#f4b27b'; ctx.beginPath(); ctx.arc(0, -5, 15, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#ff7a00'; ctx.beginPath(); ctx.arc(0, -16, 17, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#f59a20'; roundedRect(-21, -17, 42, 7, 4); ctx.fill(); ctx.fillStyle = '#6e3d28'; ctx.beginPath(); ctx.arc(-1, 0, 12, 0, Math.PI); ctx.fill(); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(7, -6, 4, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#16324f'; ctx.beginPath(); ctx.arc(8, -6, 2, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#16324f'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(5, 1, 6, .1, 1.2); ctx.stroke(); ctx.fillStyle = '#8b4d21'; ctx.fillRect(-19, 11, 38, 5); ctx.fillStyle = '#ffd15c'; ctx.fillRect(1, 11, 6, 6); drawWrench(); ctx.restore(); }
function draw() { ctx.clearRect(0, 0, W, H); drawBackground(); pipes.forEach(pipe => { drawPipe(pipe, true); drawPipe(pipe, false); }); particles.forEach(p => { ctx.globalAlpha = Math.max(0, p.life * 2); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(p.x, p.y, 3, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }); drawPlayer(); }
function loop(time) { const dt = Math.min((time - (lastTime || time)) / 1000, .035); lastTime = time; if (state === 'playing') update(dt); draw(); requestAnimationFrame(loop); }
function action() { if (state === 'ready' || state === 'gameover') { siteLink.hidden = false; start(); } else flap(); }
startButton.addEventListener('click', start);
canvas.addEventListener('pointerdown', e => { e.preventDefault(); action(); });
document.addEventListener('keydown', e => { if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); action(); } });
reset();
requestAnimationFrame(loop);
