/* Lehe loogika. Hindu ja müügiseisu muudetakse failis andmed.js, mitte siin. */
(function () {
  "use strict";

  const FOTO_SUUR = "/assets/images/fotod/suur/";
  const FOTO_VAIKE = "/assets/images/fotod/vaike/";
  const km = 1 + (Number(SEADED.kmMaar) || 0) / 100;

  // ---- Andmete ettevalmistus: igale esemele unikaalne aadress ----
  const koik = [];
  const loendur = {};
  let muuNr = 0;
  Object.keys(KATEGOORIAD).forEach(function (kat) {
    KATEGOORIAD[kat].forEach(function (e) {
      let voti;
      if (e.nr) {
        loendur[e.nr] = (loendur[e.nr] || 0) + 1;
        voti = loendur[e.nr] === 1 ? String(e.nr) : e.nr + "-" + loendur[e.nr];
      } else {
        voti = "muu-" + (++muuNr);
      }
      e._voti = voti;
      e._kat = kat;
      e._myydud = e.myydud === true || Number(e.kogus) === 0;
      e._fotod = Array.isArray(e.fotod) ? e.fotod : [];
      koik.push(e);
    });
  });

  // ---- Abifunktsioonid ----
  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function raha(v) {
    const taisarv = Math.abs(v - Math.round(v)) < 0.005;
    return new Intl.NumberFormat("et-EE", {
      minimumFractionDigits: taisarv ? 0 : 2,
      maximumFractionDigits: taisarv ? 0 : 2
    }).format(v) + "\u00a0€";
  }
  function onHind(e) { return typeof e.hind === "number" && isFinite(e.hind); }
  function yhik(e) { return e.yhik || "tk"; }
  function hinnaHtml(e) {
    if (!onHind(e)) {
      return '<div class="hind-neto">' + esc(e.hind ? capital(e.hind) : "Hind kokkuleppel") + "</div>";
    }

   if (onKomplekt(e)) {
      const kokku = Math.round(e.hind * Number(e.kogus) * 100) / 100;
      return '<div class="hind-silt">' + esc(e.kogus) + " " + esc(yhik(e)) + " komplekt</div>" +
        '<div class="hind-neto">' + raha(kokku) + " <small>+ KM</small></div>" +
        '<div class="hind-km">' + raha(kokku * km) + " koos KM-ga</div>" +
        '<div class="hind-km">' + raha(e.hind) + " / " + esc(yhik(e)) + " + KM</div>";
    }
    
    const yh = yhik(e) === "tk" ? "" : " / " + esc(yhik(e));
    return '<div class="hind-neto">' + raha(e.hind) + yh + " <small>+ KM</small></div>" +
      '<div class="hind-km">' + raha(e.hind * km) + yh + " koos KM-ga</div>";
  }

  // Kategooriad SEADED.komplektina loendis müüakse ainult kogu kogusega korraga
  function onKomplekt(e) {
    return Array.isArray(SEADED.komplektina) && SEADED.komplektina.indexOf(e._kat) !== -1 && Number(e.kogus) > 1;
  }
  
  function capital(s) { s = String(s); return s.charAt(0).toUpperCase() + s.slice(1); }
  function alamrida(e) { return [e.tootja, e.mudel].filter(Boolean).join(", "); }
  function kogusTekst(e) {
    if (e._myydud) return '<span class="myydud-silt">Müüdud</span>';
    return "Saadaval " + esc(e.kogus) + " " + esc(yhik(e));
  }
  // Failinimest objektide vahemik, nt "Objekt_100-101_IMG_4881.jpg" -> "100–101"
  function fotoObjektid(fail) {
    const m = /^Objekt_(\d+)(?:-(\d+))?/.exec(fail);
    if (!m || !m[2]) return "";
    return m[1] + "–" + m[2];
  }

  // ---- Päis ja jalus ----
  document.getElementById("pealkiri").textContent = SEADED.pealkiri;
  document.getElementById("sissejuhatus").textContent = SEADED.sissejuhatus;
  const k = SEADED.kontakt || {};
  const kontaktOsad = [];
  if (k.email) kontaktOsad.push('<a href="mailto:' + esc(k.email) + '">' + esc(k.email) + "</a>");
  if (k.telefon) kontaktOsad.push('<a href="tel:' + esc(k.telefon.replace(/\s/g, "")) + '">' + esc(k.telefon) + "</a>");
  if (k.aadress) kontaktOsad.push("<span>" + esc(k.aadress) + "</span>");
  document.getElementById("kontakt").innerHTML = kontaktOsad.join("");
  if (SEADED.uuendatud) document.getElementById("uuendatud").textContent = "Nimekiri viimati uuendatud " + SEADED.uuendatud + ".";

  // ---- Nimekirja vaade ----
  const katKonteiner = document.getElementById("kategooriad");
  const katLingid = document.getElementById("kategooria-lingid");
  const otsing = document.getElementById("otsing");
  const peidaMyydud = document.getElementById("peida-myydud");

  function katId(kat) {
    return "kat-" + kat.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-");
  }

  function eseRida(e) {
    const f = e._fotod[0];
    const pilt = f
      ? '<img src="' + FOTO_VAIKE + encodeURI(f) + '" alt="" loading="lazy" width="208" height="208">'
      : '<div class="foto-puudub">Foto puudub</div>';
    const tempel = e._myydud ? '<span class="tempel">MÜÜDUD</span>' : "";
    const nr = e.nr ? "<span>Objekt " + esc(e.nr) + "</span>" : "";
    return '<li class="ese' + (e._myydud ? " myydud" : "") + '" data-voti="' + esc(e._voti) + '">' +
      '<a href="#/ese/' + encodeURIComponent(e._voti) + '">' +
      '<div class="pisipilt">' + pilt + tempel + "</div>" +
      '<div class="ese-tekst"><p class="ese-nimi">' + esc(e.nimi) + "</p>" +
      (alamrida(e) ? '<p class="ese-mudel">' + esc(alamrida(e)) + "</p>" : "") +
      '<p class="ese-meta">' + nr + "<span>" + kogusTekst(e) + "</span></p></div>" +
      '<div class="hind">' + hinnaHtml(e) + "</div>" +
      "</a></li>";
  }

  function joonistaNimekiri() {
    const q = otsing.value.trim().toLowerCase();
    const peida = peidaMyydud.checked;
    let html = "", lingid = "", kokku = 0;
    Object.keys(KATEGOORIAD).forEach(function (kat) {
      const nahtavad = KATEGOORIAD[kat].filter(function (e) {
        if (peida && e._myydud) return false;
        if (!q) return true;
        return [e.nimi, e.tootja, e.mudel, e.nr, e.kommentaar].join(" ").toLowerCase().indexOf(q) !== -1;
      });
      if (!nahtavad.length) return;
      kokku += nahtavad.length;
      const saadaval = nahtavad.filter(function (e) { return !e._myydud; }).length;
      const id = katId(kat);
      lingid += '<li><a href="#' + id + '">' + esc(kat) + "<small>" + saadaval + "</small></a></li>";
      html += '<section class="kategooria" id="' + id + '" aria-labelledby="' + id + '-p">' +
        '<h2 id="' + id + '-p">' + esc(kat) + "<small>" + saadaval + " müügis</small></h2>" +
        '<ul class="esemed">' + nahtavad.map(eseRida).join("") + "</ul></section>";
    });
    katKonteiner.innerHTML = html;
    katLingid.innerHTML = lingid;
    document.getElementById("tyhi").hidden = kokku > 0;
  }
  otsing.addEventListener("input", joonistaNimekiri);
  peidaMyydud.addEventListener("change", joonistaNimekiri);

  // Kategoorialingid kerivad ilma aadressi (#/ese/...) loogikat segamata
  katLingid.addEventListener("click", function (ev) {
    const a = ev.target.closest("a");
    if (!a) return;
    ev.preventDefault();
    const s = document.querySelector(a.getAttribute("href"));
    if (s) s.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
  });

  // ---- Detailvaade ----
  const nimekiriVaade = document.getElementById("nimekiri-vaade");
  const detailVaade = document.getElementById("detail-vaade");
  let kerimine = 0, tulinNimekirjast = false;
  let aktiivne = null, fotoNr = 0;

  function joonistaDetail(e) {
    const f = e._fotod;
    const andmed = [];
    if (e.nr) andmed.push(["Objekti number", esc(e.nr)]);
    andmed.push(["Kategooria", esc(e._kat)]);
    if (e.tootja) andmed.push(["Tootja", esc(e.tootja)]);
    if (e.mudel) andmed.push(["Mudel / mõõdud", esc(e.mudel)]);
    andmed.push(["Kogus", e._myydud ? '<span class="myydud-silt">Müüdud</span>' : esc(e.kogus) + " " + esc(yhik(e))]);
    if (e.kommentaar) andmed.push(["Märkus", esc(e.kommentaar)]);

    const lingid = (e.lingid || []).map(function (l) {
      const url = typeof l === "string" ? l : l.url;
      let silt = typeof l === "string" ? "" : l.silt;
      let domeen = "";
      try { domeen = new URL(url).hostname.replace(/^www\./, ""); } catch (err) { domeen = url; }
      silt = silt ? capital(silt) + ": spetsifikatsioon" : "Spetsifikatsioon";
      return '<li><a href="' + esc(url) + '" target="_blank" rel="noopener">' + esc(silt) + " (" + esc(domeen) + ")</a></li>";
    }).join("");

    const teema = "Objekt " + (e.nr || "") + " – " + e.nimi;
    const kysi = !e._myydud && k.email
      ? '<a class="kysi" href="mailto:' + esc(k.email) + "?subject=" + encodeURIComponent(teema) + '">Küsi selle eseme kohta</a>' +
        (k.telefon ? '<p class="kysi-telefon">Või helista: <a href="tel:' + esc(k.telefon.replace(/\s/g, "")) + '">' + esc(k.telefon) + "</a></p>" : "")
      : "";

    const galerii = f.length
      ? '<div class="galerii-suur">' +
          '<button type="button" class="ava" aria-label="Ava foto täissuuruses"><img id="suur-foto" src="" alt=""></button>' +
          (f.length > 1 ? '<button type="button" class="valgus-nool eelmine" aria-label="Eelmine foto">‹</button>' +
            '<button type="button" class="valgus-nool jargmine" aria-label="Järgmine foto">›</button>' : "") +
        "</div>" +
        '<p class="pildil" id="pildil"></p>' +
        (f.length > 1 ? '<ul class="galerii-pisi">' + f.map(function (x, i) {
          return '<li><button type="button" data-i="' + i + '" aria-label="Foto ' + (i + 1) + '"><img src="' + FOTO_VAIKE + encodeURI(x) + '" alt="" loading="lazy"></button></li>';
        }).join("") + "</ul>" : "")
      : '<div class="galerii-suur"><div class="foto-puudub">Selle eseme kohta foto puudub</div></div>';

    detailVaade.innerHTML =
      '<a class="tagasi" href="#">‹ Tagasi nimekirja</a>' +
      '<article class="detail' + (e._myydud ? " myydud" : "") + '">' +
        '<div class="galerii">' + galerii + "</div>" +
        '<div class="detail-info">' +
          (e.nr ? '<p class="objekt">Objekt ' + esc(e.nr) + "</p>" : "") +
          "<h1>" + esc(e.nimi) + "</h1>" +
          '<div class="detail-hind">' + (e._myydud ? '<p class="myydud-silt">See ese on müüdud</p>' : hinnaHtml(e)) + "</div>" +
          '<dl class="andmed">' + andmed.map(function (r) { return "<dt>" + r[0] + "</dt><dd>" + r[1] + "</dd>"; }).join("") + "</dl>" +
          (lingid ? '<ul class="lingid">' + lingid + "</ul>" : "") +
          kysi +
        "</div>" +
      "</article>";

    aktiivne = e;
    naitaFotot(0);

    const ava = detailVaade.querySelector(".ava");
    if (ava) ava.addEventListener("click", function () { avaValgus(); });
    detailVaade.querySelectorAll(".galerii-suur .eelmine").forEach(function (b) { b.addEventListener("click", function () { naitaFotot(fotoNr - 1); }); });
    detailVaade.querySelectorAll(".galerii-suur .jargmine").forEach(function (b) { b.addEventListener("click", function () { naitaFotot(fotoNr + 1); }); });
    detailVaade.querySelectorAll(".galerii-pisi button").forEach(function (b) {
      b.addEventListener("click", function () { naitaFotot(Number(b.dataset.i)); });
    });
    document.title = e.nimi + (e.nr ? " (objekt " + e.nr + ")" : "") + " – " + SEADED.pealkiri;
  }

  function naitaFotot(i) {
    if (!aktiivne || !aktiivne._fotod.length) return;
    const f = aktiivne._fotod;
    fotoNr = (i + f.length) % f.length;
    const img = document.getElementById("suur-foto");
    if (img) {
      img.src = FOTO_SUUR + encodeURI(f[fotoNr]);
      img.alt = aktiivne.nimi + ", foto " + (fotoNr + 1) + "/" + f.length;
    }
    const v = fotoObjektid(f[fotoNr]);
    const pildil = document.getElementById("pildil");
    if (pildil) pildil.textContent = (f.length > 1 ? "Foto " + (fotoNr + 1) + "/" + f.length + ". " : "") + (v ? "Fotol on objektid " + v + "." : "");
    detailVaade.querySelectorAll(".galerii-pisi button").forEach(function (b) {
      b.setAttribute("aria-current", Number(b.dataset.i) === fotoNr ? "true" : "false");
    });
    const val = document.getElementById("valgus");
    if (!val.hidden) uuendaValgus();
  }

  // ---- Täisekraan ----
  const valgus = document.getElementById("valgus");
  const valgusImg = valgus.querySelector("img");
  function uuendaValgus() {
    const f = aktiivne._fotod;
    valgusImg.src = FOTO_SUUR + encodeURI(f[fotoNr]);
    valgusImg.alt = aktiivne.nimi;
    valgus.querySelector(".valgus-loendur").textContent = f.length > 1 ? (fotoNr + 1) + " / " + f.length : "";
    valgus.querySelectorAll(".valgus-nool").forEach(function (b) { b.hidden = f.length < 2; });
  }
  function avaValgus() { valgus.hidden = false; uuendaValgus(); valgus.querySelector(".valgus-sulge").focus(); }
  function sulgeValgus() { valgus.hidden = true; const a = detailVaade.querySelector(".ava"); if (a) a.focus(); }
  valgus.querySelector(".valgus-sulge").addEventListener("click", sulgeValgus);
  valgus.querySelector(".eelmine").addEventListener("click", function () { naitaFotot(fotoNr - 1); });
  valgus.querySelector(".jargmine").addEventListener("click", function () { naitaFotot(fotoNr + 1); });
  valgus.addEventListener("click", function (ev) { if (ev.target === valgus) sulgeValgus(); });
  document.addEventListener("keydown", function (ev) {
    if (detailVaade.hidden) return;
    if (ev.key === "Escape" && !valgus.hidden) sulgeValgus();
    else if (ev.key === "ArrowLeft") naitaFotot(fotoNr - 1);
    else if (ev.key === "ArrowRight") naitaFotot(fotoNr + 1);
  });
  // Pühkimine telefonis
  let puudeX = null;
  valgus.addEventListener("touchstart", function (ev) { puudeX = ev.touches[0].clientX; }, { passive: true });
  valgus.addEventListener("touchend", function (ev) {
    if (puudeX === null) return;
    const dx = ev.changedTouches[0].clientX - puudeX;
    if (Math.abs(dx) > 50) naitaFotot(fotoNr + (dx < 0 ? 1 : -1));
    puudeX = null;
  });

  // ---- Marsruutimine (#/ese/100) ----
  function marsruut() {
    const m = /^#\/ese\/(.+)$/.exec(location.hash);
    const e = m && koik.find(function (x) { return x._voti === decodeURIComponent(m[1]); });
    if (e) {
      if (!nimekiriVaade.hidden) { kerimine = window.scrollY; tulinNimekirjast = true; }
      nimekiriVaade.hidden = true;
      detailVaade.hidden = false;
      joonistaDetail(e);
      window.scrollTo(0, document.querySelector(".pais").offsetHeight);
    } else {
      valgus.hidden = true;
      tulinNimekirjast = false;
      detailVaade.hidden = true;
      nimekiriVaade.hidden = false;
      document.title = SEADED.pealkiri;
      if (location.hash.indexOf("#/") === 0) history.replaceState(null, "", location.pathname + location.search);
      window.scrollTo(0, kerimine);
    }
  }
  detailVaade.addEventListener("click", function (ev) {
    if (ev.target.closest(".tagasi")) {
      ev.preventDefault();
      if (tulinNimekirjast) history.back();
      else location.hash = "";
    }
  });
  window.addEventListener("hashchange", marsruut);

  joonistaNimekiri();
  marsruut();
})();
