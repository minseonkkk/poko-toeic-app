/* poko 사운드 — 합성 효과음 (외부 오디오 파일 없이 Web Audio API로 즉석 생성)
   브라우저 자동재생 정책 때문에 사용자의 첫 탭 이후에 AudioContext를 연다. */
const Sound = (() => {
  let ctx = null;
  let unlocked = false;
  let enabled = true;

  function ensureCtx() {
    if (ctx) return ctx;
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  }

  function unlock() {
    const c = ensureCtx();
    if (!c) return;
    if (c.state === 'suspended') c.resume().catch(() => {});
    unlocked = true;
  }

  // note: 하나 이상의 {freq, at, dur, type, gain} 톤을 겹쳐 재생
  function tone(notes, { gain = 0.09 } = {}) {
    if (!enabled) return;
    const c = ensureCtx();
    if (!c) return;
    // resume()은 비동기라 suspended 상태에서도 일단 스케줄링은 진행한다 —
    // resume이 곧 끝나면 예약해 둔 오실레이터가 그대로 재생된다.
    if (c.state === 'suspended') c.resume().catch(() => {});
    const now = c.currentTime;
    notes.forEach((n) => {
      const osc = c.createOscillator();
      const g = c.createGain();
      osc.type = n.type || 'sine';
      osc.frequency.setValueAtTime(n.freq, now + (n.at || 0));
      if (n.slide) osc.frequency.exponentialRampToValueAtTime(n.slide, now + (n.at || 0) + (n.dur || 0.12));
      const peak = (n.gain != null ? n.gain : gain);
      g.gain.setValueAtTime(0.0001, now + (n.at || 0));
      g.gain.exponentialRampToValueAtTime(peak, now + (n.at || 0) + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, now + (n.at || 0) + (n.dur || 0.12));
      osc.connect(g).connect(c.destination);
      osc.start(now + (n.at || 0));
      osc.stop(now + (n.at || 0) + (n.dur || 0.12) + 0.02);
    });
  }

  return {
    unlock,
    setEnabled: (v) => { enabled = v; },
    isEnabled: () => enabled,
    // 버튼 탭 — 짧고 가벼운 클릭음
    tap: () => tone([{ freq: 720, dur: 0.05, type: 'triangle', gain: 0.05 }]),
    // 카드 넘김 (훑기 스와이프)
    swipe: () => tone([{ freq: 500, slide: 900, dur: 0.09, type: 'sine', gain: 0.05 }]),
    // 정답 — 밝은 상승 2음
    correct: () => tone([
      { freq: 660, dur: 0.09, type: 'sine', gain: 0.08 },
      { freq: 880, at: 0.08, dur: 0.14, type: 'sine', gain: 0.09 },
    ]),
    // 오답 — 낮은 하강 톤
    wrong: () => tone([{ freq: 300, slide: 160, dur: 0.18, type: 'sawtooth', gain: 0.055 }]),
    // 레슨/세트 완료 — 짧은 팡파르
    done: () => tone([
      { freq: 520, dur: 0.1, type: 'triangle', gain: 0.07 },
      { freq: 660, at: 0.09, dur: 0.1, type: 'triangle', gain: 0.07 },
      { freq: 880, at: 0.18, dur: 0.22, type: 'triangle', gain: 0.09 },
    ]),
  };
})();

if (typeof window !== 'undefined') window.Sound = Sound;
