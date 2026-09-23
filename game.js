const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const overlay = document.getElementById('overlay');
const title = document.getElementById('overlay-title');
const copy = document.getElementById('overlay-copy');
const startButton = document.getElementById('start-button');
const scoreEl = document.getElementById('score');
const bestEl = document.getElementById('best');

const W = 480, H = 720, GROUND = 35;
canvas.width = W;
canvas.height = H;

let state = 'ready', score = 0, best = Number(localStorage.getItem('pipeHopperBest') || 0);
let player, pipes, particles, frame, lastTime;
bestEl.textContent = best;

function reset() {
  score = 0;
  scoreEl.textContent = score;
  player = { x: 112, y: H / 2, radius: 22, velocity: 0, rotation: 0 };
  pipes = [];
  particles = [];
  frame = 0;
}
function start() { reset(); state = 'playing'; overlay.classList.add('hidden'); canvas.focus(); flap(); }
function endGame() {
  if (state !== 'playing') return;
  state = 'gameover';
  if (score > best) { best = score; localStorage.setItem('pipeHopperBest', best); bestEl.textContent = best; }
  title.textContent = 'Pipe blocked!';
  copy.textContent = `You fixed ${score} pipe${score === 1 ? '' : 's'} today. Give it another go!`;
  startButton.innerHTML = 'Try Again <span>↻</span>';
  overlay.classList.remove('hidden');
}
function flap() {
  if (state !== 'playing') return;
  player.velocity = -330;
  for (let i = 0; i < 5; i++) particles.push({ x: player.x - 20, y: player.y + 8, vx: -Math.random() * 60, vy: (Math.random() - .5) * 90, life: .5 });
}
function addPipe() {
  // The gap shrinks and its center moves farther from the middle as the score rises.
  const gap = Math.max(138, 220 - score * 3);
  const movement = Math.min(145, 35 + score * 5);
  const gapCenter = H / 2 + (Math.random() - .5) * 2 * movement;
  const top = Math.max(55, Math.min(H - GROUND - gap - 55, gapCenter - gap / 2));
  pipes.push({ x: W + 30, width: 72, top, bottom: top + gap, passed: false });
}
function hitPipe(p) {
  // Only collide while horizontally overlapping a pipe. Being inside the gap
  // is safe; the previous circle/rectangle test treated the gap as a hit.
  const overlapsHorizontally = player.x + player.radius > p.x && player.x - player.radius < p.x + p.width;
  if (!overlapsHorizontally) return false;
  const hitsTop = player.y - player.radius < p.top;
  const hitsBottom = player.y + player.radius > p.bottom;
  return hitsTop || hitsBottom;
}
function update(dt) {
  frame++;
  player.velocity += 1050 * dt;
  player.y += player.velocity * dt;
  player.rotation = Math.min(Math.PI / 2, Math.max(-.55, player.velocity / 650));

  // Pipes move continuously, with a shorter interval as the game gets harder.
  const spawnInterval = Math.max(76, 125 - score * 2);
  if (frame === 1 || frame % spawnInterval === 0) addPipe();

  const speed = 180 + Math.min(score * 6, 180);
  pipes.forEach(p => {
    p.x -= speed * dt;
    if (!p.passed && p.x + p.width < player.x) {
      p.passed = true;
      score++;
      scoreEl.textContent = score;
    }
    if (hitPipe(p)) endGame();
  });
  pipes = pipes.filter(p => p.x + p.width > -20);

  particles.forEach(q => { q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt; });
  particles = particles.filter(q => q.life > 0);
  if (player.y - player.radius < 0 || player.y + player.radius > H - GROUND) endGame();
}
function roundedRect(x, y, w, h, r) { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }
function drawBackground() {
  const sky = ctx.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#7edcff'); sky.addColorStop(1, '#c9f4ff'); ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = 'rgba(255,255,255,.58)';
  for (const c of [{x:60,y:120,s:1},{x:370,y:220,s:.75},{x:260,y:65,s:.55}]) { ctx.beginPath(); ctx.arc(c.x, c.y, 28*c.s, 0, 7); ctx.arc(c.x+25*c.s,c.y+3,20*c.s,0,7); ctx.arc(c.x-23*c.s,c.y+8,17*c.s,0,7); ctx.fill(); }
  ctx.save(); ctx.setLineDash([8, 12]); ctx.strokeStyle = 'rgba(9, 115, 155, .22)'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, H / 2); ctx.lineTo(W, H / 2); ctx.stroke(); ctx.restore();
  ctx.fillStyle = '#8cda83'; ctx.fillRect(0, H - GROUND, W, GROUND); ctx.fillStyle = '#65bd68'; ctx.fillRect(0, H - GROUND, W, 6);
}
function drawPipe(p, y, h, capAtTop) {
  ctx.fillStyle = '#0878a5'; roundedRect(p.x, y, p.width, h, 7); ctx.fill();
  ctx.fillStyle = '#15a7cf'; ctx.fillRect(p.x + 9, y + 4, 13, Math.max(0, h - 8));
  const capY = capAtTop ? y : y + h - 30;
  ctx.fillStyle = '#075d86'; roundedRect(p.x - 9, capY, p.width + 18, 30, 8); ctx.fill();
  ctx.fillStyle = '#20b9d8'; ctx.fillRect(p.x, capY + 5, p.width, 9);
}
function drawWrench() {
  ctx.save(); ctx.translate(18, 8); ctx.rotate(-.45); ctx.strokeStyle = '#a9b4bd'; ctx.lineWidth = 7; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(-2, 13); ctx.lineTo(18, -9); ctx.stroke(); ctx.lineWidth = 4; ctx.strokeStyle = '#e3ebef'; ctx.beginPath(); ctx.arc(22, -13, 8, .45, 5.75); ctx.stroke(); ctx.restore();
}
function drawPlayer() {
  ctx.save(); ctx.translate(player.x, player.y); ctx.rotate(player.rotation);
  ctx.fillStyle = '#1768a8'; roundedRect(-18, -1, 36, 27, 9); ctx.fill();
  ctx.fillStyle = '#f4b27b'; ctx.beginPath(); ctx.arc(0, -5, 15, 0, 7); ctx.fill();
  ctx.fillStyle = '#ff7a00'; ctx.beginPath(); ctx.arc(0, -16, 17, Math.PI, 0); ctx.fill();
  ctx.fillStyle = '#f59a20'; roundedRect(-21, -17, 42, 7, 4); ctx.fill();
  ctx.fillStyle = '#6e3d28'; ctx.beginPath(); ctx.arc(-1, 0, 12, 0, Math.PI); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(7, -6, 4, 0, 7); ctx.fill(); ctx.fillStyle = '#16324f'; ctx.beginPath(); ctx.arc(8, -6, 2, 0, 7); ctx.fill();
  ctx.strokeStyle = '#16324f'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(5, 1, 6, .1, 1.2); ctx.stroke();
  ctx.fillStyle = '#8b4d21'; ctx.fillRect(-19, 11, 38, 5); ctx.fillStyle = '#ffd15c'; ctx.fillRect(1, 11, 6, 6); drawWrench();
  ctx.restore();
}
function draw() {
  ctx.clearRect(0, 0, W, H); drawBackground();
  pipes.forEach(p => { drawPipe(p, 0, p.top, false); drawPipe(p, p.bottom, H - GROUND - p.bottom, true); });
  particles.forEach(q => { ctx.globalAlpha = Math.max(0, q.life * 2); ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(q.x, q.y, 3, 0, 7); ctx.fill(); ctx.globalAlpha = 1; });
  drawPlayer();
}
function loop(time) { const dt = Math.min((time - (lastTime || time)) / 1000, .035); lastTime = time; if (state === 'playing') update(dt); draw(); requestAnimationFrame(loop); }
function action() { if (state === 'ready' || state === 'gameover') start(); else flap(); }
startButton.addEventListener('click', start);
canvas.addEventListener('pointerdown', e => { e.preventDefault(); action(); });
document.addEventListener('keydown', e => { if (e.code === 'Space' || e.code === 'ArrowUp') { e.preventDefault(); action(); } });
reset(); requestAnimationFrame(loop);
