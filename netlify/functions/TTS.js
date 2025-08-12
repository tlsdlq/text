// fs 모듈은 더 이상 필요 없습니다.
// const fs = require('fs');
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

// 로컬 파일 경로 대신, 배포된 사이트의 이미지 URL 경로를 사용합니다.
const backgroundLibrary = {
  'default': '/images/background.jpg',
  'stars': '/images/background.jpg', // stars도 동일한 이미지를 사용
  'matrix': '/images/matrix.jpg'
};

// 이 함수는 더 이상 필요 없습니다.
// function getImageMimeType(filePath) { ... }

exports.handler = async function(event) {
  try {
    const params = event.queryStringParameters || {};
    const width = 1200;

    const bgKey = params.bg || 'default';
    // backgroundLibrary에서 직접 URL을 가져옵니다.
    const bgUrl = backgroundLibrary[bgKey] || backgroundLibrary['default'];
    
    // Base URL을 구성합니다. Netlify 환경 변수나 요청 헤더를 사용할 수 있습니다.
    // 여기서는 간단하게 상대 경로를 사용하지만, 전체 URL을 사용하는 것이 더 안정적입니다.
    const siteUrl = `https://${event.headers.host}`; // 예: https://your-site.netlify.app
    const fullBgUrl = `${siteUrl}${bgUrl}`;
    
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
    
    // Base64 데이터 대신 URL을 href에 직접 삽입합니다.
    const backgroundContent = `<image href="${fullBgUrl}" x="0" y="0" width="${width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>`;
    
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
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
      body: svg.trim(),
    };
  } catch (err) {
    const errorSvg = `<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f8d7da" /><text x="10" y="50%" font-family="monospace" font-size="16" fill="#721c24" dominant-baseline="middle">Error: ${escapeSVG(err.message)}</text></svg>`;
    return { statusCode: 500, headers: { 'Content-Type': 'image/svg+xml' }, body: errorSvg.trim() };
  }
};
