/* IT Passport (IP) Exam — প্রশ্নব্যাংক, উত্তর ও ব্যাখ্যা
   ডেটা: ITPEC IP past exams (April 2010 – April 2026) */
(function () {
  "use strict";
  var D = null;                 // bank.json
  var ST = {
    mode: "related",            // 'important' | 'related'
    tab: "bank",
    q: "", topic: "", field: "", tier: "", onlyExp: false, exam: "",
    page: 0, per: 20,
    done: {}, quiz: null
  };
  var LS = {
    get: function (k, d) { try { var v = localStorage.getItem("ip_" + k); return v === null ? d : JSON.parse(v); } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem("ip_" + k, JSON.stringify(v)); } catch (e) { } }
  };
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var el = function (t, c, h) { var n = document.createElement(t); if (c) n.className = c; if (h != null) n.innerHTML = h; return n; };
  var esc = function (s) { return String(s == null ? "" : s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
  var md = function (s) { return esc(s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/`([^`]+)`/g, "<code>$1</code>"); };
  var LET = ["a", "b", "c", "d"];

  /* ---------- boot ---------- */
  ST.mode = LS.get("mode", null) || "related";
  ST.done = LS.get("done", {});
  var savedTheme = LS.get("theme", null);
  if (savedTheme) document.documentElement.setAttribute("data-theme", savedTheme);

  fetch("data/bank.json").then(function (r) { return r.json(); }).then(function (d) {
    D = d; init();
  }).catch(function () {
    $("#app").innerHTML = '<div class="empty">ডেটা লোড হয়নি। পেজটি রিফ্রেশ করুন।</div>';
  });

  function init() {
    // stats
    var s = D.stats;
    $("#stats").innerHTML =
      stat(s.q, "পুরনো প্রশ্ন") + stat(s.exams, "টি এক্সাম (২০১০–২০২৬)") +
      stat(s.repeat, "রিপিট হওয়া প্রশ্নগুচ্ছ") + stat(s.explained, "বিস্তারিত ব্যাখ্যা");
    // setup choice
    Array.prototype.forEach.call(document.querySelectorAll(".choice"), function (c) {
      c.addEventListener("click", function () { setMode(c.dataset.mode); });
    });
    setMode(ST.mode, true);
    // filters
    var tp = $("#f-topic");
    Object.keys(D.topicBn).sort().forEach(function (k) {
      var o = el("option"); o.value = k; o.textContent = D.topicBn[k] + " (" + D.q.filter(function (q) { return q.t === k; }).length + ")"; tp.appendChild(o);
    });
    var ex = $("#f-exam");
    D.exams.forEach(function (e) { var o = el("option"); o.value = e[2]; o.textContent = e[1]; ex.appendChild(o); });
    $("#f-q").addEventListener("input", function (e) { ST.q = e.target.value.trim().toLowerCase(); ST.page = 0; render(); });
    tp.addEventListener("change", function (e) { ST.topic = e.target.value; ST.page = 0; render(); });
    $("#f-field").addEventListener("change", function (e) { ST.field = e.target.value; ST.page = 0; render(); });
    $("#f-tier").addEventListener("change", function (e) { ST.tier = e.target.value; ST.page = 0; render(); });
    ex.addEventListener("change", function (e) { ST.exam = e.target.value; ST.page = 0; render(); });
    // tabs
    Array.prototype.forEach.call(document.querySelectorAll("nav.tabs button"), function (b) {
      b.addEventListener("click", function () { go(b.dataset.tab); });
    });
    $("#theme").addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme");
      var next = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next); LS.set("theme", next);
    });
    if (location.hash.replace("#", "")) go(location.hash.replace("#", ""), true);
    render();
  }
  function stat(n, l) { return '<div class="stat"><b>' + n + "</b><span>" + l + "</span></div>"; }

  function setMode(m, quiet) {
    ST.mode = m; LS.set("mode", m);
    Array.prototype.forEach.call(document.querySelectorAll(".choice"), function (c) {
      c.dataset.on = c.dataset.mode === m ? "1" : "0";
      var r = c.querySelector("input"); if (r) r.checked = c.dataset.mode === m;
    });
    if (!quiet) render();
  }
  function go(tab, quiet) {
    ST.tab = tab; ST.page = 0;
    Array.prototype.forEach.call(document.querySelectorAll("nav.tabs button"), function (b) {
      b.setAttribute("aria-selected", b.dataset.tab === tab ? "true" : "false");
    });
    $("#filters").classList.toggle("hide", tab === "notes");
    $("#f-exam").style.display = tab === "exam" ? "block" : "none";
    if (!quiet) history.replaceState(null, "", "#" + tab);
    render();
  }

  /* ---------- selection ---------- */
  function groups() {
    var out = D.g.slice();
    if (ST.topic) out = out.filter(function (g) { return g.topic === ST.topic; });
    if (ST.field) out = out.filter(function (g) { return g.field === ST.field; });
    if (ST.tier === "4") out = out.filter(function (g) { return g.size >= 4; });
    else if (ST.tier === "3") out = out.filter(function (g) { return g.size === 3; });
    else if (ST.tier === "2") out = out.filter(function (g) { return g.size === 2; });
    else if (ST.tier === "1") out = out.filter(function (g) { return g.size === 1; });
    else if (ST.tier === "new") out = out.filter(function (g) { return g.latest >= 2024; });
    if (ST.onlyExp) out = out.filter(function (g) { return !!g.exp; });
    if (ST.exam) out = out.filter(function (g) { return g.ids.some(function (i) { return D.q[i].x === ST.exam; }); });
    if (ST.q) {
      var k = ST.q;
      out = out.filter(function (g) {
        return g.ids.some(function (i) {
          var q = D.q[i];
          return (q.s + " " + q.o.join(" ")).toLowerCase().indexOf(k) >= 0;
        });
      });
    }
    return out;
  }

  /* ---------- render ---------- */
  function render() {
    if (!D) return;
    var app = $("#app"); app.innerHTML = "";
    if (ST.tab === "notes") return renderNotes(app);
    if (ST.tab === "quiz") return renderQuiz(app);
    if (ST.tab === "exam") return renderExam(app);
    renderBank(app);
  }

  function renderBank(app) {
    var gs = groups();
    var doneN = gs.filter(function (g) { return ST.done[D.q[g.rep].id]; }).length;
    var head = el("div");
    head.innerHTML = '<div class="small" style="color:var(--muted);margin-bottom:4px">' +
      gs.length + " টি প্রশ্নগুচ্ছ · শেখা হয়েছে " + doneN + " টি · গুরুত্বের ক্রমে সাজানো (উপরের গুলো সবচেয়ে বেশি রিপিট হয়েছে)</div>" +
      '<div class="progress"><i style="width:' + (gs.length ? Math.round(doneN / gs.length * 100) : 0) + '%"></i></div>';
    app.appendChild(head);
    if (!gs.length) { app.appendChild(el("div", "empty", "এই ফিল্টারে কিছু পাওয়া যায়নি।")); return; }
    var end = Math.min(gs.length, (ST.page + 1) * ST.per);
    for (var i = 0; i < end; i++) app.appendChild(cardFor(gs[i]));
    if (end < gs.length) {
      var more = el("button", "btn primary", "আরও " + Math.min(ST.per, gs.length - end) + " টি দেখুন");
      more.style.width = "100%"; more.addEventListener("click", function () { ST.page++; render(); window.scrollBy(0, -200); });
      app.appendChild(more);
    }
  }

  function stemHtml(q) {
    var tbl = /\S {2,}\S/.test(q.s) || q.s.split("\n").length > 3;
    return '<div class="stem' + (tbl ? " table" : "") + '">' + esc(q.s) + "</div>";
  }
  function optsHtml(q) {
    var h = '<ol class="opts">';
    for (var i = 0; i < 4; i++) h += '<li data-ok="' + (q.a === i ? 1 : 0) + '"><span class="k">' + LET[i] + ")</span><span>" + esc(q.o[i]) + "</span></li>";
    return h + "</ol>";
  }
  function pdfLink(q) {
    var p = D.pdf[q.x];
    return p ? '<a href="' + p + '" target="_blank" rel="noopener">মূল প্রশ্নপত্র (PDF) — ' + esc(q.e) + ", Q" + q.n + "</a>" : "";
  }

  function cardFor(g) {
    var q = D.q[g.rep];
    var c = el("div", "card" + (ST.done[q.id] ? " done" : ""));
    var yrs = g.ids.map(function (i) { return D.q[i].e; });
    var m = '<div class="meta"><span class="chip rank">#' + g.rank + "</span>" +
      '<span class="chip">' + esc(D.topicBn[g.topic] || g.topic) + "</span>" +
      '<span class="chip">' + esc((D.fieldBn[g.field] || g.field)) + " · Q" + q.n + "</span>" +
      (g.size > 1 ? '<span class="chip hot">' + g.size + " বার এসেছে</span>" : '<span class="chip">১ বার</span>') +
      '<span class="chip">সর্বশেষ: ' + esc(q.e) + "</span>" +
      (g.exp ? '<span class="chip hot">ব্যাখ্যা আছে</span>' : "") + "</div>";
    c.innerHTML = m + stemHtml(q) + optsHtml(q) +
      '<div class="btnrow"><button class="btn primary act-show">উত্তর ও ব্যাখ্যা দেখুন</button>' +
      '<button class="btn act-done">' + (ST.done[q.id] ? "✓ শেখা হয়েছে" : "শেখা হয়েছে চিহ্নিত করুন") + "</button></div>" +
      '<div class="answer hide"></div>';
    var ans = $(".answer", c);
    $(".act-show", c).addEventListener("click", function () {
      var open = !ans.classList.contains("hide");
      if (open) { ans.classList.add("hide"); $(".opts", c).parentNode.querySelector(".opts").classList.remove("revealed"); this.textContent = "উত্তর ও ব্যাখ্যা দেখুন"; return; }
      if (!ans.dataset.filled) { ans.innerHTML = answerHtml(g, q); ans.dataset.filled = "1"; }
      ans.classList.remove("hide"); $(".opts", c).classList.add("revealed");
      this.textContent = "লুকান";
    });
    $(".act-done", c).addEventListener("click", function () {
      if (ST.done[q.id]) { delete ST.done[q.id]; } else { ST.done[q.id] = 1; }
      LS.set("done", ST.done); render();
    });
    return c;
  }

  function answerHtml(g, q) {
    var h = '<span class="tag">সঠিক উত্তর: ' + LET[q.a] + ") " + esc(q.o[q.a]) + "</span>";
    if (g.exp) {
      h += "<h4>কেন এই উত্তর (ব্যাখ্যা)</h4><p>" + md(g.exp.why) + "</p>";
      if (g.exp.note) h += "<h4>যা মনে রাখতে হবে</h4><p>" + md(g.exp.note) + "</p>";
      if (g.exp.more) h += "<h4>আরও যে টপিক পড়বেন</h4><p>" + md(g.exp.more) + "</p>";
    } else {
      h += "<h4>সংক্ষেপে</h4><p>অপশন " + LET[q.a] + " ই সঠিক। এই প্রশ্নের টপিক <strong>" +
        esc(D.topicBn[g.topic] || g.topic) + "</strong> — কুইক নোট ট্যাবে এই টপিকের সারসংক্ষেপ দেখুন।</p>";
    }
    if (ST.mode === "related" && g.size > 1) {
      h += '<details class="rel"><summary>একই প্রশ্ন আগে যেভাবে এসেছিল (' + (g.size - 1) + " টি) — একসাথে পড়ুন</summary>";
      g.ids.forEach(function (i) {
        if (i === g.rep) return;
        var r = D.q[i];
        h += '<div class="relq"><div class="meta"><span class="chip">' + esc(r.e) + " · Q" + r.n + "</span>" +
          '<span class="chip">উত্তর: ' + LET[r.a] + ")</span></div>" + stemHtml(r) +
          '<ol class="opts revealed">';
        for (var k = 0; k < 4; k++) h += '<li data-ok="' + (r.a === k ? 1 : 0) + '"><span class="k">' + LET[k] + ")</span><span>" + esc(r.o[k]) + "</span></li>";
        h += "</ol><div class='srcs'>" + pdfLink(r) + "</div></div>";
      });
      h += "</details>";
    } else if (g.size > 1) {
      h += '<p class="small" style="color:var(--muted)">এই প্রশ্নটি এসেছে: ' + esc(g.ids.map(function (i) { return D.q[i].e; }).join(", ")) + "</p>";
    }
    h += '<div class="srcs">' + pdfLink(q) + "</div>";
    return h;
  }

  /* ---------- notes ---------- */
  function renderNotes(app) {
    app.appendChild(el("div", "small", '<p style="color:var(--muted)">অল্প সময়ে পড়ার জন্য সারসংক্ষেপ। প্রথম তিনটি নোট পরীক্ষার আগের রাতে অবশ্যই পড়ুন।</p>'));
    D.notes.forEach(function (n) {
      var d = el("div", "note");
      d.innerHTML = "<h3>" + esc(n.title) + '</h3><div class="body">' + md(n.body).replace(/\n/g, "\n") + "</div>";
      app.appendChild(d);
    });
  }

  /* ---------- browse by exam ---------- */
  function renderExam(app) {
    var exam = ST.exam || D.exams[0][2];
    var qs = D.q.filter(function (q) { return q.x === exam; }).sort(function (a, b) { return a.n - b.n; });
    var label = (D.exams.filter(function (e) { return e[2] === exam; })[0] || [0, exam])[1];
    app.appendChild(el("div", "small", '<p style="color:var(--muted)">উপরের "এক্সাম" ফিল্টার দিয়ে বছর বদলান। <strong>' + esc(label) + "</strong> — " + qs.length + " টি প্রশ্ন (উত্তরসহ)।</p>"));
    qs.forEach(function (q) {
      var g = D.g[q.g] || { size: 1, rank: "-", topic: q.t, field: q.f, ids: [] };
      var c = el("div", "card");
      c.innerHTML = '<div class="meta"><span class="chip rank">Q' + q.n + '</span><span class="chip">' + esc(D.topicBn[q.t] || q.t) + "</span>" +
        (g.size > 1 ? '<span class="chip hot">' + g.size + " বার এসেছে</span>" : "") + "</div>" +
        stemHtml(q) + optsHtml(q) + '<div class="btnrow"><button class="btn primary act">উত্তর দেখুন</button></div><div class="answer hide"></div>';
      var ans = $(".answer", c);
      $(".act", c).addEventListener("click", function () {
        if (!ans.dataset.filled) { ans.innerHTML = answerHtml(g, q); ans.dataset.filled = "1"; }
        ans.classList.toggle("hide"); $(".opts", c).classList.toggle("revealed");
        this.textContent = ans.classList.contains("hide") ? "উত্তর দেখুন" : "লুকান";
      });
      app.appendChild(c);
    });
  }

  /* ---------- quiz ---------- */
  function renderQuiz(app) {
    var head = el("div", "quizhead");
    head.innerHTML = '<button class="btn primary act-new">নতুন কুইজ (২০টি প্রশ্ন)</button>' +
      '<span class="small" style="color:var(--muted)">বর্তমান ফিল্টার অনুযায়ী প্রশ্ন আসবে। উত্তর দিলেই ব্যাখ্যা দেখা যাবে।</span>' +
      '<span class="spacer"></span><span class="score"></span>';
    app.appendChild(head);
    var box = el("div"); app.appendChild(box);
    $(".act-new", head).addEventListener("click", function () { ST.quiz = newQuiz(); paint(); });
    if (!ST.quiz) ST.quiz = newQuiz();
    paint();

    function newQuiz() {
      var gs = groups().slice(0, 400);
      var pick = [], seen = {};
      while (pick.length < Math.min(20, gs.length)) {
        var g = gs[Math.floor(Math.random() * gs.length)];
        if (seen[g.rank]) continue; seen[g.rank] = 1; pick.push(g);
      }
      return { items: pick, answers: {}, n: 0 };
    }
    function paint() {
      box.innerHTML = "";
      var Q = ST.quiz, right = 0, answered = 0;
      Object.keys(Q.answers).forEach(function (k) { answered++; if (Q.answers[k].ok) right++; });
      $(".score", head).textContent = "স্কোর: " + right + " / " + answered + (answered ? " (" + Math.round(right / answered * 100) + "%)" : "");
      Q.items.forEach(function (g, idx) {
        var q = D.q[g.rep], c = el("div", "card");
        c.innerHTML = '<div class="meta"><span class="chip rank">' + (idx + 1) + " / " + Q.items.length + '</span><span class="chip">' +
          esc(D.topicBn[g.topic] || g.topic) + "</span>" + (g.size > 1 ? '<span class="chip hot">' + g.size + " বার এসেছে</span>" : "") + "</div>" +
          stemHtml(q) + '<ol class="opts click">' + [0, 1, 2, 3].map(function (i) {
            return '<li data-i="' + i + '" data-ok="' + (q.a === i ? 1 : 0) + '"><span class="k">' + LET[i] + ')</span><span>' + esc(q.o[i]) + "</span></li>";
          }).join("") + '</ol><div class="answer hide"></div>';
        var ol = $(".opts", c), ans = $(".answer", c);
        var prev = Q.answers[g.rank];
        if (prev) show(prev.pick);
        ol.addEventListener("click", function (e) {
          var li = e.target.closest("li"); if (!li || Q.answers[g.rank]) return;
          var i = +li.dataset.i;
          Q.answers[g.rank] = { pick: i, ok: i === q.a };
          show(i); paint2();
        });
        function show(pick) {
          ol.classList.add("revealed"); ol.classList.remove("click");
          if (pick !== q.a) { var bad = ol.querySelector('li[data-i="' + pick + '"]'); if (bad) bad.dataset.pick = "bad"; }
          ans.innerHTML = answerHtml(g, q); ans.classList.remove("hide");
        }
        function paint2() {
          var r = 0, a = 0; Object.keys(Q.answers).forEach(function (k) { a++; if (Q.answers[k].ok) r++; });
          $(".score", head).textContent = "স্কোর: " + r + " / " + a + " (" + Math.round(r / a * 100) + "%)";
        }
        box.appendChild(c);
      });
    }
  }
})();
