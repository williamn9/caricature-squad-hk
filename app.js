(function () {
  const calendar = document.getElementById("calendar");
  const partnersEl = document.getElementById("partners");
  const yearEl = document.getElementById("year");
  const galleryGrid = document.getElementById("gallery-grid");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

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

  const partners = window.CARICATURE_PARTNERS || {};

  const events = (Array.isArray(window.CARICATURE_SCHEDULE)
    ? window.CARICATURE_SCHEDULE
    : []
  )
    .map((event) => {
      const partner = resolvePartner(event);
      return {
        ...event,
        venue: event.venue || partner.name || "",
        location: event.location || partner.location || "",
        maps: event.maps || partner.maps || "",
        partnerId: event.partnerId || partner.id || "",
        _date: parseDate(event.date),
        _partner: partner,
      };
    })
    .filter((event) => event._date)
    .sort((a, b) => a._date - b._date);

  renderPartners(events);

  if (!calendar) return;

  const eventsByKey = new Map();
  events.forEach((event) => {
    const key = dateKey(event._date);
    if (!eventsByKey.has(key)) eventsByKey.set(key, []);
    eventsByKey.get(key).push(event);
  });

  const today = startOfDay(new Date());
  const nextEvent = events.find((event) => event._date >= today) || events[0];
  let viewYear = (nextEvent ? nextEvent._date : today).getFullYear();
  let viewMonth = (nextEvent ? nextEvent._date : today).getMonth();
  let selectedKey = nextEvent ? dateKey(nextEvent._date) : null;

  render();

  function renderPartners(allEvents) {
    if (!partnersEl) return;

    const usedIds = [];
    allEvents.forEach((event) => {
      const id = event.partnerId || event._partner?.id;
      if (id && !usedIds.includes(id)) usedIds.push(id);
    });

    // Also include registered partners not yet on the schedule (for future collabs)
    Object.keys(partners).forEach((id) => {
      if (!usedIds.includes(id)) usedIds.push(id);
    });

    if (!usedIds.length) {
      partnersEl.innerHTML = "";
      return;
    }

    partnersEl.innerHTML = `
      <div class="partners__label">合作場地 Partners</div>
      <ul class="partners__list">
        ${usedIds
          .map((id) => {
            const p = partners[id] || {};
            const name = p.name || id;
            const nameEn = p.nameEn ? ` · ${escapeHtml(p.nameEn)}` : "";
            const maps = p.maps
              ? `<a href="${escapeAttr(p.maps)}" target="_blank" rel="noopener noreferrer">地圖</a>`
              : "";
            return `
              <li class="partners__item">
                <strong>${escapeHtml(name)}</strong>${nameEn}
                ${maps}
              </li>
            `;
          })
          .join("")}
      </ul>
    `;
  }

  function render() {
    const monthLabel = new Date(viewYear, viewMonth, 1).toLocaleDateString("zh-HK", {
      year: "numeric",
      month: "long",
    });
    const weekdays = ["日", "一", "二", "三", "四", "五", "六"];
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
    const cells = [];

    for (let i = 0; i < firstDay; i += 1) {
      cells.push('<div class="cal-cell is-empty" aria-hidden="true"></div>');
    }

    for (let day = 1; day <= daysInMonth; day += 1) {
      const date = new Date(viewYear, viewMonth, day);
      const key = dateKey(date);
      const dayEvents = eventsByKey.get(key) || [];
      const isToday = key === dateKey(today);
      const isSelected = key === selectedKey;
      const hasEvent = dayEvents.length > 0;
      const classes = [
        "cal-cell",
        hasEvent ? "has-event" : "",
        isToday ? "is-today" : "",
        isSelected ? "is-selected" : "",
      ]
        .filter(Boolean)
        .join(" ");

      const venueLabel = hasEvent ? dayEvents[0].venue || "" : "";

      cells.push(`
        <button
          type="button"
          class="${classes}"
          data-date="${key}"
          ${hasEvent ? "" : "disabled"}
          aria-pressed="${isSelected ? "true" : "false"}"
          aria-label="${monthLabel} ${day}日${
            hasEvent
              ? `，${venueLabel} ${dayEvents[0].artist || ""} ${dayEvents[0].time || ""}`.trim()
              : ""
          }"
        >
          <span class="cal-cell__day">${day}</span>
          ${
            hasEvent
              ? `<span class="cal-cell__pip" aria-hidden="true"></span>
                 <span class="cal-cell__time">${escapeHtml(dayEvents[0].time || "")}</span>
                 <span class="cal-cell__dot">${escapeHtml(dayEvents[0].artist || "LIVE")}</span>
                 <span class="cal-cell__venue">${escapeHtml(venueLabel)}</span>`
              : ""
          }
        </button>
      `);
    }

    const selectedEvents = selectedKey ? eventsByKey.get(selectedKey) || [] : [];
    const detailHtml = selectedEvents.length
      ? selectedEvents
          .map((event) => {
            const location = event.location || event.venue || "";
            const maps = event.maps || "";
            const locationHtml = maps
              ? `<a class="cal-detail__maps" href="${escapeAttr(maps)}" target="_blank" rel="noopener noreferrer">${escapeHtml(location)}</a>`
              : `<span>${escapeHtml(location)}</span>`;
            return `
          <article class="cal-detail__card">
            <div class="cal-detail__when">
              <strong>${formatLongDate(event._date)}</strong>
              <span class="cal-detail__time">${escapeHtml(event.time)}</span>
            </div>
            <div class="cal-detail__body">
              <h3>${escapeHtml(event.venue || "合作場地")}</h3>
              <p class="cal-detail__location">地點 Location · ${locationHtml}</p>
              <p>畫家 Artist · ${escapeHtml(event.artist || "TBA")}</p>
              <p>${escapeHtml(event.note || "")}</p>
            </div>
          </article>
        `;
          })
          .join("")
      : `<p class="cal-detail__empty">揀有標記嘅日子睇詳情：場地、時間同畫家。</p>`;

    calendar.innerHTML = `
      <div class="cal">
        <div class="cal__toolbar">
          <button type="button" class="cal__nav" data-nav="-1" aria-label="上個月">‹</button>
          <h3 class="cal__month">${monthLabel}</h3>
          <button type="button" class="cal__nav" data-nav="1" aria-label="下個月">›</button>
        </div>
        <div class="cal__weekdays">
          ${weekdays.map((day) => `<span>${day}</span>`).join("")}
        </div>
        <div class="cal__grid">
          ${cells.join("")}
        </div>
        <div class="cal-detail" id="cal-detail">
          ${detailHtml}
        </div>
      </div>
    `;

    calendar.querySelectorAll("[data-nav]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const delta = Number(btn.getAttribute("data-nav"));
        const next = new Date(viewYear, viewMonth + delta, 1);
        viewYear = next.getFullYear();
        viewMonth = next.getMonth();
        render();
      });
    });

    calendar.querySelectorAll(".cal-cell.has-event").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectedKey = btn.getAttribute("data-date");
        render();
      });
    });
  }

  function resolvePartner(event) {
    if (event.partnerId && partners[event.partnerId]) {
      return partners[event.partnerId];
    }
    // Inline fallback if event carries venue fields without partnerId
    if (event.venue || event.location) {
      return {
        id: event.partnerId || "",
        name: event.venue || "",
        location: event.location || "",
        maps: event.maps || "",
      };
    }
    return {};
  }

  function parseDate(value) {
    if (!value) return null;
    const [y, m, d] = String(value).split("-").map(Number);
    if (!y || !m || !d) return null;
    return new Date(y, m - 1, d);
  }

  function startOfDay(date) {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  function dateKey(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  function formatLongDate(date) {
    return date.toLocaleDateString("zh-HK", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function escapeAttr(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
})();
