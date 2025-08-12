const fs = require('fs');
const path = require('path');

// SVG 내용에 포함될 수 있는 특수 문자를 이스케이프합니다.
function escapeSVG(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// ★ 핵심 로직 1: '{bold}' 구문을 파싱하여 tspan으로 변환하는 함수 ★
function parseBoldText(line) {
  // 1. 텍스트를 {굵은글씨} 패턴으로 나눕니다.
  // ex: "일반 {굵은} 텍스트" -> ["일반 ", "굵은", " 텍스트"]
  const parts = line.split(/\{([^}]+)\}/g).filter(part => part);

  // 2. 각 부분을 tspan으로 변환합니다.
  return parts.map((part, index) => {
    // split의 결과에서 홀수 번째 인덱스(1, 3, 5...)가 {괄호} 안의 내용입니다.
    const isBold = index % 2 === 1;
    if (isBold) {
      // 굵은 텍스트는 font-weight을 700(bold)으로 지정합니다.
      return `<tspan font-weight="700">${part}</tspan>`;
    } else {
      // 일반 텍스트는 별도 스타일 없이 그대로 둡니다.
      return `<tspan>${part}</tspan>`;
    }
  }).join('');
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

    const fontKey = params.font || 'default';
    const selectedFont = fontLibrary[fontKey] || fontLibrary['default'];
    const textColor = escapeSVG(params.textColor) || '#ffffff';
    const fontSize = parseInt(params.fontSize, 10) || 16;
    const fontWeight = parseInt(params.fontWeight, 10) || 400;

    let backgroundContent = '';
    if (params.useBg === 'true' && bgImageBase64) {
        const bgFit = params.bgFit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice';
        backgroundContent = `<image href="data:${getImageMimeType('background.jpg')};base64,${bgImageBase64}" x="0" y="0" width="100%" height="100%" preserveAspectRatio="${bgFit}"/>`;
    } else {
        const bgColor = escapeSVG(params.bgColor) || '#000000';
        backgroundContent = `<rect width="100%" height="100%" fill="${bgColor}" />`;
    }

    const align = params.align || 'left';
    let textAnchor, x;
    const padding = 20;
    switch (align) {
      case 'center': textAnchor = 'middle'; x = '50%'; break;
      case 'right': textAnchor = 'end'; x = width - padding; break;
      default: textAnchor = 'start'; x = padding; break;
    }

    // ★ 핵심 로직 2: 줄바꿈과 굵기 변환 로직 통합 ★
    const rawText = params.text || '이것은 {부분 강조} 기능입니다.|{중요한 내용}만 두껍게 표시할 수 있습니다.';
    const lines = escapeSVG(rawText).split('|');
    const lineHeight = 1.6;

    const textElements = lines.map((line, index) => {
      // 각 줄에 대해 굵기 파싱 함수를 호출합니다.
      const innerContent = parseBoldText(line);
      const dy = index === 0 ? '0' : `${lineHeight}em`;
      // 한 줄을 나타내는 tspan 안에, 굵기별로 나뉜 tspan들이 들어갑니다.
      return `<tspan x="${x}" dy="${dy}">${innerContent}</tspan>`;
    }).join('');
    
    const totalTextBlockHeight = (lines.length - 1) * lineHeight * fontSize + fontSize;
    const startY = (height / 2) - (totalTextBlockHeight / 2) + (fontSize * 0.7);

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
