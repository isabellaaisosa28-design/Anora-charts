(function(global){
  "use strict";

  const KEY = "anora_charts_data_v1";
  const DEFAULTS = { PLAY_WEIGHT: 1, SALES_WEIGHT: 1, STABILITY_WEIGHT: 1 };

  const sampleWeeks = [
    {
      date: "2026-09-06",
      rows: [
        ["vampire", "Olivia Rodrigo", 520, 90, 30],
        ["WAP", "Cardi B", 480, 130, 15],
        ["Cruel Summer", "Taylor Swift", 430, 85, 25],
        ["Snooze", "SZA", 360, 70, 20],
        ["Calm Down", "Rema", 340, 55, 18],
        ["Good 4 U", "Olivia Rodrigo", 315, 48, 12],
        ["greedy", "Tate McRae", 300, 45, 16],
        ["Espresso", "Sabrina Carpenter", 295, 40, 15],
        ["Water", "Tyla", 270, 42, 13],
        ["Birds of a Feather", "Billie Eilish", 260, 38, 20]
      ]
    },
    {
      date: "2026-09-13",
      rows: [
        ["vampire", "Olivia Rodrigo", 610, 110, 35],
        ["WAP", "Cardi B", 450, 125, 18],
        ["Cruel Summer", "Taylor Swift", 470, 88, 27],
        ["Snooze", "SZA", 390, 74, 22],
        ["Calm Down", "Rema", 350, 57, 18],
        ["Good 4 U", "Olivia Rodrigo", 330, 50, 14],
        ["greedy", "Tate McRae", 345, 47, 17],
        ["Espresso", "Sabrina Carpenter", 310, 44, 15],
        ["Water", "Tyla", 300, 45, 14],
        ["Birds of a Feather", "Billie Eilish", 290, 41, 21]
      ]
    },
    {
      date: "2026-09-20",
      rows: [
        ["vampire", "Olivia Rodrigo", 680, 125, 40],
        ["Cruel Summer", "Taylor Swift", 510, 92, 29],
        ["WAP", "Cardi B", 470, 130, 19],
        ["Snooze", "SZA", 420, 78, 24],
        ["greedy", "Tate McRae", 390, 55, 18],
        ["Calm Down", "Rema", 365, 60, 19],
        ["Good 4 U", "Olivia Rodrigo", 345, 53, 15],
        ["Espresso", "Sabrina Carpenter", 325, 46, 16],
        ["Water", "Tyla", 315, 48, 15],
        ["Birds of a Feather", "Billie Eilish", 300, 43, 22]
      ]
    }
  ];

  function uid(song, artist) {
    return (song + "|||" + artist).toLowerCase().trim();
  }

  function num(v) {
    if (v === null || v === undefined || v === "") return 0;
    const n = Number(String(v).replace(/,/g, "").trim());
    return Number.isFinite(n) ? n : 0;
  }

  function esc(v) {
    return String(v ?? "").trim();
  }

  function points(row, weights = DEFAULTS) {
    return (
      num(row.plays) * weights.PLAY_WEIGHT +
      num(row.sales) * weights.SALES_WEIGHT +
      num(row.stability) * weights.STABILITY_WEIGHT
    );
  }

  function cert(sales) {
    const n = num(sales);
    if (n >= 10000000) return "Diamond";
    if (n >= 5000000) return "Platinum";
    if (n >= 1000000) return "Gold";
    return "";
  }

  function fresh() {
    return {
      version: 1,
      weights: { ...DEFAULTS },
      weeks: [],
      settings: { currency: "Personal Units" }
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return fresh();
      const data = JSON.parse(raw);
      data.weeks = Array.isArray(data.weeks) ? data.weeks : [];
      data.weights = Object.assign({}, DEFAULTS, data.weights || {});
      return data;
    } catch (error) {
      return fresh();
    }
  }

  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
    return data;
  }

  function normalizeRow(x) {
    const song = esc(x.song);
    const artist = esc(x.artist);
    const row = {
      id: x.id || uid(song, artist),
      song,
      artist,
      album: esc(x.album),
      plays: num(x.plays),
      sales: num(x.sales),
      stability: num(x.stability),
      debut: x.debut || null
    };
    row.points = points(row);
    return row;
  }

  function previousMap(data, date) {
    const sorted = data.weeks
      .filter(w => w.date < date)
      .sort((a, b) => a.date.localeCompare(b.date));
    const previous = sorted[sorted.length - 1];
    const map = {};
    if (previous) {
      previous.rows.forEach(row => {
        map[row.id] = row;
      });
    }
    return map;
  }

  function processWeek(data, date, rawRows) {
    const previous = previousMap(data, date);
    const rows = rawRows
      .map(normalizeRow)
      .filter(row => row.song && row.artist);

    rows.sort(
      (a, b) =>
        b.points - a.points ||
        b.plays - a.plays ||
        a.song.localeCompare(b.song)
    );

    rows.forEach((row, index) => {
      row.position = index + 1;
      const previousRow = previous[row.id];
      row.previousPosition = previousRow ? previousRow.position : null;

      if (!previousRow) {
        row.movement = "NEW";
      } else if (previousRow.position === row.position) {
        row.movement = "=";
      } else if (previousRow.position > row.position) {
        row.movement = "▲" + (previousRow.position - row.position);
      } else {
        row.movement = "▼" + (row.position - previousRow.position);
      }

      row.peak = previousRow
        ? Math.min(previousRow.peak || 999, row.position)
        : row.position;

      const historical = data.weeks.flatMap(week =>
        week.rows.filter(existing => existing.id === row.id)
      );
      row.weeks = historical.length + 1;
      row.numberOneWeeks =
        historical.filter(existing => existing.position === 1).length +
        (row.position === 1 ? 1 : 0);
      row.certification = cert(row.sales);
    });

    return { date, rows };
  }

  function saveWeek(data, date, rawRows) {
    if (!date) throw new Error("Week ending date is required.");
    if (!rawRows.length) throw new Error("Add at least one song.");

    const existingIndex = data.weeks.findIndex(week => week.date === date);
    const week = processWeek(data, date, rawRows);

    if (existingIndex >= 0) {
      data.weeks[existingIndex] = week;
    } else {
      data.weeks.push(week);
    }

    data.weeks.sort((a, b) => a.date.localeCompare(b.date));

    // Reprocess all weeks so peaks/weeks/movement stay consistent
    const copy = data.weeks.map(week => ({
      date: week.date,
      rows: week.rows.map(row => ({
        song: row.song,
        artist: row.artist,
        album: row.album,
        plays: row.plays,
        sales: row.sales,
        stability: row.stability,
        id: row.id
      }))
    }));

    data.weeks = [];
    copy.forEach(week => {
      data.weeks.push(processWeek(data, week.date, week.rows));
    });

    save(data);
    return data;
  }

  function latest(data) {
    return (
      data.weeks
        .slice()
        .sort((a, b) => b.date.localeCompare(a.date))[0] || null
    );
  }

  function allRows(data) {
    return data.weeks.flatMap(week =>
      week.rows.map(row => Object.assign({ weekDate: week.date }, row))
    );
  }

  function aggregate(data, field) {
    const map = {};
    allRows(data).forEach(row => {
      const key = row[field] || "Unknown";
      if (!map[key]) {
        map[key] = {
          name: key,
          plays: 0,
          sales: 0,
          points: 0,
          weeks: 0,
          numberOnes: 0,
          songs: 0
        };
      }
      map[key].plays += row.plays;
      map[key].sales += row.sales;
      map[key].points += row.points;
      map[key].weeks++;
      if (row.position === 1) map[key].numberOnes++;
    });

    // approximate unique songs by counting distinct ids in aggregate later if needed
    Object.keys(map).forEach(key => {
      const ids = new Set(
        allRows(data)
          .filter(r => (r[field] || "Unknown") === key)
          .map(r => r.id)
      );
      map[key].songs = ids.size;
    });

    return Object.values(map).sort((a, b) => b.points - a.points);
  }

  function parseCSV(text) {
    const lines = text
      .split(/\r?\n/)
      .filter(line => line.trim());
    if (!lines.length) return [];

    function split(line) {
      const output = [];
      let current = "";
      let quoted = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
          if (quoted && line[i + 1] === '"') {
            current += '"';
            i++;
          } else {
            quoted = !quoted;
          }
        } else if (ch === "," && !quoted) {
          output.push(current);
          current = "";
        } else {
          current += ch;
        }
      }
      output.push(current);
      return output;
    }

    const headers = split(lines[0]).map(header =>
      header
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "_")
    );

    const aliases = {
      song: ["song", "title", "track", "track_name"],
      artist: ["artist", "artist_name"],
      album: ["album", "album_name"],
      plays: ["plays", "streams", "stream", "play_count"],
      sales: ["sales", "units", "sale_units"],
      stability: ["stability", "stability_points", "stability_point"]
    };

    const index = {};
    Object.keys(aliases).forEach(key => {
      index[key] = headers.findIndex(header => aliases[key].includes(header));
    });

    return lines
      .slice(1)
      .map(line => {
        const values = split(line);
        const output = {};
        Object.keys(index).forEach(key => {
          if (index[key] >= 0) {
            output[key] = values[index[key]];
          }
        });
        return normalizeRow(output);
      })
      .filter(row => row.song && row.artist);
  }

  function exportJSON(data) {
    return JSON.stringify(data, null, 2);
  }

  function reset() {
    localStorage.removeItem(KEY);
  }

  function loadSample() {
    const data = fresh();
    sampleWeeks.forEach(week => {
      const rawRows = week.rows.map(r => ({
        song: r[0],
        artist: r[1],
        plays: r[2],
        sales: r[3],
        stability: r[4],
        album: ""
      }));
      saveWeek(data, week.date, rawRows);
    });
    return data;
  }

  global.ANORA = {
    KEY,
    DEFAULTS,
    sampleWeeks,
    load,
    save,
    saveWeek,
    processWeek,
    latest,
    aggregate,
    allRows,
    parseCSV,
    points,
    cert,
    exportJSON,
    reset,
    normalizeRow,
    loadSample,
    uid
  };
})(window);
