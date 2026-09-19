
const app = document.getElementById("app"); const nav = document.getElementById("nav"); const menuBtn = document.getElementById("menuBtn"); function esc(value) { return String(value ?? "") .replaceAll("&", "&") .replaceAll("<", "<") .replaceAll(">", ">") .replaceAll('"', """) .replaceAll("'", "'"); } function fmt(value) { return Number(value || 0).toLocaleString(); } function latest() { const data = ANORA.load(); return ANORA.latest(data); } function shell(title, subtitle = "") { return `
ANORA CHARTS

${esc(title)}

${subtitle ? `
${esc(subtitle)}

` : ""}
`; } function empty(message) { return `
No data yet.
${esc(message)}

`; } function movementClass(movement) { if (movement === "NEW") return "new"; if (movement === "RE") return "re"; if (movement === "=") return "same"; if (String(movement).startsWith("▲")) return "up"; if (String(movement).startsWith("▼")) return "down"; return ""; } function hot100() { const data = ANORA.load(); const rows = ANORA.latest(data); if (!rows.length) { app.innerHTML = shell( "ANORA HOT 100", "Your personal weekly music chart." ) + empty("Go to UPDATE to add your first chart week."); return; } const artists = [...new Set(rows.map(r => r.artist).filter(Boolean))].sort(); app.innerHTML = shell( "ANORA HOT 100", "Your personal weekly chart." ) + `
    
`; const renderTable = () => { const search = document.getElementById("search").value.toLowerCase(); const artist = document.getElementById("artistFilter").value; const sort = document.getElementById("sortBy").value; let filtered = rows.filter(r => { const matchesSearch = !search || String(r.song).toLowerCase().includes(search) || String(r.artist).toLowerCase().includes(search); const matchesArtist = !artist || r.artist === artist; return matchesSearch && matchesArtist; }); if (sort === "points") { filtered.sort((a, b) => b.chart_points - a.chart_points); } else if (sort === "plays") { filtered.sort((a, b) => b.plays - a.plays); } else if (sort === "sales") { filtered.sort((a, b) => b.sales - a.sales); } else { filtered.sort((a, b) => a.current_position - b.current_position); } document.getElementById("hotTable").innerHTML = `
${filtered.map(r => ` `).join("")}
#	Song	Artist	LW	Peak	Weeks	Plays	Sales	Points	Cert.
${fmt(r.current_position)}	${esc(r.song)}	${esc(r.artist)}	${esc(r.movement)} 	${fmt(r.peak_position)}	${fmt(r.weeks_on_chart)}	${fmt(r.plays)}	${fmt(r.sales)}	${fmt(r.chart_points)}	${r.certification ? `${esc(r.certification)}` : "—"}
${filtered.map(r => `
#${fmt(r.current_position)} ${esc(r.movement)}
${esc(r.song)}

${esc(r.artist)}

Peak${fmt(r.peak_position)} Weeks${fmt(r.weeks_on_chart)} Plays${fmt(r.plays)} Sales${fmt(r.sales)} Points${fmt(r.chart_points)}
${r.certification ? `${esc(r.certification)}` : ""}
`).join("")}
`; }; document.getElementById("search").addEventListener("input", renderTable); document.getElementById("artistFilter").addEventListener("change", renderTable); document.getElementById("sortBy").addEventListener("change", renderTable); renderTable(); } function beat() { const rows = latest(); if (!rows.length) { app.innerHTML = shell("CHART BEAT", "Weekly chart movement and highlights.") + empty("Add a chart week first."); return; } const numberOne = rows.find(r => r.current_position === 1); const movers = [...rows] .filter(r => String(r.movement).startsWith("▲")) .sort((a, b) => { const av = Number(String(a.movement).replace(/[^\d]/g, "")); const bv = Number(String(b.movement).replace(/[^\d]/g, "")); return bv - av; }) .slice(0, 10); const newEntries = rows .filter(r => r.movement === "NEW") .slice(0, 10); app.innerHTML = shell( "CHART BEAT", "The biggest stories from the latest ANORA HOT 100." ) + `
No. 1 ${numberOne ? esc(numberOne.song) : "—"} ${numberOne ? esc(numberOne.artist) : ""}
New Entries ${fmt(newEntries.length)}
Charted Songs ${fmt(rows.length)}
Biggest Movers

${ movers.length ? `
${movers.map(r => `
#${fmt(r.current_position)} ${esc(r.song)}
${esc(r.artist)} ${esc(r.movement)}
`).join("")}
` : empty("No upward movers this week.") }
New Entries

${ newEntries.length ? `
${newEntries.map(r => `
#${fmt(r.current_position)} ${esc(r.song)}
${esc(r.artist)} NEW
`).join("")}
` : empty("No new entries this week.") }
`; } function artists() { const data = ANORA.load(); const rows = ANORA.aggregate(data, "artist"); if (!rows.length) { app.innerHTML = shell("ARTIST CHART", "Artists ranked from your chart data.") + empty("Add chart data first."); return; } app.innerHTML = shell( "ARTIST CHART", "Artist totals calculated from ANORA CHARTS data." ) + `
${rows.map((r, i) => ` `).join("")}
#	Artist	Songs	Plays	Sales	Points
${i + 1}	${esc(r.name)}	${fmt(r.songs)}	${fmt(r.plays)}	${fmt(r.sales)}	${fmt(r.points)}
`; } function albums() { const data = ANORA.load(); const rows = ANORA.aggregate(data, "album") .filter(r => r.name && r.name !== "Unknown"); if (!rows.length) { app.innerHTML = shell("ALBUM CHART", "Albums ranked from your chart data.") + empty("Add album information to your chart data."); return; } app.innerHTML = shell( "ALBUM CHART", "Album totals calculated from ANORA CHARTS data." ) + `
${rows.map((r, i) => ` `).join("")}
#	Album	Songs	Plays	Sales	Points
${i + 1}	${esc(r.name)}	${fmt(r.songs)}	${fmt(r.plays)}	${fmt(r.sales)}	${fmt(r.points)}
`; } function sales() { const data = ANORA.load(); const rows = ANORA.allRows(data); if (!rows.length) { app.innerHTML = shell("SALES", "Personal sales leaders.") + empty("Add chart data first."); return; } const map = new Map(); rows.forEach(r => { const key = r.song_id || ANORA.uid(r.song, r.artist); if (!map.has(key)) { map.set(key, { song: r.song, artist: r.artist, sales: 0, weeks: 0 }); } const item = map.get(key); item.sales += Number(r.sales || 0); item.weeks += 1; }); const leaders = [...map.values()] .sort((a, b) => b.sales - a.sales); app.innerHTML = shell( "SALES", "Lifetime personal sales generated inside ANORA CHARTS." ) + `
${leaders.map((r, i) => ` `).join("")}
#	Song	Artist	Lifetime Sales	Weeks
${i + 1}	${esc(r.song)}	${esc(r.artist)}	${fmt(r.sales)}	${fmt(r.weeks)}
`; } function history() { const data = ANORA.load(); if (!data.weeks.length) { app.innerHTML = shell("CHART HISTORY", "Every saved chart week.") + empty("No saved weeks yet."); return; } const weeks = [...data.weeks].sort((a, b) => String(b.week_ending).localeCompare(String(a.week_ending)) ); app.innerHTML = shell( "CHART HISTORY", "Saved weeks are kept permanently in your browser." ) + `
${weeks.map(w => `
WEEK ENDING
${esc(w.week_ending)}

${fmt(w.rows.length)} songs

VIEW HOT 100
`).join("")}
`; } function records() { const data = ANORA.load(); const rows = ANORA.allRows(data); if (!rows.length) { app.innerHTML = shell("RECORDS", "ANORA CHARTS records.") + empty("Add chart data first."); return; } const songMap = new Map(); rows.forEach(r => { const key = r.song_id || ANORA.uid(r.song, r.artist); if (!songMap.has(key)) { songMap.set(key, { song: r.song, artist: r.artist, weeks: 0, bestPeak: 999, biggestPoints: 0, sales: 0, numberOnes: 0 }); } const item = songMap.get(key); item.weeks += 1; item.bestPeak = Math.min(item.bestPeak, Number(r.peak_position || 999)); item.biggestPoints = Math.max( item.biggestPoints, Number(r.chart_points || 0) ); item.sales += Number(r.sales || 0); if (Number(r.current_position) === 1) { item.numberOnes += 1; } }); const songStats = [...songMap.values()]; const mostWeeks = [...songStats] .sort((a, b) => b.weeks - a.weeks)[0]; const biggestWeek = [...songStats] .sort((a, b) => b.biggestPoints - a.biggestPoints)[0]; const mostSales = [...songStats] .sort((a, b) => b.sales - a.sales)[0]; const bestPeak = [...songStats] .sort((a, b) => a.bestPeak - b.bestPeak)[0]; const numberOneLeader = [...songStats] .sort((a, b) => b.numberOnes - a.numberOnes)[0]; const cards = [ { title: "Most Weeks", value: mostWeeks.weeks, song: mostWeeks.song, artist: mostWeeks.artist }, { title: "Biggest Week", value: fmt(biggestWeek.biggestPoints) + " pts", song: biggestWeek.song, artist: biggestWeek.artist }, { title: "Most Sales", value: fmt(mostSales.sales), song: mostSales.song, artist: mostSales.artist }, { title: "Best Peak", value: "#" + bestPeak.bestPeak, song: bestPeak.song, artist: bestPeak.artist }, { title: "Most #1 Weeks", value: numberOneLeader.numberOnes, song: numberOneLeader.song, artist: numberOneLeader.artist } ]; app.innerHTML = shell( "RECORDS", "Current records calculated from your saved chart history." ) + `
${cards.map(c => `
${esc(c.title)} ${esc(c.value)}
${esc(c.song)}

${esc(c.artist)}

`).join("")}
`; } function update() { const data = ANORA.load(); app.innerHTML = shell( "UPDATE", "Add a weekly chart, import CSV data, or manage your saved data." ) + `
Add Weekly Chart

Week ending  
+ ADD SONG  PREVIEW WEEK  SAVE WEEK
CSV Import

Paste CSV with columns such as Song, Artist, Album, Plays, Sales and Stability.


PREVIEW CSV  SAVE CSV WEEK
Data Management

LOAD SAMPLE DATA  EXPORT JSON  RESET DATA
`; const manualRows = document.getElementById("manualRows"); const preview = document.getElementById("preview"); const saveWeekBtn = document.getElementById("saveWeek"); const csvPreview = document.getElementById("csvPreview"); const saveCsvBtn = document.getElementById("saveCsv"); let pendingRows = null; let pendingCsvRows = null; function addManualRow(values = {}) { const row = document.createElement("div"); row.className = "manual-row"; row.innerHTML = `              × `; row.querySelector(".remove-row").addEventListener("click", () => { row.remove(); }); manualRows.appendChild(row); } addManualRow(); addManualRow(); addManualRow(); document.getElementById("addRow").addEventListener("click", () => { addManualRow(); }); document.getElementById("previewWeek").addEventListener("click", () => { const rows = [...manualRows.querySelectorAll(".manual-row")] .map(row => ({ song: row.querySelector(".song").value.trim(), artist: row.querySelector(".artist").value.trim(), album: row.querySelector(".album").value.trim(), plays: Number(row.querySelector(".plays").value || 0), sales: Number(row.querySelector(".sales").value || 0), stability: Number(row.querySelector(".stability").value || 0) })) .filter(r => r.song && r.artist); if (!rows.length) { preview.innerHTML = `
Add at least one song and artist.
`; saveWeekBtn.disabled = true; return; } const date = document.getElementById("weekDate").value; pendingRows = ANORA.processWeek(rows, date, data); preview.innerHTML = `
Preview

${fmt(pendingRows.length)} songs · ${esc(date)}

${pendingRows.map(r => `
#${fmt(r.current_position)} ${esc(r.song)} — ${esc(r.artist)} ${esc(r.movement)} ${fmt(r.chart_points)} pts
`).join("")}
`; saveWeekBtn.disabled = false; }); saveWeekBtn.addEventListener("click", () => { if (!pendingRows) return; const date = document.getElementById("weekDate").value; ANORA.saveWeek( data, date, pendingRows ); alert("Chart week saved."); location.hash = "#/hot100"; }); document.getElementById("previewCsv").addEventListener("click", () => { const text = document.getElementById("csvText").value.trim(); if (!text) { csvPreview.innerHTML = `
Paste CSV data first.
`; saveCsvBtn.disabled = true; return; } try { const parsed = ANORA.parseCSV(text); if (!parsed.length) { throw new Error("No usable rows found."); } pendingCsvRows = parsed; csvPreview.innerHTML = `
CSV Preview

${fmt(parsed.length)} rows detected.

${parsed.slice(0, 50).map(r => ` `).join("")} 
Song	Artist	Album	Plays	Sales	Stability
${esc(r.song)}	${esc(r.artist)}	${esc(r.album)}	${fmt(r.plays)}	${fmt(r.sales)}	${fmt(r.stability)}
`; saveCsvBtn.disabled = false; } catch (error) { pendingCsvRows = null; saveCsvBtn.disabled = true; csvPreview.innerHTML = `
${esc(error.message)}
`; } }); saveCsvBtn.addEventListener("click", () => { if (!pendingCsvRows) return; const date = document.getElementById("weekDate").value; const processed = ANORA.processWeek( pendingCsvRows, date, data ); ANORA.saveWeek( data, date, processed ); alert("CSV chart week saved."); location.hash = "#/hot100"; }); document.getElementById("loadSample").addEventListener("click", () => { if (!confirm("Load the sample ANORA CHARTS data?")) return; ANORA.loadSample(); alert("Sample data loaded."); location.hash = "#/hot100"; }); document.getElementById("exportJson").addEventListener("click", () => { const current = ANORA.load(); const blob = new Blob( [JSON.stringify(current, null, 2)], { type: "application/json" } ); const url = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = url; a.download = "anora-charts-data.json"; a.click(); URL.revokeObjectURL(url); }); document.getElementById("resetData").addEventListener("click", () => { if (!confirm("Delete all ANORA CHARTS data from this browser?")) return; ANORA.reset(); location.hash = "#/hot100"; }); } function render() { const route = location.hash.replace(/^#\/?/, "") || "hot100"; if (route === "hot100") hot100(); else if (route === "beat") beat(); else if (route === "artists") artists(); else if (route === "albums") albums(); else if (route === "sales") sales(); else if (route === "history") history(); else if (route === "records") records(); else if (route === "update") update(); else hot100(); nav?.querySelectorAll("a").forEach(link => { link.addEventListener("click", () => { nav.classList.remove("open"); menuBtn?.setAttribute("aria-expanded", "false"); }); }); } menuBtn?.addEventListener("click", () => { const open = nav.classList.toggle("open"); menuBtn.setAttribute("aria-expanded", String(open)); }); window.addEventListener("hashchange", render); render();
