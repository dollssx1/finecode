/*
 * finecode-check.js — 파인코드 스터디 공통 스크립트
 *
 * index.html 과 later.html 이 함께 쓴다. 내용은 finecode-data.js 의 window.FINECODE 에서 읽는다.
 * 다른 과목(vue.html + finecode-vue-data.js 등)도 같은 모양의 데이터를 주면 그대로 쓸 수 있다.
 *   데이터의 key   과목 구분 (마지막으로 본 회차 저장 키에 붙는다). 회차 id 는 과목끼리 겹치지 않게 한다.
 *   데이터의 lang  기본 코드 색칠 언어: 'java'(기본), 'vue', 'plain'
 *
 * 하는 일
 *   1. 데이터로 화면을 그린다.
 *        data-view="all"   전체 목록 (회차 탭으로 10개씩)
 *        data-view="later" "나중에 공부"로 체크한 항목만
 *   2. 항목마다 "나중에 공부" 체크 버튼을 붙인다.
 *   3. 체크 상태를 저장하고, 다음에 열 때 그대로 불러온다.
 *        - 항상: 브라우저 localStorage (파일을 직접 열어도 동작)
 *        - 게시된 페이지에서 가능하면: 내 계정 저장소(db)에도 동기화
 *
 * 쓰는 법
 *   <div class="wrap" id="finecode" data-view="all" data-later-url="later.html"></div>
 *   <script src="finecode-data.js"></script>
 *   <script src="finecode-check.js"></script>
 *
 * 저장 형식
 *   localStorage["finecode:<회차 id>"] = '["l1","l3"]'   체크한 항목 id 목록
 */
