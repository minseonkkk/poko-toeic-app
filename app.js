'use strict';

/* ============================================================
   유틸
   ============================================================ */
const CHUNK_SIZE = 15;
const rnd = (n) => { const x = Math.sin(n * 12.9898) * 43758.5453; return x - Math.floor(x); };
const shuffle = (arr, seed) => arr.map((v, i) => [rnd(seed + i * 7), v]).sort((a, b) => a[0] - b[0]).map((p) => p[1]);

// 예문에서 대상 단어만 잘라낸다 (굴절형 포함)
const splitHi = (sent, word) => {
  const s = sent || '', w = (word || '').trim();
  if (!s || !w) return { pre: s, hit: '', post: '' };
  const base = w.replace(/[^A-Za-z\s'-]/g, '');
  const stem = base.length > 5 ? base.slice(0, base.length - 2) : base;
  const re = new RegExp('\\b' + stem.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + "[A-Za-z''-]*", 'i');
  const m = s.match(re);
  if (!m) return { pre: s, hit: '', post: '' };
  return { pre: s.slice(0, m.index), hit: m[0], post: s.slice(m.index + m[0].length) };
};

const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// 실제 구글/카카오/이메일 로그인을 처리하는 공용 백엔드(auth_server, Render 배포).
// 서버가 아직 안 떠 있거나 응답이 없어도 앱 자체는 게스트/로컬 로그인으로 계속 동작해야 하므로,
// 이 서버를 쓰는 모든 요청은 실패해도 조용히 무시하고 넘어간다.
const AUTH_BASE = 'https://poko-auth-server.onrender.com';
// 구글/카카오 리디렉션 설정(콘솔 쪽 redirect URI 등)이 마무리될 때까지 소셜 로그인 버튼은 숨긴다.
// 게스트로 시작하기 + 이메일 가입은 이 플래그와 무관하게 항상 동작한다. 준비되면 true로만 바꾸면 됨.
const SHOW_OAUTH = false;

function poko(mood, px) {
  return pokoHTML(mood, px);
}

// 랜딩 인트로용 캐릭터 모션 클립 (Higgsfield 생성) — 외부 접속이 막힌 샌드박스에서는
// <video onerror>가 정적 이미지로 자동 대체한다.
const CLIPS = [
  { label: '오늘도 반가워요', hint: '매일 5분, 시험에 잘 나오는 순서로', src: 'https://d8j0ntlcm91z4.cloudfront.net/user_3CDQYaE0WVY3MST2ktDWtEYwngN/hf_20260814_144811_c16470a8-ecbc-42ba-8490-e9dee72688b8.mp4' },
  { label: '단어집 펼치는 중', hint: '파트별·주제별로 정리된 핵심 표현', src: 'https://d8j0ntlcm91z4.cloudfront.net/user_3CDQYaE0WVY3MST2ktDWtEYwngN/hf_20260814_144811_03f2d6a5-1849-4ee2-a48a-3efb0d1ef7ec.mp4' },
  { label: '한 세트 끝냈을 때', hint: '레슨 하나 끝낼 때마다 스트릭이 쌓여요', src: 'https://d8j0ntlcm91z4.cloudfront.net/user_3CDQYaE0WVY3MST2ktDWtEYwngN/hf_20260814_144821_2d68c762-4940-4a96-9490-1513f574083a.mp4' },
];

/* ============================================================
   최소 DCLogic 베이스 — 원본 Claude Design .dc.html 컴포넌트가
   기대하는 setState/componentDidMount/componentDidUpdate 계약만
   구현한다 (실제 프레임워크는 없음, 이 앱은 순수 vanilla JS).
   ============================================================ */
class DCLogic {
  setState(patch, cb) {
    const next = typeof patch === 'function' ? patch(this.state) : patch;
    this.state = Object.assign({}, this.state, next);
    if (this.componentDidUpdate) this.componentDidUpdate();
    scheduleRender();
    if (cb) cb();
  }
}

/* ============================================================
   앱 로직 (원본 dc.html의 data-dc-script를 그대로 이식)
   ============================================================ */
class Component extends DCLogic {
  state = {
    view: 'splash', tab: 'learn', W: [], SEC: [], P5: [], PT: [], TOPICS: [], TOF: {},
    goal: 850, hearts: 5, streak: 3, done: {}, run: null, res: null,
    brIdx: 0, brFlip: false, brDx: 0, brDrag: false, brMark: {}, brSel: null,
    wordMode: 'both', reveal: {}, miss: {}, saved: {}, wordFilter: 'all', wordPart: 'all', wordTopic: 'all', started: {},
    user: null, guestMode: false, authMode: 'signup', authStep: 'choice', name: '', email: '', pw: '', authError: '', authBusy: false,
  };

  brDeck() {
    const S = this.state, sel = S.brSel;
    if (!sel) return [];
    if (sel.kind === 'miss') return Object.keys(S.miss).sort((a, b) => S.miss[b] - S.miss[a]).map((i) => S.W[i]).filter(Boolean);
    if (sel.kind === 'saved') return Object.keys(S.saved).map((i) => S.W[i]).filter(Boolean);
    if (sel.kind === 'topic') return S.W.filter((w) => (S.TOF[w.i] || 'etc') === sel.id && (!sel.secs || sel.secs.includes(w.sec)));
    return S.W.filter((w) => ['01', '02', '03', '04', '05'].includes(w.sec));
  }

  brOpen(sel) {
    this.setState({ brSel: sel, brIdx: 0, brFlip: false, brDx: 0, brDrag: false });
  }

  addMiss(wi) {
    if (wi == null) return;
    this.setState({ miss: { ...this.state.miss, [wi]: (this.state.miss[wi] || 0) + 1 } });
  }

  brAdvance(dir) {
    Sound.swipe();
    const deck = this.brDeck();
    const w = deck[this.state.brIdx];
    const mark = w ? { ...this.state.brMark, [w.i]: dir > 0 ? 'yes' : 'no' } : this.state.brMark;
    const miss = w && dir < 0 ? { ...this.state.miss, [w.i]: Math.max(this.state.miss[w.i] || 0, 1) } : this.state.miss;
    this.setState({ brDx: dir * 460, brDrag: false, brMark: mark, miss });
    setTimeout(() => this.setState({
      brIdx: (this.state.brIdx + 1) % Math.max(deck.length, 1), brDx: 0, brFlip: false,
    }), 180);
  }

  componentDidMount() {
    this.setState({ W: ENTRIES, SEC: SECTIONS, P5: P5, PT: POINTS, TOPICS: TOPICS, TOF: TOPIC_OF });
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem('poko:session') || 'null'); } catch (e) { saved = null; }
    setTimeout(() => {
      if (this.state.view !== 'splash') return;
      // 회원 세션과 게스트 세션을 각각 다른 localStorage 키에 저장해 서로 덮어쓰지 않게 한다.
      let guestSaved = null;
      try { guestSaved = JSON.parse(localStorage.getItem('poko:guest-session') || 'null'); } catch (e) { guestSaved = null; }
      if (saved && saved.user) this.setState({ ...saved, guestMode: false, view: 'path', tab: 'learn', run: null, res: null });
      else if (guestSaved) this.setState({ ...guestSaved, user: null, guestMode: true, view: 'path', tab: 'learn', run: null, res: null });
      else this.setState({ view: 'intro' });
    }, 2400);
    this.checkRealSession();
  }

  // 실제 구글/카카오/이메일 로그인 백엔드(auth_server)에 세션이 남아있는지 확인한다.
  // OAuth 리다이렉트로 막 돌아왔을 때와 새로고침할 때마다 호출되며, 서버가 응답하지 않아도
  // (아직 배포 전이거나 Render가 잠들어 있어도) 게스트/로컬 로그인은 그대로 동작해야 하므로 조용히 무시한다.
  checkRealSession() {
    fetch(`${AUTH_BASE}/api/auth/me`, { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data && data.user && data.user.email) this.login({ email: data.user.email, name: data.user.name || data.user.email });
      })
      .catch(() => {});
  }

  // 구글/카카오 로그인 시작 — 서버로 전체 페이지 이동시켜 OAuth 동의 화면을 띄운다.
  // redirect 쿼리로 지금 이 앱의 주소를 알려줘야 로그인 완료 후 정확히 여기로 돌아온다.
  startOAuth(provider) {
    const redirect = window.location.origin + window.location.pathname;
    window.location.href = `${AUTH_BASE}/api/auth/${provider}?redirect=${encodeURIComponent(redirect)}`;
  }

  async submitAuthReal() {
    const S = this.state;
    const signup = S.authMode === 'signup';
    this.setState({ authBusy: true, authError: '' });
    try {
      const res = await fetch(`${AUTH_BASE}/api/auth/${signup ? 'signup' : 'login'}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(signup ? { email: S.email, password: S.pw, name: S.name } : { email: S.email, password: S.pw }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { this.setState({ authBusy: false, authError: data.error || '오류가 발생했어요. 다시 시도해주세요.' }); return; }
      this.login({ email: data.user.email, name: data.user.name });
    } catch (e) {
      this.setState({ authBusy: false, authError: '로그인 서버에 연결할 수 없어요. 잠시 후 다시 시도해주세요.' });
    }
  }

  persist(extra) {
    const S = { ...this.state, ...(extra || {}) };
    if (!S.user && !S.guestMode) return;
    const keep = { user: S.user, goal: S.goal, streak: S.streak, done: S.done, started: S.started, saved: S.saved, miss: S.miss, brMark: S.brMark };
    const key = S.user ? 'poko:session' : 'poko:guest-session';
    try { localStorage.setItem(key, JSON.stringify(keep)); } catch (e) {}
  }

  componentDidUpdate() { this.persist(); }

  login(user) {
    // 게스트로 쌓아둔 진행 기록은 그대로 계정에 이어붙인다 (초기화하지 않음).
    try { localStorage.removeItem('poko:guest-session'); } catch (e) {}
    this.setState({ user, guestMode: false, view: 'path', tab: 'learn', authStep: 'choice', pw: '', authBusy: false, authError: '' }, () => this.persist());
  }

  continueAsGuest() {
    this.setState({ guestMode: true, view: 'path', tab: 'learn' }, () => this.persist());
  }

  logout() {
    fetch(`${AUTH_BASE}/api/auth/logout`, { method: 'POST', credentials: 'include' }).catch(() => {});
    try { localStorage.removeItem('poko:session'); localStorage.removeItem('poko:guest-session'); } catch (e) {}
    this.setState({ user: null, guestMode: false, view: 'intro', authStep: 'choice', done: {}, started: {}, saved: {}, miss: {}, brMark: {}, name: '', email: '', pw: '' });
  }

  // 시험에서 가장 자주 나오는 파트 기준 분류 (고득점 세트는 별도 티어)
  groupDefs() {
    return [
      { id: 'g56', part: 'PART 5 · 6', label: '빈칸 채우기 핵심 단어', hint: '채용·계약·재무·물류… 업무 주제별로 묶은 최빈출 단어', tier: 'core', secs: ['02', '03', '04', '05'] },
      { id: 'gco', part: 'PART 5 · 6', label: '콜로케이션 · 짝꿍 표현', hint: '주제별 짝꿍 표현 — 전치사까지 덩어리로 외우기', tier: 'core', secs: ['06', '07', '08', '09', '10', '11'] },
      { id: 'ggr', part: 'PART 5', label: '문법 포인트 실전', hint: '빈출 포인트 8개 · 실전형 문항', tier: 'core', kind: 'gram' },
      { id: 'gp1', part: 'PART 1', label: '사진 묘사 고난도 어휘', hint: '사람 동작 · 사물 배치 · 장소 배경으로 나눈 고난도 어휘', tier: 'adv', secs: ['01'] },
      { id: 'gadv', part: '950+ ADVANCED', label: '고득점 함정 세트', hint: '강조 부사·복합명사·헷갈리는 유사어 — 900점대에서 갈리는 구간', tier: 'adv', secs: ['12', '13', '14'] },
    ];
  }

  makeQuestions(node) {
    const { W, P5 } = this.state;
    if (node.kind === 'gram') {
      const pool = P5.filter((q) => q.point === node.pt).slice(0, 7);
      return pool.map((q) => ({
        type: 'gram', kicker: 'PART 5 · 빈칸 채우기', prompt: q.stem,
        choices: q.choices, answer: q.answer, note: q.explain, sentence: q.sentence,
      }));
    }
    if (node.idxs) return this.wordQuestions(node.idxs.map((i) => W[i]).filter(Boolean));
    const sec = W.filter((w) => w.sec === node.sec);
    return this.wordQuestions(sec.slice(node.from, node.from + CHUNK_SIZE));
  }

  wordQuestions(items) {
    const { W } = this.state;
    return items.map((w, i) => {
      const sec = W.filter((x) => x.sec === w.sec);
      // 뜻이 겹치는 단어는 오답 보기에서 제외 (지원자/응시자류 혼동 방지)
      const toks = (s) => s.split(/[,·\s()]+/).map((x) => x.trim()).filter((x) => x.length > 1);
      const mine = toks(w.meaning);
      const clean = sec.filter((x) => x.i !== w.i && !toks(x.meaning).some((t) => mine.some((m) => t.includes(m) || m.includes(t))));
      const others = shuffle(clean.length >= 3 ? clean : sec.filter((x) => x.i !== w.i), w.i * 3).slice(0, 3);
      const dir = i % 2 === 0;
      const opts = shuffle([w, ...others], w.i + 5);
      return {
        type: dir ? 'meaning' : 'term',
        kicker: dir ? '알맞은 뜻을 고르세요' : '알맞은 단어를 고르세요',
        prompt: dir ? w.term : w.meaning,
        choices: opts.map((o) => (dir ? o.meaning : o.term)),
        answer: opts.findIndex((o) => o.i === w.i),
        note: w.tr, sentence: w.ex, wi: w.i,
      };
    });
  }

  start(node) {
    if (node.kind === 'chest') { this.setState({ done: { ...this.state.done, [node.id]: true } }); return; }
    const qs = this.makeQuestions(node);
    if (!qs.length) return;
    const hearts = this.state.hearts > 0 ? this.state.hearts : 5;
    this.setState({ hearts, view: 'lesson', started: { ...this.state.started, [node.id]: true }, run: { node, qs, pos: 0, picked: null, checked: false, right: 0, hearts, combo: 0 } });
  }

  check() {
    const r = this.state.run;
    if (r.picked === null || r.checked) return;
    const q = r.qs[r.pos];
    const ok = r.picked === q.answer;
    if (ok) Sound.correct(); else Sound.wrong();
    if (!ok) this.addMiss(q.wi);
    const finished = r.pos + 1 >= r.qs.length;
    if (finished) this.setState({ done: { ...this.state.done, [r.node.id]: true } });
    this.setState({ run: { ...r, checked: true, ok, right: r.right + (ok ? 1 : 0), combo: ok ? r.combo + 1 : 0, hearts: ok ? r.hearts : r.hearts - 1 } });
  }

  next() {
    const r = this.state.run;
    const last = r.pos + 1 >= r.qs.length || r.hearts <= 0;
    if (last) {
      if (r.hearts > 0) Sound.done();
      this.setState({
        view: 'res', hearts: Math.max(r.hearts, 0),
        done: r.hearts > 0 ? { ...this.state.done, [r.node.id]: true } : this.state.done,
        res: { node: r.node, right: r.right, total: r.qs.length, failed: r.hearts <= 0 },
      });
      return;
    }
    this.setState({ run: { ...r, pos: r.pos + 1, picked: null, checked: false } });
  }

  renderVals() {
    const S = this.state, v = {};
    v.isSplash = S.view === 'splash';
    v.isIntro = S.view === 'intro';
    v.isAsk = S.view === 'ask';
    v.isPath = S.view === 'path' && S.tab === 'learn';
    v.isWords = S.view === 'path' && S.tab === 'words';
    v.isBrowse = S.view === 'path' && S.tab === 'browse' && !!S.brSel;
    v.isMe = S.view === 'path' && S.tab === 'me';

    // 훑어보기 (스와이프 카드)
    {
      const deck = this.brDeck(), w = deck[S.brIdx] || {};
      const marks = Object.values(S.brMark);
      v.brTotal = deck.length; v.brN = Math.min(S.brIdx + 1, deck.length);
      v.brPct = Math.round((S.brIdx / Math.max(deck.length, 1)) * 100) + '%';
      v.brTerm = w.term || ''; v.brMeaning = w.meaning || ''; v.brTr = w.tr || '';
      const bh = splitHi(w.ex, w.term);
      v.brExPre = bh.pre; v.brExHit = bh.hit; v.brExPost = bh.post;
      v.brPos = w.pos || '';
      const m = S.brMark[w.i];
      v.brTag = m === 'yes' ? '알아요' : m === 'no' ? '헷갈려요' : '처음';
      v.brTagFg = m === 'yes' ? '#3F9E2E' : m === 'no' ? '#E23B4E' : '#A29CBE';
      v.brTagBg = m === 'yes' ? '#EDFBE6' : m === 'no' ? '#FFEFF1' : '#F5F4FB';
      v.brOpen = S.brFlip; v.brClosed = !S.brFlip;
      v.brYesCount = marks.filter((x) => x === 'yes').length;
      v.brNoCount = marks.filter((x) => x === 'no').length;
      v.brTransform = 'translateX(' + S.brDx + 'px) rotate(' + (S.brDx * 0.03).toFixed(2) + 'deg)';
      v.brTransition = S.brDrag ? 'none' : 'transform .18s ease';
      v.brBorder = S.brDx > 40 ? '#7BD94F' : S.brDx < -40 ? '#FF5A6E' : '#EFEDF7';
      v.brLeftFg = S.brDx < -40 ? '#E23B4E' : '#C3BFD8';
      v.brRightFg = S.brDx > 40 ? '#3F9E2E' : '#C3BFD8';
      v.brFlip = () => { if (Math.abs(S.brDx) < 6) this.setState({ brFlip: !S.brFlip }); };
      v.brYes = () => this.brAdvance(1);
      v.brNo = () => this.brAdvance(-1);
      v.isBrowsePick = S.view === 'path' && S.tab === 'browse' && !S.brSel;
      v.brSelLabel = S.brSel ? S.brSel.label : '훑어보기';
      v.brBack = () => this.setState({ brSel: null });
      const savedN = Object.keys(S.saved).length, missN = Object.keys(S.miss).length;
      v.brQuick = [
        { kind: 'saved', label: '내가 저장한 단어', hint: '오답 화면에서 저장한 단어', count: savedN, bg: '#EEEBFF', border: '#5B4BF7', fg: '#4436C9', subFg: '#7A6FD8' },
        { kind: 'miss', label: '헷갈린 단어', hint: '틀리거나 헷갈린다고 넘긴 단어', count: missN, bg: '#FFF7F8', border: '#FFD3D9', fg: '#E23B4E', subFg: '#C98A92' },
        { kind: 'all', label: '전체 단어', hint: '단어집 전체를 순서대로', count: S.W.filter((w) => ['01', '02', '03', '04', '05'].includes(w.sec)).length, bg: '#fff', border: '#E5E2F0', fg: '#2B2545', subFg: '#A29CBE' },
      ].map((q) => ({ ...q, go: () => this.brOpen({ kind: q.kind, label: q.label }) }));
      const counts = {};
      S.W.forEach((w) => { const id = S.TOF[w.i] || 'etc'; counts[id] = (counts[id] || 0) + 1; });
      v.brGroups = this.groupDefs().filter((g) => !g.kind).map((g) => {
        const ids = [];
        S.W.filter((w) => g.secs.includes(w.sec)).forEach((w) => { const id = S.TOF[w.i] || 'etc'; if (!ids.includes(id)) ids.push(id); });
        return {
          part: g.part + ' · ' + g.label,
          items: ids.map((id) => {
            const tp = S.TOPICS.find((x) => x.id === id) || { label: id };
            const n = S.W.filter((w) => g.secs.includes(w.sec) && (S.TOF[w.i] || 'etc') === id).length;
            const short = { g56: 'PART 5·6', gco: '콜로케이션', gp1: 'PART 1', gadv: '950+' }[g.id] || g.part;
            return { label: tp.label, count: n, go: () => this.brOpen({ kind: 'topic', id, secs: g.secs, label: short + ' · ' + tp.label }) };
          }),
        };
      });
      v.brDown = (e) => { this._x0 = e.clientX; try { e.currentTarget.setPointerCapture(e.pointerId); } catch (err) {} this.setState({ brDrag: true }); };
      v.brMove = (e) => { if (this.state.brDrag) this.setState({ brDx: e.clientX - this._x0 }); };
      v.brUp = () => {
        const dx = this.state.brDx;
        if (dx > 90) this.brAdvance(1);
        else if (dx < -90) this.brAdvance(-1);
        else this.setState({ brDx: 0, brDrag: false });
      };
    }
    v.showTabs = S.view === 'path';
    v.isLesson = S.view === 'lesson';
    v.isRes = S.view === 'res';
    v.goIntro = () => this.setState({ view: 'intro' });
    // 랜딩 인트로 — Higgsfield로 생성한 캐릭터 모션 클립 (좌우로 넘기며 확인)
    const clip0 = S.clip0 || 0;
    const cur = CLIPS[clip0 % CLIPS.length];
    v.clipSrc = cur.src;
    v.clipLabel = cur.label;
    v.clipHint = cur.hint;
    v.nextClip = () => this.setState({ clip0: (clip0 + 1) % CLIPS.length });
    v.clipDots = CLIPS.map((c, i) => ({
      go: () => this.setState({ clip0: i }),
      bg: clip0 % CLIPS.length === i ? '#5B4BF7' : '#DFDCEE',
    }));
    // 로그인 / 회원가입 (선택 화면 → 이메일 폼)
    const signup = S.authMode === 'signup';
    v.isAuthChoice = S.view === 'auth' && S.authStep !== 'form';
    v.isAuthForm = S.view === 'auth' && S.authStep === 'form';
    v.isSignup = signup;
    v.goLogin = () => this.setState({ view: 'auth', authMode: 'login', authStep: 'choice' });
    v.goSignup = () => this.setState({ view: 'auth', authMode: 'signup', authStep: 'choice' });
    v.toggleAuth = () => this.setState({ authMode: signup ? 'login' : 'signup', authStep: 'choice' });
    v.backToChoice = () => this.setState({ authStep: 'choice' });
    v.switchAsk = signup ? '이미 계정이 있나요?' : '계정이 없나요?';
    v.switchCta = signup ? '로그인' : '가입하기';
    v.authTitle = signup ? '계정 만들기' : '다시 오셨네요';
    v.authHint = signup
      ? '저장한 단어와 학습 기록이 계정에 남아서, 언제 다시 들어와도 이어서 할 수 있어요.'
      : '가입할 때 쓴 방법으로 로그인하면 저장한 단어장이 그대로 있어요.';
    v.formTitle = signup ? '이메일로 가입하기' : '이메일로 로그인';
    v.formSub = signup ? '단어장과 학습 기록을 이 계정에 저장할게요.' : '가입할 때 쓴 이메일과 비밀번호를 입력해 주세요.';
    v.name = S.name; v.email = S.email; v.pw = S.pw;
    v.onName = (e) => this.setState({ name: e.target.value });
    v.onEmail = (e) => this.setState({ email: e.target.value });
    v.onPw = (e) => this.setState({ pw: e.target.value });
    const okName = S.name.trim().length >= 1;
    const okEmail = /.+@.+\..+/.test(S.email);
    const okPw = S.pw.length >= 8;
    const on2 = (good, touched) => good ? '#7BD94F' : touched ? '#FF5A6E' : '#E5E2F0';
    v.nameBorder = on2(okName, S.name.length > 0); v.nameCheck = okName ? '#7BD94F' : 'transparent';
    v.emailBorder = on2(okEmail, S.email.length > 0); v.emailCheck = okEmail ? '#7BD94F' : 'transparent';
    v.pwBorder = on2(okPw, S.pw.length > 0); v.pwCheck = okPw ? '#7BD94F' : 'transparent';
    v.pwRules = [
      { label: '8자 이상', ok: okPw },
      { label: '영문 포함', ok: /[A-Za-z]/.test(S.pw) },
      { label: '숫자 포함', ok: /\d/.test(S.pw) },
    ].map((r) => ({ label: r.label, mark: r.ok ? '✓' : '·', color: r.ok ? '#3F9E2E' : '#A29CBE' }));
    const ready = okEmail && okPw && (!signup || okName);
    v.authBg = ready ? '#5B4BF7' : '#F0EEF9';
    v.authFg = ready ? '#fff' : '#BDB8D4';
    v.authShadow = ready ? '#4436C9' : '#E5E2F0';
    v.authCta = S.authBusy ? '처리 중…' : signup ? '가입하고 시작하기' : '로그인';
    v.submitAuth = () => { if (ready && !S.authBusy) this.submitAuthReal(); };
    v.authError = S.authError;
    const SOCIAL = SHOW_OAUTH ? [
      { id: 'google', label: 'Google로 계속하기', icon: 'G', bg: '#fff', fg: '#2B2545', border: '#E5E2F0', shadow: '#E5E2F0' },
      { id: 'kakao', label: '카카오로 계속하기', icon: '●', bg: '#FFE24D', fg: '#3B2E00', border: '#FFE24D', shadow: '#D9BF17' },
    ] : [];
    v.socials = SOCIAL.map((s) => ({ ...s, go: () => this.startOAuth(s.id) }))
      .concat([{ label: signup ? '이메일로 계속하기' : '이메일로 로그인', icon: '✉', bg: '#fff', fg: '#2B2545', border: '#E5E2F0', shadow: '#E5E2F0', go: () => this.setState({ authStep: 'form' }) }]);
    v.socialIcons = SOCIAL.map((s) => ({ icon: s.icon, bg: s.bg, fg: s.fg, border: s.border, go: () => this.startOAuth(s.id) }));
    v.hasSocialIcons = v.socialIcons.length > 0;
    v.continueGuest = () => this.continueAsGuest();

    v.isGuest = !S.user && S.guestMode;
    v.userName = S.user ? S.user.name : (v.isGuest ? '게스트' : '학습자');
    v.userEmail = S.user ? S.user.email : (v.isGuest ? '로그인하지 않고 이용 중이에요' : '로그인하면 기록이 저장돼요');
    v.guestUpgradeGo = () => this.setState({ view: 'auth', authMode: 'signup', authStep: 'choice' });
    v.logoutLabel = S.user ? '로그아웃' : '처음 화면으로';
    v.logout = () => this.logout();
    v.goAsk = () => this.setState({ view: 'ask' });
    v.goPath = () => this.setState({ view: 'path', tab: 'learn' });

    v.goals = [[600, '600점대', '기본기부터'], [750, '750점대', '실전 감각'], [850, '850점대', '고득점 준비'], [950, '950점 이상', '만점 도전']]
      .map(([n, label, sub]) => ({
        label, sub, pick: () => this.setState({ goal: n }),
        bg: S.goal === n ? '#EEEBFF' : '#fff',
        border: S.goal === n ? '#5B4BF7' : '#E5E2F0',
        fg: S.goal === n ? '#4436C9' : '#2B2545',
      }));
    v.nextBg = S.goal ? '#5B4BF7' : '#F0EEF9';
    v.nextFg = S.goal ? '#fff' : '#BDB8D4';
    v.nextShadow = S.goal ? '#4436C9' : '#E5E2F0';

    v.streak = S.streak; v.hearts = S.hearts; v.goalMin = S.goal;
    v.tabs = [['learn', '학습', '⌂'], ['browse', '훑기', '⇄'], ['words', '단어', '▤'], ['me', '내 정보', '☺']].map(([id, label, icon]) => ({
      label, icon, go: () => this.setState({ tab: id }),
      bg: S.tab === id ? '#EEEBFF' : 'transparent',
      fg: S.tab === id ? '#5B4BF7' : '#A29CBE',
    }));

    // 파트별 유닛 경로 (잠금 없음 — 아무 노드나 바로 시작)
    v.doneCount = Object.keys(S.done).length;
    const OFFS = ['0px', '30px', '40px', '12px', '-26px', '-38px', '-10px'];
    const theme = (tier) => tier === 'adv'
      ? { bg: '#2B2545', shadow: '#151125', fg: '#fff', subFg: 'rgba(255,255,255,.62)', kicker: '#FFC754', node: '#FFC754', nodeShadow: '#D99F1C', nodeFg: '#2B2545' }
      : { bg: '#5B4BF7', shadow: '#4436C9', fg: '#fff', subFg: 'rgba(255,255,255,.72)', kicker: 'rgba(255,255,255,.62)', node: '#5B4BF7', nodeShadow: '#4436C9', nodeFg: '#fff' };

    v.units = this.groupDefs().map((g) => {
      const th = theme(g.tier);
      const mk = (id, label, icon, node) => {
        const done = !!S.done[id];
        return {
          label, icon: done ? '✓' : icon, off: '0px',
          bg: done ? '#7BD94F' : th.node,
          shadow: done ? '#5CB636' : th.nodeShadow,
          fg: done ? '#fff' : th.nodeFg,
          box: (done ? '0 6px 0 #5CB636' : '0 6px 0 ' + th.nodeShadow) + (!done && S.started[id] ? ', inset 0 0 0 4px rgba(255,255,255,.5)' : ''),
          go: () => this.start(Object.assign({}, node, { id })),
        };
      };
      let nodes = [];
      if (g.kind === 'gram') {
        nodes = S.PT.map((p) => mk('gram-' + p.id, p.ko + ' (7문항)', '✎', { kind: 'gram', pt: p.id, label: p.ko }));
      } else {
        // 주제 카테고리별로 묶는다 (품사 순서가 아니라 의미 단위)
        const pool = S.W.filter((w) => g.secs.includes(w.sec));
        const byTopic = {};
        pool.forEach((w) => { const tid = S.TOF[w.i] || 'etc'; (byTopic[tid] = byTopic[tid] || []).push(w.i); });
        S.TOPICS.forEach((tp) => {
          const idxs = byTopic[tp.id];
          if (!idxs || !idxs.length) return;
          const n = Math.ceil(idxs.length / CHUNK_SIZE);
          for (let k = 0; k < n; k++) {
            const part = idxs.slice(k * CHUNK_SIZE, (k + 1) * CHUNK_SIZE);
            const base = n > 1 ? tp.label + ' ' + (k + 1) : tp.label;
            const label = base + ' (' + part.length + '개)';
            nodes.push(mk('t-' + g.id + '-' + tp.id + '-' + k, label, '★', { kind: 'word', idxs: part, label: base }));
          }
        });
      }
      nodes = nodes.map((n, i) => Object.assign({}, n, { off: OFFS[i % OFFS.length] }));
      const done = nodes.filter((n) => n.icon === '✓').length;
      return {
        part: g.part, label: g.label, hint: g.hint, nodes,
        progress: done + ' / ' + nodes.length,
        bg: th.bg, shadow: th.shadow, fg: th.fg, subFg: th.subFg, kicker: th.kicker,
      };
    });

    // words tab — 파트 · 주제로 골라 보기
    const savedIdx = Object.keys(S.saved);
    const GDEFS = this.groupDefs().filter((g) => !g.kind);
    const partSecs = S.wordPart === 'all' ? null : (GDEFS.find((g) => g.id === S.wordPart) || {}).secs;
    let list = S.wordFilter === 'saved' ? savedIdx.map((i) => S.W[i]).filter(Boolean) : S.W.slice();
    if (partSecs) list = list.filter((w) => partSecs.includes(w.sec));
    if (S.wordTopic !== 'all') list = list.filter((w) => (S.TOF[w.i] || 'etc') === S.wordTopic);
    list = list.slice(0, 60);
    const enOnly = S.wordMode === 'en';
    v.wordCount = list.length;
    v.wordEmpty = list.length === 0;
    v.savedCount = savedIdx.length;
    v.wordCaption = S.wordFilter === 'saved'
      ? '내가 저장한 단어 ' + list.length + '개'
      : 'sunny 단어집 ' + S.W.length + '개 중 ' + list.length + '개 표시';
    v.wordFilters = [['all', '전체'], ['saved', '내가 저장한 단어 ' + savedIdx.length]].map(([id, label]) => ({
      label, go: () => this.setState({ wordFilter: id }),
      bg: S.wordFilter === id ? '#5B4BF7' : '#fff',
      fg: S.wordFilter === id ? '#fff' : '#7A749A',
      border: S.wordFilter === id ? '#5B4BF7' : '#E5E2F0',
    }));
    const PLABEL = { g56: 'PART 5·6 단어', gco: '콜로케이션', gp1: 'PART 1 어휘', gadv: '950+ 고득점' };
    v.partChips = [{ id: 'all', label: '전체 파트' }].concat(GDEFS.map((g) => ({ id: g.id, label: PLABEL[g.id] || g.part })))
      .map((p) => ({
        label: p.label, go: () => this.setState({ wordPart: p.id, wordTopic: 'all' }),
        bg: S.wordPart === p.id ? '#2B2545' : '#fff',
        fg: S.wordPart === p.id ? '#fff' : '#7A749A',
        border: S.wordPart === p.id ? '#2B2545' : '#E5E2F0',
      }));
    const topicPool = partSecs ? S.W.filter((w) => partSecs.includes(w.sec)) : S.W;
    const tids = [];
    topicPool.forEach((w) => { const id = S.TOF[w.i] || 'etc'; if (!tids.includes(id)) tids.push(id); });
    v.topicChips = [{ id: 'all', label: '전체 주제' }].concat(tids.map((id) => ({ id, label: (S.TOPICS.find((x) => x.id === id) || {}).label || id })))
      .map((c) => ({
        label: c.label, go: () => this.setState({ wordTopic: c.id }),
        bg: S.wordTopic === c.id ? '#EEEBFF' : '#fff',
        fg: S.wordTopic === c.id ? '#4436C9' : '#7A749A',
        border: S.wordTopic === c.id ? '#5B4BF7' : '#E5E2F0',
      }));
    v.wordModes = [['both', '한글·영어 같이'], ['en', '영어만 보기']].map(([id, label]) => ({
      label, go: () => this.setState({ wordMode: id, reveal: {} }),
      bg: S.wordMode === id ? '#fff' : 'transparent',
      fg: S.wordMode === id ? '#5B4BF7' : '#A29CBE',
      shadow: S.wordMode === id ? '0 2px 0 #DFDCEE' : 'none',
    }));
    v.wordList = list.map((w) => {
      const shown = !!S.reveal[w.i], isSaved = !!S.saved[w.i];
      return {
        primary: w.term,
        sub: enOnly ? (shown ? w.meaning : '탭하면 뜻 확인') : w.meaning,
        subFg: enOnly && !shown ? '#C3BFD8' : '#7A749A',
        tag: (S.TOPICS.find((x) => x.id === (S.TOF[w.i] || 'etc')) || {}).label || w.pos,
        saveIcon: isSaved ? '★' : '☆',
        saveBg: isSaved ? '#5B4BF7' : '#fff',
        saveFg: isSaved ? '#fff' : '#BDB8D4',
        saveBorder: isSaved ? '#5B4BF7' : '#E5E2F0',
        save: () => {
          const next = { ...S.saved };
          if (next[w.i]) delete next[w.i]; else next[w.i] = true;
          this.setState({ saved: next });
        },
        tap: () => { if (enOnly) this.setState({ reveal: { ...S.reveal, [w.i]: !shown } }); },
      };
    });

    v.stats = [
      { icon: '▲', color: '#FFB020', value: S.streak, label: '연속 학습일' },
      { icon: '✓', color: '#7BD94F', value: v.doneCount, label: '완료한 레슨' },
    ];

    // 나만의 단어장(저장) / 헷갈린 단어(오답) — 내 정보 탭
    {
      const savedEntries = Object.keys(S.saved).map((i) => S.W[+i]).filter(Boolean);
      v.savedWordCount = savedEntries.length;
      v.hasSavedWords = savedEntries.length > 0;
      v.noSavedWords = savedEntries.length === 0;
      v.savedWordList = savedEntries.slice(0, 4).map((w) => ({ term: w.term, meaning: w.meaning }));
      v.browseSaved = () => this.setState({ tab: 'browse' }, () => this.brOpen({ kind: 'saved', label: '나만의 단어장' }));

      const missEntries = Object.keys(S.miss)
        .map((i) => ({ i: +i, w: S.W[+i], count: S.miss[i] }))
        .filter((x) => x.w)
        .sort((a, b) => b.count - a.count);
      v.missCount = missEntries.length;
      v.hasMiss = missEntries.length > 0;
      v.noMiss = missEntries.length === 0;
      v.missList = missEntries.slice(0, 4).map((x) => ({ term: x.w.term, meaning: x.w.meaning, count: x.count }));
      v.browseMiss = () => this.setState({ tab: 'browse' }, () => this.brOpen({ kind: 'miss', label: '헷갈린 단어' }));
    }

    // lesson
    if (S.run) {
      const r = S.run, q = r.qs[r.pos];
      v.runHearts = Math.max(r.hearts, 0);
      v.lessonPct = Math.round((r.pos / r.qs.length) * 100) + '%';
      v.qKicker = q.kicker;
      v.lessonScope = (r.node.label || '학습') + ' · 총 ' + r.qs.length + (q.type === 'gram' ? '문항' : '단어');
      v.qPrompt = q.prompt;
      v.qSize = q.type === 'gram' ? '15.5px' : q.type === 'meaning' ? '26px' : '19px';
      v.checked = r.checked; v.notChecked = !r.checked;
      v.lessonMood = !r.checked ? 'think' : (r.ok ? 'wink' : 'oh');
      v.quit = () => this.setState({ view: 'path', run: null });
      v.doCheck = () => this.check();
      v.doNext = () => this.next();
      v.nextLabel = r.pos + 1 >= r.qs.length || r.hearts <= 0 ? '결과 보기' : '계속';
      v.checkBg = r.picked === null ? '#F0EEF9' : '#7BD94F';
      v.checkFg = r.picked === null ? '#BDB8D4' : '#fff';
      v.checkShadow = r.picked === null ? '#E5E2F0' : '#5CB636';
      v.fbColor = r.ok ? '#3F9E2E' : '#E23B4E';
      v.fbShadow = r.ok ? '#2F7A22' : '#B72B3C';
      v.fbBg = r.ok ? '#EDFBE6' : '#FFEFF1';
      v.fbLine = r.ok ? '#CDEFBE' : '#FFD3D9';
      v.fbSub = r.ok ? 'rgba(63,158,46,.75)' : 'rgba(226,59,78,.75)';
      v.fbMark = r.ok ? '✓' : '!';
      v.fbTitle = r.ok ? (r.combo >= 3 ? r.combo + '연속 정답!' : '좋아요!') : '아쉬워요';
      // 정답을 맞혔을 때 한 번 튕겨 나오는 큼직한 도장 텍스트 (듀오링고의 "PERFECT" 연출 참고)
      v.showStamp = r.ok;
      v.fbStamp = r.combo >= 3 ? '완벽해요!' : '정답이에요!';
      v.fbAnswer = '정답: ' + q.choices[q.answer];
      const target = q.type === 'meaning' ? q.prompt : q.choices[q.answer];
      const fh = splitHi(q.sentence, target);
      v.fbPre = fh.pre; v.fbHit = fh.hit; v.fbPost = fh.post;
      v.fbNote = q.note;
      v.fbWrong = r.checked && !r.ok; v.fbRight = !r.checked || r.ok;
      const savedNow = q.wi != null && !!S.saved[q.wi];
      v.saveLabel = savedNow ? '✓ 단어장에 저장됨' : '나만의 단어장에 저장';
      v.saveBg = savedNow ? '#5B4BF7' : '#fff';
      v.saveFg = savedNow ? '#fff' : '#5B4BF7';
      v.saveBorder = savedNow ? '#5B4BF7' : '#D9D3F5';
      v.saveShadow = savedNow ? '#4436C9' : '#D9D3F5';
      v.skipLabel = r.pos + 1 >= r.qs.length || r.hearts <= 0 ? '결과 보기' : '스킵하기';
      v.doSave = () => {
        if (q.wi == null) { this.next(); return; }
        this.setState({ saved: { ...S.saved, [q.wi]: true } }, () => this.next());
      };
      v.options = q.choices.map((t, k) => {
        let bg = '#fff', border = '#E5E2F0', fg = '#2B2545', keyFg = '#A29CBE', keyBorder = '#E5E2F0';
        if (!r.checked && r.picked === k) { bg = '#EEEBFF'; border = '#5B4BF7'; fg = '#4436C9'; keyFg = '#5B4BF7'; keyBorder = '#5B4BF7'; }
        if (r.checked && k === q.answer) { bg = '#EDFBE6'; border = '#7BD94F'; fg = '#3F9E2E'; keyFg = '#3F9E2E'; keyBorder = '#7BD94F'; }
        else if (r.checked && k === r.picked) { bg = '#FFEFF1'; border = '#FF5A6E'; fg = '#E23B4E'; keyFg = '#E23B4E'; keyBorder = '#FF5A6E'; }
        return { text: t, key: 'ABCD'[k], bg, border, fg, keyFg, keyBorder, pick: () => { if (!r.checked) this.setState({ run: { ...r, picked: k } }); } };
      });
    }

    // result
    if (S.res) {
      const R = S.res;
      v.resColor = R.failed ? '#FF5A6E' : '#7BD94F';
      v.resMood = R.failed ? 'oh' : (R.right === R.total ? 'wink' : 'happy');
      v.resShadow = R.failed ? '#D8404F' : '#5CB636';
      v.resTitle = R.failed ? '하트가 없어요' : '레슨 완료!';
      v.resSub = R.failed
        ? '다음 세트를 시작하면 하트가 다시 5개로 채워져요.'
        : R.node.label + ' · ' + R.total + '문항 중 ' + R.right + '개 정답';
      v.resCards = [
        { label: '정확도', icon: '◎', value: Math.round((R.right / R.total) * 100) + '%', color: '#5B4BF7' },
        { label: '남은 하트', icon: '♥', value: Math.max(S.hearts, 0), color: '#FF5A6E' },
      ];
    }
    return v;
  }
}

/* ============================================================
   렌더러 — 이벤트 델리게이션 + 화면별 템플릿
   ============================================================ */
let handlers = {};
let handlerSeq = 0;
function on(fn) {
  const id = 'h' + (handlerSeq++);
  handlers[id] = fn;
  return id;
}

const wrap = (inner, extra = '') => `<div style="position:absolute;inset:0;${extra}">${inner}</div>`;

function screenSplash() {
  return wrap(`
    <div style="position:absolute;inset:0;background:#5B4BF7;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:22px">
      <div style="animation:splashGrow 1.1s cubic-bezier(.34,1.56,.64,1) both, bob 2s ease-in-out 1.1s infinite">${poko('front', 156)}</div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:6px;animation:splashFadeUp .6s ease .7s both">
        <div class="brand-logo" style="font-size:20px;color:#fff;opacity:.92">안녕하세요! 오늘도 반가워요</div>
        <div class="brand-logo" style="font-size:38px;color:#fff">sunny</div>
      </div>
    </div>`);
}

function screenIntro(v) {
  return wrap(`
    <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:70px 26px 34px;gap:14px">
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px">
        <div data-act="${on(v.nextClip)}" style="width:236px;height:236px;border-radius:50%;overflow:hidden;background:#F6F2E8;box-shadow:0 10px 30px rgba(43,37,69,.12);flex:none;display:flex;align-items:center;justify-content:center;cursor:pointer">
          <video autoplay muted playsinline data-onended="${on(v.nextClip)}" src="${v.clipSrc}" onerror="this.parentElement.innerHTML=window.pokoHTML('happy',168)" style="width:100%;height:100%;object-fit:cover;display:block"></video>
        </div>
        <div style="display:flex;gap:6px">
          ${v.clipDots.map((d) => `<button data-act="${on(d.go)}" style="width:8px;height:8px;border-radius:50%;background:${d.bg};padding:0"></button>`).join('')}
        </div>
        <div class="brand-logo" style="font-size:40px;color:#5B4BF7">sunny</div>
        <div style="font-size:12.5px;font-weight:700;color:#A29CBE">${esc(v.clipLabel)}</div>
        <div style="font-size:16px;font-weight:600;color:#7A749A;text-align:center;line-height:1.6">시험에 가장 많이 나오는 순서대로,<br>TOEIC 단어와 문법을 게임처럼.</div>
      </div>
      <button class="btn-primary" data-act="${on(v.goAsk)}">시작하기</button>
      <button class="btn-secondary" data-act="${on(v.goLogin)}">이미 계정이 있어요</button>
      <button data-act="${on(v.continueGuest)}" style="font-size:13px;font-weight:800;color:#A29CBE;padding-top:4px">로그인 없이 시작하기</button>
    </div>`);
}

function screenAuthChoice(v) {
  return wrap(`
    <div style="position:absolute;inset:0;display:flex;flex-direction:column;padding:22px 22px 20px;background:#fff;overflow:auto">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding-bottom:6px">
        <button data-act="${on(v.goIntro)}" style="font-size:24px;color:#C3BFD8;width:24px;text-align:left">‹</button>
        <span style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;color:#7A749A">
          <span>${esc(v.switchAsk)}</span>
          <button data-act="${on(v.toggleAuth)}" style="font-size:12.5px;font-weight:800;color:#5B4BF7">${esc(v.switchCta)}</button>
        </span>
      </div>
      <div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding:10px 0 18px">
        ${poko('calm', 82)}
        <span style="font-size:23px;font-weight:800;letter-spacing:-.02em">${esc(v.authTitle)}</span>
        <span style="font-size:13px;font-weight:700;color:#7A749A;text-align:center;line-height:1.5">${esc(v.authHint)}</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${v.socials.map((s) => `
        <button class="press" data-act="${on(s.go)}" style="display:flex;align-items:center;justify-content:center;gap:10px;background:${s.bg};color:${s.fg};border:2px solid ${s.border};border-radius:16px;padding:14px;font-size:14.5px;font-weight:800;box-shadow:0 3px 0 ${s.shadow}">
          <span style="font-size:15px;width:18px;text-align:center">${s.icon}</span><span>${esc(s.label)}</span>
        </button>`).join('')}
      </div>
      <div style="flex:1"></div>
      <div style="font-size:11.5px;font-weight:700;color:#C3BFD8;text-align:center;line-height:1.5;padding-top:10px">계속하면 sunny의 이용약관과 개인정보 처리방침에 동의하게 됩니다.</div>
    </div>`);
}

function screenAuthForm(v) {
  return wrap(`
    <div style="position:absolute;inset:0;overflow:auto;padding:22px 22px 20px;background:#fff">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding-bottom:12px">
        <button data-act="${on(v.backToChoice)}" style="font-size:24px;color:#C3BFD8;width:24px;text-align:left">‹</button>
        <span style="display:flex;align-items:center;gap:6px;font-size:12.5px;font-weight:700;color:#7A749A">
          <span>${esc(v.switchAsk)}</span>
          <button data-act="${on(v.toggleAuth)}" style="font-size:12.5px;font-weight:800;color:#5B4BF7">${esc(v.switchCta)}</button>
        </span>
      </div>
      <div style="font-size:20px;font-weight:800;letter-spacing:-.02em;padding-bottom:4px">${esc(v.formTitle)}</div>
      <div style="font-size:12.5px;font-weight:700;color:#7A749A;line-height:1.5;padding-bottom:14px">${esc(v.formSub)}</div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${v.isSignup ? `
        <div style="position:relative;display:flex;align-items:center">
          <input data-focus-key="name" data-oninput="${on(v.onName)}" value="${esc(v.name)}" placeholder="이름" style="width:100%;border:2px solid ${v.nameBorder};border-radius:16px;padding:13px 44px 13px 16px;font-size:15px;font-weight:700;color:#2B2545;outline:none">
          <span style="position:absolute;right:16px;font-size:15px;font-weight:900;color:${v.nameCheck}">✓</span>
        </div>` : ''}
        <div style="position:relative;display:flex;align-items:center">
          <input data-focus-key="email" data-oninput="${on(v.onEmail)}" value="${esc(v.email)}" placeholder="이메일 주소" type="email" style="width:100%;border:2px solid ${v.emailBorder};border-radius:16px;padding:13px 44px 13px 16px;font-size:15px;font-weight:700;color:#2B2545;outline:none">
          <span style="position:absolute;right:16px;font-size:15px;font-weight:900;color:${v.emailCheck}">✓</span>
        </div>
        <div style="position:relative;display:flex;align-items:center">
          <input data-focus-key="pw" data-oninput="${on(v.onPw)}" value="${esc(v.pw)}" placeholder="비밀번호 (8자 이상)" type="password" style="width:100%;border:2px solid ${v.pwBorder};border-radius:16px;padding:13px 44px 13px 16px;font-size:15px;font-weight:700;color:#2B2545;outline:none">
          <span style="position:absolute;right:16px;font-size:15px;font-weight:900;color:${v.pwCheck}">✓</span>
        </div>
      </div>
      ${v.isSignup ? `
      <div style="background:#F7F6FD;border-radius:14px;padding:10px 14px;margin-top:8px;display:flex;flex-direction:column;gap:4px">
        <span style="font-size:11.5px;font-weight:800;color:#7A749A">비밀번호 조건</span>
        ${v.pwRules.map((c) => `<span style="display:flex;align-items:center;gap:8px;font-size:11.5px;font-weight:700;color:${c.color}"><span style="width:14px">${c.mark}</span><span>${esc(c.label)}</span></span>`).join('')}
      </div>` : ''}
      ${v.authError ? `<div style="background:#FFF0F1;color:#E23B4E;border-radius:12px;padding:11px 14px;margin-top:10px;font-size:12.5px;font-weight:700;line-height:1.5">${esc(v.authError)}</div>` : ''}
      <div style="font-size:11px;font-weight:700;color:#A29CBE;line-height:1.5;padding:10px 2px 12px">계속하면 sunny의 이용약관과 개인정보 처리방침에 동의하게 됩니다.</div>
      <button class="press" data-act="${on(v.submitAuth)}" style="width:100%;background:${v.authBg};color:${v.authFg};border-radius:16px;padding:16px;font-size:16px;font-weight:800;box-shadow:0 4px 0 ${v.authShadow}">${esc(v.authCta)}</button>
      ${v.hasSocialIcons ? `
      <div style="display:flex;align-items:center;gap:10px;padding:14px 0">
        <span style="flex:1;height:2px;background:#F0EEF9"></span>
        <span style="font-size:11.5px;font-weight:800;color:#C3BFD8">또는</span>
        <span style="flex:1;height:2px;background:#F0EEF9"></span>
      </div>
      <div style="display:flex;justify-content:center;gap:10px;padding-bottom:4px">
        ${v.socialIcons.map((s) => `<button class="press" data-act="${on(s.go)}" style="width:46px;height:46px;border-radius:50%;background:${s.bg};color:${s.fg};border:2px solid ${s.border};font-size:16px;font-weight:800;display:flex;align-items:center;justify-content:center">${s.icon}</button>`).join('')}
      </div>` : ''}
    </div>`);
}

function screenAsk(v) {
  return wrap(`
    <div style="position:absolute;inset:0;display:flex;flex-direction:column;padding:22px 20px 22px">
      <div style="display:flex;align-items:center;gap:14px;padding-bottom:6px">
        <button data-act="${on(v.goIntro)}" style="font-size:24px;color:#C3BFD8;width:24px;text-align:left">‹</button>
        <div style="flex:1;height:14px;border-radius:99px;background:#F0EEF9;overflow:hidden"><div style="height:100%;width:14%;background:#FFB020;border-radius:99px"></div></div>
      </div>
      <div style="display:flex;align-items:flex-end;gap:10px;padding:18px 0 16px">
        ${poko('3q', 48)}
        <div style="position:relative;flex:1;border:2px solid #E5E2F0;border-radius:16px;padding:12px 14px;font-size:14.5px;font-weight:700;line-height:1.5;margin-bottom:14px">딱 하나만 물어볼게요.<br>목표 점수가 어떻게 되나요?</div>
      </div>
      <div style="display:flex;flex-direction:column;gap:8px">
        ${v.goals.map((g) => `
        <button class="press" data-act="${on(g.pick)}" style="display:flex;align-items:center;justify-content:space-between;gap:12px;background:${g.bg};border:2px solid ${g.border};border-radius:16px;padding:14px 18px;box-shadow:0 3px 0 ${g.border}">
          <span style="font-size:15px;font-weight:800;color:${g.fg}">${esc(g.label)}</span><span style="font-size:12.5px;font-weight:700;color:#A29CBE">${esc(g.sub)}</span>
        </button>`).join('')}
      </div>
      <div style="flex:1"></div>
      <button class="press" data-act="${on(v.goSignup)}" style="width:100%;background:${v.nextBg};color:${v.nextFg};border-radius:16px;padding:16px;font-size:16px;font-weight:800;box-shadow:0 4px 0 ${v.nextShadow}">계속하기</button>
    </div>`);
}

function topBar(v) {
  return `
  <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding:14px 20px 14px">
    <div class="brand-logo" style="display:flex;align-items:center;gap:6px;font-size:17px;color:#FFB020"><span style="font-size:18px">▲</span><span>${v.streak}</span></div>
    <div class="brand-logo" style="display:flex;align-items:center;gap:6px;font-size:17px;color:#FF5A6E"><span style="font-size:16px">♥</span><span>${v.hearts}</span></div>
  </div>`;
}

function screenPath(v) {
  return wrap(`
    <div style="position:absolute;inset:0;overflow:auto;padding:8px 0 108px">
      ${topBar(v)}
      <div style="display:flex;flex-direction:column;gap:26px;padding:8px 0 0">
        ${v.units.map((u) => `
        <div style="display:flex;flex-direction:column;align-items:center;gap:18px">
          <div style="margin:0 16px;align-self:stretch;background:${u.bg};border-radius:18px;padding:16px 18px;display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 4px 0 ${u.shadow}">
            <span style="display:flex;flex-direction:column;gap:3px;min-width:0">
              <span style="font-size:10.5px;font-weight:800;letter-spacing:.12em;color:${u.kicker}">${esc(u.part)}</span>
              <span style="font-size:16.5px;font-weight:800;color:${u.fg};letter-spacing:-.01em">${esc(u.label)}</span>
              <span style="font-size:11.5px;font-weight:700;color:${u.subFg};line-height:1.5">${esc(u.hint)}</span>
            </span>
            <span style="font-size:11.5px;font-weight:800;color:${u.fg};white-space:nowrap;flex:none">${u.progress}</span>
          </div>
          <div style="display:flex;flex-direction:column;align-items:center;gap:14px;padding:0 20px;width:100%">
            ${u.nodes.map((n) => `
            <div style="display:flex;flex-direction:column;align-items:center;gap:7px;transform:translateX(${n.off})">
              <button class="press" data-act="${on(n.go)}" style="width:76px;height:66px;border-radius:50%;background:${n.bg};box-shadow:${n.box};display:flex;align-items:center;justify-content:center;font-size:24px;font-weight:800;color:${n.fg}">${n.icon}</button>
              <span style="font-size:11.5px;font-weight:800;color:#2B2545;max-width:120px;text-align:center;line-height:1.35">${esc(n.label)}</span>
            </div>`).join('')}
          </div>
        </div>`).join('')}
      </div>
    </div>`);
}

function screenWords(v) {
  return wrap(`
    <div style="position:absolute;inset:0;overflow:auto;padding:20px 16px 108px">
      <div style="font-size:24px;font-weight:800;letter-spacing:-.02em;padding:0 4px 4px">내 단어</div>
      <div style="font-size:12.5px;font-weight:700;color:#7A749A;padding:0 4px 14px">${esc(v.wordCaption)}</div>
      <div style="display:flex;gap:6px;margin:0 2px 10px">
        ${v.wordFilters.map((f) => `<button class="press" data-act="${on(f.go)}" style="border:2px solid ${f.border};background:${f.bg};color:${f.fg};border-radius:12px;padding:9px 14px;font-size:12.5px;font-weight:800">${esc(f.label)}</button>`).join('')}
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin:0 2px 8px">
        ${v.partChips.map((p) => `<button class="press" data-act="${on(p.go)}" style="border:2px solid ${p.border};background:${p.bg};color:${p.fg};border-radius:11px;padding:8px 12px;font-size:11.5px;font-weight:800">${esc(p.label)}</button>`).join('')}
      </div>
      <div style="display:flex;flex-wrap:wrap;gap:6px;margin:0 2px 14px">
        ${v.topicChips.map((c) => `<button class="press" data-act="${on(c.go)}" style="border:2px solid ${c.border};background:${c.bg};color:${c.fg};border-radius:11px;padding:8px 12px;font-size:11.5px;font-weight:800">${esc(c.label)}</button>`).join('')}
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px;background:#F0EEF9;border-radius:14px;padding:4px;margin:0 2px 14px">
        ${v.wordModes.map((m) => `<button data-act="${on(m.go)}" style="border-radius:11px;padding:10px 6px;font-size:12.5px;font-weight:800;background:${m.bg};color:${m.fg};box-shadow:${m.shadow}">${esc(m.label)}</button>`).join('')}
      </div>
      ${v.wordEmpty ? `
      <div style="background:#fff;border:2px solid #EFEDF7;border-radius:18px;padding:22px 18px 24px;display:flex;flex-direction:column;align-items:center;gap:10px">
        ${poko('think', 72)}
        <span style="text-align:center;font-size:13px;font-weight:700;color:#A29CBE;line-height:1.7">이 조건에 해당하는 단어가 없어요.<br>레슨 오답 화면이나 ☆ 버튼으로 단어를 저장해 보세요.</span>
      </div>` : `
      <div style="display:flex;flex-direction:column;gap:8px">
        ${v.wordList.map((w) => `
        <div style="background:#fff;border:2px solid #EFEDF7;border-radius:16px;padding:12px 12px 12px 16px;display:flex;align-items:center;justify-content:space-between;gap:10px">
          <button data-act="${on(w.tap)}" style="flex:1;text-align:left;display:flex;flex-direction:column;gap:3px;min-width:0">
            <span style="font-size:15.5px;font-weight:800;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(w.primary)}</span>
            <span style="font-size:13.5px;font-weight:700;color:${w.subFg};white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(w.sub)}</span>
          </button>
          <span style="display:flex;align-items:center;gap:8px;flex:none">
            <span style="font-size:11px;font-weight:800;color:#7A749A;background:#F5F4FB;border-radius:8px;padding:5px 9px">${esc(w.tag)}</span>
            <button class="press" data-act="${on(w.save)}" style="width:40px;height:40px;border-radius:12px;border:2px solid ${w.saveBorder};background:${w.saveBg};color:${w.saveFg};font-size:16px;font-weight:800;display:flex;align-items:center;justify-content:center">${w.saveIcon}</button>
          </span>
        </div>`).join('')}
      </div>`}
    </div>`);
}

function screenMe(v) {
  return wrap(`
    <div style="position:absolute;inset:0;overflow:auto;padding:24px 16px 108px">
      <div style="display:flex;flex-direction:column;align-items:center;gap:10px;padding-bottom:22px">
        ${poko('wink', 108)}
        <div style="font-size:20px;font-weight:800">${esc(v.userName)}님</div>
        <div style="font-size:12.5px;font-weight:700;color:#A29CBE">${esc(v.userEmail)}</div>
        <div style="font-size:13px;font-weight:700;color:#7A749A;white-space:nowrap">목표 ${v.goalMin}점 · ${v.streak}일 연속</div>
        <button data-act="${on(v.logout)}" style="border:2px solid #E5E2F0;border-radius:12px;padding:8px 14px;font-size:12px;font-weight:800;color:#7A749A;margin-top:4px">${esc(v.logoutLabel)}</button>
      </div>
      ${v.isGuest ? `
      <button class="press" data-act="${on(v.guestUpgradeGo)}" style="width:100%;text-align:left;background:#EEEBFF;border:2px solid #5B4BF7;border-radius:16px;padding:14px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 3px 0 #5B4BF7;margin-bottom:12px">
        <span style="display:flex;flex-direction:column;gap:2px">
          <span style="font-size:14px;font-weight:800;color:#4436C9">가입하고 기록 저장하기</span>
          <span style="font-size:11.5px;font-weight:700;color:#7A6FD8">지금까지 쌓은 기록은 그대로 유지돼요</span>
        </span>
        <span style="font-size:18px;color:#5B4BF7">›</span>
      </button>` : ''}
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
        ${v.stats.map((s) => `
        <div style="background:#fff;border:2px solid #EFEDF7;border-radius:18px;padding:16px;display:flex;flex-direction:column;gap:6px">
          <span style="font-size:20px;color:${s.color}">${s.icon}</span>
          <span class="stat-num" style="font-size:24px">${s.value}</span>
          <span style="font-size:12px;font-weight:700;color:#7A749A">${esc(s.label)}</span>
        </div>`).join('')}
      </div>
      <div style="background:#fff;border:2px solid #D9D3F5;border-radius:20px;padding:18px;margin-top:12px;display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
          <span style="display:flex;flex-direction:column;gap:2px">
            <span style="font-size:15.5px;font-weight:800">나만의 단어장</span>
            <span style="font-size:12px;font-weight:700;color:#A29CBE">★ 눌러서 저장한 단어</span>
          </span>
          <span class="stat-num" style="font-size:22px;color:#5B4BF7;flex:none">${v.savedWordCount}</span>
        </div>
        ${v.hasSavedWords ? `
        <div style="display:flex;flex-direction:column;gap:8px">
          ${v.savedWordList.map((w) => `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;background:#F7F6FD;border-radius:12px;padding:11px 13px">
            <span style="display:flex;flex-direction:column;gap:2px;min-width:0">
              <span class="stat-num" style="font-size:14.5px">${esc(w.term)}</span>
              <span style="font-size:12px;font-weight:700;color:#7A749A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(w.meaning)}</span>
            </span>
          </div>`).join('')}
        </div>
        <button class="press" data-act="${on(v.browseSaved)}" style="width:100%;background:#5B4BF7;color:#fff;border-radius:14px;padding:14px;font-size:14.5px;font-weight:800;box-shadow:0 3px 0 #4436C9">저장한 단어 카드로 넘겨보기</button>
        ` : `<div style="font-size:13px;font-weight:700;color:#C3BFD8;line-height:1.6;padding:6px 0">아직 없어요. 단어 카드나 레슨에서 ★을 눌러 저장하면 여기 모입니다.</div>`}
      </div>
      <div style="background:#fff;border:2px solid #FFD3D9;border-radius:20px;padding:18px;margin-top:10px;display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
          <span style="display:flex;flex-direction:column;gap:2px">
            <span style="font-size:15.5px;font-weight:800">헷갈린 단어</span>
            <span style="font-size:12px;font-weight:700;color:#A29CBE">틀리거나 헷갈린다고 넘긴 단어</span>
          </span>
          <span class="stat-num" style="font-size:22px;color:#E23B4E;flex:none">${v.missCount}</span>
        </div>
        ${v.hasMiss ? `
        <div style="display:flex;flex-direction:column;gap:8px">
          ${v.missList.map((w) => `
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;background:#FFF7F8;border-radius:12px;padding:11px 13px">
            <span style="display:flex;flex-direction:column;gap:2px;min-width:0">
              <span class="stat-num" style="font-size:14.5px">${esc(w.term)}</span>
              <span style="font-size:12px;font-weight:700;color:#7A749A;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(w.meaning)}</span>
            </span>
            <span style="font-size:11.5px;font-weight:800;color:#E23B4E;flex:none">${w.count}</span>
          </div>`).join('')}
        </div>
        <button class="press" data-act="${on(v.browseMiss)}" style="width:100%;background:#FF5A6E;color:#fff;border-radius:14px;padding:14px;font-size:14.5px;font-weight:800;box-shadow:0 3px 0 #D8404F">헷갈린 단어 카드로 넘겨보기</button>
        ` : `<div style="font-size:13px;font-weight:700;color:#C3BFD8;line-height:1.6;padding:6px 0">아직 없어요. 레슨에서 틀린 단어와 훑기에서 "헷갈려요"로 넘긴 단어가 여기 모입니다.</div>`}
      </div>
    </div>`);
}

function screenBrowsePick(v) {
  return wrap(`
    <div style="position:absolute;inset:0;overflow:auto;padding:24px 16px 104px;background:#F7F6FD">
      <div style="padding:4px 2px 16px;display:flex;align-items:flex-end;gap:10px">
        <span style="flex:1;display:flex;flex-direction:column;gap:3px;min-width:0">
          <span style="font-size:22px;font-weight:800;letter-spacing:-.02em">무엇을 훑어볼까요?</span>
          <span style="font-size:12.5px;font-weight:700;color:#A29CBE">묶음을 고르면 그 단어만 카드로 넘겨봐요</span>
        </span>
        ${poko('3q', 42)}
      </div>
      <div style="display:flex;flex-direction:column;gap:8px;padding-bottom:18px">
        ${v.brQuick.map((q) => `
        <button class="press" data-act="${on(q.go)}" style="text-align:left;background:${q.bg};border:2px solid ${q.border};border-radius:18px;padding:15px 16px;display:flex;align-items:center;justify-content:space-between;gap:12px;box-shadow:0 3px 0 ${q.border}">
          <span style="display:flex;flex-direction:column;gap:3px;min-width:0">
            <span style="font-size:14.5px;font-weight:800;color:${q.fg}">${esc(q.label)}</span><span style="font-size:11.5px;font-weight:700;color:${q.subFg}">${esc(q.hint)}</span>
          </span>
          <span class="stat-num" style="font-size:17px;color:${q.fg};flex:none">${q.count}</span>
        </button>`).join('')}
      </div>
      ${v.brGroups.map((g) => `
      <div style="padding-bottom:16px;display:flex;flex-direction:column;gap:8px">
        <span style="font-size:11px;font-weight:800;letter-spacing:.12em;color:#A29CBE;padding-left:2px">${esc(g.part)}</span>
        <div style="display:flex;flex-wrap:wrap;gap:8px">
          ${g.items.map((c) => `
          <button class="press" data-act="${on(c.go)}" style="background:#fff;border:2px solid #E5E2F0;border-radius:14px;padding:11px 14px;display:flex;align-items:center;gap:8px;box-shadow:0 3px 0 #E5E2F0">
            <span style="font-size:13px;font-weight:800;color:#2B2545">${esc(c.label)}</span><span class="stat-num" style="font-size:12px;color:#5B4BF7">${c.count}</span>
          </button>`).join('')}
        </div>
      </div>`).join('')}
    </div>`);
}

function screenBrowse(v) {
  return wrap(`
    <div style="position:absolute;inset:0;display:flex;flex-direction:column;padding:24px 18px 104px;background:#F7F6FD">
      <div style="display:flex;align-items:center;justify-content:space-between;gap:12px;padding:4px 2px 14px">
        <span style="display:flex;align-items:center;gap:10px;min-width:0">
          <button data-act="${on(v.brBack)}" style="font-size:22px;color:#C3BFD8;width:20px;text-align:left;flex:none">‹</button>
          <span style="display:flex;flex-direction:column;gap:2px;min-width:0">
            <span style="font-size:18px;font-weight:800;letter-spacing:-.02em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${esc(v.brSelLabel)}</span>
            <span style="font-size:11.5px;font-weight:700;color:#A29CBE">좌우로 넘기며 확인</span>
          </span>
        </span>
        <span class="stat-num" style="font-size:15px;color:#5B4BF7;flex:none">${v.brN} / ${v.brTotal}</span>
      </div>
      <div style="height:8px;border-radius:99px;background:#EAE7F7;overflow:hidden;margin:0 2px 16px"><div style="height:100%;background:#5B4BF7;border-radius:99px;width:${v.brPct}"></div></div>
      <div style="position:relative;flex:1;min-height:0">
        <div style="position:absolute;left:12px;right:12px;top:16px;bottom:26px;background:#fff;border:2px solid #EFEDF7;border-radius:26px;opacity:.7"></div>
        <div style="position:absolute;left:6px;right:6px;top:8px;bottom:18px;background:#fff;border:2px solid #EFEDF7;border-radius:26px;opacity:.85"></div>
        <div data-onpointerdown="${on(v.brDown)}" data-onpointermove="${on(v.brMove)}" data-onpointerup="${on(v.brUp)}" data-onpointercancel="${on(v.brUp)}" data-act="${on(v.brFlip)}"
          style="position:absolute;inset:0 0 10px;background:#fff;border:2px solid ${v.brBorder};border-radius:26px;box-shadow:0 8px 0 #EAE7F7;padding:24px 22px;display:flex;flex-direction:column;cursor:grab;touch-action:none;transform:${v.brTransform};transition:${v.brTransition}">
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px">
            <span style="font-size:11px;font-weight:800;letter-spacing:.1em;color:#A29CBE">${esc(v.brPos)}</span>
            <span style="font-size:11px;font-weight:800;color:${v.brTagFg};background:${v.brTagBg};border-radius:8px;padding:5px 9px">${esc(v.brTag)}</span>
          </div>
          <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:14px;text-align:center">
            <div class="brand-logo" style="font-size:30px;letter-spacing:-.02em">${esc(v.brTerm)}</div>
            ${v.brOpen ? `
            <div style="display:flex;flex-direction:column;gap:16px;animation:rise .18s ease">
              <div style="font-size:19px;font-weight:800;color:#5B4BF7;line-height:1.5">${esc(v.brMeaning)}</div>
              <div style="border-top:2px solid #F0EEF9;padding-top:14px;display:flex;flex-direction:column;gap:8px">
                <div style="font-size:14.5px;font-weight:700;line-height:1.75;color:#4A4468">${esc(v.brExPre)}<span style="background:#FFF0CE;box-shadow:0 -2px 0 #FFE3A3 inset;border-radius:5px;padding:1px 3px;color:#8A5A00">${esc(v.brExHit)}</span>${esc(v.brExPost)}</div>
                <div style="font-size:13px;font-weight:600;line-height:1.6;color:#A29CBE">${esc(v.brTr)}</div>
              </div>
            </div>` : `<div style="font-size:13.5px;font-weight:700;color:#C3BFD8">탭하면 뜻이 보여요</div>`}
          </div>
          <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;font-size:11.5px;font-weight:800;color:#C3BFD8">
            <span style="color:${v.brLeftFg}">← 헷갈려요</span><span style="color:${v.brRightFg}">알아요 →</span>
          </div>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;padding-top:14px">
        <button class="press" data-act="${on(v.brNo)}" style="flex:1;background:#fff;border:2px solid #FFD3D9;border-radius:16px;padding:15px;font-size:14.5px;font-weight:800;color:#E23B4E;box-shadow:0 3px 0 #FFD3D9">헷갈려요 ${v.brNoCount}</button>
        <button class="press" data-act="${on(v.brYes)}" style="flex:1;background:#fff;border:2px solid #CDEFBE;border-radius:16px;padding:15px;font-size:14.5px;font-weight:800;color:#3F9E2E;box-shadow:0 3px 0 #CDEFBE">알아요 ${v.brYesCount}</button>
      </div>
    </div>`);
}

function tabsBar(v) {
  return `
  <div style="position:absolute;left:0;right:0;bottom:0;background:#fff;border-top:2px solid #EFEDF7;padding:10px 14px 20px;display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:4px">
    ${v.tabs.map((t) => `
    <button data-act="${on(t.go)}" style="display:flex;flex-direction:column;align-items:center;gap:4px;padding:8px 0;border-radius:14px;background:${t.bg}">
      <span style="font-size:19px;color:${t.fg}">${t.icon}</span><span style="font-size:11px;font-weight:800;color:${t.fg}">${esc(t.label)}</span>
    </button>`).join('')}
  </div>`;
}

function screenLesson(v) {
  return wrap(`
    <div style="position:absolute;inset:0;display:flex;flex-direction:column;padding:24px 18px 0;background:#fff">
      ${v.showStamp ? `
      <div style="position:absolute;left:50%;top:38%;z-index:5;pointer-events:none;animation:stamp .9s cubic-bezier(.22,1.4,.36,1) forwards">
        <span class="brand-logo" style="display:inline-block;font-size:30px;color:#fff;background:${v.fbColor};padding:10px 22px;border-radius:14px;box-shadow:0 6px 0 ${v.fbShadow};white-space:nowrap">${esc(v.fbStamp)}</span>
      </div>` : ''}
      <div style="display:flex;align-items:center;gap:14px;padding:6px 0 20px">
        <button data-act="${on(v.quit)}" style="font-size:22px;color:#C3BFD8;width:22px;text-align:left">×</button>
        <div style="flex:1;height:15px;border-radius:99px;background:#F0EEF9;overflow:hidden"><div style="height:100%;background:#7BD94F;border-radius:99px;width:${v.lessonPct}"></div></div>
        <div class="brand-logo" style="display:flex;align-items:center;gap:5px;font-size:16px;color:#FF5A6E"><span>♥</span><span>${v.runHearts}</span></div>
      </div>
      <div style="flex:1;overflow:auto">
        <div style="display:flex;align-items:center;justify-content:space-between;gap:10px;padding-bottom:12px">
          <span style="font-size:11px;font-weight:800;letter-spacing:.1em;color:#A29CBE">${esc(v.qKicker)}</span>
          <span style="font-size:11px;font-weight:800;color:#5B4BF7;background:#EEEBFF;border-radius:8px;padding:5px 9px;white-space:nowrap">${esc(v.lessonScope)}</span>
        </div>
        <div style="display:flex;align-items:flex-end;gap:8px;padding-bottom:22px">
          ${poko(v.lessonMood, 60)}
          <div style="flex:1;border:2px solid #E5E2F0;border-radius:16px;padding:15px 16px;margin-bottom:12px;font-size:${v.qSize};font-weight:800;line-height:1.5;letter-spacing:-.01em">${esc(v.qPrompt)}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:10px;padding-bottom:20px">
          ${v.options.map((o) => `
          <button class="press" data-act="${on(o.pick)}" style="text-align:left;display:flex;align-items:center;gap:12px;background:${o.bg};border:2px solid ${o.border};border-radius:16px;padding:14px 16px;box-shadow:0 3px 0 ${o.border}">
            <span class="brand-logo" style="width:26px;height:26px;border-radius:8px;border:2px solid ${o.keyBorder};display:flex;align-items:center;justify-content:center;font-size:12px;color:${o.keyFg};flex:none">${o.key}</span>
            <span style="font-size:15.5px;font-weight:700;color:${o.fg};line-height:1.45">${esc(o.text)}</span>
          </button>`).join('')}
        </div>
      </div>
      ${v.notChecked ? `
      <div style="padding:8px 0 26px">
        <button class="press" data-act="${on(v.doCheck)}" style="width:100%;background:${v.checkBg};color:${v.checkFg};border-radius:16px;padding:17px;font-size:16px;font-weight:800;box-shadow:0 4px 0 ${v.checkShadow}">확인</button>
      </div>` : `
      <div style="margin:0 -18px;background:${v.fbBg};border-top:2px solid ${v.fbLine};padding:18px 18px 26px;display:flex;flex-direction:column;gap:12px;animation:rise .2s ease">
        <div style="display:flex;align-items:center;gap:10px">
          <span style="width:30px;height:30px;border-radius:50%;background:${v.fbColor};color:#fff;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:800">${v.fbMark}</span>
          <span style="font-size:17px;font-weight:800;color:${v.fbColor}">${esc(v.fbTitle)}</span>
        </div>
        <div style="font-size:13.5px;font-weight:800;color:${v.fbColor};line-height:1.6">${esc(v.fbAnswer)}</div>
        <div style="font-size:13.5px;font-weight:700;color:#4A4468;line-height:1.75">${esc(v.fbPre)}<span style="background:#FFF0CE;box-shadow:0 -2px 0 #FFE3A3 inset;border-radius:5px;padding:1px 3px;color:#8A5A00">${esc(v.fbHit)}</span>${esc(v.fbPost)}</div>
        <div style="font-size:13px;font-weight:600;color:${v.fbSub};line-height:1.7">${esc(v.fbNote)}</div>
        ${v.fbWrong ? `
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px">
          <button class="press" data-act="${on(v.doSave)}" style="background:${v.saveBg};color:${v.saveFg};border:2px solid ${v.saveBorder};border-radius:16px;padding:14px 10px;font-size:13.5px;font-weight:800;line-height:1.35;box-shadow:0 4px 0 ${v.saveShadow}">${esc(v.saveLabel)}</button>
          <button class="press" data-act="${on(v.doNext)}" style="background:${v.fbColor};color:#fff;border-radius:16px;padding:14px 10px;font-size:13.5px;font-weight:800;line-height:1.35;box-shadow:0 4px 0 ${v.fbShadow}">${esc(v.skipLabel)}</button>
        </div>` : `
        <button class="press" data-act="${on(v.doNext)}" style="width:100%;background:${v.fbColor};color:#fff;border-radius:16px;padding:16px;font-size:16px;font-weight:800;box-shadow:0 4px 0 ${v.fbShadow}">${esc(v.nextLabel)}</button>`}
      </div>`}
    </div>`);
}

function screenRes(v) {
  return wrap(`
    <div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;padding:48px 22px 30px;background:#fff">
      <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:18px;width:100%">
        <div style="animation:bob 2.2s ease-in-out infinite">${poko(v.resMood, 126)}</div>
        <div class="brand-logo" style="font-size:30px;color:${v.resColor};animation:pop .3s ease">${esc(v.resTitle)}</div>
        <div style="font-size:14.5px;font-weight:700;color:#7A749A;text-align:center;line-height:1.6">${esc(v.resSub)}</div>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;width:100%;padding-top:8px">
          ${v.resCards.map((c) => `
          <div style="border:2px solid ${c.color};border-radius:16px;overflow:hidden">
            <div style="background:${c.color};color:#fff;font-size:11px;font-weight:800;letter-spacing:.06em;padding:5px;text-align:center">${esc(c.label)}</div>
            <div style="padding:12px 6px;display:flex;align-items:center;justify-content:center;gap:5px;font-family:'Nunito',sans-serif;font-weight:900;font-size:19px;color:${c.color}"><span style="font-size:14px">${c.icon}</span><span>${c.value}</span></div>
          </div>`).join('')}
        </div>
      </div>
      <button class="press" data-act="${on(v.goPath)}" style="width:100%;background:${v.resColor};color:#fff;border-radius:16px;padding:17px;font-size:16px;font-weight:800;box-shadow:0 4px 0 ${v.resShadow}">계속하기</button>
    </div>`);
}

function renderAll(v) {
  let html = '';
  if (v.isSplash) html += screenSplash();
  else if (v.isIntro) html += screenIntro(v);
  else if (v.isAuthChoice) html += screenAuthChoice(v);
  else if (v.isAuthForm) html += screenAuthForm(v);
  else if (v.isAsk) html += screenAsk(v);
  else if (v.isLesson) html += screenLesson(v);
  else if (v.isRes) html += screenRes(v);
  else if (v.showTabs) {
    if (v.isPath) html += screenPath(v);
    else if (v.isWords) html += screenWords(v);
    else if (v.isMe) html += screenMe(v);
    else if (v.isBrowse) html += screenBrowse(v);
    else if (v.isBrowsePick) html += screenBrowsePick(v);
    html += tabsBar(v);
  }
  return html;
}

/* ============================================================
   부트스트랩
   ============================================================ */
let comp = null;
let root = null;
let renderQueued = false;

function scheduleRender() {
  if (renderQueued) return;
  renderQueued = true;
  Promise.resolve().then(() => { renderQueued = false; renderApp(); });
}

function renderApp() {
  const active = document.activeElement;
  const focusKey = active && active.dataset ? active.dataset.focusKey : null;
  const selStart = active && 'selectionStart' in active ? active.selectionStart : null;
  const selEnd = active && 'selectionStart' in active ? active.selectionEnd : null;

  handlers = {};
  handlerSeq = 0;
  const v = comp.renderVals();
  root.innerHTML = renderAll(v);

  if (focusKey) {
    const el = root.querySelector('[data-focus-key="' + focusKey + '"]');
    if (el) {
      el.focus();
      if (selStart != null && el.setSelectionRange) { try { el.setSelectionRange(selStart, selEnd); } catch (e) {} }
    }
  }
}

function findActEl(target, attr) {
  return target.closest ? target.closest('[' + attr + ']') : null;
}

function wireEvents() {
  root.addEventListener('click', (e) => {
    const el = findActEl(e.target, 'data-act');
    if (!el) return;
    Sound.unlock();
    if (el.tagName === 'BUTTON') Sound.tap();
    const fn = handlers[el.getAttribute('data-act')];
    if (fn) fn(e);
  });
  root.addEventListener('input', (e) => {
    const el = findActEl(e.target, 'data-oninput');
    if (!el) return;
    const fn = handlers[el.getAttribute('data-oninput')];
    if (fn) fn(e);
  });
  ['pointerdown', 'pointermove', 'pointerup', 'pointercancel'].forEach((type) => {
    root.addEventListener(type, (e) => {
      const attr = 'data-on' + type;
      const el = findActEl(e.target, attr);
      if (!el) return;
      const fn = handlers[el.getAttribute(attr)];
      if (fn) fn({ clientX: e.clientX, pointerId: e.pointerId, currentTarget: el, target: e.target, preventDefault: () => e.preventDefault() });
    });
  });
  // 'ended'는 버블링하지 않는 미디어 이벤트라 캡처 단계에서 델리게이션한다 (인트로 영상 자동 전환용)
  root.addEventListener('ended', (e) => {
    const el = e.target && e.target.getAttribute && e.target.getAttribute('data-onended') ? e.target : null;
    if (!el) return;
    const fn = handlers[el.getAttribute('data-onended')];
    if (fn) fn(e);
  }, true);
}

function boot() {
  root = document.getElementById('app-frame');
  comp = new Component();
  wireEvents();
  renderApp();
  comp.componentDidMount();
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
else boot();
