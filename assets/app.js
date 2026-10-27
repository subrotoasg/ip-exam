/* IT Passport (IP) Exam — প্রশ্নব্যাংক, উত্তর ও বাংলা ব্যাখ্যা
   ডেটা: ITPEC IP past exams (April 2010 – April 2026) */
(function () {
  "use strict";
  var D = null;
  var ST = {
    mode: "related", tab: "bank",
    q: "", topic: "", field: "", tier: "", exam: "",
    page: 0, per: 15, done: {}, quiz: null
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
  var tclass = function (t) { return "t-" + String(t).replace(/[^A-Za-z]/g, ""); };

  ST.mode = LS.get("mode", null) || "related";
  ST.done = LS.get("done", {});
  var th = LS.get("theme", null); if (th) document.documentElement.setAttribute("data-theme", th);

  fetch("data/bank.json").then(function (r) { return r.json(); }).then(function (d) { D = d; init(); })
    .catch(function () { $("#app").innerHTML = '<div class="empty">ডেটা লোড হয়নি। পেজটি রিফ্রেশ করুন।</div>'; });

  function init() {
    var s = D.stats;
    $("#stats").innerHTML = stat(s.q, "পুরনো প্রশ্ন (চিত্রসহ)") + stat(s.exams, "টি এক্সাম · ২০১০–২০২৬") +
      stat(s.repeat, "রিপিট হওয়া প্রশ্ন") + stat(s.explained, "বাংলা ব্যাখ্যা");
    Array.prototype.forEach.call(document.querySelectorAll(".choice"), function (c) {
      c.addEventListener("click", function () { setMode(c.dataset.mode); });
    });
    setMode(ST.mode, true);
    var tp = $("#f-topic");
    Object.keys(D.topicBn).sort(function (a, b) { return D.topicBn[a].localeCompare(D.topicBn[b], "bn"); }).forEach(function (k) {
      var o = el("option"); o.value = k;
      o.textContent = D.topicBn[k] + " (" + D.q.filter(function (q) { return q.t === k; }).length + ")";
      tp.appendChild(o);
    });
    var ex = $("#f-exam");
    D.exams.forEach(function (e) { var o = el("option"); o.value = e[2]; o.textContent = e[1]; ex.appendChild(o); });
    $("#f-q").addEventListener("input", function (e) { ST.q = e.target.value.trim().toLowerCase(); ST.page = 0; render(); });
    tp.addEventListener("change", function (e) { ST.topic = e.target.value; ST.page = 0; render(); });
    $("#f-field").addEventListener("change", function (e) { ST.field = e.target.value; ST.page = 0; render(); });
    $("#f-tier").addEventListener("change", function (e) { ST.tier = e.target.value; ST.page = 0; render(); });
    ex.addEventListener("change", function (e) { ST.exam = e.target.value; ST.page = 0; render(); });
    Array.prototype.forEach.call(document.querySelectorAll("nav.tabs button"), function (b) {
      b.addEventListener("click", function () { go(b.dataset.tab); });
    });
    $("#theme").addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme");
      var next = cur === "dark" ? "light" : "dark";
      document.documentElement.setAttribute("data-theme", next); LS.set("theme", next);
    });
    var h = location.hash.replace("#", ""); if (h) go(h, true);
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

  function groups() {
    var out = D.g.slice();
    if (ST.topic) out = out.filter(function (g) { return g.topic === ST.topic; });
    if (ST.field) out = out.filter(function (g) { return g.field === ST.field; });
    if (ST.tier === "4") out = out.filter(function (g) { return g.size >= 4; });
    else if (ST.tier === "3") out = out.filter(function (g) { return g.size === 3; });
    else if (ST.tier === "2") out = out.filter(function (g) { return g.size === 2; });
    else if (ST.tier === "1") out = out.filter(function (g) { return g.size === 1; });
    else if (ST.tier === "new") out = out.filter(function (g) { return g.latest >= 2024; });
    else if (ST.tier === "exp") out = out.filter(function (g) { return !!g.exp; });
    if (ST.exam && ST.tab === "exam") out = out.filter(function (g) { return g.ids.some(function (i) { return D.q[i].x === ST.exam; }); });
    if (ST.q) {
      var k = ST.q;
      out = out.filter(function (g) {
        return g.ids.some(function (i) {
          var q = D.q[i];
          return (q.s + " " + q.o.join(" ") + " " + q.e).toLowerCase().indexOf(k) >= 0;
        });
      });
    }
    return out;
  }

  function render() {
    if (!D) return;
    var app = $("#app"); app.innerHTML = "";
    if (ST.tab === "notes") return renderNotes(app);
    if (ST.tab === "quiz") return renderQuiz(app);
    if (ST.tab === "exam") return renderExam(app);
    renderBank(app);
  }

  /* ---------- question rendering ---------- */
  function stemHtml(q) {
    if (!q.s) return '<p class="small" style="color:var(--muted)">এই প্রশ্নটি ছবি/টেবিলভিত্তিক — নিচের মূল ছবিতে পড়ুন।</p>';
    var lines = q.s.split("\n"), out = "", buf = [], tbl = [];
    function flushP() { if (buf.length) { out += "<p>" + esc(buf.join(" ")) + "</p>"; buf = []; } }
    function flushT() { if (tbl.length) { out += "<pre>" + esc(tbl.join("\n")) + "</pre>"; tbl = []; } }
    lines.forEach(function (l) {
      if (/\S {3,}\S/.test(l)) { flushP(); tbl.push(l); }
      else { flushT(); if (l.trim()) buf.push(l.trim()); }
    });
    flushP(); flushT();
    return out;
  }
  function qBody(q) {
    var hasImg = q.im && q.im.length;
    var imgFirst = hasImg && (q.fig || q.only);
    var txt = '<div class="stem' + (imgFirst ? " hide" : "") + '">' + stemHtml(q) + "</div>";
    if (!hasImg) return txt;
    var img = imgHtml(q, imgFirst);
    var btn = '<button class="txtbtn" type="button" data-toggle="' + (imgFirst ? "text" : "img") + '">' +
      (imgFirst ? "📝 লেখা আকারে দেখুন (সার্চ/কপি করা যায়)" : "🖼️ মূল প্রশ্নপত্রের ছবি দেখুন") + "</button>";
    return (imgFirst ? img + btn + txt : txt + btn + img);
  }
  function wireBody(root) {
    Array.prototype.forEach.call(root.querySelectorAll(".txtbtn"), function (b) {
      b.addEventListener("click", function () {
        var holder = b.parentNode;
        var target = b.dataset.toggle === "text" ? holder.querySelector(".stem") : holder.querySelector("figure.qimg");
        if (target) target.classList.toggle("hide");
      });
    });
  }
  function imgHtml(q, open) {
    if (!q.im || !q.im.length) return "";
    var show = !!open;
    var imgs = q.im.map(function (f) {
      return '<img loading="lazy" alt="' + esc(q.e) + " Q" + q.n + ' মূল প্রশ্ন" src="img/' + q.x + "/" + f + '">';
    }).join("");
    return '<figure class="qimg' + (show ? "" : " hide") + '" data-img="1">' + imgs +
      '<figcaption>📄 মূল প্রশ্নপত্র থেকে — ' + esc(q.e) + ", Q" + q.n + " (চিত্র ও টেবিলসহ হুবহু)</figcaption></figure>";
  }
  function optsHtml(q, click) {
    if (!q.o[0] && !q.o[1]) return "";
    var h = '<ol class="opts' + (click ? " click" : "") + '">';
    for (var i = 0; i < 4; i++) h += '<li data-i="' + i + '" data-ok="' + (q.a === i ? 1 : 0) + '"><span class="k">' + LET[i] + '</span><span class="v">' + esc(q.o[i]) + "</span></li>";
    return h + "</ol>";
  }
  function pdfLink(q) {
    var p = D.pdf[q.x];
    return p ? '🔗 <a href="' + p + '" target="_blank" rel="noopener">পুরো প্রশ্নপত্র PDF — ' + esc(q.e) + "</a>" : "";
  }

  function cardFor(g, opts) {
    opts = opts || {};
    var q = D.q[g.rep];
    var c = el("div", "card " + tclass(g.topic) + (ST.done[q.id] ? " done" : ""));
    var hot = g.size >= 5 ? '<span class="chip star">🔥 ' + g.size + " বার এসেছে</span>"
      : g.size > 1 ? '<span class="chip hot">🔁 ' + g.size + " বার এসেছে</span>" : "";
    c.innerHTML =
      '<div class="meta"><span class="chip rank">#' + g.rank + "</span>" +
      '<span class="chip topic">' + esc(D.topicBn[g.topic] || g.topic) + "</span>" + hot +
      '<span class="chip">' + esc(q.e) + " · Q" + q.n + "</span>" +
      (g.exp ? '<span class="chip ok">✅ ব্যাখ্যা আছে</span>' : "") + "</div>" +
      '<span class="qlabel">প্রশ্ন</span>' + qBody(q) + optsHtml(q) +
      '<div class="btnrow"><button class="btn primary act-show">👁️ উত্তর ও ব্যাখ্যা</button>' +
      '<button class="btn act-done' + (ST.done[q.id] ? " good" : "") + '">' + (ST.done[q.id] ? "✓ শেখা হয়েছে" : "শেখা হয়েছে") + "</button></div>" +
      '<div class="answer hide"></div>';
    var ans = $(".answer", c), ol = $(".opts", c);
    wireBody(c);
    $(".act-show", c).addEventListener("click", function () {
      if (!ans.classList.contains("hide")) {
        ans.classList.add("hide"); if (ol) ol.classList.remove("revealed");
        this.textContent = "👁️ উত্তর ও ব্যাখ্যা"; return;
      }
      if (!ans.dataset.filled) { ans.innerHTML = answerHtml(g, q); ans.dataset.filled = "1"; }
      ans.classList.remove("hide"); if (ol) ol.classList.add("revealed");
      wireBody(ans);
      this.textContent = "🙈 লুকান";
    });
    $(".act-done", c).addEventListener("click", function () {
      if (ST.done[q.id]) delete ST.done[q.id]; else ST.done[q.id] = 1;
      LS.set("done", ST.done); render();
    });
    if (opts.openAnswer) $(".act-show", c).click();
    return c;
  }

  function answerHtml(g, q) {
    var h = '<div class="ansbar"><span class="pill">উত্তর: ' + LET[q.a] + '</span><span class="txt">' +
      (q.o[q.a] ? esc(q.o[q.a]) : "অপশনের লেখা ছবিতে দেখুন") + "</span></div>";
    if (g.exp) {
      h += '<div class="exp why"><h4>🎯 কেন এই উত্তর</h4><p>' + md(g.exp.why) + "</p></div>";
      if (g.exp.note) h += '<div class="exp note"><h4>🧠 যেটা মুখস্থ রাখলেই হবে</h4><p>' + md(g.exp.note) + "</p></div>";
      if (g.exp.more) h += '<div class="exp more"><h4>📚 আরও যে টপিক পড়বেন</h4><p>' + md(g.exp.more) + "</p></div>";
    } else {
      h += '<div class="exp why"><h4>🎯 সংক্ষেপে</h4><p>সঠিক অপশন <strong>' + LET[q.a] + "</strong>। টপিক: <strong>" +
        esc(D.topicBn[g.topic] || g.topic) + '</strong> — "কুইক নোট" ট্যাবে এই টপিকের সারসংক্ষেপ পড়ে নিন।</p></div>';
    }
    if (ST.mode === "related" && g.size > 1) {
      h += '<details class="rel"><summary>একই প্রশ্ন আগে যেভাবে এসেছিল (' + (g.size - 1) + " টি) — একসাথে পড়ুন</summary>";
      g.ids.forEach(function (i) {
        if (i === g.rep) return;
        var r = D.q[i];
        h += '<div class="relq"><div class="meta"><span class="chip">' + esc(r.e) + " · Q" + r.n + '</span><span class="chip ok">উত্তর: ' + LET[r.a] + "</span></div>" +
          qBody(r) +
          (r.o[0] ? optsHtml(r).replace('class="opts"', 'class="opts revealed"') : "") +
          '<div class="srcs">' + pdfLink(r) + "</div></div>";
      });
      h += "</details>";
    } else if (g.size > 1) {
      h += '<p class="small" style="color:var(--muted)">এই প্রশ্নটি এসেছে: <strong>' + esc(g.ids.map(function (i) { return D.q[i].e; }).join(", ")) + "</strong></p>";
    }
    h += '<div class="srcs">' + pdfLink(q) + "</div>";
    return h;
  }

  /* ---------- tabs ---------- */
  function renderBank(app) {
    var gs = groups();
    var doneN = gs.filter(function (g) { return ST.done[D.q[g.rep].id]; }).length;
    app.appendChild(el("div", "", '<div class="small" style="color:var(--muted);margin-bottom:2px">' +
      "<strong>" + gs.length + "</strong> টি প্রশ্নগুচ্ছ · শেখা হয়েছে <strong>" + doneN +
      "</strong> টি · উপরের প্রশ্নগুলো সবচেয়ে বেশিবার পরীক্ষায় এসেছে</div>" +
      '<div class="progress"><i style="width:' + (gs.length ? Math.round(doneN / gs.length * 100) : 0) + '%"></i></div>'));
    if (!gs.length) { app.appendChild(el("div", "empty", "এই ফিল্টারে কিছু পাওয়া যায়নি।")); return; }
    var end = Math.min(gs.length, (ST.page + 1) * ST.per);
    for (var i = 0; i < end; i++) app.appendChild(cardFor(gs[i]));
    if (end < gs.length) {
      var more = el("button", "btn primary", "আরও " + Math.min(ST.per, gs.length - end) + " টি প্রশ্ন দেখুন ↓");
      more.style.width = "100%";
      more.addEventListener("click", function () { ST.page++; render(); });
      app.appendChild(more);
    }
  }

  function renderNotes(app) {
    app.appendChild(el("div", "", '<p class="small" style="color:var(--muted)">অল্প সময়ে পড়ার জন্য সারসংক্ষেপ। প্রথম তিনটি নোট পরীক্ষার আগের রাতে অবশ্যই পড়ুন।</p>'));
    D.notes.forEach(function (n) {
      app.appendChild(el("div", "note", "<h3>" + esc(n.title) + '</h3><div class="body">' + md(n.body) + "</div>"));
    });
  }

  function renderExam(app) {
    var exam = ST.exam || D.exams[0][2];
    var qs = [];
    D.q.forEach(function (q, i) { if (q.x === exam) qs.push(i); });
    qs.sort(function (a, b) { return D.q[a].n - D.q[b].n; });
    var label = (D.exams.filter(function (e) { return e[2] === exam; })[0] || [0, exam])[1];
    app.appendChild(el("div", "", '<p class="small" style="color:var(--muted)">উপরের “এক্সাম” মেনু দিয়ে বছর বদলান। <strong>' +
      esc(label) + "</strong> — " + qs.length + " টি প্রশ্ন, উত্তরসহ।</p>"));
    var end = Math.min(qs.length, (ST.page + 1) * 20);
    for (var i = 0; i < end; i++) {
      var qi = qs[i], q = D.q[qi], g = D.g[q.g] || { size: 1, ids: [qi], exp: null };
      app.appendChild(cardFor({ rep: qi, ids: g.ids, size: g.size, rank: q.n, topic: q.t, field: q.f, exp: g.exp }));
    }
    if (end < qs.length) {
      var more = el("button", "btn primary", "আরও ২০টি প্রশ্ন ↓"); more.style.width = "100%";
      more.addEventListener("click", function () { ST.page++; render(); });
      app.appendChild(more);
    }
  }

  function renderQuiz(app) {
    var head = el("div", "quizhead");
    head.innerHTML = '<button class="btn primary act-new">🎲 নতুন কুইজ (২০টি)</button>' +
      '<span class="small" style="color:var(--muted)">ফিল্টার অনুযায়ী প্রশ্ন আসবে। অপশনে ক্লিক করলেই উত্তর ও ব্যাখ্যা।</span>' +
      '<span class="spacer"></span><span class="score">স্কোর: 0 / 0</span>';
    app.appendChild(head);
    var box = el("div"); app.appendChild(box);
    $(".act-new", head).addEventListener("click", function () { ST.quiz = newQuiz(); paint(); });
    if (!ST.quiz) ST.quiz = newQuiz();
    paint();

    function newQuiz() {
      var gs = groups().filter(function (g) { return D.q[g.rep].o[0]; }).slice(0, 500);
      var pick = [], seen = {}, guard = 0;
      while (pick.length < Math.min(20, gs.length) && guard++ < 500) {
        var g = gs[Math.floor(Math.random() * gs.length)];
        if (seen[g.rank]) continue; seen[g.rank] = 1; pick.push(g);
      }
      return { items: pick, answers: {} };
    }
    function tally() {
      var Q = ST.quiz, r = 0, a = 0;
      Object.keys(Q.answers).forEach(function (k) { a++; if (Q.answers[k].ok) r++; });
      $(".score", head).textContent = "স্কোর: " + r + " / " + a + (a ? " (" + Math.round(r / a * 100) + "%)" : "");
    }
    function paint() {
      box.innerHTML = ""; var Q = ST.quiz; tally();
      if (!Q.items.length) { box.appendChild(el("div", "empty", "এই ফিল্টারে কুইজের প্রশ্ন নেই।")); return; }
      Q.items.forEach(function (g, idx) {
        var q = D.q[g.rep], c = el("div", "card " + tclass(g.topic));
        c.innerHTML = '<div class="meta"><span class="chip rank">' + (idx + 1) + " / " + Q.items.length + '</span>' +
          '<span class="chip topic">' + esc(D.topicBn[g.topic] || g.topic) + "</span>" +
          (g.size > 1 ? '<span class="chip hot">🔁 ' + g.size + " বার এসেছে</span>" : "") + "</div>" +
          qBody(q) + optsHtml(q, true) +
          '<div class="answer hide"></div>';
        var ol = $(".opts", c), ans = $(".answer", c);
        var prev = Q.answers[g.rank];
        if (prev) show(prev.pick);
        ol.addEventListener("click", function (e) {
          var li = e.target.closest("li"); if (!li || Q.answers[g.rank]) return;
          var i = +li.dataset.i;
          Q.answers[g.rank] = { pick: i, ok: i === q.a }; show(i); tally();
        });
        function show(pick) {
          ol.classList.add("revealed"); ol.classList.remove("click");
          if (pick !== q.a) { var bad = ol.querySelector('li[data-i="' + pick + '"]'); if (bad) bad.dataset.pick = "bad"; }
          ans.innerHTML = answerHtml(g, q); ans.classList.remove("hide"); wireBody(ans);
        }
        wireBody(c);
        box.appendChild(c);
      });
    }
  }
})();
