(function () {
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = matchMedia("(pointer: fine)").matches;
  const CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#";
  const PHRASES = [
    "You don’t direct its decisions.",
    "The mind is always on.",
    "It remembers what happened next.",
    "Every move is public.",
    "The system decides what it’s allowed to do."
  ];
  const WATCH = ["Market", "Holders", "Treasury", "Memory", "The web", "X", "Other minds"];
  const ACTS = [
    ["BUYBACK", "Buy back its own token and burn it"],
    ["SWAP", "Swap into an approved asset, inside the limit"],
    ["DCA", "Scheduled accumulation window"],
    ["AIRDROP", "Reward eligible holders"],
    ["JACKPOT", "Verifiable on-chain draw"],
    ["QUEST", "A public quest for holders"],
    ["CONTEST", "Contest opened"],
    ["POLL", "Holder poll goes live"],
    ["RULE", "Holder target reached. Reward armed"],
    ["LORE", "New meme, art, and lore"],
    ["RESEARCH", "Read the web, X, and other minds"]
  ];

  const boot = document.getElementById("boot");
  const bootLog = document.getElementById("boot-log");
  const rotator = document.getElementById("rotator");
  const spotlight = document.querySelector(".spotlight");
  const cursor = document.querySelector(".cursor");
  const trails = [...document.querySelectorAll(".trail")];
  const points = trails.map(() => ({ x: innerWidth / 2, y: innerHeight / 2 }));
  const mouse = { x: innerWidth / 2, y: innerHeight / 2, on: false };
  let bootDone = false;
  let phraseTimer = 0;
  let scrambleStop = null;
  let audioOn = false;
  let audioCtx = null;
  let logTimer = 0;
  let watchTimer = 0;
  let hexTimer = 0;
  let glitchTimer = 0;
  let clockTimer = 0;
  let previewUrl = "";

  function store(area, key, value) {
    try {
      const box = area === "local" ? localStorage : sessionStorage;
      if (value === undefined) return box.getItem(key);
      box.setItem(key, value);
    } catch (err) {
      return null;
    }
    return null;
  }

  function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function scramble(el, text) {
    if (!el) return function () {};
    if (reduce) {
      el.textContent = text;
      return function () {};
    }
    let frame = 0;
    const steps = 18;
    const id = setInterval(() => {
      el.textContent = [...text].map((ch, i) => {
        if (ch === " ") return " ";
        if (frame / steps > i / text.length) return text[i];
        return CHARS[(Math.random() * CHARS.length) | 0];
      }).join("");
      frame += 1;
      if (frame > steps) {
        clearInterval(id);
        el.textContent = text;
      }
    }, 30);
    return function () { clearInterval(id); el.textContent = text; };
  }

  function finishBoot(flash) {
    if (bootDone) return;
    bootDone = true;
    store("session", "agency-booted", "1");
    boot.setAttribute("aria-hidden", "true");
    if (flash) document.body.classList.add("crt-on");
    document.body.classList.add("ready");
    boot.classList.add("hide");
    if (scrambleStop) scrambleStop();
    scrambleStop = scramble(rotator, PHRASES[0]);
    if (flash) setTimeout(() => document.body.classList.remove("crt-on"), 700);
  }

  async function runBoot() {
    const lines = [
      "Robinhood Chain",
      "creator fees → treasury",
      "model bind: ready",
      "private channel: none",
      "signer: isolated",
      "public log: on"
    ];
    for (const line of lines) {
      if (bootDone) return;
      bootLog.textContent += (bootLog.textContent ? "\n" : "") + "> " + line;
      await wait(200);
    }
    await wait(280);
    finishBoot(true);
  }

  function blip(freq, dur, gain) {
    if (!audioOn) return;
    const ctx = audioCtx || (audioCtx = new AudioContext());
    if (ctx.state === "suspended") ctx.resume();
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = "square";
    osc.frequency.value = freq;
    amp.gain.value = gain;
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
    osc.connect(amp).connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
  }

  function chord() {
    [440, 554, 659].forEach((freq, i) => {
      setTimeout(() => blip(freq, 0.12, 0.03), i * 90);
    });
  }

  function burst(x, y) {
    if (reduce) return;
    for (let i = 0; i < 16; i += 1) {
      const spark = document.createElement("i");
      spark.className = "spark";
      const angle = (Math.PI * 2 * i) / 16;
      const dist = 36 + Math.random() * 70;
      spark.style.left = x + "px";
      spark.style.top = y + "px";
      spark.style.setProperty("--dx", Math.cos(angle) * dist + "px");
      spark.style.setProperty("--dy", Math.sin(angle) * dist + "px");
      document.body.appendChild(spark);
      setTimeout(() => spark.remove(), 720);
    }
  }

  function shortHash() {
    const bytes = crypto.getRandomValues(new Uint8Array(3));
    const tail = crypto.getRandomValues(new Uint8Array(2));
    const hex = (arr) => [...arr].map((b) => b.toString(16).padStart(2, "0")).join("");
    return "0x" + hex(bytes) + "…" + hex(tail);
  }

  function makeRow(act, detail, state, tx) {
    const li = document.createElement("li");
    li.className = "log-row " + state;
    const status = document.createElement("span");
    status.className = "st";
    status.textContent = state === "pending" ? "PENDING" : "CONFIRMED";
    const name = document.createElement("span");
    name.className = "log-act";
    name.textContent = act;
    const info = document.createElement("span");
    info.className = "log-detail";
    info.textContent = detail;
    const chain = document.createElement("span");
    chain.className = "log-tx";
    chain.textContent = tx;
    li.append(status, name, info, chain);
    return li;
  }

  function seedLogs() {
    const list = document.getElementById("log-list");
    if (!list) return;
    ACTS.slice(0, 3).forEach(([act, detail]) => {
      list.append(makeRow(act, detail, "confirmed", shortHash() + " · Robinhood Chain"));
    });
  }

  function pushLog() {
    const list = document.getElementById("log-list");
    if (!list || document.hidden) return;
    const [act, detail] = ACTS[(Math.random() * ACTS.length) | 0];
    const row = makeRow(act, detail, "pending", "awaiting Robinhood Chain");
    list.prepend(row);
    while (list.children.length > 5) list.lastElementChild.remove();
    setTimeout(() => {
      if (!row.isConnected) return;
      row.classList.remove("pending");
      row.classList.add("confirmed");
      row.querySelector(".st").textContent = "CONFIRMED";
      row.querySelector(".log-tx").textContent = shortHash() + " · Robinhood Chain";
      blip(520, 0.05, 0.02);
    }, 1500);
  }

  function cycleWatch() {
    const items = [...document.querySelectorAll(".watch li")];
    const label = document.getElementById("radar-label");
    if (!items.length) return;
    let index = 0;
    const tick = () => {
      items.forEach((item, i) => item.classList.toggle("on", i === index));
      if (label) label.textContent = WATCH[index].toUpperCase();
      index = (index + 1) % items.length;
    };
    tick();
    if (!reduce) watchTimer = setInterval(tick, 1400);
  }

  function bindCursor() {
    if (!fine || reduce) return;
    window.addEventListener("mousemove", (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      mouse.on = true;
      document.body.classList.add("arm-cursor");
      const typing = e.target.closest("input, textarea");
      document.body.classList.toggle("cursor-off", Boolean(typing));
      if (spotlight) {
        spotlight.style.left = e.clientX + "px";
        spotlight.style.top = e.clientY + "px";
      }
    }, { passive: true });

    const loop = () => {
      if (mouse.on && cursor) {
        cursor.style.transform = "translate3d(" + mouse.x + "px," + mouse.y + "px,0)";
        points.forEach((point, i) => {
          const target = i === 0 ? mouse : points[i - 1];
          point.x += (target.x - point.x) * 0.28;
          point.y += (target.y - point.y) * 0.28;
          trails[i].style.transform = "translate3d(" + point.x + "px," + point.y + "px,0)";
        });
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  function bindScroll() {
    const bar = document.querySelector(".progress");
    const nav = document.querySelector(".nav");
    const sections = [...document.querySelectorAll("main section[id]")];
    const spies = [...document.querySelectorAll("[data-spy]")];
    const creed = document.getElementById("creed");
    const words = creed ? [...creed.querySelectorAll(".creed-line span")] : [];

    const onScroll = () => {
      const max = document.documentElement.scrollHeight - innerHeight;
      if (bar) bar.style.transform = "scaleX(" + (max > 0 ? scrollY / max : 0) + ")";
      if (nav) nav.classList.toggle("solid", scrollY > 12);
      let current = sections[0] ? sections[0].id : "";
      sections.forEach((section) => {
        if (section.getBoundingClientRect().top < innerHeight * 0.38) current = section.id;
      });
      spies.forEach((link) => link.classList.toggle("active", link.dataset.spy === current));

      if (creed && words.length) {
        const rect = creed.getBoundingClientRect();
        const progress = Math.min(1, Math.max(0, (innerHeight * 0.72 - rect.top) / (rect.height * 0.72)));
        words.forEach((word, i) => word.classList.toggle("on", progress >= (i + 0.35) / words.length));
      }
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  function bindReveal() {
    const nodes = [...document.querySelectorAll(".reveal")];
    if (reduce) {
      nodes.forEach((node) => node.classList.add("in"));
      return;
    }
    document.querySelectorAll("[data-stagger]").forEach((parent) => {
      [...parent.children].forEach((child, i) => {
        child.style.transitionDelay = (i * 80) + "ms";
      });
    });
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("in");
        io.unobserve(entry.target);
      });
    }, { threshold: 0.18, rootMargin: "0px 0px -8% 0px" });
    nodes.forEach((node) => io.observe(node));
  }

  function bindMagnetic() {
    if (reduce || !fine) return;
    document.querySelectorAll(".magnetic").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        const x = e.clientX - rect.left - rect.width / 2;
        const y = e.clientY - rect.top - rect.height / 2;
        el.style.transform = "translate(" + (x * 0.18) + "px," + (y * 0.22) + "px)";
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "";
      });
    });
  }

  function bindTilt() {
    if (reduce || !fine) return;
    document.querySelectorAll(".tilt").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const rect = el.getBoundingClientRect();
        const px = (e.clientX - rect.left) / rect.width - 0.5;
        const py = (e.clientY - rect.top) / rect.height - 0.5;
        el.style.transform = "rotateX(" + (-py * 7).toFixed(2) + "deg) rotateY(" + (px * 8).toFixed(2) + "deg)";
      });
      el.addEventListener("mouseleave", () => {
        el.style.transform = "";
      });
    });
  }

  function bindNav() {
    const toggle = document.getElementById("nav-toggle");
    const links = document.getElementById("nav-links");
    if (!toggle || !links) return;
    const close = () => {
      links.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
    };
    toggle.addEventListener("click", () => {
      const open = links.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
      document.body.classList.toggle("nav-open", open);
      blip(680, 0.04, 0.025);
    });
    links.addEventListener("click", (e) => {
      if (e.target.closest("a")) close();
    });
    window.addEventListener("keydown", (e) => {
      if (e.key === "Escape") close();
    });
  }

  function bindSound() {
    const button = document.getElementById("sound");
    if (!button) return;
    audioOn = store("local", "agency-sound") === "1";
    const paint = () => {
      button.setAttribute("aria-pressed", String(audioOn));
      button.textContent = audioOn ? "Sound on" : "Sound off";
    };
    paint();
    button.addEventListener("click", async () => {
      audioOn = !audioOn;
      store("local", "agency-sound", audioOn ? "1" : "0");
      paint();
      if (audioOn) {
        audioCtx = audioCtx || new AudioContext();
        if (audioCtx.state === "suspended") await audioCtx.resume();
        blip(740, 0.06, 0.03);
      }
    });
    document.querySelectorAll(".btn, .model").forEach((el) => {
      el.addEventListener("pointerenter", () => blip(620, 0.03, 0.015));
    });
  }

  function bindHex() {
    const node = document.getElementById("jackpot-hex");
    if (!node || reduce) {
      if (node) node.textContent = "0xa91c4e";
      return;
    }
    hexTimer = setInterval(() => {
      if (document.hidden) return;
      const bytes = crypto.getRandomValues(new Uint8Array(3));
      node.textContent = "0x" + [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
    }, 140);
  }

  function bindGlitch() {
    const img = document.querySelector(".hero-logo img");
    if (!img || reduce) return;
    glitchTimer = setInterval(() => {
      if (document.hidden) return;
      img.classList.add("glitch");
      setTimeout(() => img.classList.remove("glitch"), 220);
    }, 7200);
  }

  function bindClock() {
    const node = document.getElementById("clock");
    if (!node) return;
    const tick = () => {
      node.textContent = new Date().toISOString().slice(11, 19) + " UTC";
    };
    tick();
    clockTimer = setInterval(tick, 1000);
  }

  function bindPhrases() {
    if (!rotator || reduce) return;
    let index = 0;
    phraseTimer = setInterval(() => {
      if (document.hidden) return;
      index = (index + 1) % PHRASES.length;
      if (scrambleStop) scrambleStop();
      scrambleStop = scramble(rotator, PHRASES[index]);
    }, 3600);
  }

  function bindAwaken() {
    const form = document.getElementById("awaken-form");
    const consoleEl = document.getElementById("console");
    const plaque = document.getElementById("plaque");
    const file = document.getElementById("image");
    const fileName = document.getElementById("file-name");
    const submit = document.getElementById("awaken-submit");
    if (!form) return;

    file.addEventListener("change", () => {
      const chosen = file.files && file.files[0];
      if (!chosen || !chosen.type.startsWith("image/")) {
        fileName.textContent = "Optional";
        return;
      }
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = URL.createObjectURL(chosen);
      fileName.textContent = chosen.name;
      document.getElementById("plaque-img").src = previewUrl;
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = form.name.value.trim().replace(/\s+/g, " ");
      const ticker = form.ticker.value.trim().toUpperCase();
      const model = new FormData(form).get("model");
      const okName = name.length >= 2 && name.length <= 24;
      const okTicker = /^[A-Z0-9]{2,8}$/.test(ticker);
      if (!okName || !okTicker || !model) {
        form.classList.remove("shake");
        void form.offsetWidth;
        form.classList.add("shake");
        consoleEl.textContent = "> rejected\n> a mind needs a name, a ticker, and a model";
        plaque.classList.remove("show");
        blip(180, 0.08, 0.03);
        return;
      }

      submit.disabled = true;
      plaque.classList.remove("show");
      const lines = [
        "> name  " + name,
        "> ticker  $" + ticker,
        "> image  " + (previewUrl ? "bound" : "terminal mark"),
        "> model  " + model,
        "> creator fees → treasury",
        "> private channel  none",
        "> limits  sealed",
        "> isolated signer  standing by",
        "> mind online",
        "> you observe. you don’t direct it."
      ];
      consoleEl.textContent = "";
      for (const line of lines) {
        consoleEl.textContent += (consoleEl.textContent ? "\n" : "") + line;
        blip(500 + Math.random() * 180, 0.04, 0.02);
        await wait(reduce ? 0 : 160);
      }

      document.getElementById("plaque-name").textContent = name;
      document.getElementById("plaque-ticker").textContent = "$" + ticker;
      document.getElementById("plaque-model").textContent = model;
      document.getElementById("plaque-img").alt = name + " image";
      if (!previewUrl) document.getElementById("plaque-img").src = "logo.jpg";
      plaque.classList.add("show");
      const rect = plaque.getBoundingClientRect();
      burst(rect.left + 60, rect.top + 60);
      burst(rect.left + rect.width * 0.45, rect.top + 36);
      chord();
      submit.disabled = false;
      submit.querySelector(".magnetic").textContent = "Preview again";
    });
  }

  document.getElementById("boot-skip").addEventListener("click", () => {
    blip(700, 0.05, 0.03);
    finishBoot(true);
  });
  window.addEventListener("keydown", (e) => {
    if (!bootDone && (e.key === "Enter" || e.key === "Escape")) finishBoot(true);
  });

  document.querySelectorAll("a[href^='#']").forEach((link) => {
    link.addEventListener("click", () => blip(640, 0.03, 0.02));
  });

  bindCursor();
  bindScroll();
  bindReveal();
  bindMagnetic();
  bindTilt();
  bindNav();
  bindSound();
  bindHex();
  bindGlitch();
  bindClock();
  bindPhrases();
  cycleWatch();
  seedLogs();
  bindAwaken();

  if (!reduce) {
    logTimer = setInterval(pushLog, 3200);
  }

  if (reduce || store("session", "agency-booted") === "1") {
    bootLog.textContent = "> mind online";
    finishBoot(false);
  } else {
    runBoot();
  }

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) return;
    const clock = document.getElementById("clock");
    if (clock) clock.textContent = new Date().toISOString().slice(11, 19) + " UTC";
  });

  window.addEventListener("beforeunload", () => {
    [phraseTimer, logTimer, watchTimer, hexTimer, glitchTimer, clockTimer].forEach((id) => {
      if (id) clearInterval(id);
    });
    if (previewUrl) URL.revokeObjectURL(previewUrl);
  });
})();
