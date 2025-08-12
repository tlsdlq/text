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

const backgroundLibrary = {
  'default': path.resolve(__dirname, '../../images/background.jpg'),
  'stars': path.resolve(__dirname, '../../images/background.jpg'),
  'matrix': path.resolve(__dirname, '../../images/matrix.jpg')
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

    const bgKey = params.bg || 'default';
    const textColor = escapeSVG(params.textColor) || '#ffffff';
    const fontSize = parseInt(params.fontSize, 10) || 16;
    
    const align = params.align || 'left';
    let textAnchor, x;
    const paddingX = 40;
    switch (align) {
      case 'center': textAnchor = 'middle'; x = width / 2; break;
      case 'right': textAnchor = 'end'; x = width - paddingX; break;
      default: textAnchor = 'start'; x = paddingX; break;
    }

    const rawText = params.text || '이제 폰트 기능이 없습니다.|시스템 기본 폰트를 사용합니다.';
    const lines = escapeSVG(rawText).split('|');
    const lineHeight = 1.6;
    const paddingY = 60;

    const totalTextBlockHeight = (lines.length - 1) * (lineHeight * fontSize) + fontSize;
    const height = Math.round(totalTextBlockHeight + (paddingY * 2));
    
    // --- 배경 이미지 처리 로직 수정 ---
    let backgroundContent;
    const useLinking = params.linking === 'true';

    if (useLinking) {
      // 성능 모드: backgroundImage 함수를 URL로 참조
      const imageUrl = `/.netlify/functions/backgroundImage?bg=${bgKey}`;
      backgroundContent = `<image href="${imageUrl}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>`;
    } else {
      // 호환성 모드 (기본): Base64로 내장
      const bgPath = backgroundLibrary[bgKey] || backgroundLibrary['default'];
      const bgData = fs.readFileSync(bgPath, 'base64');
      const bgMimeType = getImageMimeType(bgPath);
      backgroundContent = `<image href="data:${bgMimeType};base64,${bgData}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>`;
    }
    // --- 수정 끝 ---
    
    const startY = Math.round((height / 2) - (totalTextBlockHeight / 2) + (fontSize * 0.8));

    const textElements = lines.map((line, index) => {
      const innerContent = parseBoldText(line);
      const dy = index === 0 ? '0' : `${lineHeight}em`;
      return `<tspan x="${x}" dy="${dy}">${innerContent}</tspan>`;
    }).join('');

    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        ${backgroundContent}
        <text
          y="${startY}"
          font-family="sans-serif"
          font-size="${fontSize}px"
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
        // SVG 자체의 캐시는 짧게 가져가거나, 파라미터가 동일하면 캐시되도록 설정합니다.
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
      body: svg.trim(),
    };
  } catch (err) {
    const errorSvg = `<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f8d7da" /><text x="10" y="50%" font-family="monospace" font-size="16" fill="#721c24" dominant-baseline="middle">Error: ${escapeSVG(err.message)}</text></svg>`;
    return { statusCode: 500, headers: { 'Content-Type': 'image/svg+xml' }, body: errorSvg.trim() };
  }
};
