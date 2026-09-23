const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const title = document.getElementById('overlay-title');
const copy = document.getElementById('overlay-copy');
const startButton = document.getElementById('start-button');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');

const W = 480, H = 720;
let state = 'ready', score = 0, best = Number(localStorage.getItem('pipeHopperBest') || 0);
let player, pipes, particles, frame, lastTime;
bestEl.textContent = best;

function reset() {
  score = 0; scoreEl.textContent = score;
  player = { x: 112, y: 340, radius: 20, velocity: 0, rotation: 0 };
  pipes = []; particles = []; frame = 0;
}
function start() { reset(); state = 'playing'; overlay.classList.add('hidden'); canvas.focus(); flap(); }
function endGame() {
  state = 'gameover';
  if (score > best) { best = score; localStorage.setItem('pipeHopperBest', best); bestEl.textContent = best; }
  title.textContent = 'Pipe blocked!'; copy.textContent = `You fixed ${score} pipe${score === 1 ? '' : 's'} today. Give it another go!`;
  startButton.innerHTML = 'Try Again <span>↻</span>'; overlay.classList.remove('hidden');
}
function flap() {
  if (state !== 'playing') return;
  player.velocity = -390;
  for (let i = 0; i < 5; i++) particles.push({ x: player.x - 17, y: player.y + 8, vx: -Math.random() * 60, vy: (Math.random() - .5) * 90, life: .5 });
}
function addPipe() {
  const gap = Math.max(142, 190 - score * 2.4);
  const top = 92 + Math.random() * (H - gap - 220);
  pipes.push({ x: W + 30, width: 72, top, bottom: top + gap, passed: false });
}
function hitPipe(p) {
  const closestX = Math.max(p.x, Math.min(player.x, p.x + p.width));
  const closestY = player.y < p.top ? p.top : player.y > p.bottom ? p.bottom : player.y;
  return Math.hypot(player.x - closestX, player.y - closestY) < player.radius;
}
function update(dt) {
  frame++;
  player.velocity += 1250 * dt; player.y += player.velocity * dt;
  player.rotation = Math.min(Math.PI / 2, Math.max(-.55, player.velocity / 650));
  if (frame % 92 === 0) addPipe();
  const speed = 190 + Math.min(score * 3, 100);
  pipes.forEach(p => {
    p.x -= speed * dt;
    if (!p.passed && p.x + p.width < player.x) { p.passed = true; score++; scoreEl.textContent = score; }
    if (hitPipe(p)) endGame();
  });
  pipes = pipes.filter(p => p.x + p.width > -20);
  particles.forEach(q => { q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; });
  particles = particles.filter(q => q.life > 0);
  if (player.y - player.radius < 0 || player.y + player.radius > H - 35) endGame();
}
function roundedRect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#7edcff'); sky.addColorStop(1, '#c9f4ff'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.58)';
  for (const c of [{x:60,y:120,s:1},{x:370,y:220,s:.75},{x:260,y:65,s:.55}]) { ctx.beginPath(); ctx.arc(c.x, c.y, 28*c.s, 0, 7); ctx.arc(c.x+25*c.s,c.y+3,20*c.s,0,7); ctx.arc(c.x-23*c.s,c.y+8,17*c.s,0,7); ctx.fill(); }
  ctx.fillStyle = '#8cda83'; ctx.fillRect(0, H - 35, W, 35); ctx.fillStyle = '#65bd68'; ctx.fillRect(0, H - 35, W, 6);
}
function drawPipe(p, y, h, capAtTop) {
  ctx.fillStyle = '#0878a5'; roundedRect(p.x, y, p.width, h, 7); ctx.fill();
  ctx.fillStyle = '#15a7cf'; ctx.fillRect(p.x + 9, y + 4, 13, h - 8);
  const capY = capAtTop ? y : y + h - 30;
  ctx.fillStyle = '#075d86'; roundedRect(p.x - 9, capY, p.width + 18, 30, 8); ctx.fill();
  ctx.fillStyle = '#20b9d8'; ctx.fillRect(p.x, capY + 5, p.width, 9);
}
function drawPlayer() {
  ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(player.rotation);
  ctx.fillStyle = '#ff7a00'; ctx.beginPath(); ctx.arc(0, 5, 19, 0, 7); ctx.fill();
  ctx.fillStyle = '#ffb63d'; ctx.beginPath(); ctx.arc(0, -9, 15, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#ef830f'; ctx.fillRect(-17, -11, 34, 6);
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(7, 1, 5, 0, 7); ctx.fill(); ctx.fillStyle = '#16324f'; ctx.beginPath(); ctx.arc(9, 1, 2, 0, 7); ctx.fill();
  ctx.strokeStyle = '#16324f'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(4, 7, 7, .1, 1.2); ctx.stroke(); ctx.restore();
}
function draw() {
  ctx.clearRect(0,0,W,H); drawBackground();
  pipes.forEach(p => { drawPipe(p, 0, p.top, false); drawPipe(p, p.bottom, H - 35 - p.bottom, true); });
  particles.forEach(q => { ctx.globalAlpha = Math.max(0, q.life * 2); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(q.x,q.y,3,0,7); ctx.fill(); ctx.globalAlpha = 1; });
  drawPlayer();
}
function loop(time) { const dt = Math.min((time - (lastTime || time)) / 1000, .035); lastTime = time; if (state === 'playing') update(dt); draw(); requestAnimationFrame(loop); }
function action() { if (state === 'ready' || state === 'gameover') start(); else flap(); }
startButton.addEventListener('click', start);
canvas.addEventListener('pointerdown', e => { e.preventDefault(); action(); });
document.addEventListener('keydown', e => { if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); action(); } });
reset(); requestAnimationFrame(loop);
