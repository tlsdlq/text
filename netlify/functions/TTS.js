const fs = require('fs');
const path = require('path');

function escapeSVG(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function parseBoldText(line) {
  const parts = line.split(/\{([^}]+)\}/g).filter(part => part);
  return parts.map((part, index) => {
    const isBold = index % 2 === 1;
    if (isBold) {
      return `<tspan font-weight="700">${part}</tspan>`;
    } else {
      return `<tspan>${part}</tspan>`;
    }
  }).join('');
}

// ★★★ 1. 배경 라이브러리 (파일 경로를 가리킴) ★★★
const backgroundLibrary = {
  'default': path.resolve(__dirname, '../../images/background.jpg'),
  'stars': path.resolve(__dirname, '../../images/background.jpg'),
  'matrix': path.resolve(__dirname, '../../images/matrix.jpg')
};

const fontLibrary = {
  'default': { family: "'Noto Sans KR', sans-serif", importUrl: "@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@100..900&amp;display=swap');" },
  'NM': { family: "'Nanum Myeongjo', serif", importUrl: "@import url('https://fonts.googleapis.com/css2?family=Nanum+Myeongjo:wght@400;700;800&amp;display=swap');" },
  'NGC': { family: "'Nanum Gothic Coding', monospace", importUrl: "@import url('https://fonts.googleapis.com/css2?family=Nanum+Gothic+Coding:wght@400;700&amp;display=swap');" },
  'NPS': { family: "'Nanum Pen Script', cursive", importUrl: "@import url('https://fonts.googleapis.com/css2?family=Nanum+Pen+Script&amp;display=swap');" },
  'NBS': { family: "'Nanum Brush Script', cursive", importUrl: "@import url('https://fonts.googleapis.com/css2?family=Nanum+Brush+Script&amp;display=swap');" },
  'GU': { family: "'Gugi', sans-serif", importUrl: "@import url('https://fonts.googleapis.com/css2?family=Gugi&amp;display=swap');" },
  'DO': { family: "'Dongle', sans-serif", importUrl: "@import url('https://fonts.googleapis.com/css2?family=Dongle:wght@300;400;700&amp;display=swap');" },
  'DOK': { family: "'Dokdo', cursive", importUrl: "@import url('https://fonts.googleapis.com/css2?family=Dokdo&amp;display=swap');" },
  'SD': { family: "'Single Day', cursive", importUrl: "@import url('https://fonts.googleapis.com/css2?family=Single+Day&amp;display=swap');" },
  'CF': { family: "'Cute Font', sans-serif", importUrl: "@import url('https://fonts.googleapis.com/css2?family=Cute+Font&amp;display=swap');" },
  'BFO': { family: "'Bagel Fat One', sans-serif", importUrl: "@import url('https://fonts.googleapis.com/css2?family=Bagel+Fat+One&amp;display=swap');" },
  'DI': { family: "'Diphylleia', serif", importUrl: "@import url('https://fonts.googleapis.com/css2?family=Diphylleia&amp;display=swap');" },
  'GO': { family: "'Grandiflora One', serif", importUrl: "@import url('https://fonts.googleapis.com/css2?family=Grandiflora+One&amp;display=swap');" }
};

function getImageMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  return 'application/octet-stream';
}


exports.handler = async function(event) {
  try {
    const params = event.queryStringParameters || {};
    const width = 1200;

    // --- 배경 선택 및 데이터 변환 ---
    const bgKey = params.bg || 'default';
    const bgPath = backgroundLibrary[bgKey] || backgroundLibrary['default'];
    
    // ★★★ 2. 선택된 배경 이미지를 읽어 Base64로 인코딩 ★★★
    const bgData = fs.readFileSync(bgPath, 'base64');
    const bgMimeType = getImageMimeType(bgPath);

    // 폰트 및 텍스트 처리
    const fontKey = params.font || 'default';
    const selectedFont = fontLibrary[fontKey] || fontLibrary['default'];
    const textColor = escapeSVG(params.textColor) || '#ffffff';
    const fontSize = parseInt(params.fontSize, 10) || 16;
    const fontWeight = parseInt(params.fontWeight, 10) || 400;

    const align = params.align || 'left';
    let textAnchor, x;
    const paddingX = 40;
    switch (align) {
      case 'center': textAnchor = 'middle'; x = width / 2; break;
      case 'right': textAnchor = 'end'; x = width - paddingX; break;
      default: textAnchor = 'start'; x = paddingX; break;
    }

    const rawText = params.text || '배경 이미지가 이제|어디서든 잘 보입니다.';
    const lines = escapeSVG(rawText).split('|');
    const lineHeight = 1.6;
    const paddingY = 60;

    const totalTextBlockHeight = (lines.length - 1) * (lineHeight * fontSize) + fontSize;
    const height = Math.round(totalTextBlockHeight + (paddingY * 2));
    
    // ★★★ 3. 배경 이미지 href에 Base64 데이터 직접 삽입 ★★★
    const backgroundContent = `<image href="data:${bgMimeType};base64,${bgData}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>`;
    
    const startY = Math.round((height / 2) - (totalTextBlockHeight / 2) + (fontSize * 0.8));

    const textElements = lines.map((line, index) => {
      const innerContent = parseBoldText(line);
      const dy = index === 0 ? '0' : `${lineHeight}em`;
      return `<tspan x="${x}" dy="${dy}">${innerContent}</tspan>`;
    }).join('');

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
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
      body: svg.trim(),
    };
  } catch (err) {
    const errorSvg = `<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f8d7da" /><text x="10" y="50%" font-family="monospace" font-size="16" fill="#721c24" dominant-baseline="middle">Error: ${escapeSVG(err.message)}</text></svg>`;
    return { statusCode: 500, headers: { 'Content-Type': 'image/svg+xml' }, body: errorSvg.trim() };
  }
};
