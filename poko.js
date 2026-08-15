/* poko 마스코트 — 실제 사진을 못 불러올 때만 쓰는 대체용 인라인 SVG.
   토끼 캐릭터(느껴진 양모 인형: 크림색 몸, 갈색 끝 귀, 동그란 안경, 하늘색 가디건)를
   단순화해서 그린다. mood: front | 3q | happy | oh | think | calm | wink */
function pokoSVG(mood) {
  const CREAM = '#F7F0E3';
  const EAR_TIP = '#B5763F';
  const EAR_INNER = '#F3B8C4';
  const SWEATER = '#9DBEE0';
  const COLLAR = '#E4E9ED';
  const BUTTON = '#5B7BA6';
  const GLASSES = '#3A3530';
  const NOSE = '#E8949E';
  const CHEEK = '#F5B8B0';

  // 눈/입 파츠 — mood별로 교체
  const faces = {
    front: {
      eyes: '<circle cx="-16" cy="-4" r="9" fill="#2B2545"/><circle cx="16" cy="-4" r="9" fill="#2B2545"/><circle cx="-13" cy="-7" r="2.6" fill="#fff"/><circle cx="19" cy="-7" r="2.6" fill="#fff"/>',
      mouth: '<path d="M-7 14 Q0 20 7 14" stroke="#2B2545" stroke-width="3" fill="none" stroke-linecap="round"/>',
      tilt: 0,
    },
    '3q': {
      eyes: '<circle cx="-10" cy="-4" r="8" fill="#2B2545"/><circle cx="20" cy="-4" r="8" fill="#2B2545"/><circle cx="-7" cy="-7" r="2.3" fill="#fff"/><circle cx="23" cy="-7" r="2.3" fill="#fff"/>',
      mouth: '<path d="M2 14 Q10 18 16 13" stroke="#2B2545" stroke-width="3" fill="none" stroke-linecap="round"/>',
      tilt: -4,
    },
    happy: {
      eyes: '<path d="M-24 -4 Q-16 -14 -8 -4" stroke="#2B2545" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M8 -4 Q16 -14 24 -4" stroke="#2B2545" stroke-width="4.5" fill="none" stroke-linecap="round"/>',
      mouth: '<path d="M-10 12 Q0 26 10 12 Q0 18 -10 12 Z" fill="#2B2545"/>',
      tilt: 2,
    },
    oh: {
      eyes: '<circle cx="-16" cy="-4" r="10.5" fill="#2B2545"/><circle cx="16" cy="-4" r="10.5" fill="#2B2545"/><circle cx="-16" cy="-4" r="4" fill="#fff"/><circle cx="16" cy="-4" r="4" fill="#fff"/>',
      mouth: '<ellipse cx="0" cy="16" rx="6" ry="8" fill="#2B2545"/>',
      tilt: 0,
      brows: '<path d="M-24 -18 L-8 -14" stroke="#2B2545" stroke-width="3" stroke-linecap="round"/><path d="M24 -18 L8 -14" stroke="#2B2545" stroke-width="3" stroke-linecap="round"/>',
    },
    think: {
      eyes: '<path d="M-24 -6 Q-16 -2 -8 -6" stroke="#2B2545" stroke-width="4.5" fill="none" stroke-linecap="round"/><circle cx="17" cy="-6" r="8" fill="#2B2545"/><circle cx="20" cy="-9" r="2.2" fill="#fff"/>',
      mouth: '<path d="M-6 15 Q2 12 9 14" stroke="#2B2545" stroke-width="3" fill="none" stroke-linecap="round"/>',
      tilt: -6,
    },
    calm: {
      eyes: '<path d="M-24 -4 Q-16 2 -8 -4" stroke="#2B2545" stroke-width="4.5" fill="none" stroke-linecap="round"/><path d="M8 -4 Q16 2 24 -4" stroke="#2B2545" stroke-width="4.5" fill="none" stroke-linecap="round"/>',
      mouth: '<path d="M-8 13 Q0 19 8 13" stroke="#2B2545" stroke-width="3" fill="none" stroke-linecap="round"/>',
      tilt: 0,
    },
    wink: {
      eyes: '<path d="M-24 -4 Q-16 2 -8 -4" stroke="#2B2545" stroke-width="4.5" fill="none" stroke-linecap="round"/><circle cx="16" cy="-4" r="9" fill="#2B2545"/><circle cx="19" cy="-7" r="2.6" fill="#fff"/>',
      mouth: '<path d="M-10 12 Q0 24 10 12 Q0 17 -10 12 Z" fill="#2B2545"/>',
      tilt: 3,
    },
  };
  const f = faces[mood] || faces.front;

  return `
<svg viewBox="0 0 200 220" xmlns="http://www.w3.org/2000/svg" style="display:block;width:100%;height:100%">
  <ellipse cx="100" cy="207" rx="42" ry="7" fill="#2B2545" opacity="0.08"/>
  <g transform="translate(100 118) rotate(${f.tilt})">
    <!-- ears (뒤에 깔림) -->
    <g transform="rotate(-14)">
      <ellipse cx="-34" cy="-92" rx="15" ry="46" fill="${CREAM}"/>
      <ellipse cx="-34" cy="-88" rx="8" ry="34" fill="${EAR_INNER}"/>
      <path d="M-49 -122 A15 20 0 0 1 -19 -122 L-22 -105 A12 14 0 0 0 -46 -105 Z" fill="${EAR_TIP}"/>
    </g>
    <g transform="rotate(14)">
      <ellipse cx="34" cy="-92" rx="15" ry="46" fill="${CREAM}"/>
      <ellipse cx="34" cy="-88" rx="8" ry="34" fill="${EAR_INNER}"/>
      <path d="M19 -122 A15 20 0 0 1 49 -122 L46 -105 A12 14 0 0 0 22 -105 Z" fill="${EAR_TIP}"/>
    </g>
    <!-- 가디건 -->
    <path d="M-46 96 Q-50 46 -34 30 L34 30 Q50 46 46 96 Z" fill="${SWEATER}"/>
    <path d="M-14 30 L0 46 L14 30 L14 44 L0 58 L-14 44 Z" fill="${COLLAR}"/>
    <circle cx="0" cy="60" r="3" fill="${BUTTON}"/>
    <circle cx="0" cy="76" r="3" fill="${BUTTON}"/>
    <!-- 머리 -->
    <circle cx="0" cy="-6" r="54" fill="${CREAM}"/>
    <!-- 볼터치 -->
    <ellipse cx="-34" cy="4" rx="9" ry="6" fill="${CHEEK}" opacity="0.7"/>
    <ellipse cx="34" cy="4" rx="9" ry="6" fill="${CHEEK}" opacity="0.7"/>
    <!-- 눈썹 (있으면) -->
    ${f.brows || ''}
    <!-- 눈/입 -->
    ${f.eyes}
    ${f.mouth}
    <!-- 코 -->
    <ellipse cx="0" cy="7" rx="4" ry="3" fill="${NOSE}"/>
    <!-- 동그란 안경 -->
    <circle cx="-17" cy="-4" r="15" fill="none" stroke="${GLASSES}" stroke-width="2.5"/>
    <circle cx="17" cy="-4" r="15" fill="none" stroke="${GLASSES}" stroke-width="2.5"/>
    <path d="M-2 -4 L2 -4" stroke="${GLASSES}" stroke-width="2.5"/>
    <path d="M-32 -6 L-40 -10" stroke="${GLASSES}" stroke-width="2.5" stroke-linecap="round"/>
    <path d="M32 -6 L40 -10" stroke="${GLASSES}" stroke-width="2.5" stroke-linecap="round"/>
  </g>
</svg>`.trim();
}

