(function () {
  const canvas = document.getElementById("field");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const mouse = { x: innerWidth / 2, y: innerHeight / 2 };
  let stars = [];
  let clouds = [];
  let shots = [];
  let running = !reduce;
  let last = 0;

  function dpr() {
    return Math.min(window.devicePixelRatio || 1, 2);
  }

  function resize() {
    const r = dpr();
    canvas.width = Math.floor(innerWidth * r);
    canvas.height = Math.floor(innerHeight * r);
    canvas.style.width = innerWidth + "px";
    canvas.style.height = innerHeight + "px";
    ctx.setTransform(r, 0, 0, r, 0, 0);
    const count = innerWidth < 720 ? 48 : 110;
    stars = Array.from({ length: count }, () => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      z: Math.random() * 0.75 + 0.25,
      s: Math.random() < 0.12 ? 2 : 1,
      t: Math.random() * Math.PI * 2
    }));
    clouds = Array.from({ length: 4 }, (_, i) => ({
      x: Math.random() * innerWidth,
      y: innerHeight * (0.15 + i * 0.22),
      s: 180 + Math.random() * 220,
      vx: 0.15 + Math.random() * 0.2
    }));
  }

  function frame(now, once) {
    if (!running && !once) return;
    const dt = Math.min(32, now - last || 16);
    last = now;
    ctx.clearRect(0, 0, innerWidth, innerHeight);

    clouds.forEach((c) => {
      c.x += c.vx * dt * 0.03;
      if (c.x - c.s > innerWidth) c.x = -c.s;
      const g = ctx.createRadialGradient(c.x, c.y, 0, c.x, c.y, c.s);
      g.addColorStop(0, "rgba(243,236,223,0.045)");
      g.addColorStop(1, "rgba(243,236,223,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.s, 0, Math.PI * 2);
      ctx.fill();
    });

    const ox = (mouse.x - innerWidth / 2) * 0.012;
    const oy = (mouse.y - innerHeight / 2) * 0.012;
    stars.forEach((s) => {
      s.t += dt * 0.0016 * s.z;
      const tw = 0.28 + Math.abs(Math.sin(s.t)) * 0.72;
      ctx.globalAlpha = tw * (0.35 + s.z * 0.65);
      ctx.fillStyle = "#f3ecdf";
      ctx.fillRect(s.x + ox * s.z, s.y + oy * s.z, s.s, s.s);
    });
    ctx.globalAlpha = 1;

    if (!reduce && Math.random() < 0.004 && shots.length < 2) {
      shots.push({
        x: Math.random() * innerWidth,
        y: Math.random() * innerHeight * 0.7,
        vx: 4 + Math.random() * 3,
        vy: 1.2 + Math.random() * 1.2,
        life: 1
      });
    }
    shots = shots.filter((shot) => shot.life > 0);
    shots.forEach((shot) => {
      shot.x += shot.vx;
      shot.y += shot.vy;
      shot.life -= dt * 0.0015;
      ctx.globalAlpha = Math.max(shot.life, 0);
      ctx.fillStyle = "#f3ecdf";
      ctx.fillRect(shot.x, shot.y, 8, 1);
      ctx.fillRect(shot.x - 6, shot.y, 4, 1);
      ctx.globalAlpha = 1;
    });

    if (!once) requestAnimationFrame(frame);
  }

  resize();
  if (reduce) {
    frame(0, true);
    return;
  }
  requestAnimationFrame(frame);

  window.addEventListener("resize", resize);
  window.addEventListener("mousemove", (e) => {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
  }, { passive: true });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      running = false;
    } else if (!running) {
      running = true;
      last = performance.now();
      requestAnimationFrame(frame);
    }
  });
})();