(function () {
  'use strict';

  var T = {
    brand: '파인코드 스터디',
    later: '나중에 공부',
    tabsLabel: '회차',
    session: function (s) { return s.no + '회차'; },
    heading: function (s) { return s.no + '회차: ' + s.name + ' ' + s.lessons.length + '개'; },
    countAll: function (n) { return n ? '이 회차에서 나중에 공부 ' + n + '개' : '다시 볼 항목은 오른쪽 "나중에 공부" 버튼으로 표시하세요'; },
    countLater: function (n) { return '모두 ' + n + '개'; },
    laterLead: '전체 목록에서 "나중에 공부"로 체크한 항목만 모았습니다. 공부를 마친 항목은 체크를 풀면 다음에 열 때 이 목록에서 빠집니다.',
    emptyTitle: '아직 체크한 항목이 없습니다',
    emptyBody: '전체 목록에서 다시 보고 싶은 항목의 "나중에 공부" 버튼을 누르면 여기에 모입니다.',
    reset: '이 회차 체크 해제',
    resetConfirm: '한 번 더 누르면 해제',
    upcoming: '다음 회차 예고',
    bad: '✕ 나쁨',
    good: '✓ 좋음',
    account: '계정에 저장됨',
    local: '이 브라우저에 저장됨',
    none: '저장할 수 없음: 창을 닫으면 사라집니다'
  };

  function start() {
    var root = document.getElementById('finecode');
    var DATA = window.FINECODE;
    if (!root || !DATA || !DATA.sessions || !DATA.sessions.length) return;

    document.documentElement.lang = 'ko';
    var view = root.getAttribute('data-view') === 'later' ? 'later' : 'all';
    var listUrl = root.getAttribute('data-list-url') || 'index.html';
    var laterUrl = root.getAttribute('data-later-url') || 'later.html';
    var sessions = DATA.sessions;
    var LAST = 'finecode:last' + (DATA.key ? ':' + DATA.key : '');   // 마지막으로 본 회차 (과목마다 따로)

    // ================= 저장 =================
    function readLocal(key) {
      try { return localStorage.getItem(key); } catch (e) { return null; }
    }
    function writeLocal(key, value) {
      try {
        if (value === null) localStorage.removeItem(key); else localStorage.setItem(key, value);
        return true;
      } catch (e) { return false; }
    }
    function fromIds(st, ids) {
      var on = {};
      if (Array.isArray(ids)) st.ids.forEach(function (id) { if (ids.indexOf(id) !== -1) on[id] = true; });
      return on;
    }
    function toIds(st) {
      return st.ids.filter(function (id) { return st.on[id]; });
    }
    function loadLocal(st) {
      try { st.on = fromIds(st, JSON.parse(readLocal(st.key) || '[]')); } catch (e) { st.on = {}; }
    }

    var S = {};                                // 회차 id → 체크 상태
    sessions.forEach(function (s) {
      var key = 'finecode:' + s.id;
      var st = {
        key: key,
        flag: key + ':unsynced',               // 계정 저장소에 아직 못 올린 변경이 있음
        ids: s.lessons.map(function (l) { return l.id; }),
        on: {},
        early: {},                             // 계정 저장소 연결 전에 누른 항목
        doc: null, writing: false, again: false
      };
      loadLocal(st);
      st.unsyncedAtLoad = readLocal(st.flag) === '1';
      S[s.id] = st;
    });

    var localOk = true;
    var remoteOk = false;
    var connected = false;

    function push(sid) {
      var st = S[sid];
      if (!st.doc) return;
      if (st.writing) { st.again = true; return; }       // 한 문서에 한 번에 한 쓰기
      st.writing = true;
      st.doc.set({ later: toIds(st) }).then(function () {
        remoteOk = true;
        if (!st.again) writeLocal(st.flag, null);
      }, function (err) {
        remoteOk = false;
        var code = err && err.code;
        if (code === 'invalid_argument' || code === 'revoked' || code === 'not_granted') st.doc = null;
      }).then(function () {
        st.writing = false;
        showWhere();
        if (st.again) { st.again = false; push(sid); }
      });
    }

    function save(sid) {
      var st = S[sid];
      localOk = writeLocal(st.key, JSON.stringify(toIds(st)));
      writeLocal(st.flag, '1');
      refresh();
      push(sid);
    }

    function toggle(sid, lid) {
      var st = S[sid];
      if (!st || st.ids.indexOf(lid) === -1) return;
      if (st.on[lid]) delete st.on[lid]; else st.on[lid] = true;
      if (!connected) st.early[lid] = !!st.on[lid];
      save(sid);
    }

    function clearSession(sid) {
      var st = S[sid];
      st.on = {};
      if (!connected) st.ids.forEach(function (id) { st.early[id] = false; });
      save(sid);
    }

    function withTimeout(promise, ms) {
      return new Promise(function (resolve, reject) {
        var t = setTimeout(function () { reject(new Error('timeout')); }, ms);
        promise.then(function (v) { clearTimeout(t); resolve(v); }, function (e) { clearTimeout(t); reject(e); });
      });
    }

    // 게시된 페이지에서만: 계정 전용 저장소와 맞춘다.
    function connect() {
      var claude = window.claude;
      if (!claude || typeof claude.use !== 'function') return;
      Promise.all([claude.use('db'), claude.use('user')]).then(function (ns) {
        var db = ns[0], user = ns[1];
        if (!db || !user) return;
        return user.id().then(function (uid) {
          if (!uid) return;
          var col = db.collection('data/users/' + uid);
          return withTimeout(col.get(), 10000).then(function (snap) {
            var remote = {};
            snap.docs.forEach(function (d) { remote[d.id] = d.data() || {}; });
            connected = true;
            remoteOk = true;
            var changedHere = false;
            sessions.forEach(function (s) {
              var st = S[s.id];
              st.doc = col.doc(s.id);
              var data = remote[s.id];
              if (data && !st.unsyncedAtLoad) {
                // 계정에 저장된 값이 기준. 연결 전에 누른 것만 그 위에 다시 적용.
                var before = toIds(st).join();
                st.on = fromIds(st, data.later);
                var touched = Object.keys(st.early);
                touched.forEach(function (id) { if (st.early[id]) st.on[id] = true; else delete st.on[id]; });
                localOk = writeLocal(st.key, JSON.stringify(toIds(st)));
                if (toIds(st).join() !== before) changedHere = true;
                if (touched.length) push(s.id);
              } else if (st.unsyncedAtLoad || toIds(st).length) {
                push(s.id);                    // 이 브라우저의 값을 계정으로 올림
              }
            });
            if (changedHere && view === 'later') { remember(); renderLater(); } else refresh();
          });
        });
      }).catch(function () { /* 연결 실패: 브라우저 저장만 사용 */ });
    }

    // ================= 화면 =================
    function pad(n) { return (n < 10 ? '0' : '') + n; }

    // ----- 코드 색칠 -----
    // 데이터에는 순수 코드만 있다. 주석, 문자열, 키워드/애너테이션(, 태그 이름)을 찾아 span 으로 감싼다.
    // 언어는 데이터 전체의 lang (없으면 'java') 을 따르고, 항목이나 칸마다 lang 으로 바꿀 수 있다.
    //   'java'   자바
    //   'vue'    자바스크립트, 타입스크립트, Vue SFC (= 'js', 'ts'). 템플릿 리터럴과 <태그> 도 칠한다
    //   'plain'  설정 파일, 명령어, SQL 등. 주석(//, #, SQL의 --, /* */, <!-- -->)과 문자열만 칠한다
    var JAVA_KEYWORDS = ('abstract assert boolean break byte case catch char class continue default do double else enum ' +
      'extends final finally float for if implements import instanceof int interface long native new null true false ' +
      'package private protected public return short static super switch synchronized this throw throws transient try ' +
      'void volatile while var record sealed permits yield').split(' ');
    var JS_KEYWORDS = ('async await break case catch class const continue debugger default delete do else enum export ' +
      'extends false finally for from function if implements import in instanceof interface let new null of private ' +
      'protected public return satisfies static super switch this throw true try typeof undefined var void while yield').split(' ');

    // 한 토큰은 한 묶음에만 맞는다. 1 주석, 2 문자열, 3 애너테이션/키워드, 4 태그 이름(html 일 때만)
    function tokenizer(keywords, html) {
      return new RegExp(
        '(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/' + (html ? '|<!--[\\s\\S]*?-->' : '') + ')' +
        '|("""[\\s\\S]*?"""|"(?:\\\\.|[^"\\\\\\n])*"|\'(?:\\\\.|[^\'\\\\\\n])*\'' + (html ? '|`(?:\\\\.|[^`\\\\])*`' : '') + ')' +
        '|(@[A-Za-z_]\\w*|\\b(?:' + keywords.join('|') + ')\\b)' +
        (html ? '|(<\\/?[A-Za-z][\\w.-]*)' : ''),
        'g');
    }
    var PLAIN_TOKEN = /((?:^|[ \t])(?:\/\/|#|--[ \t])[^\n]*|\/\*[\s\S]*?\*\/|<!--[\s\S]*?-->)|("(?:\\.|[^"\\\n])*"|'(?:\\.|[^'\\\n])*')/gm;

    function esc(text) {
      return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    function painter(re) {
      return function (code) {
        var out = '', last = 0, m;
        re.lastIndex = 0;
        while ((m = re.exec(code))) {
          out += esc(code.slice(last, m.index));
          out += '<span class="' + (m[1] ? 'c' : m[2] ? 's' : m[3] ? 'k' : 't') + '">' + esc(m[0]) + '</span>';
          last = m.index + m[0].length;
        }
        return out + esc(code.slice(last));
      };
    }
    var PAINT = {
      java: painter(tokenizer(JAVA_KEYWORDS, false)),
      vue: painter(tokenizer(JS_KEYWORDS, true)),
      plain: painter(PLAIN_TOKEN)
    };
    PAINT.js = PAINT.ts = PAINT.vue;

    function tidy(code) {                      // 앞뒤 빈 줄 제거, \${ 는 ${ 로, \` 는 ` 로 되돌림
      return String(code).replace(/^\s*\n/, '').replace(/\s+$/, '').replace(/\\\$\{/g, '${').replace(/\\`/g, '`');
    }
    // lang 은 'plain' 처럼 항목 전체에 주거나, { good: 'plain' } 처럼 칸마다 줄 수 있다.
    function langOf(l, kind) {
      if (!l.lang) return '';
      return typeof l.lang === 'string' ? l.lang : (l.lang[kind] || '');
    }

    function panesOf(l) {
      var panes = [];
      // badLabel, goodLabel 을 주면 칸 제목을 바꿀 수 있다 (예: 흔한 오해 / 실제 동작).
      if (l.bad != null) panes.push({ kind: 'bad', label: l.badLabel || T.bad, code: l.bad, lang: langOf(l, 'bad') });
      if (l.good != null) panes.push({ kind: 'good', label: l.goodLabel || T.good, code: l.good, lang: langOf(l, 'good') });
      if (l.single) panes.push({ kind: 'single', label: l.single.label || '', code: l.single.code, lang: langOf(l, 'single') });
      return panes;
    }
    function paneHtml(p) {
      var paint = PAINT[p.lang] || PAINT[DATA.lang] || PAINT.java;
      return '<div class="pane ' + p.kind + '"><div class="pane-label">' + p.label + '</div><pre>' +
        paint(tidy(p.code)) + '</pre></div>';
    }

    function cardHtml(s, l, index, withSession) {
      var dom = s.id + '-' + l.id;
      return '<section class="lesson" id="' + dom + '" data-sid="' + s.id + '" data-lid="' + l.id + '">' +
        '<div class="lesson-head">' +
          '<span class="num">' + (withSession ? T.session(s) + ' · ' : '') + pad(index + 1) + '</span>' +
          '<h2>' + l.title + '</h2>' +
          (l.ver ? '<span class="ver">' + l.ver + '</span>' : '') +
          '<button type="button" class="fc-check" id="fc-check-' + dom + '" aria-pressed="false">' +
            '<span class="fc-box" aria-hidden="true">✓</span>' + T.later + '</button>' +
        '</div>' +
        '<p class="why">' + l.why + '</p>' +
        '<div class="compare">' + panesOf(l).map(paneHtml).join('') + '</div>' +
        (l.note ? '<p class="note">' + l.note + '</p>' : '') +
      '</section>';
    }

    // 회차 10개(항목 100개)를 한 묶음으로 본다. 묶음이 둘 이상이면 위쪽에 묶음 줄이 생긴다.
    var BATCH = 10;
    function batchOf(s) { return Math.floor((s.no - 1) / BATCH); }
    var batches = [];
    (function () {
      var seen = 0, byIndex = {};
      sessions.forEach(function (s) {
        var b = batchOf(s);
        if (!byIndex[b]) { byIndex[b] = { index: b, first: s, from: seen + 1, to: seen }; batches.push(byIndex[b]); }
        seen += s.lessons.length;
        byIndex[b].to = seen;
      });
    })();

    function tabsHtml(activeSession) {
      var prefix = view === 'all' ? '' : listUrl;
      var activeBatch = activeSession ? batchOf(activeSession) : -1;
      var top = '';
      if (batches.length > 1) {
        top += batches.map(function (b) {
          var on = b.index === activeBatch;
          return '<a class="batch' + (on ? ' on' : '') + '" href="' + prefix + '#' + b.first.id + '" data-batch="' + b.index + '">' +
            b.from + '~' + b.to + '<span class="tab-count" hidden></span></a>';
        }).join('');
      }
      top += '<a class="tab later' + (view === 'later' ? ' on' : '') + '"' + (view === 'later' ? ' aria-current="page"' : '') +
        ' href="' + laterUrl + '" data-tab="later">' + T.later + '<span class="tab-count" hidden></span></a>';

      // 회차 탭 : 전체 목록에서는 현재 묶음의 회차만, 나중에 공부에서는 묶음이 하나일 때만 보여 준다.
      var shown = sessions.filter(function (s) {
        return activeSession ? batchOf(s) === activeBatch : batches.length === 1;
      });
      var tabs = shown.map(function (s) {
        var on = s === activeSession;
        return '<a class="tab' + (on ? ' on' : '') + '"' + (on ? ' aria-current="page"' : '') +
          ' href="' + prefix + '#' + s.id + '" data-tab="' + s.id + '" title="' + T.session(s) + '"><b>' + pad(s.no) + '</b> ' + s.name +
          '<span class="tab-count" hidden></span></a>';
      }).join('');

      return '<nav class="tabs" aria-label="' + T.tabsLabel + '">' +
        '<div class="tabs-top">' + top + '</div>' +
        (tabs ? '<div class="tabs-sessions">' + tabs + '</div>' : '') +
      '</nav>';
    }

    // 좁은 화면에서 회차 탭은 옆으로 넘긴다. 현재 탭이 보이도록 가로 위치만 맞춘다.
    function revealActiveTab() {
      var box = root.querySelector('.tabs-sessions');
      var tab = box && box.querySelector('.tab.on');
      if (tab) box.scrollLeft += tab.getBoundingClientRect().left - box.getBoundingClientRect().left - 16;
    }

    function statusHtml(withReset) {
      return '<div class="fc-status"><span class="fc-count"></span><span class="fc-where"></span>' +
        (withReset ? '<button type="button" class="fc-reset" id="fc-reset" hidden>' + T.reset + '</button>' : '') +
      '</div>';
    }

    // ----- 전체 목록 -----
    var cur = sessions[0];

    function renderAll() {
      var s = cur;
      var html = tabsHtml(s) +
        '<header>' +
          '<div class="eyebrow">' + (DATA.subject ? DATA.subject + ' · ' : '') + T.brand + '</div>' +
          '<h1>' + T.heading(s) + '</h1>' +
          '<p class="lead">' + s.lead + '</p>' +
          '<nav class="toc">' + s.lessons.map(function (l, i) {
            return '<a href="#' + s.id + '-' + l.id + '" data-chip="' + l.id + '"><b>' + pad(i + 1) + '</b> ' + (l.short || l.title) + '</a>';
          }).join('') + '</nav>' +
          statusHtml(true) +
        '</header>' +
        s.lessons.map(function (l, i) { return cardHtml(s, l, i, false); }).join('');
      if (DATA.upcoming && s === sessions[sessions.length - 1]) {
        html += '<div class="next"><h3>' + T.upcoming + ' · ' + DATA.upcoming.name + '</h3><ul>' +
          DATA.upcoming.items.map(function (it) { return '<li>' + it + '</li>'; }).join('') + '</ul></div>';
      }
      root.innerHTML = html;
      document.title = (DATA.subject ? DATA.subject + ' ' : '') + T.brand + ' · ' + T.session(s);
      refresh();
      revealActiveTab();
    }

    function parseHash() {
      var h = '';
      try { h = decodeURIComponent((location.hash || '').slice(1)); } catch (e) { h = ''; }
      if (!h) return null;
      for (var i = 0; i < sessions.length; i++) {
        var s = sessions[i];
        if (h === s.id) return { s: s, lid: null };
        if (h.indexOf(s.id + '-') === 0) {
          var lid = h.slice(s.id.length + 1);
          if (S[s.id].ids.indexOf(lid) !== -1) return { s: s, lid: lid };
        }
      }
      return null;
    }

    function goHash(first) {
      var target = parseHash();
      if (!target) return false;
      if (target.s !== cur || first) {
        cur = target.s;
        writeLocal(LAST, cur.id);
        renderAll();
      }
      if (target.lid) {
        var el = document.getElementById(target.s.id + '-' + target.lid);
        if (el) el.scrollIntoView();
      }
      return true;
    }

    // ----- 나중에 공부 -----
    // 이 화면을 연 동안 보여 줄 항목. 체크를 풀어도 바로 사라지지 않게 따로 기억한다.
    var shown = {};
    function remember() {
      sessions.forEach(function (s) {
        var list = shown[s.id] || [];
        toIds(S[s.id]).forEach(function (id) { if (list.indexOf(id) === -1) list.push(id); });
        shown[s.id] = list;
      });
    }

    function renderLater() {
      var body = '';
      sessions.forEach(function (s) {
        var ids = shown[s.id] || [];
        if (!ids.length) return;
        body += '<h2 class="group"><a href="' + listUrl + '#' + s.id + '">' + T.session(s) + ' · ' + s.name + '</a></h2>';
        s.lessons.forEach(function (l, i) { if (ids.indexOf(l.id) !== -1) body += cardHtml(s, l, i, true); });
      });
      if (!body) body = '<div class="empty"><strong>' + T.emptyTitle + '</strong>' + T.emptyBody + '</div>';
      root.innerHTML = tabsHtml(null) +
        '<header>' +
          '<div class="eyebrow">' + (DATA.subject ? DATA.subject + ' · ' : '') + T.brand + '</div>' +
          '<h1>' + T.later + '</h1>' +
          '<p class="lead">' + T.laterLead + '</p>' +
          statusHtml(false) +
        '</header>' + body;
      refresh();
    }

    // ----- 체크 상태만 다시 칠하기 (화면을 새로 그리지 않는다) -----
    function setCount(el, n) {
      if (!el) return;
      el.textContent = String(n);
      el.hidden = n === 0;
    }

    function showWhere() {
      var el = root.querySelector('.fc-where');
      if (el) el.textContent = remoteOk ? T.account : (localOk ? T.local : T.none);
    }

    function refresh() {
      var total = 0;
      sessions.forEach(function (s) {
        var n = toIds(S[s.id]).length;
        total += n;
        setCount(root.querySelector('.tab[data-tab="' + s.id + '"] .tab-count'), n);
      });
      setCount(root.querySelector('.tab[data-tab="later"] .tab-count'), total);
      batches.forEach(function (b) {
        var n = 0;
        sessions.forEach(function (s) { if (batchOf(s) === b.index) n += toIds(S[s.id]).length; });
        setCount(root.querySelector('.batch[data-batch="' + b.index + '"] .tab-count'), n);
      });

      Array.prototype.forEach.call(root.querySelectorAll('.lesson[data-sid]'), function (el) {
        var st = S[el.getAttribute('data-sid')];
        var on = !!(st && st.on[el.getAttribute('data-lid')]);
        el.classList.toggle('fc-on', on);
        var btn = el.querySelector('.fc-check');
        if (btn) btn.setAttribute('aria-pressed', on ? 'true' : 'false');
      });

      var count = root.querySelector('.fc-count');
      if (view === 'all') {
        var st = S[cur.id];
        var n = toIds(st).length;
        Array.prototype.forEach.call(root.querySelectorAll('nav.toc a[data-chip]'), function (a) {
          a.classList.toggle('fc-on', !!st.on[a.getAttribute('data-chip')]);
        });
        if (count) count.textContent = T.countAll(n);
        var reset = root.querySelector('.fc-reset');
        if (reset && !reset.classList.contains('fc-armed')) reset.hidden = n === 0;
      } else if (count) {
        count.textContent = T.countLater(total);
      }
      showWhere();
    }

    // ================= 동작 =================
    var armTimer = null;
    function disarm(btn) {
      clearTimeout(armTimer);
      btn.classList.remove('fc-armed');
      btn.textContent = T.reset;
    }

    root.addEventListener('click', function (e) {
      var target = e.target;
      if (!target || !target.closest) return;
      var check = target.closest('.fc-check');
      if (check) {
        var card = check.closest('.lesson');
        if (card) toggle(card.getAttribute('data-sid'), card.getAttribute('data-lid'));
        return;
      }
      var reset = target.closest('.fc-reset');
      if (reset) {
        if (!reset.classList.contains('fc-armed')) {
          reset.classList.add('fc-armed');
          reset.textContent = T.resetConfirm;
          armTimer = setTimeout(function () { disarm(reset); refresh(); }, 4000);
          return;
        }
        disarm(reset);
        clearSession(cur.id);
      }
    });

    // 다른 탭(예: 전체 목록과 나중에 공부를 같이 열어 둔 경우)에서 바뀐 체크를 따라간다.
    window.addEventListener('storage', function (e) {
      var hit = false;
      sessions.forEach(function (s) {
        var st = S[s.id];
        if (e.key === st.key) { loadLocal(st); hit = true; }
      });
      if (!hit) return;
      if (view === 'later') { remember(); renderLater(); } else refresh();
    });

    if (view === 'all') {
      if (!goHash(true)) {
        var last = readLocal(LAST);
        sessions.forEach(function (s) { if (s.id === last) cur = s; });
        renderAll();
      }
      window.addEventListener('hashchange', function () { goHash(false); });
    } else {
      remember();
      renderLater();
    }
    connect();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
