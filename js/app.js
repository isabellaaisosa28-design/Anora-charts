(function () {
  "use strict";

  const page = document.getElementById("page");
  const nav = document.getElementById("mainNav");
  const menuToggle = document.getElementById("menuToggle");

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function fmt(value) {
    const number = Number(value || 0);
    return Number.isFinite(number) ? number.toLocaleString() : "0";
  }

  function movement(row) {
    const current = Number(row.current_position || row.position || 0);
    const previous = Number(row.previous_position || row.previous || 0);

    if (!previous) return "NEW";
    if (current < previous) return "▲ " + (previous - current);
    if (current > previous) return "▼ " + (current - previous);
    return "=";
  }

  function movementClass(value) {
    if (value.startsWith("▲")) return "up";
    if (value.startsWith("▼")) return "down";
    if (value === "NEW") return "new";
    return "same";
  }

  function getData() {
    if (window.ANORA && typeof ANORA.load === "function") {
      return ANORA.load();
    }
    return [];
  }

  function latestRows() {
    if (window.ANORA && typeof ANORA.latest === "function") {
      return ANORA.latest() || [];
    }

    return getData();
  }

  function shell(title, subtitle, content) {
    page.innerHTML = `
      <div class="container">
        <div class="page-kicker">ANORA CHARTS</div>
        <h1>${esc(title)}</h1>
        <p class="sub">${esc(subtitle)}</p>
        ${content}
      </div>
    `;
  }

  function empty(message) {
    return `<div class="empty">${esc(message)}</div>`;
  }

  function hot100() {
    const rows = latestRows();

    if (!rows.length) {
      shell(
        "ANORA HOT 100",
        "Your personal weekly music chart.",
        empty("No chart data yet. Go to UPDATE to add your first week.")
      );
      return;
    }

    const sorted = [...rows].sort(
      (a, b) =>
        Number(a.current_position || a.position || 999) -
        Number(b.current_position || b.position || 999)
    );

    const tableRows = sorted
      .map((row, index) => {
        const position = Number(
          row.current_position || row.position || index + 1
        );

        const move = movement(row);
        const cls = movementClass(move);

        return `
          <tr>
            <td class="pos">${position}</td>
            <td>
              <div class="song">${esc(row.song || row.title || "Unknown Song")}</div>
              <div class="artist">${esc(row.artist || "Unknown Artist")}</div>
            </td>
            <td class="movement ${cls}">${esc(move)}</td>
            <td>${fmt(row.plays)}</td>
            <td>${fmt(row.sales)}</td>
            <td>${fmt(row.chart_points || row.points)}</td>
            <td>${fmt(row.peak_position || position)}</td>
            <td>${fmt(row.weeks_on_chart || 1)}</td>
          </tr>
        `;
      })
      .join("");

    shell(
      "ANORA HOT 100",
      "Based on your personal listening data.",
      `
        <div class="card">
          <div class="preview-wrap">
            <table class="chart-table">
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Song / Artist</th>
                  <th>Move</th>
                  <th>Plays</th>
                  <th>Sales</th>
                  <th>Points</th>
                  <th>Peak</th>
                  <th>Weeks</th>
                </tr>
              </thead>
              <tbody>${tableRows}</tbody>
            </table>
          </div>
        </div>
      `
    );
  }

  function chartBeat() {
    const rows = latestRows();

    shell(
      "CHART BEAT",
      "The latest movement and highlights.",
      rows.length
        ? `
          <div class="grid grid-2">
            <div class="stat">
              <div class="num">${fmt(rows.length)}</div>
              <div class="label">Songs on chart</div>
            </div>
            <div class="stat">
              <div class="num">${
                rows.filter(r => Number(r.current_position || r.position) === 1)
                  .length
              }</div>
              <div class="label">Current #1</div>
            </div>
          </div>
        `
        : empty("No chart data yet.")
    );
  }

  function artistChart() {
    const rows = latestRows();
    const artists = {};

    rows.forEach(row => {
      const artist = row.artist || "Unknown Artist";
      if (!artists[artist]) {
        artists[artist] = {
          artist,
          songs: 0,
          plays: 0,
          sales: 0,
          points: 0
        };
      }

      artists[artist].songs += 1;
      artists[artist].plays += Number(row.plays || 0);
      artists[artist].sales += Number(row.sales || 0);
      artists[artist].points += Number(
        row.chart_points || row.points || 0
      );
    });

    const list = Object.values(artists).sort((a, b) => b.points - a.points);

    shell(
      "ARTIST CHART",
      "Artists ranked by combined chart performance.",
      list.length
        ? `
          <div class="card">
            ${list
              .map(
                (artist, index) => `
                  <div class="record">
                    <strong>${index + 1}. ${esc(artist.artist)}</strong>
                    <span>
                      ${artist.songs} song(s) ·
                      ${fmt(artist.plays)} plays ·
                      ${fmt(artist.points)} points
                    </span>
                  </div>
                `
              )
              .join("")}
          </div>
        `
        : empty("No artist data yet.")
    );
  }

  function albumChart() {
    const rows = latestRows();
    const albums = {};

    rows.forEach(row => {
      const album = row.album || "Unknown Album";

      if (!albums[album]) {
        albums[album] = {
          album,
          plays: 0,
          sales: 0,
          points: 0
        };
      }

      albums[album].plays += Number(row.plays || 0);
      albums[album].sales += Number(row.sales || 0);
      albums[album].points += Number(
        row.chart_points || row.points || 0
      );
    });

    const list = Object.values(albums).sort((a, b) => b.points - a.points);

    shell(
      "ALBUM CHART",
      "Albums ranked by the performance of their songs.",
      list.length
        ? `
          <div class="card">
            ${list
              .map(
                (album, index) => `
                  <div class="record">
                    <strong>${index + 1}. ${esc(album.album)}</strong>
                    <span>
                      ${fmt(album.plays)} plays ·
                      ${fmt(album.sales)} sales ·
                      ${fmt(album.points)} points
                    </span>
                  </div>
                `
              )
              .join("")}
          </div>
        `
        : empty("No album data yet.")
    );
  }

  function salesChart() {
    const rows = latestRows();

    const sorted = [...rows].sort(
      (a, b) => Number(b.sales || 0) - Number(a.sales || 0)
    );

    shell(
      "SALES CHART",
      "Songs ranked by ANORA sales.",
      sorted.length
        ? `
          <div class="card">
            ${sorted
              .map(
                (row, index) => `
                  <div class="record">
                    <strong>
                      ${index + 1}. ${esc(row.song || row.title || "Unknown Song")}
                    </strong>
                    <span>
                      ${esc(row.artist || "Unknown Artist")} ·
                      ${fmt(row.sales)} sales
                    </span>
                  </div>
                `
              )
              .join("")}
          </div>
        `
        : empty("No sales data yet.")
    );
  }

  function history() {
    let data = getData();

    if (!Array.isArray(data)) data = [];

    const weeks = {};

    data.forEach(row => {
      const week = row.week || row.chart_week || row.date || "Unknown Week";
      if (!weeks[week]) weeks[week] = 0;
      weeks[week] += 1;
    });

    const list = Object.entries(weeks).sort((a, b) =>
      String(b[0]).localeCompare(String(a[0]))
    );

    shell(
      "CHART HISTORY",
      "Saved ANORA HOT 100 weeks.",
      list.length
        ? `
          <div class="card">
            ${list
              .map(
                ([week, count]) => `
                  <div class="record">
                    <strong>${esc(week)}</strong>
                    <span>${count} charted song(s)</span>
                  </div>
                `
              )
              .join("")}
          </div>
        `
        : empty("No chart history saved yet.")
    );
  }

  function records() {
    const rows = latestRows();

    if (!rows.length) {
      shell(
        "RECORDS",
        "ANORA CHARTS records.",
        empty("Add chart data to start building records.")
      );
      return;
    }

    const numberOne = rows.find(
      row => Number(row.current_position || row.position) === 1
    );

    const mostPlayed = [...rows].sort(
      (a, b) => Number(b.plays || 0) - Number(a.plays || 0)
    )[0];

    const highestSales = [...rows].sort(
      (a, b) => Number(b.sales || 0) - Number(a.sales || 0)
    )[0];

    shell(
      "RECORDS",
      "Selected ANORA CHARTS records.",
      `
        <div class="record-list">
          ${
            numberOne
              ? `
                <div class="record">
                  <strong>Current #1</strong>
                  <span>
                    ${esc(numberOne.song || numberOne.title || "Unknown Song")}
                    — ${esc(numberOne.artist || "Unknown Artist")}
                  </span>
                </div>
              `
              : ""
          }

          ${
            mostPlayed
              ? `
                <div class="record">
                  <strong>Most Plays This Week</strong>
                  <span>
                    ${esc(mostPlayed.song || mostPlayed.title || "Unknown Song")}
                    — ${fmt(mostPlayed.plays)} plays
                  </span>
                </div>
              `
              : ""
          }

          ${
            highestSales
              ? `
                <div class="record">
                  <strong>Most Sales This Week</strong>
                  <span>
                    ${esc(highestSales.song || highestSales.title || "Unknown Song")}
                    — ${fmt(highestSales.sales)} sales
                  </span>
                </div>
              `
              : ""
          }
        </div>
      `
    );
  }

  function updatePage() {
    shell(
      "UPDATE ANORA CHARTS",
      "Add a new chart week.",
      `
        <div class="card">
          <h2>Manual Update</h2>
          <p class="sub">
            Your chart engine can process a new weekly dataset here.
          </p>
          <p class="notice">
            If you already have the ANORA data engine installed, this page
            will connect to it.
          </p>
        </div>
      `
    );
  }

  function render() {
    const route = location.hash.replace(/^#\/?/, "") || "hot100";

    if (route === "chart-beat" || route === "beat") {
      chartBeat();
    } else if (route === "artists") {
      artistChart();
    } else if (route === "albums") {
      albumChart();
    } else if (route === "sales") {
      salesChart();
    } else if (route === "history") {
      history();
    } else if (route === "records") {
      records();
    } else if (route === "update") {
      updatePage();
    } else {
      hot100();
    }

    if (nav) {
      nav.classList.remove("open");
    }
  }

  if (menuToggle && nav) {
    menuToggle.addEventListener("click", function () {
      nav.classList.toggle("open");
    });
  }

  window.addEventListener("hashchange", render);

  document.addEventListener("DOMContentLoaded", render);

  render();
})();
