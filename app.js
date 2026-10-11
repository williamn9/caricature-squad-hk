(function () {
  const calendar = document.getElementById("calendar");
  const yearEl = document.getElementById("year");
  const galleryGrid = document.getElementById("gallery-grid");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // All compressed gallery photos: assets/photos/g01.jpeg … g60.jpeg
  const PHOTO_COUNT = 60;
  if (galleryGrid) {
    galleryGrid.innerHTML = Array.from({ length: PHOTO_COUNT }, (_, i) => {
      const n = String(i + 1).padStart(2, "0");
      return `
        <figure>
          <img
            src="assets/photos/g${n}.jpeg"
            alt="Caricature Squad HK photo ${i + 1}"
            loading="lazy"
            decoding="async"
            width="800"
            height="800"
          />
        </figure>
      `;
    }).join("");
  }

  const events = Array.isArray(window.CARICATURE_SCHEDULE)
    ? window.CARICATURE_SCHEDULE
    : [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcoming = events
    .map((event) => ({ ...event, _date: parseDate(event.date) }))
    .filter((event) => event._date && event._date >= today)
    .sort((a, b) => a._date - b._date);

  if (!calendar) return;

  if (!upcoming.length) {
    calendar.innerHTML =
      '<p class="schedule__note">近期檔期即將更新 — 先 follow Instagram / Facebook 啦。</p>';
    return;
  }

  calendar.innerHTML = upcoming
    .map((event, index) => {
      const weekday = event._date.toLocaleDateString("zh-HK", { weekday: "short" });
      const month = event._date.toLocaleDateString("en-GB", { month: "short" }).toUpperCase();
      const day = event._date.getDate();

      return `
        <article class="event${index === 0 ? " is-next" : ""}">
          <div class="event__date">
            <strong>${day}</strong>
            <span>${month} · ${weekday}</span>
          </div>
          <div class="event__body">
            <h3>${escapeHtml(event.venue)}</h3>
            <p>${escapeHtml(event.time)} · ${escapeHtml(event.note || "")}</p>
          </div>
          <div class="event__tag">FREE</div>
        </article>
      `;
    })
    .join("");

  function parseDate(value) {
    if (!value) return null;
    const [y, m, d] = String(value).split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
})();
