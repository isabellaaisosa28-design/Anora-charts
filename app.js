(function () {
  "use strict";

  const app = document.getElementById("app");
  const nav = document.getElementById("nav");
  const menuBtn = document.getElementById("menuBtn");

  function esc(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function fmt(value) {
    return Number(value || 0).toLocaleString();
  }

  function getLatestRows() {
    const data = ANORA.load();
    const week = ANORA.latest(data);
    return week && Array.isArray(week.rows) ? week.rows : [];
  }

  function shell(title, subtitle) {
    return (
      '<div class="hero">' +
      '<div class="page-kicker">ANORA CHARTS</div>' +
      "<h1>" + esc(title) + "</h1>" +
      (subtitle ? '<p class="sub">' + esc(subtitle) + "</p>" : "") +
      "</div>"
    );
  }

  function empty(message) {
    return (
      '<div class="empty">' +
      "<strong>No data yet.</strong><br />" +
      esc(message) +
      "</div>"
    );
  }

  function movementClass(movement) {
    if (movement === "NEW") return "new";
    if (movement === "RE") return "re";
    if (movement === "=") return "same";
    if (String(movement).startsWith("▲")) return "up";
    if (String(movement).startsWith("▼")) return "down";
    return "";
  }

  /* ---------- HOT 100 ---------- */
  function hot100() {
    const data = ANORA.load();
    const week = ANORA.latest(data);
    const rows = week && Array.isArray(week.rows) ? week.rows : [];

    if (!rows.length) {
      app.innerHTML =
        shell("ANORA HOT 100", "Your personal weekly music chart.") +
        empty("Go to UPDATE to add your first chart week.");
      return;
    }

    const artists = [...new Set(rows.map(r => r.artist).filter(Boolean))].sort();

    app.innerHTML =
      shell("ANORA HOT 100", "Your personal weekly chart · Week ending " + esc(week.date)) +
      '<div class="filters">' +
      '<input type="search" id="search" placeholder="Search song or artist" />' +
      '<select id="artistFilter"><option value="">All artists</option>' +
      artists.map(a => '<option value="' + esc(a) + '">' + esc(a) + "</option>").join("") +
      "</select>" +
      '<select id="sortBy">' +
      '<option value="position">Sort by position</option>' +
      '<option value="points">Sort by points</option>' +
      '<option value="plays">Sort by plays</option>' +
      '<option value="sales">Sort by sales</option>' +
      "</select>" +
      "</div>" +
      '<div class="preview-wrap">' +
      '<table class="chart-table" id="hotTable"></table>' +
      "</div>";

    function renderTable() {
      const search = (document.getElementById("search").value || "").toLowerCase();
      const artist = document.getElementById("artistFilter").value;
      const sort = document.getElementById("sortBy").value;

      let filtered = rows.filter(r => {
        const matchesSearch =
          !search ||
          String(r.song).toLowerCase().includes(search) ||
          String(r.artist).toLowerCase().includes(search);
        const matchesArtist = !artist || r.artist === artist;
        return matchesSearch && matchesArtist;
      });

      if (sort === "points") filtered.sort((a, b) => b.points - a.points);
      else if (sort === "plays") filtered.sort((a, b) => b.plays - a.plays);
      else if (sort === "sales") filtered.sort((a, b) => b.sales - a.sales);
      else filtered.sort((a, b) => a.position - b.position);

      document.getElementById("hotTable").innerHTML =
        "<thead><tr>" +
        "<th>#</th><th>Song</th><th>Artist</th><th>LW</th><th>Peak</th>" +
        "<th>Weeks</th><th>Plays</th><th>Sales</th><th>Points</th><th>Cert.</th>" +
        "</tr></thead><tbody>" +
        filtered
          .map(r => {
            const mc = movementClass(r.movement);
            return (
              "<tr>" +
              '<td class="pos">' + fmt(r.position) + "</td>" +
              '<td><div class="song">' + esc(r.song) + "</div></td>" +
              '<td><div class="artist">' + esc(r.artist) + "</div></td>" +
              '<td class="movement ' + mc + '">' + esc(r.movement) + "</td>" +
              "<td>" + fmt(r.peak) + "</td>" +
              "<td>" + fmt(r.weeks) + "</td>" +
              "<td>" + fmt(r.plays) + "</td>" +
              "<td>" + fmt(r.sales) + "</td>" +
              "<td>" + fmt(r.points) + "</td>" +
              "<td>" +
              (r.certification
                ? '<span class="badge">' + esc(r.certification) + "</span>"
                : "—") +
              "</td>" +
              "</tr>"
            );
          })
          .join("") +
        "</tbody>";
    }

    document.getElementById("search").addEventListener("input", renderTable);
    document.getElementById("artistFilter").addEventListener("change", renderTable);
    document.getElementById("sortBy").addEventListener("change", renderTable);
    renderTable();
  }

  /* ---------- CHART BEAT ---------- */
  function beat() {
    const rows = getLatestRows();
    if (!rows.length) {
      app.innerHTML =
        shell("CHART BEAT", "Weekly chart movement and highlights.") +
        empty("Add a chart week first.");
      return;
    }

    const numberOne = rows.find(r => r.position === 1);
    const movers = [...rows]
      .filter(r => String(r.movement).startsWith("▲"))
      .sort((a, b) => {
        const av = Number(String(a.movement).replace(/[^\d]/g, "")) || 0;
        const bv = Number(String(b.movement).replace(/[^\d]/g, "")) || 0;
        return bv - av;
      })
      .slice(0, 10);
    const newEntries = rows.filter(r => r.movement === "NEW").slice(0, 10);

    app.innerHTML =
      shell("CHART BEAT", "The biggest stories from the latest ANORA HOT 100.") +
      '<div class="grid grid-3">' +
      '<div class="stat"><div class="label">No. 1</div><div class="num">' +
      (numberOne ? esc(numberOne.song) : "—") +
      '</div><div class="small">' +
      (numberOne ? esc(numberOne.artist) : "") +
      "</div></div>" +
      '<div class="stat"><div class="label">New Entries</div><div class="num">' +
      fmt(newEntries.length) +
      "</div></div>" +
      '<div class="stat"><div class="label">Charted Songs</div><div class="num">' +
      fmt(rows.length) +
      "</div></div>" +
      "</div>" +
      '<div class="card"><h2>Biggest Movers</h2>' +
      (movers.length
        ? '<div class="record-list">' +
          movers
            .map(
              r =>
                '<div class="record"><strong>#' +
                fmt(r.position) +
                " " +
                esc(r.song) +
                '</strong><span>' +
                esc(r.artist) +
                ' · <span class="movement up">' +
                esc(r.movement) +
                "</span></span></div>"
            )
            .join("") +
          "</div>"
        : empty("No upward movers this week.")) +
      "</div>" +
      '<div class="card"><h2>New Entries</h2>' +
      (newEntries.length
        ? '<div class="record-list">' +
          newEntries
            .map(
              r =>
                '<div class="record"><strong>#' +
                fmt(r.position) +
                " " +
                esc(r.song) +
                '</strong><span>' +
                esc(r.artist) +
                ' · <span class="movement new">NEW</span></span></div>'
            )
            .join("") +
          "</div>"
        : empty("No new entries this week.")) +
      "</div>";
  }

  /* ---------- ARTIST CHART ---------- */
  function artists() {
    const data = ANORA.load();
    const rows = ANORA.aggregate(data, "artist");
    if (!rows.length) {
      app.innerHTML =
        shell("ARTIST CHART", "Artists ranked from your chart data.") +
        empty("Add chart data first.");
      return;
    }

    app.innerHTML =
      shell("ARTIST CHART", "Artist totals calculated from ANORA CHARTS data.") +
      '<div class="preview-wrap"><table class="chart-table"><thead><tr>' +
      "<th>#</th><th>Artist</th><th>Songs</th><th>Plays</th><th>Sales</th><th>Points</th>" +
      "</tr></thead><tbody>" +
      rows
        .map(
          (r, i) =>
            "<tr>" +
            '<td class="pos">' + (i + 1) + "</td>" +
            '<td class="song">' + esc(r.name) + "</td>" +
            "<td>" + fmt(r.songs) + "</td>" +
            "<td>" + fmt(r.plays) + "</td>" +
            "<td>" + fmt(r.sales) + "</td>" +
            "<td>" + fmt(r.points) + "</td>" +
            "</tr>"
        )
        .join("") +
      "</tbody></table></div>";
  }

  /* ---------- ALBUM CHART ---------- */
  function albums() {
    const data = ANORA.load();
    const rows = ANORA.aggregate(data, "album").filter(
      r => r.name && r.name !== "Unknown" && r.name !== ""
    );
    if (!rows.length) {
      app.innerHTML =
        shell("ALBUM CHART", "Albums ranked from your chart data.") +
        empty("Add album information to your chart data.");
      return;
    }

    app.innerHTML =
      shell("ALBUM CHART", "Album totals calculated from ANORA CHARTS data.") +
      '<div class="preview-wrap"><table class="chart-table"><thead><tr>' +
      "<th>#</th><th>Album</th><th>Songs</th><th>Plays</th><th>Sales</th><th>Points</th>" +
      "</tr></thead><tbody>" +
      rows
        .map(
          (r, i) =>
            "<tr>" +
            '<td class="pos">' + (i + 1) + "</td>" +
            '<td class="song">' + esc(r.name) + "</td>" +
            "<td>" + fmt(r.songs) + "</td>" +
            "<td>" + fmt(r.plays) + "</td>" +
            "<td>" + fmt(r.sales) + "</td>" +
            "<td>" + fmt(r.points) + "</td>" +
            "</tr>"
        )
        .join("") +
      "</tbody></table></div>";
  }

  /* ---------- SALES ---------- */
  function sales() {
    const data = ANORA.load();
    const all = ANORA.allRows(data);
    if (!all.length) {
      app.innerHTML =
        shell("SALES", "Personal sales leaders.") + empty("Add chart data first.");
      return;
    }

    const map = new Map();
    all.forEach(r => {
      const key = r.id || ANORA.uid(r.song, r.artist);
      if (!map.has(key)) {
        map.set(key, { song: r.song, artist: r.artist, sales: 0, weeks: 0 });
      }
      const item = map.get(key);
      item.sales += Number(r.sales || 0);
      item.weeks += 1;
    });

    const leaders = [...map.values()].sort((a, b) => b.sales - a.sales);

    app.innerHTML =
      shell("SALES", "Cumulative personal sales generated inside ANORA CHARTS.") +
      '<div class="preview-wrap"><table class="chart-table"><thead><tr>' +
      "<th>#</th><th>Song</th><th>Artist</th><th>Cumulative Sales</th><th>Weeks</th>" +
      "</tr></thead><tbody>" +
      leaders
        .map(
          (r, i) =>
            "<tr>" +
            '<td class="pos">' + (i + 1) + "</td>" +
            '<td class="song">' + esc(r.song) + "</td>" +
            '<td class="artist">' + esc(r.artist) + "</td>" +
            "<td>" + fmt(r.sales) + "</td>" +
            "<td>" + fmt(r.weeks) + "</td>" +
            "</tr>"
        )
        .join("") +
      "</tbody></table></div>";
  }

  /* ---------- HISTORY ---------- */
  function history() {
    const data = ANORA.load();
    if (!data.weeks.length) {
      app.innerHTML =
        shell("CHART HISTORY", "Every saved chart week.") +
        empty("No saved weeks yet.");
      return;
    }

    const weeks = [...data.weeks].sort((a, b) =>
      String(b.date).localeCompare(String(a.date))
    );

    app.innerHTML =
      shell("CHART HISTORY", "Saved weeks are kept permanently in your browser.") +
      '<div class="record-list">' +
      weeks
        .map(
          w =>
            '<div class="record">' +
            "<strong>WEEK ENDING</strong> " +
            esc(w.date) +
            '<br /><span>' +
            fmt(w.rows.length) +
            " songs</span>" +
            ' · <a href="#/hot100">VIEW HOT 100</a>' +
            "</div>"
        )
        .join("") +
      "</div>";
  }

  /* ---------- RECORDS ---------- */
  function records() {
    const data = ANORA.load();
    const all = ANORA.allRows(data);
    if (!all.length) {
      app.innerHTML =
        shell("RECORDS", "ANORA CHARTS records.") + empty("Add chart data first.");
      return;
    }

    const songMap = new Map();
    all.forEach(r => {
      const key = r.id || ANORA.uid(r.song, r.artist);
      if (!songMap.has(key)) {
        songMap.set(key, {
          song: r.song,
          artist: r.artist,
          weeks: 0,
          bestPeak: 999,
          biggestPoints: 0,
          sales: 0,
          numberOnes: 0
        });
      }
      const item = songMap.get(key);
      item.weeks += 1;
      item.bestPeak = Math.min(item.bestPeak, Number(r.peak || 999));
      item.biggestPoints = Math.max(item.biggestPoints, Number(r.points || 0));
      item.sales += Number(r.sales || 0);
      if (Number(r.position) === 1) item.numberOnes += 1;
    });

    const songStats = [...songMap.values()];
    const mostWeeks = [...songStats].sort((a, b) => b.weeks - a.weeks)[0];
    const biggestWeek = [...songStats].sort(
      (a, b) => b.biggestPoints - a.biggestPoints
    )[0];
    const mostSales = [...songStats].sort((a, b) => b.sales - a.sales)[0];
    const bestPeak = [...songStats].sort((a, b) => a.bestPeak - b.bestPeak)[0];
    const numberOneLeader = [...songStats].sort(
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
      '<div class="grid grid-2">' +
      cards
        .map(
          c =>
            '<div class="card record"><strong>' +
            esc(c.title) +
            "</strong> " +
            esc(String(c.value)) +
            "<br /><span>" +
            esc(c.song) +
            " — " +
            esc(c.artist) +
            "</span></div>"
        )
        .join("") +
      "</div>";
  }

  /* ---------- UPDATE ---------- */
  function update() {
    const data = ANORA.load();

    app.innerHTML =
      shell(
        "UPDATE",
        "Add a weekly chart, import CSV data, or manage your saved data."
      ) +
      '<div class="card">' +
      "<h2>Add Weekly Chart</h2>" +
      '<label class="small">Week ending</label><br />' +
      '<input type="date" id="weekDate" />' +
      '<div id="manualRows" style="margin-top:12px"></div>' +
      '<div class="toolbar">' +
      '<button type="button" id="addRow">+ ADD SONG</button>' +
      '<button type="button" class="secondary" id="previewWeek">PREVIEW WEEK</button>' +
      '<button type="button" id="saveWeek" disabled>SAVE WEEK</button>' +
      "</div>" +
      '<div id="preview" style="margin-top:12px"></div>' +
      "</div>" +
      '<div class="card">' +
      "<h2>CSV Import</h2>" +
      '<p class="small">Paste CSV with columns such as Song, Artist, Album, Plays, Sales and Stability.</p>' +
      '<textarea id="csvText" class="csv-box" placeholder="Song,Artist,Album,Plays,Sales,Stability"></textarea>' +
      '<div class="toolbar">' +
      '<button type="button" class="secondary" id="previewCsv">PREVIEW CSV</button>' +
      '<button type="button" id="saveCsv" disabled>SAVE CSV WEEK</button>' +
      "</div>" +
      '<div id="csvPreview" style="margin-top:12px"></div>' +
      "</div>" +
      '<div class="card">' +
      "<h2>Data Management</h2>" +
      '<div class="toolbar">' +
      '<button type="button" class="secondary" id="loadSample">LOAD SAMPLE DATA</button>' +
      '<button type="button" class="secondary" id="exportJson">EXPORT JSON</button>' +
      '<button type="button" class="danger" id="resetData">RESET DATA</button>' +
      "</div>" +
      "</div>";

    const manualRows = document.getElementById("manualRows");
    const preview = document.getElementById("preview");
    const saveWeekBtn = document.getElementById("saveWeek");
    const csvPreview = document.getElementById("csvPreview");
    const saveCsvBtn = document.getElementById("saveCsv");
    let pendingRows = null;
    let pendingCsvRows = null;

    function addManualRow() {
      const row = document.createElement("div");
      row.className = "manual-row";
      row.style.cssText =
        "display:grid;grid-template-columns:1fr 1fr 1fr 70px 70px 70px 36px;gap:6px;margin-bottom:8px;align-items:center";
      row.innerHTML =
        '<input class="song" placeholder="Song" />' +
        '<input class="artist" placeholder="Artist" />' +
        '<input class="album" placeholder="Album" />' +
        '<input class="plays" type="number" placeholder="Plays" />' +
        '<input class="sales" type="number" placeholder="Sales" />' +
        '<input class="stability" type="number" placeholder="Stab." />' +
        '<button type="button" class="secondary remove-row" title="Remove">×</button>';
      row.querySelector(".remove-row").addEventListener("click", function () {
        row.remove();
      });
      manualRows.appendChild(row);
    }

    addManualRow();
    addManualRow();
    addManualRow();

    document.getElementById("addRow").addEventListener("click", function () {
      addManualRow();
    });

    document.getElementById("previewWeek").addEventListener("click", function () {
      const rows = [...manualRows.querySelectorAll(".manual-row")]
        .map(function (row) {
          return {
            song: row.querySelector(".song").value.trim(),
            artist: row.querySelector(".artist").value.trim(),
            album: row.querySelector(".album").value.trim(),
            plays: Number(row.querySelector(".plays").value || 0),
            sales: Number(row.querySelector(".sales").value || 0),
            stability: Number(row.querySelector(".stability").value || 0)
          };
        })
        .filter(function (r) {
          return r.song && r.artist;
        });

      if (!rows.length) {
        preview.innerHTML =
          '<div class="notice">Add at least one song and artist.</div>';
        saveWeekBtn.disabled = true;
        pendingRows = null;
        return;
      }

      const date = document.getElementById("weekDate").value;
      if (!date) {
        preview.innerHTML =
          '<div class="notice">Please choose a week ending date.</div>';
        saveWeekBtn.disabled = true;
        pendingRows = null;
        return;
      }

      const processed = ANORA.processWeek(data, date, rows);
      pendingRows = processed.rows;

      preview.innerHTML =
        '<div class="notice"><strong>Preview</strong> — ' +
        fmt(pendingRows.length) +
        " songs · " +
        esc(date) +
        "</div>" +
        '<div class="record-list" style="margin-top:8px">' +
        pendingRows
          .map(function (r) {
            return (
              '<div class="record"><strong>#' +
              fmt(r.position) +
              " " +
              esc(r.song) +
              "</strong> — " +
              esc(r.artist) +
              ' <span class="movement ' +
              movementClass(r.movement) +
              '">' +
              esc(r.movement) +
              "</span> · " +
              fmt(r.points) +
              " pts</div>"
            );
          })
          .join("") +
        "</div>";
      saveWeekBtn.disabled = false;
    });

    saveWeekBtn.addEventListener("click", function () {
      if (!pendingRows) return;
      const date = document.getElementById("weekDate").value;
      if (!date) {
        alert("Week ending date is required.");
        return;
      }
      ANORA.saveWeek(data, date, pendingRows);
      alert("Chart week saved.");
      location.hash = "#/hot100";
    });

    document.getElementById("previewCsv").addEventListener("click", function () {
      const text = document.getElementById("csvText").value.trim();
      if (!text) {
        csvPreview.innerHTML =
          '<div class="notice">Paste CSV data first.</div>';
        saveCsvBtn.disabled = true;
        pendingCsvRows = null;
        return;
      }
      try {
        const parsed = ANORA.parseCSV(text);
        if (!parsed.length) throw new Error("No usable rows found.");
        pendingCsvRows = parsed;
        csvPreview.innerHTML =
          '<div class="notice"><strong>CSV Preview</strong> — ' +
          fmt(parsed.length) +
          " rows detected.</div>" +
          '<div class="preview-wrap" style="margin-top:8px"><table class="chart-table"><thead><tr>' +
          "<th>Song</th><th>Artist</th><th>Album</th><th>Plays</th><th>Sales</th><th>Stability</th>" +
          "</tr></thead><tbody>" +
          parsed
            .slice(0, 50)
            .map(function (r) {
              return (
                "<tr>" +
                "<td>" + esc(r.song) + "</td>" +
                "<td>" + esc(r.artist) + "</td>" +
                "<td>" + esc(r.album) + "</td>" +
                "<td>" + fmt(r.plays) + "</td>" +
                "<td>" + fmt(r.sales) + "</td>" +
                "<td>" + fmt(r.stability) + "</td>" +
                "</tr>"
              );
            })
            .join("") +
          "</tbody></table></div>";
        saveCsvBtn.disabled = false;
      } catch (error) {
        pendingCsvRows = null;
        saveCsvBtn.disabled = true;
        csvPreview.innerHTML =
          '<div class="notice">' + esc(error.message) + "</div>";
      }
    });

    saveCsvBtn.addEventListener("click", function () {
      if (!pendingCsvRows) return;
      const date = document.getElementById("weekDate").value;
      if (!date) {
        alert("Week ending date is required.");
        return;
      }
      ANORA.saveWeek(data, date, pendingCsvRows);
      alert("CSV chart week saved.");
      location.hash = "#/hot100";
    });

    document.getElementById("loadSample").addEventListener("click", function () {
      if (!confirm("Load the sample ANORA CHARTS data?")) return;
      ANORA.loadSample();
      alert("Sample data loaded.");
      location.hash = "#/hot100";
    });

    document.getElementById("exportJson").addEventListener("click", function () {
      const current = ANORA.load();
      const blob = new Blob([JSON.stringify(current, null, 2)], {
        type: "application/json"
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "anora-charts-data.json";
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById("resetData").addEventListener("click", function () {
      if (!confirm("Delete all ANORA CHARTS data from this browser?")) return;
      ANORA.reset();
      location.hash = "#/hot100";
    });
  }

  /* ---------- ROUTER ---------- */
  function render() {
    const route = location.hash.replace(/^#\/?/, "") || "hot100";
    if (route === "hot100") hot100();
    else if (route === "beat") beat();
    else if (route === "artists") artists();
    else if (route === "albums") albums();
    else if (route === "sales") sales();
    else if (route === "history") history();
    else if (route === "records") records();
    else if (route === "update") update();
    else hot100();
  }

  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      const open = nav.classList.toggle("open");
      menuBtn.setAttribute("aria-expanded", String(open));
    });
    nav.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", function () {
        nav.classList.remove("open");
        menuBtn.setAttribute("aria-expanded", "false");
      });
    });
  }

  window.addEventListener("hashchange", render);
  render();
})();
