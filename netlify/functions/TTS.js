const fs = require('fs');
const path = require('path');

// SVG 내용에 포함될 수 있는 특수 문자를 이스케이프합니다.
function escapeSVG(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}


const fontLibrary = {
  // 기본 폰트
  'default': {
    family: "'Noto Sans KR', sans-serif",
    importUrl: "@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@100..900&display=swap');"
  },
  // --- 나눔 시리즈 ---
  'NM': { // Nanum Myeongjo
    family: "'Nanum Myeongjo', serif",
    importUrl: "@import url('https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&display=swap');"
  },
  'NGC': { // Nanum Gothic Coding
    family: "'Nanum Gothic Coding', monospace",
    importUrl: "@import url('https://fonts.googleapis.com/css2?family=Nanum+Gothic+Coding:wght@400;700&display=swap');"
  },
  'NPS': { // Nanum Pen Script
    family: "'Nanum Pen Script', cursive",
    importUrl: "@import url('https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap');"
  },
  'NBS': { // Nanum Brush Script
    family: "'Nanum Brush Script', cursive",
    importUrl: "@import url('https://fonts.googleapis.com/css2?family=Nanum+Brush+Script&display=swap');"
  },
  // --- 개성있는 한글/영문 폰트 ---
  'GU': { // Gugi
    family: "'Gugi', sans-serif",
    importUrl: "@import url('https://fonts.googleapis.com/css2?family=Gugi&display=swap');"
  },
  'DO': { // Dongle
    family: "'Dongle', sans-serif",
    importUrl: "@import url('https://fonts.googleapis.com/css2?family=Dongle:wght@300;400;700&display=swap');"
  },
  'DOK': { // Dokdo
    family: "'Dokdo', cursive",
    importUrl: "@import url('https://fonts.googleapis.com/css2?family=Dokdo&display=swap');"
  },
  'SD': { // Single Day
    family: "'Single Day', cursive",
    importUrl: "@import url('https://fonts.googleapis.com/css2?family=Single+Day&display=swap');"
  },
  'CF': { // Cute Font
    family: "'Cute Font', sans-serif",
    importUrl: "@import url('https://fonts.googleapis.com/css2?family=Cute+Font&display=swap');"
  },
  'BFO': { // Bagel Fat One
    family: "'Bagel Fat One', sans-serif",
    importUrl: "@import url('https://fonts.googleapis.com/css2?family=Bagel+Fat+One&display=swap');"
  },
  'DI': { // Diphylleia
    family: "'Diphylleia', serif",
    importUrl: "@import url('https://fonts.googleapis.com/css2?family=Diphylleia&display=swap');"
  },
  'GO': { // Grandiflora One
    family: "'Grandiflora One', serif",
    importUrl: "@import url('https://fonts.googleapis.com/css2?family=Grandiflora+One&display=swap');"
  }
};
// ==================================================================


// --- 리소스 읽기 (배경 이미지만) ---
let bgImageBase64;
try {
  const bgImagePath = path.resolve(__dirname, '../../images/background.jpg');
  bgImageBase64 = fs.readFileSync(bgImagePath, 'base64');
} catch (error) {
  console.error("배경 이미지를 읽는 중 오류 발생:", error);
}

function getImageMimeType(fileName) {
    const extension = path.extname(fileName).toLowerCase();
    if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
    if (extension === '.png') return 'image/png';
    return 'application/octet-stream';
}

exports.handler = async function(event) {
  try {
    const params = event.queryStringParameters || {};
    
    // --- 폰트 선택 ---
    const fontKey = params.font || 'default';
    const selectedFont = fontLibrary[fontKey] || fontLibrary['default'];

    const width = Math.min(parseInt(params.width, 10) || 800, 2000);
    const height = Math.min(parseInt(params.height, 10) || 400, 2000);

    let backgroundContent = '';
    if (params.useBg === 'true' && bgImageBase64) {
        const bgFit = params.bgFit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice';
        backgroundContent = `<image href="data:${getImageMimeType('background.jpg')};base64,${bgImageBase64}" x="0" y="0" width="100%" height="100%" preserveAspectRatio="${bgFit}"/>`;
    } else {
        const bgColor = escapeSVG(params.bgColor) || '#000000';
        backgroundContent = `<rect width="100%" height="100%" fill="${bgColor}" />`;
    }

    const textColor = escapeSVG(params.textColor) || '#ffffff';
    const textToShow = escapeSVG(params.text || 'Font Keyword Test!');
    const fontSize = Math.min(parseInt(params.fontSize, 10) || Math.min(width / 12, height / 5), 1000);
    const fontWeight = parseInt(params.fontWeight, 10) || 400;

    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <style>${selectedFont.importUrl}</style>
        ${backgroundContent}
        <text
          x="50%" y="50%"
          font-family="${selectedFont.family}"
          font-size="${fontSize}"
          font-weight="${fontWeight}"
          fill="${textColor}"
          text-anchor="middle" dominant-baseline="middle"
          paint-order="stroke" stroke="#000000" stroke-width="2px"
        >
          ${textToShow}
        </text>
      </svg>
    `;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline' fonts.googleapis.com; font-src fonts.gstatic.com; img-src data:;",
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
      body: svg.trim(),
    };
  } catch (err) {
    const errorSvg = `<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f8d7da" /><text x="10" y="50%" font-family="monospace" font-size="16" fill="#721c24" dominant-baseline="middle">Error: ${escapeSVG(err.message)}</text></svg>`;
    return { statusCode: 500, headers: { 'Content-Type': 'image/svg+xml' }, body: errorSvg.trim() };
  }
};
