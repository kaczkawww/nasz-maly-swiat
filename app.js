(() => {
  "use strict";
  const cfg = window.LOVE_CONFIG || {};
  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  $("#heroNickname").textContent = cfg.nickname || "Myszko";
  $("#heroSubtitle").textContent = cfg.heroSubtitle || "";
  $("#letterSignature").textContent = cfg.signature || "z całego serca, ja";
  $("#anniversaryMessage").textContent = cfg.anniversaryMessage || "";
  $("#finalMessage").textContent = cfg.finalMessage || "";
  $("#footerYear").textContent = new Date().getFullYear();

  // Starfield uses CSS transforms only; a small number of elements keeps mobile smooth.
  const starField = $("#stars");
  for (let i = 0; i < 36; i++) {
    const star = document.createElement("span");
    star.className = "star";
    star.style.left = `${(i * 37 + 11) % 100}%`;
    star.style.top = `${(i * 53 + 7) % 100}%`;
    star.style.animationDelay = `${(i % 9) * -0.43}s`;
    star.style.setProperty("--star-size", `${i % 7 === 0 ? 3 : 1 + (i % 2)}px`);
    starField.appendChild(star);
  }

  // Relationship counter: uses local date/time and handles dates in the future.
  const parseLocalDate = (iso) => {
    const [y, m, d] = String(iso || "2026-10-01").split("-").map(Number);
    return new Date(y, m - 1, d, 0, 0, 0, 0);
  };
  const startDate = parseLocalDate(cfg.relationshipStart);
  const pad = n => String(n).padStart(2, "0");
  const updateCounter = () => {
    const now = new Date();
    let delta = now - startDate;
    if (delta < 0) {
      const distance = Math.abs(delta);
      $("#days").textContent = Math.floor(distance / 86400000);
      $("#hours").textContent = pad(Math.floor(distance / 3600000) % 24);
      $("#minutes").textContent = pad(Math.floor(distance / 60000) % 60);
      $("#seconds").textContent = pad(Math.floor(distance / 1000) % 60);
      $("#anniversaryMessage").textContent = "Wasza wspólna historia zaczyna się już niedługo.";
    } else {
      $("#days").textContent = Math.floor(delta / 86400000);
      $("#hours").textContent = pad(Math.floor(delta / 3600000) % 24);
      $("#minutes").textContent = pad(Math.floor(delta / 60000) % 60);
      $("#seconds").textContent = pad(Math.floor(delta / 1000) % 60);
    }
    const nextMonth = new Date(startDate);
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    const monthLength = Math.max(1, nextMonth - startDate);
    const elapsed = Math.max(0, Math.min(monthLength, now - startDate));
    const percent = Math.max(0, Math.min(100, elapsed / monthLength * 100));
    $("#monthProgress").style.width = `${percent}%`;
    $("#progressLabel").textContent = now < startDate ? "wkrótce" : `${Math.floor(percent)}%`;
  };
  updateCounter();
  window.setInterval(updateCounter, 1000);

  // Accessible dialog.
  const dialog = $("#messageDialog");
  const showMessage = (title, body, label = "DLA CIEBIE") => {
    $("#dialogTitle").textContent = title;
    $("#dialogBody").textContent = body;
    $("#dialogEyebrow").textContent = label;
    if (typeof dialog.showModal === "function") dialog.showModal();
    else window.alert(`${title}\n\n${body}`);
  };
  const closeDialog = () => dialog.open && dialog.close();
  $("#dialogClose").addEventListener("click", closeDialog);
  $("#dialogOkay").addEventListener("click", closeDialog);
  dialog.addEventListener("click", e => { if (e.target === dialog) closeDialog(); });

  // Envelopes
  const envelopeGrid = $("#envelopeGrid");
  (cfg.envelopes || []).forEach((item, i) => {
    const button = document.createElement("button");
    button.className = "envelope-card";
    button.type = "button";
    button.innerHTML = `<span class="envelope-number">${escapeHtml(item.label || `KOPERTA ${pad(i+1)}`)}</span><span class="envelope-art" aria-hidden="true"><span class="envelope-flap"></span><span class="envelope-heart">♡</span></span><strong>${escapeHtml(item.title)}</strong><span class="envelope-open">otwórz wiadomość ↗</span>`;
    button.addEventListener("click", () => showMessage(item.title, item.body, item.label || "MAŁY SEKRET"));
    envelopeGrid.appendChild(button);
  });

  // Flip cards
  const reasonGrid = $("#reasonGrid");
  (cfg.reasons || []).forEach((item, i) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "reason-card";
    button.setAttribute("aria-pressed", "false");
    button.innerHTML = `<span class="reason-inner"><span class="reason-front"><small>POWÓD ${pad(i+1)}</small><strong>${escapeHtml(item.front)}</strong><span class="tap-hint">dotknij, żeby odkryć ↻</span></span><span class="reason-back"><span class="back-heart">♡</span><strong>${escapeHtml(item.front)}</strong><span>${escapeHtml(item.back)}</span></span></span>`;
    button.addEventListener("click", () => {
      const flipped = button.classList.toggle("flipped");
      button.setAttribute("aria-pressed", String(flipped));
    });
    reasonGrid.appendChild(button);
  });

  // Letter typewriter
  const letterContent = $("#letterContent");
  const openLetter = $("#openLetter");
  const fullLetter = (cfg.letter || []).join("\n\n");
  let letterOpened = false;
  let typingTimer = null;
  const renderFullLetter = () => {
    if (typingTimer) window.clearInterval(typingTimer);
    letterContent.innerHTML = (cfg.letter || []).map(p => `<p>${escapeHtml(p)}</p>`).join("");
    letterOpened = true;
    openLetter.classList.add("hidden");
    $("#showFullLetter").classList.add("hidden");
  };
  openLetter.addEventListener("click", () => {
    if (letterOpened) return;
    letterOpened = true;
    openLetter.disabled = true;
    openLetter.textContent = "Piszę dla Ciebie…";
    $("#showFullLetter").classList.remove("hidden");
    const words = fullLetter.split(/(\s+)/);
    let i = 0, current = "";
    letterContent.textContent = "";
    if (reduceMotion) { renderFullLetter(); return; }
    typingTimer = window.setInterval(() => {
      current += words[i] || "";
      letterContent.textContent = current;
      i++;
      if (i >= words.length) {
        window.clearInterval(typingTimer);
        letterContent.innerHTML = (cfg.letter || []).map(p => `<p>${escapeHtml(p)}</p>`).join("");
        openLetter.classList.add("hidden");
        $("#showFullLetter").classList.add("hidden");
      }
    }, 42);
  });
  $("#showFullLetter").addEventListener("click", renderFullLetter);

  // Dreams checklist, stored only in this browser's localStorage.
  const dreamList = $("#dreamList");
  (cfg.dreams || []).forEach((item, i) => {
    const label = document.createElement("label");
    label.className = "dream-item";
    label.innerHTML = `<input type="checkbox" data-dream="${i}"><span class="dream-check" aria-hidden="true">✓</span><span class="dream-copy"><strong>${escapeHtml(item.title)}</strong><span>${escapeHtml(item.body)}</span></span>`;
    const input = $("input", label);
    try { input.checked = localStorage.getItem(`olu-dream-${i}`) === "true"; } catch (_) {}
    label.classList.toggle("checked", input.checked);
    input.addEventListener("change", () => {
      label.classList.toggle("checked", input.checked);
      try { localStorage.setItem(`olu-dream-${i}`, String(input.checked)); } catch (_) {}
    });
    dreamList.appendChild(label);
  });

  // "Open when..." messages
  const whenGrid = $("#whenGrid");
  const whenSymbols = ["☁", "☾", "✧", "♡"];
  (cfg.whenMessages || []).forEach((item, i) => {
    const button = document.createElement("button");
    button.className = "when-card";
    button.type = "button";
    button.innerHTML = `<span class="when-symbol">${whenSymbols[i % whenSymbols.length]}</span><strong>${escapeHtml(item.title)}</strong><span class="when-open">otwórz ↗</span>`;
    button.addEventListener("click", () => showMessage(item.title, item.body, "MAŁA WIADOMOŚĆ"));
    whenGrid.appendChild(button);
  });

  // Secret easter egg: both decorative heart and hidden keyboard sequence.
  const secretHeart = $("#secretHeart");
  const secretResult = $("#secretResult");
  const revealSecret = () => {
    secretHeart.classList.add("found");
    secretResult.classList.remove("hidden");
    secretHeart.setAttribute("aria-label", "Ukryte serce odkryte");
    burstHearts(secretHeart);
  };
  secretHeart.addEventListener("click", revealSecret);
  const secretSequence = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "h", "e", "a", "r", "t"];
  let sequenceIndex = 0;
  document.addEventListener("keydown", e => {
    if (e.key === secretSequence[sequenceIndex]) sequenceIndex++;
    else sequenceIndex = e.key === secretSequence[0] ? 1 : 0;
    if (sequenceIndex === secretSequence.length) { revealSecret(); sequenceIndex = 0; }
  });

  // Quiz
  const quiz = cfg.quiz || [];
  let quizIndex = 0;
  const renderQuiz = () => {
    const q = quiz[quizIndex];
    if (!q) return;
    $("#quizCount").textContent = `PYTANIE ${quizIndex + 1} / ${quiz.length}`;
    $("#quizQuestion").textContent = q.question;
    $("#quizProgress").style.width = `${(quizIndex / quiz.length) * 100}%`;
    $("#quizFeedback").textContent = "";
    $("#quizNext").classList.add("hidden");
    $("#quizOptions").innerHTML = "";
    q.options.forEach((option, i) => {
      const button = document.createElement("button");
      button.className = "quiz-option";
      button.type = "button";
      button.textContent = option;
      button.addEventListener("click", () => {
        $$(".quiz-option", $("#quizOptions")).forEach(b => { b.disabled = true; });
        button.classList.add("selected");
        $("#quizFeedback").textContent = q.feedback || "Dzięki za odpowiedź. ♡";
        $("#quizProgress").style.width = `${((quizIndex + 1) / quiz.length) * 100}%`;
        $("#quizNext").textContent = quizIndex === quiz.length - 1 ? "Zobacz zakończenie ♡" : "Następne pytanie →";
        $("#quizNext").classList.remove("hidden");
      });
      $("#quizOptions").appendChild(button);
    });
  };
  renderQuiz();
  $("#quizNext").addEventListener("click", () => {
    if (quizIndex < quiz.length - 1) { quizIndex++; renderQuiz(); }
    else {
      $("#quizQuestion").textContent = "Ukończyłaś quiz! ♡";
      $("#quizOptions").innerHTML = "";
      $("#quizFeedback").textContent = "Najważniejsze, że tworzymy tę historię po swojemu.";
      $("#quizNext").classList.add("hidden");
      $("#quizProgress").style.width = "100%";
    }
  });

  // Finale button and lightweight celebratory particles.
  $("#finalButton").addEventListener("click", () => {
    $("#finalExtra").classList.toggle("hidden");
    $("#finalButton").textContent = $("#finalExtra").classList.contains("hidden") ? "Mam coś jeszcze dla Ciebie" : "Jeszcze jedna rzecz dla Ciebie ♡";
    if (!$("#finalExtra").classList.contains("hidden")) burstHearts($("#finalButton"), 16);
  });

  function burstHearts(origin, count = 10) {
    if (reduceMotion) return;
    const rect = origin.getBoundingClientRect();
    for (let i = 0; i < count; i++) {
      const heart = document.createElement("span");
      heart.className = "burst-heart";
      heart.textContent = i % 3 === 0 ? "✦" : "♥";
      heart.style.left = `${rect.left + rect.width / 2}px`;
      heart.style.top = `${rect.top + rect.height / 2 + window.scrollY}px`;
      heart.style.setProperty("--dx", `${(Math.random() - .5) * 180}px`);
      heart.style.setProperty("--dy", `${-40 - Math.random() * 150}px`);
      document.body.appendChild(heart);
      window.setTimeout(() => heart.remove(), 1200);
    }
  }



  // Public message book backed by the server API. Posts are visible to every visitor.
  const guestForm = $("#guestbookForm");
  const guestMessage = $("#guestMessage");
  const guestName = $("#guestName");
  const guestStatus = $("#guestStatus");
  const guestMessages = $("#guestMessages");
  const guestCount = $("#guestCount");
  const renderGuestMessages = (items) => {
    guestMessages.innerHTML = "";
    if (!items || !items.length) {
      guestMessages.innerHTML = '<p class="guest-empty">Na razie pusto. Możesz zostawić pierwszy wpis.</p>';
      return;
    }
    [...items].reverse().forEach(item => {
      const article = document.createElement("article"); article.className = "guest-message";
      const name = document.createElement("strong"); name.textContent = item.name || "Gość";
      const body = document.createElement("p"); body.textContent = item.message || "";
      const time = document.createElement("time");
      const date = item.createdAt ? new Date(item.createdAt) : null;
      time.textContent = date && !Number.isNaN(date.getTime()) ? date.toLocaleString("pl-PL", { dateStyle: "medium", timeStyle: "short" }) : "";
      article.append(name, body, time); guestMessages.appendChild(article);
    });
  };
  const loadGuestMessages = async () => {
    try {
      const response = await fetch("/api/messages", { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("API unavailable");
      const data = await response.json(); renderGuestMessages(data.messages || []);
    } catch (_) {
      guestMessages.innerHTML = '<p class="guest-empty">Księga wiadomości jest dostępna po uruchomieniu serwera. Reszta strony działa normalnie.</p>';
    }
  };
  guestMessage.addEventListener("input", () => { guestCount.textContent = `${guestMessage.value.length} / 280`; });
  guestForm.addEventListener("submit", async e => {
    e.preventDefault();
    const message = guestMessage.value.trim();
    if (!message) { guestStatus.textContent = "Wpisz wiadomość przed zapisaniem."; return; }
    const submit = $("button[type=submit]", guestForm); submit.disabled = true; guestStatus.textContent = "Zapisywanie…";
    try {
      const response = await fetch("/api/messages", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ name: guestName.value.trim() || "Gość", message }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Nie udało się zapisać wiadomości.");
      renderGuestMessages(data.messages || []); guestForm.reset(); guestCount.textContent = "0 / 280"; guestStatus.textContent = "Wiadomość zapisana.";
    } catch (error) {
      guestStatus.textContent = error.message || "Nie udało się połączyć z serwerem.";
    } finally { submit.disabled = false; }
  });
  loadGuestMessages();

  // Playlist: the server discovers audio files added to assets/music/ (or assets/).
  const musicFile = $("#musicFile");
  const siteAudio = $("#siteAudio");
  const playlistSelect = $("#playlistSelect");
  let playlistTracks = [];
  let selectedTrack = -1;
  const showTrack = (index, autoplay = false) => {
    if (!playlistTracks.length || index < 0 || index >= playlistTracks.length) return;
    selectedTrack = index;
    const track = playlistTracks[index];
    playlistSelect.value = String(index);
    if (siteAudio.dataset.objectUrl) { URL.revokeObjectURL(siteAudio.dataset.objectUrl); delete siteAudio.dataset.objectUrl; }
    siteAudio.src = track.url;
    $("#musicTitle").textContent = track.title;
    $("#musicHint").textContent = `Piosenka ${index + 1} z ${playlistTracks.length} · assets/music/`;
    siteAudio.load();
    if (autoplay) siteAudio.play().catch(() => {});
  };
  const loadPlaylist = async () => {
    try {
      const response = await fetch("/api/playlist", { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("Nie udało się wczytać playlisty.");
      const data = await response.json();
      playlistTracks = Array.isArray(data.tracks) ? data.tracks : [];
      playlistSelect.replaceChildren();
      if (!playlistTracks.length) {
        playlistSelect.add(new Option("Dodaj pliki do assets/music/", ""));
        $("#musicTitle").textContent = "Twoja playlista jest pusta";
        $("#musicHint").textContent = "Wrzuć MP3 do assets/music/ i odśwież stronę.";
        return;
      }
      playlistTracks.forEach((track, index) => playlistSelect.add(new Option(track.title, String(index))));
      showTrack(0);
    } catch (error) {
      playlistSelect.replaceChildren(new Option("Nie udało się wczytać playlisty", ""));
      $("#musicHint").textContent = "Sprawdź, czy strona działa przez serwer Flask.";
    }
  };
  playlistSelect.addEventListener("change", () => showTrack(Number(playlistSelect.value)));
  $("#previousTrack").addEventListener("click", () => { if (playlistTracks.length) showTrack((selectedTrack - 1 + playlistTracks.length) % playlistTracks.length, true); });
  $("#nextTrack").addEventListener("click", () => { if (playlistTracks.length) showTrack((selectedTrack + 1) % playlistTracks.length, true); });
  siteAudio.addEventListener("ended", () => { if (playlistTracks.length > 1) showTrack((selectedTrack + 1) % playlistTracks.length, true); });
  musicFile.addEventListener("change", () => {
    const file = musicFile.files && musicFile.files[0];
    if (!file) return;
    if (siteAudio.dataset.objectUrl) URL.revokeObjectURL(siteAudio.dataset.objectUrl);
    const objectUrl = URL.createObjectURL(file);
    siteAudio.dataset.objectUrl = objectUrl;
    siteAudio.src = objectUrl;
    $("#musicTitle").textContent = file.name.replace(/\.[^.]+$/, "") || "Wybrana piosenka";
    $("#musicHint").textContent = "Plik z telefonu — widoczny tylko w tej przeglądarce. Dodaj go do assets/music/, aby znalazł się na publicznej playliście.";
    playlistSelect.value = "";
    siteAudio.load();
  });
  loadPlaylist();

  // Photo preview. Selected images are not uploaded to the server automatically.
  const memoryFiles = $("#memoryFiles");
  const memoryGrid = $("#memoryGrid");
  const objectUrls = [];
  const clearMemoryPreview = () => {
    objectUrls.forEach(url => URL.revokeObjectURL(url));
    objectUrls.length = 0;
    memoryGrid.innerHTML = '<div class="memory-empty"><span>✧</span><strong>Tu mogą być Wasze zdjęcia</strong><p>Dodaj kilka kadrów, żeby zobaczyć je w tej galerii.</p></div>';
    memoryFiles.value = "";
  };
  memoryFiles.addEventListener("change", () => {
    const files = [...(memoryFiles.files || [])].filter(file => file.type.startsWith("image/")).slice(0, 12);
    if (!files.length) return;
    memoryGrid.innerHTML = "";
    files.forEach((file, index) => {
      const url = URL.createObjectURL(file); objectUrls.push(url);
      const item = document.createElement("figure"); item.className = "memory-item";
      const img = document.createElement("img"); img.src = url; img.alt = `Wspomnienie ${index + 1}`; img.loading = "lazy";
      const caption = document.createElement("span"); caption.textContent = file.name.replace(/\.[^.]+$/, "") || `Wspomnienie ${index + 1}`;
      item.append(img, caption); memoryGrid.appendChild(item);
    });
    if (memoryFiles.files.length > 12) showMessage("Wybrano pierwsze 12 zdjęć", "Galeria pokazuje maksymalnie 12 zdjęć naraz.", "MAŁA PODPOWIEDŹ");
  });
  $("#clearMemories").addEventListener("click", clearMemoryPreview);

  // A random affectionate message and a one-tap return-to-top control.
  const compliments = ["Nie musisz robić nic specjalnego, żeby być dla mnie ważna.", "Lubię poznawać Twój świat, nawet w tych najmniejszych szczegółach.", "Mam nadzieję, że dzisiaj znajdziesz choć jeden powód do uśmiechu.", "Fajnie, że nasze drogi się spotkały.", "To mały internetowy zakątek, ale myśl o Tobie jest prawdziwa."];
  const topButton = $("#backToTop");
  window.addEventListener("scroll", () => topButton.classList.toggle("visible", window.scrollY > 500), { passive: true });
  topButton.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

  // Prevent pinch/double-tap zoom where supported. Browser and OS accessibility settings can override this.
  document.addEventListener("gesturestart", e => e.preventDefault(), { passive: false });
  let lastTouchEnd = 0;
  document.addEventListener("touchend", e => {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) e.preventDefault();
    lastTouchEnd = now;
  }, { passive: false });

  // Mobile navigation
  const menuToggle = $("#menuToggle");
  const nav = $("#nav");
  menuToggle.addEventListener("click", () => {
    const open = nav.classList.toggle("nav-open");
    menuToggle.setAttribute("aria-expanded", String(open));
    menuToggle.textContent = open ? "×" : "☰";
  });
  $$("#nav a").forEach(link => link.addEventListener("click", () => {
    nav.classList.remove("nav-open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.textContent = "☰";
  }));

  // Reveal sections as they enter the viewport.
  if ("IntersectionObserver" in window && !reduceMotion) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
    $$(".reveal").forEach(el => observer.observe(el));
  } else {
    $$(".reveal").forEach(el => el.classList.add("is-visible"));
  }
})(); 
