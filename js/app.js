const app = document.getElementById("page");
const nav = document.getElementById("mainNav");
const menuBtn = document.getElementById("menuToggle");

function esc(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function fmt(value) {
  return Number(value || 0).toLocaleString();
}

function latest() {
  const data = ANORA.load();
  return ANORA.latest(data);
}

function shell(title, subtitle = "") {
  return `
    <section class="page-header">
      <h1>${esc(title)}</h1>
      ${subtitle ? `<p>${esc(subtitle)}</p>` : ""}
    </section>
  `;
}

function empty(message) {
  return `
    <div class="empty-state">
      <h2>No data yet</h2>
      <p>${esc(message)}</p>
    </div>
  `;
}

function movementClass(movement) {
  if (movement === "NEW") return "new";
  if (movement === "RE") return "re";
  if (movement === "=") return "same";
  if (String(movement).startsWith("▲")) return "up";
  if (String(movement).startsWith("▼")) return "down";
  return "";
}


/* =========================
   HOT 100
========================= */

function hot100() {
  const data = ANORA.load();
  const rows = ANORA.latest(data);

  if (!rows.length) {
    app.innerHTML =
      shell("ANORA HOT 100", "Your personal weekly music chart.") +
      empty("Go to UPDATE to add your first chart week.");
    return;
  }

  const artists = [
    ...new Set(rows.map(r => r.artist).filter(Boolean))
  ].sort();

  app.innerHTML = shell(
    "ANORA HOT 100",
    "Your personal weekly chart."
  ) + `
    <div class="chart-controls">
      <input id="search" type="search" placeholder="Search song or artist">

      <select id="artistFilter">
        <option value="">All Artists</option>
        ${artists.map(artist =>
          `<option value="${esc(artist)}">${esc(artist)}</option>`
        ).join("")}
      </select>

      <select id="sortBy">
        <option value="position">Chart Position</option>
        <option value="points">Points</option>
        <option value="plays">Plays</option>
        <option value="sales">Sales</option>
      </select>
    </div>

    <div id="hotTable" class="chart-table"></div>
  `;

  const renderTable = () => {
    const search =
      document.getElementById("search").value.toLowerCase();

    const artist =
      document.getElementById("artistFilter").value;

    const sort =
      document.getElementById("sortBy").value;

    let filtered = rows.filter(row => {
      const matchesSearch =
        !search ||
        String(row.song).toLowerCase().includes(search) ||
        String(row.artist).toLowerCase().includes(search);

      const matchesArtist =
        !artist || row.artist === artist;

      return matchesSearch && matchesArtist;
    });

    if (sort === "points") {
      filtered.sort(
        (a, b) => Number(b.chart_points || 0) -
                 Number(a.chart_points || 0)
      );
    } else if (sort === "plays") {
      filtered.sort(
        (a, b) => Number(b.plays || 0) -
                 Number(a.plays || 0)
      );
    } else if (sort === "sales") {
      filtered.sort(
        (a, b) => Number(b.sales || 0) -
                 Number(a.sales || 0)
      );
    } else {
      filtered.sort(
        (a, b) => Number(a.current_position || 999) -
                 Number(b.current_position || 999)
      );
    }

    document.getElementById("hotTable").innerHTML = `
      <div class="desktop-chart">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Song</th>
              <th>Artist</th>
              <th>LW</th>
              <th>Peak</th>
              <th>Weeks</th>
              <th>Plays</th>
              <th>Sales</th>
              <th>Points</th>
              <th>Cert.</th>
            </tr>
          </thead>

          <tbody>
            ${filtered.map(row => `
              <tr>
                <td>${fmt(row.current_position)}</td>
                <td>${esc(row.song)}</td>
                <td>${esc(row.artist)}</td>
                <td class="${movementClass(row.movement)}">
                  ${esc(row.movement)}
                </td>
                <td>${fmt(row.peak_position)}</td>
                <td>${fmt(row.weeks_on_chart)}</td>
                <td>${fmt(row.plays)}</td>
                <td>${fmt(row.sales)}</td>
                <td>${fmt(row.chart_points)}</td>
                <td>${row.certification ? esc(row.certification) : "—"}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>

      <div class="mobile-chart">
        ${filtered.map(row => `
          <article class="chart-card">
            <div class="chart-card-top">
              <strong>#${fmt(row.current_position)}</strong>
              <span class="${movementClass(row.movement)}">
                ${esc(row.movement)}
              </span>
            </div>

            <h2>${esc(row.song)}</h2>
            <p>${esc(row.artist)}</p>

            <div class="chart-stats">
              <span>Peak ${fmt(row.peak_position)}</span>
              <span>Weeks ${fmt(row.weeks_on_chart)}</span>
              <span>Plays ${fmt(row.plays)}</span>
              <span>Sales ${fmt(row.sales)}</span>
              <span>Points ${fmt(row.chart_points)}</span>
            </div>

            ${
              row.certification
                ? `<strong>${esc(row.certification)}</strong>`
                : ""
            }
          </article>
        `).join("")}
      </div>
    `;
  };

  document
    .getElementById("search")
    .addEventListener("input", renderTable);

  document
    .getElementById("artistFilter")
    .addEventListener("change", renderTable);

  document
    .getElementById("sortBy")
    .addEventListener("change", renderTable);

  renderTable();
}


/* =========================
   CHART BEAT
========================= */

function beat() {
  const rows = latest();

  if (!rows.length) {
    app.innerHTML =
      shell("CHART BEAT", "Weekly chart movement and highlights.") +
      empty("Add a chart week first.");
    return;
  }

  const numberOne = rows.find(
    row => Number(row.current_position) === 1
  );

  const movers = [...rows]
    .filter(row =>
      String(row.movement).startsWith("▲")
    )
    .sort((a, b) => {
      const aMove =
        Number(String(a.movement).replace(/[^\d]/g, ""));

      const bMove =
        Number(String(b.movement).replace(/[^\d]/g, ""));

      return bMove - aMove;
    })
    .slice(0, 10);

  const newEntries = rows
    .filter(row => row.movement === "NEW")
    .slice(0, 10);

  app.innerHTML =
    shell(
      "CHART BEAT",
      "The biggest stories from the latest ANORA HOT 100."
    ) +
    `
      <div class="beat-grid">

        <div class="stat-card">
          <span>No. 1</span>
          <strong>
            ${numberOne ? esc(numberOne.song) : "—"}
          </strong>
          <small>
            ${numberOne ? esc(numberOne.artist) : ""}
          </small>
        </div>

        <div class="stat-card">
          <span>New Entries</span>
          <strong>${fmt(newEntries.length)}</strong>
        </div>

        <div class="stat-card">
          <span>Charted Songs</span>
          <strong>${fmt(rows.length)}</strong>
        </div>

      </div>

      <section class="content-section">
        <h2>Biggest Movers</h2>

        ${
          movers.length
            ? movers.map(row => `
                <div class="beat-row">
                  <strong>#${fmt(row.current_position)}</strong>
                  <span>
                    ${esc(row.song)} —
                    ${esc(row.artist)}
                  </span>
                  <b>${esc(row.movement)}</b>
                </div>
              `).join("")
            : empty("No upward movers this week.")
        }
      </section>

      <section class="content-section">
        <h2>New Entries</h2>

        ${
          newEntries.length
            ? newEntries.map(row => `
                <div class="beat-row">
                  <strong>#${fmt(row.current_position)}</strong>
                  <span>
                    ${esc(row.song)} —
                    ${esc(row.artist)}
                  </span>
                  <b>NEW</b>
                </div>
              `).join("")
            : empty("No new entries this week.")
        }
      </section>
    `;
}


/* =========================
   ARTIST CHART
========================= */

function artists() {
  const data = ANORA.load();
  const rows = ANORA.aggregate(data, "artist");

  if (!rows.length) {
    app.innerHTML =
      shell(
        "ARTIST CHART",
        "Artists ranked from your chart data."
      ) +
      empty("Add chart data first.");
    return;
  }

  app.innerHTML =
    shell(
      "ARTIST CHART",
      "Artist totals calculated from ANORA CHARTS data."
    ) +
    `
      <div class="desktop-chart">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Artist</th>
              <th>Songs</th>
              <th>Plays</th>
              <th>Sales</th>
              <th>Points</th>
            </tr>
          </thead>

          <tbody>
            ${rows.map((row, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${esc(row.name)}</td>
                <td>${fmt(row.songs)}</td>
                <td>${fmt(row.plays)}</td>
                <td>${fmt(row.sales)}</td>
                <td>${fmt(row.points)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
}


/* =========================
   ALBUM CHART
========================= */

function albums() {
  const data = ANORA.load();

  const rows = ANORA
    .aggregate(data, "album")
    .filter(row =>
      row.name &&
      row.name !== "Unknown"
    );

  if (!rows.length) {
    app.innerHTML =
      shell(
        "ALBUM CHART",
        "Albums ranked from your chart data."
      ) +
      empty(
        "Add album information to your chart data."
      );
    return;
  }

  app.innerHTML =
    shell(
      "ALBUM CHART",
      "Album totals calculated from ANORA CHARTS data."
    ) +
    `
      <div class="desktop-chart">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Album</th>
              <th>Songs</th>
              <th>Plays</th>
              <th>Sales</th>
              <th>Points</th>
            </tr>
          </thead>

          <tbody>
            ${rows.map((row, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${esc(row.name)}</td>
                <td>${fmt(row.songs)}</td>
                <td>${fmt(row.plays)}</td>
                <td>${fmt(row.sales)}</td>
                <td>${fmt(row.points)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
}


/* =========================
   SALES
========================= */

function sales() {
  const data = ANORA.load();
  const rows = ANORA.allRows(data);

  if (!rows.length) {
    app.innerHTML =
      shell("SALES", "Personal sales leaders.") +
      empty("Add chart data first.");
    return;
  }

  const map = new Map();

  rows.forEach(row => {
    const key =
      row.song_id ||
      ANORA.uid(row.song, row.artist);

    if (!map.has(key)) {
      map.set(key, {
        song: row.song,
        artist: row.artist,
        sales: 0,
        weeks: 0
      });
    }

    const item = map.get(key);

    item.sales += Number(row.sales || 0);
    item.weeks += 1;
  });

  const leaders = [...map.values()]
    .sort((a, b) => b.sales - a.sales);

  app.innerHTML =
    shell(
      "SALES",
      "Lifetime personal sales generated inside ANORA CHARTS."
    ) +
    `
      <div class="desktop-chart">
        <table>
          <thead>
            <tr>
              <th>#</th>
              <th>Song</th>
              <th>Artist</th>
              <th>Lifetime Sales</th>
              <th>Weeks</th>
            </tr>
          </thead>

          <tbody>
            ${leaders.map((row, index) => `
              <tr>
                <td>${index + 1}</td>
                <td>${esc(row.song)}</td>
                <td>${esc(row.artist)}</td>
                <td>${fmt(row.sales)}</td>
                <td>${fmt(row.weeks)}</td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
}


/* =========================
   CHART HISTORY
========================= */

function history() {
  const data = ANORA.load();

  if (!data.weeks.length) {
    app.innerHTML =
      shell(
        "CHART HISTORY",
        "Every saved chart week."
      ) +
      empty("No saved weeks yet.");
    return;
  }

  const weeks = [...data.weeks].sort(
    (a, b) =>
      String(b.week_ending)
        .localeCompare(String(a.week_ending))
  );

  app.innerHTML =
    shell(
      "CHART HISTORY",
      "Saved weeks are kept permanently in this browser."
    ) +
    `
      <div class="history-list">
        ${weeks.map(week => `
          <article class="history-card">
            <span>WEEK ENDING</span>
            <h2>${esc(week.week_ending)}</h2>
            <p>${fmt(week.rows.length)} songs</p>
            <a href="#/hot100">VIEW HOT 100</a>
          </article>
        `).join("")}
      </div>
    `;
}


/* =========================
   RECORDS
========================= */

function records() {
  const data = ANORA.load();
  const rows = ANORA.allRows(data);

  if (!rows.length) {
    app.innerHTML =
      shell(
        "RECORDS",
        "ANORA CHARTS records."
      ) +
      empty("Add chart data first.");
    return;
  }

  const songMap = new Map();

  rows.forEach(row => {
    const key =
      row.song_id ||
      ANORA.uid(row.song, row.artist);

    if (!songMap.has(key)) {
      songMap.set(key, {
        song: row.song,
        artist: row.artist,
        weeks: 0,
        bestPeak: 999,
        biggestPoints: 0,
        sales: 0,
        numberOnes: 0
      });
    }

    const item = songMap.get(key);

    item.weeks += 1;

    item.bestPeak = Math.min(
      item.bestPeak,
      Number(row.peak_position || 999)
    );

    item.biggestPoints = Math.max(
      item.biggestPoints,
      Number(row.chart_points || 0)
    );

    item.sales += Number(row.sales || 0);

    if (Number(row.current_position) === 1) {
      item.numberOnes += 1;
    }
  });

  const songStats = [...songMap.values()];

  const mostWeeks =
    [...songStats].sort(
      (a, b) => b.weeks - a.weeks
    )[0];

  const biggestWeek =
    [...songStats].sort(
      (a, b) => b.biggestPoints - a.biggestPoints
    )[0];

  const mostSales =
    [...songStats].sort(
      (a, b) => b.sales - a.sales
    )[0];

  const bestPeak =
    [...songStats].sort(
      (a, b) => a.bestPeak - b.bestPeak
    )[0];

  const numberOneLeader =
    [...songStats].sort(
      (a, b) => b.numberOnes - a.numberOnes
    )[0];

  const cards = [
    {
      title: "Most Weeks",
      value: mostWeeks.weeks,
      song: mostWeeks.song,
      artist: mostWeeks.artist
    },
    {
      title: "Biggest Week",
      value: fmt(biggestWeek.biggestPoints) + " pts",
      song: biggestWeek.song,
      artist: biggestWeek.artist
    },
    {
      title: "Most Sales",
      value: fmt(mostSales.sales),
      song: mostSales.song,
      artist: mostSales.artist
    },
    {
      title: "Best Peak",
      value: "#" + bestPeak.bestPeak,
      song: bestPeak.song,
      artist: bestPeak.artist
    },
    {
      title: "Most #1 Weeks",
      value: numberOneLeader.numberOnes,
      song: numberOneLeader.song,
      artist: numberOneLeader.artist
    }
  ];

  app.innerHTML =
    shell(
      "RECORDS",
      "Current records calculated from your saved chart history."
    ) +
    `
      <div class="record-grid">
        ${cards.map(card => `
          <article class="record-card">
            <span>${esc(card.title)}</span>
            <strong>${esc(card.value)}</strong>
            <h2>${esc(card.song)}</h2>
            <p>${esc(card.artist)}</p>
          </article>
        `).join("")}
      </div>
    `;
}


/* =========================
   UPDATE
========================= */

function update() {
  const data = ANORA.load();

  app.innerHTML =
    shell(
      "UPDATE",
      "Add a weekly chart, import CSV data, or manage your saved data."
    ) +
    `
      <section class="content-section">
        <h2>Add Weekly Chart</h2>

        <label>
          Week ending
          <input id="weekDate" type="date">
        </label>

        <div id="manualRows"></div>

        <button id="addRow" type="button">
          + ADD SONG
        </button>

        <button id="previewWeek" type="button">
          PREVIEW WEEK
        </button>

        <button id="saveWeek" type="button" disabled>
          SAVE WEEK
        </button>

        <div id="preview"></div>
      </section>

      <section class="content-section">
        <h2>CSV Import</h2>

        <p>
          Paste CSV with columns such as
          Song, Artist, Album, Plays, Sales and Stability.
        </p>

        <textarea
          id="csvText"
          rows="10"
          placeholder="Song,Artist,Album,Plays,Sales,Stability"
        ></textarea>

        <button id="previewCsv" type="button">
          PREVIEW CSV
        </button>

        <button id="saveCsv" type="button" disabled>
          SAVE CSV WEEK
        </button>

        <div id="csvPreview"></div>
      </section>

      <section class="content-section">
        <h2>Data Management</h2>

        <button id="loadSample" type="button">
          LOAD SAMPLE DATA
        </button>

        <button id="exportJson" type="button">
          EXPORT JSON
        </button>

        <button id="resetData" type="button">
          RESET DATA
        </button>
      </section>
    `;

  const manualRows =
    document.getElementById("manualRows");

  const preview =
    document.getElementById("preview");

  const saveWeekBtn =
    document.getElementById("saveWeek");

  const csvPreview =
    document.getElementById("csvPreview");

  const saveCsvBtn =
    document.getElementById("saveCsv");

  let pendingRows = null;
  let pendingCsvRows = null;

  function addManualRow(values = {}) {
    const row = document.createElement("div");

    row.className = "manual-row";

    row.innerHTML = `
      <input
        class="song"
        placeholder="Song"
        value="${esc(values.song || "")}"
      >

      <input
        class="artist"
        placeholder="Artist"
        value="${esc(values.artist || "")}"
      >

      <input
        class="album"
        placeholder="Album"
        value="${esc(values.album || "")}"
      >

      <input
        class="plays"
        type="number"
        min="0"
        placeholder="Plays"
        value="${values.plays || ""}"
      >

      <input
        class="sales"
        type="number"
        min="0"
        placeholder="Sales"
        value="${values.sales || ""}"
      >

      <input
        class="stability"
        type="number"
        min="0"
        placeholder="Stability"
        value="${values.stability || ""}"
      >

      <button
        class="remove-row"
        type="button"
      >
        ×
      </button>
    `;

    row
      .querySelector(".remove-row")
      .addEventListener("click", () => {
        row.remove();
      });

    manualRows.appendChild(row);
  }

  addManualRow();
  addManualRow();
  addManualRow();

  document
    .getElementById("addRow")
    .addEventListener("click", () => {
      addManualRow();
    });

  document
    .getElementById("previewWeek")
    .addEventListener("click", () => {

      const rows = [
        ...manualRows.querySelectorAll(".manual-row")
      ]
        .map(row => ({
          song: row.querySelector(".song").value.trim(),
          artist: row.querySelector(".artist").value.trim(),
          album: row.querySelector(".album").value.trim(),
          plays: Number(
            row.querySelector(".plays").value || 0
          ),
          sales: Number(
            row.querySelector(".sales").value || 0
          ),
          stability: Number(
            row.querySelector(".stability").value || 0
          )
        }))
        .filter(row =>
          row.song &&
          row.artist
        );

      if (!rows.length) {
        preview.innerHTML =
          "<p>Add at least one song and artist.</p>";

        saveWeekBtn.disabled = true;
        return;
      }

      const date =
        document.getElementById("weekDate").value;

      if (!date) {
        preview.innerHTML =
          "<p>Select a week ending date first.</p>";

        saveWeekBtn.disabled = true;
        return;
      }

      pendingRows =
        ANORA.processWeek(
          rows,
          date,
          data
        );

      preview.innerHTML = `
        <h3>Preview</h3>
        <p>
          ${fmt(pendingRows.length)}
          songs · ${esc(date)}
        </p>

        ${pendingRows.map(row => `
          <div class="preview-row">
            #${fmt(row.current_position)}
            ${esc(row.song)}
            —
            ${esc(row.artist)}
            ${esc(row.movement)}
            ${fmt(row.chart_points)} pts
          </div>
        `).join("")}
      `;

      saveWeekBtn.disabled = false;
    });

  saveWeekBtn.addEventListener("click", () => {
    if (!pendingRows) return;

    const date =
      document.getElementById("weekDate").value;

    ANORA.saveWeek(
      data,
      date,
      pendingRows
    );

    alert("Chart week saved.");

    location.hash = "#/hot100";
  });

  document
    .getElementById("previewCsv")
    .addEventListener("click", () => {

      const text =
        document.getElementById("csvText")
          .value
          .trim();

      if (!text) {
        csvPreview.innerHTML =
          "<p>Paste CSV data first.</p>";

        saveCsvBtn.disabled = true;
        return;
      }

      try {
        const parsed =
          ANORA.parseCSV(text);

        if (!parsed.length) {
          throw new Error(
            "No usable rows found."
          );
        }

        pendingCsvRows = parsed;

        csvPreview.innerHTML = `
          <h3>CSV Preview</h3>

          <p>
            ${fmt(parsed.length)}
            rows detected.
          </p>

          ${parsed.slice(0, 50).map(row => `
            <div class="preview-row">
              ${esc(row.song)}
              —
              ${esc(row.artist)}
              · Plays ${fmt(row.plays)}
              · Sales ${fmt(row.sales)}
            </div>
          `).join("")}
        `;

        saveCsvBtn.disabled = false;

      } catch (error) {
        pendingCsvRows = null;
        saveCsvBtn.disabled = true;

        csvPreview.innerHTML =
          `<p>${esc(error.message)}</p>`;
      }
    });

  saveCsvBtn.addEventListener("click", () => {
    if (!pendingCsvRows) return;

    const date =
      document.getElementById("weekDate").value;

    if (!date) {
      alert("Select a week ending date first.");
      return;
    }

    const processed =
      ANORA.processWeek(
        pendingCsvRows,
        date,
        data
      );

    ANORA.saveWeek(
      data,
      date,
      processed
    );

    alert("CSV chart week saved.");

    location.hash = "#/hot100";
  });

  document
    .getElementById("loadSample")
    .addEventListener("click", () => {

      if (
        !confirm(
          "Load the sample ANORA CHARTS data?"
        )
      ) {
        return;
      }

      ANORA.loadSample();

      alert("Sample data loaded.");

      location.hash = "#/hot100";
    });

  document
    .getElementById("exportJson")
    .addEventListener("click", () => {

      const current = ANORA.load();

      const blob = new Blob(
        [
          JSON.stringify(
            current,
            null,
            2
          )
        ],
        {
          type: "application/json"
        }
      );

      const url =
        URL.createObjectURL(blob);

      const link =
        document.createElement("a");

      link.href = url;
      link.download =
        "anora-charts-data.json";

      link.click();

      URL.revokeObjectURL(url);
    });

  document
    .getElementById("resetData")
    .addEventListener("click", () => {

      if (
        !confirm(
          "Delete all ANORA CHARTS data from this browser?"
        )
      ) {
        return;
      }

      ANORA.reset();

      location.hash = "#/hot100";
    });
}


/* =========================
   ROUTER
========================= */

function render() {
  const route =
    location.hash
      .replace(/^#\/?/, "") ||
    "hot100";

  if (route === "hot100") {
    hot100();
  } else if (route === "chart-beat" || route === "beat") {
    beat();
  } else if (route === "artists") {
    artists();
  } else if (route === "albums") {
    albums();
  } else if (route === "sales") {
    sales();
  } else if (route === "history") {
    history();
  } else if (route === "records") {
    records();
  } else if (route === "update") {
    update();
  } else {
    hot100();
  }

  if (nav) {
    nav.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        nav.classList.remove("open");

        if (menuBtn) {
          menuBtn.setAttribute(
            "aria-expanded",
            "false"
          );
        }
      });
    });
  }
}


/* =========================
   MOBILE MENU
========================= */

if (menuBtn && nav) {
  menuBtn.setAttribute(
    "aria-expanded",
    "false"
  );

  menuBtn.addEventListener("click", () => {
    const open =
      nav.classList.toggle("open");

    menuBtn.setAttribute(
      "aria-expanded",
      String(open)
    );
  });
}


/* =========================
   START APP
========================= */

window.addEventListener(
  "hashchange",
  render
);

render();
