const fs = require('fs');
const path = require('path');

// SVG 내용에 포함될 수 있는 특수 문자를 이스케이프합니다.
function escapeSVG(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const fontLibrary = {
  'default': { family: "'Noto Sans KR', sans-serif", importUrl: "@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@100..900&display=swap');" },
  'NM': { family: "'Nanum Myeongjo', serif", importUrl: "@import url('https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&display=swap');" },
  'NGC': { family: "'Nanum Gothic Coding', monospace", importUrl: "@import url('https://fonts.googleapis.com/css2?family=Nanum+Gothic+Coding:wght@400;700&display=swap');" },
  'NPS': { family: "'Nanum Pen Script', cursive", importUrl: "@import url('https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&display=swap');" },
  'NBS': { family: "'Nanum Brush Script', cursive", importUrl: "@import url('https://fonts.googleapis.com/css2?family=Nanum+Brush+Script&display=swap');" },
  'GU': { family: "'Gugi', sans-serif", importUrl: "@import url('https://fonts.googleapis.com/css2?family=Gugi&display=swap');" },
  'DO': { family: "'Dongle', sans-serif", importUrl: "@import url('https://fonts.googleapis.com/css2?family=Dongle:wght@300;400;700&display=swap');" },
  'DOK': { family: "'Dokdo', cursive", importUrl: "@import url('https://fonts.googleapis.com/css2?family=Dokdo&display=swap');" },
  'SD': { family: "'Single Day', cursive", importUrl: "@import url('https://fonts.googleapis.com/css2?family=Single+Day&display=swap');" },
  'CF': { family: "'Cute Font', sans-serif", importUrl: "@import url('https://fonts.googleapis.com/css2?family=Cute+Font&display=swap');" },
  'BFO': { family: "'Bagel Fat One', sans-serif", importUrl: "@import url('https://fonts.googleapis.com/css2?family=Bagel+Fat+One&display=swap');" },
  'DI': { family: "'Diphylleia', serif", importUrl: "@import url('https://fonts.googleapis.com/css2?family=Diphylleia&display=swap');" },
  'GO': { family: "'Grandiflora One', serif", importUrl: "@import url('https://fonts.googleapis.com/css2?family=Grandiflora+One&display=swap');" }
};

let bgImageBase64;
try {
  bgImageBase64 = fs.readFileSync(path.resolve(__dirname, '../../images/background.jpg'), 'base64');
} catch (error) { console.error("배경 이미지 읽기 오류:", error); }

function getImageMimeType(fileName) {
  const ext = path.extname(fileName).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  return 'application/octet-stream';
}

exports.handler = async function(event) {
  try {
    const params = event.queryStringParameters || {};
    const width = Math.min(parseInt(params.width, 10) || 800, 2000);
    const height = Math.min(parseInt(params.height, 10) || 400, 2000);

    // --- 폰트 및 텍스트 스타일 처리 ---
    const fontKey = params.font || 'default';
    const selectedFont = fontLibrary[fontKey] || fontLibrary['default'];
    const textColor = escapeSVG(params.textColor) || '#ffffff';
    // ★ 변경점 1: 폰트 크기 기본값을 16px로 변경
    const fontSize = parseInt(params.fontSize, 10) || 16;
    const fontWeight = parseInt(params.fontWeight, 10) || 400;

    // --- 배경 처리 ---
    let backgroundContent = '';
    if (params.useBg === 'true' && bgImageBase64) {
        const bgFit = params.bgFit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice';
        backgroundContent = `<image href="data:${getImageMimeType('background.jpg')};base64,${bgImageBase64}" x="0" y="0" width="100%" height="100%" preserveAspectRatio="${bgFit}"/>`;
    } else {
        const bgColor = escapeSVG(params.bgColor) || '#000000';
        backgroundContent = `<rect width="100%" height="100%" fill="${bgColor}" />`;
    }

    // ★ 핵심 로직 1: 정렬 기능 처리 ★
    const align = params.align || 'left'; // 기본값은 'left'
    let textAnchor;
    let x; // 텍스트의 x축 위치
    const padding = 20; // 좌우 여백

    switch (align) {
      case 'center':
        textAnchor = 'middle';
        x = '50%';
        break;
      case 'right':
        textAnchor = 'end';
        x = width - padding;
        break;
      default: // 'left'
        textAnchor = 'start';
        x = padding;
        break;
    }

    // ★ 핵심 로직 2: 줄바꿈 기능 처리 ★
    const textToShow = escapeSVG(params.text || '왼쪽 정렬 기본값입니다.|줄바꿈은 | 문자를 사용하세요.');
    const lines = textToShow.split('|'); // '|' 문자를 기준으로 텍스트를 나눕니다.
    const lineHeight = 1.6; // 줄 간격 (em 단위)

    // 여러 줄의 텍스트(<tspan>)를 생성합니다.
    const textElements = lines.map((line, index) => {
      // 첫 번째 줄은 dy 속성이 없고, 두 번째 줄부터 이전 줄과의 간격을 설정합니다.
      const dy = index === 0 ? '0' : `${lineHeight}em`;
      return `<tspan x="${x}" dy="${dy}">${line}</tspan>`;
    }).join('');
    
    // 텍스트 블록 전체를 수직으로 가운데 정렬하기 위한 시작 y 위치 계산
    const totalTextBlockHeight = (lines.length - 1) * lineHeight * fontSize + fontSize;
    const startY = (height / 2) - (totalTextBlockHeight / 2) + (fontSize * 0.7);


    // --- SVG 최종 생성 ---
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <style>${selectedFont.importUrl}</style>
        ${backgroundContent}
        <text
          y="${startY}"
          font-family="${selectedFont.family}"
          font-size="${fontSize}px"
          font-weight="${fontWeight}"
          fill="${textColor}"
          text-anchor="${textAnchor}"
          paint-order="stroke" stroke="#000000" stroke-width="1px"
        >
          ${textElements}
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