// Higgsfield로 생성한 실제 캐릭터(느껴진 양모 토끼 인형) 컷아웃 이미지.
// 외부 CDN을 못 여는 샌드박스(Artifact 미리보기 등)에서는 onerror로 SVG 대체 마스코트로 자동 폴백된다.
const POKO_MOOD_IMG = {
  front: 'https://d8j0ntlcm91z4.cloudfront.net/user_3CDQYaE0WVY3MST2ktDWtEYwngN/hf_20260814_144657_abbc0922-a9ce-43e2-9647-fb0d7e3e48aa.png',
  '3q': 'https://d8j0ntlcm91z4.cloudfront.net/user_3CDQYaE0WVY3MST2ktDWtEYwngN/hf_20260814_144705_ab154869-65ff-478f-8cbb-74781251f171.png',
  happy: 'https://d8j0ntlcm91z4.cloudfront.net/user_3CDQYaE0WVY3MST2ktDWtEYwngN/hf_20260814_144709_931781f6-45ff-43b2-b653-d046a7526f60.png',
  oh: 'https://d8j0ntlcm91z4.cloudfront.net/user_3CDQYaE0WVY3MST2ktDWtEYwngN/hf_20260814_144712_002d8f9c-f464-4125-a4f8-4135b9e8d378.png',
  think: 'https://d8j0ntlcm91z4.cloudfront.net/user_3CDQYaE0WVY3MST2ktDWtEYwngN/hf_20260814_144715_22d6a6a1-ead4-4965-8c68-d6beb2c9c379.png',
  calm: 'https://d8j0ntlcm91z4.cloudfront.net/user_3CDQYaE0WVY3MST2ktDWtEYwngN/hf_20260814_144718_4b66e8e9-c24c-41e0-8697-88000d11c40b.png',
  wink: 'https://d8j0ntlcm91z4.cloudfront.net/user_3CDQYaE0WVY3MST2ktDWtEYwngN/hf_20260814_144723_9fe73695-2070-4d30-a3a2-71c5d81160dd.png',
};
// 세로:가로 비율 — front/3q는 전신 컷(9:16), 나머지는 상반신 클로즈업(4:5)
const POKO_MOOD_RATIO = { front: 16 / 9, '3q': 16 / 9, happy: 5 / 4, oh: 5 / 4, think: 5 / 4, calm: 5 / 4, wink: 5 / 4 };

function pokoHTML(mood, px) {
  const ratio = POKO_MOOD_RATIO[mood] || 1.1;
  const h = Math.round(px * ratio);
  const url = POKO_MOOD_IMG[mood];
  if (!url) return `<div style="width:${px}px;height:${h}px;flex:none">${pokoSVG(mood)}</div>`;
  // onerror는 stale ID를 document에서 다시 찾지 않고, 이벤트를 받은 이미지 자신의
  // 부모(this.parentElement)를 직접 갈아끼운다 — 리렌더로 이미 교체된 트리를 가리키다
  // null이 되는 경쟁 상태를 피하기 위함.
  return `<div style="width:${px}px;height:${h}px;flex:none">` +
    `<img src="${url}" alt="" draggable="false" style="width:100%;height:100%;object-fit:contain;display:block" ` +
    `onerror="this.parentElement.innerHTML=window.pokoSVG('${mood}')" /></div>`;
}

if (typeof window !== 'undefined') { window.pokoSVG = pokoSVG; window.pokoHTML = pokoHTML; }
