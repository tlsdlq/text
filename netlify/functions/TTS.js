// --- 유틸리티 함수 ---

function escapeSVG(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
}

function parseBoldText(line) {
  const parts = line.split(/\{([^}]+)\}/g).filter(part => part);
  return parts.map((part, index) => {
    const isBold = index % 2 === 1;
    return isBold ? `<tspan font-weight="700">${part}</tspan>` : `<tspan>${part}</tspan>`;
  }).join('');
}

// --- SVG 배경 생성 함수 ---

function generateBackgroundSVG(bgType, width, height) {
  switch (bgType) {
    case 'stars':
      let starsContent = '';
      const defs = `
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#2c2158" />
            <stop offset="100%" stop-color="#000000" />
          </linearGradient>
          <radialGradient id="nebulaGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stop-color="#70a0ff" stop-opacity="0.6" />
            <stop offset="80%" stop-color="#3b76a8" stop-opacity="0.1" />
            <stop offset="100%" stop-color="#3b76a8" stop-opacity="0" />
          </radialGradient>
          <linearGradient id="meteorGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="rgba(255,255,255,0)" />
            <stop offset="70%" stop-color="rgba(170,220,255,0.8)" />
            <stop offset="100%" stop-color="rgba(255,255,255,1)" />
          </linearGradient>
          <filter id="starGlow">
            <feGaussianBlur stdDeviation="1.5" />
          </filter>
        </defs>
      `;
      starsContent += defs;
      
      // [1단계] 배경 그라데이션
      starsContent += `<rect width="${width}" height="${height}" fill="url(#bgGradient)" />`;
      
      // [2단계] 중심 은하수 빛
      starsContent += `<ellipse cx="${width / 2}" cy="${height / 2}" rx="${width * 0.7}" ry="${height * 0.2}" fill="url(#nebulaGradient)" transform="rotate(-45 ${width / 2} ${height / 2})" />`;

      // [3단계] 별 뿌리기
      const starCount = 400;
      const nebulaCenterX = width / 2;
      const nebulaCenterY = height / 2;
      const rotationAngle = -45 * Math.PI / 180; // 은하수 회전 각도 (라디안)

      for (let i = 0; i < starCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        
        // 별의 좌표를 은하수 각도에 맞춰 회전시켜 거리를 계산
        const rotatedX = Math.cos(-rotationAngle) * (x - nebulaCenterX) - Math.sin(-rotationAngle) * (y - nebulaCenterY) + nebulaCenterX;
        const rotatedY = Math.sin(-rotationAngle) * (x - nebulaCenterX) + Math.cos(-rotationAngle) * (y - nebulaCenterY) + nebulaCenterY;
        const dist = Math.abs(rotatedY - nebulaCenterY);
        
        // 은하수 띠 중심에 가까울수록 별이 나타날 확률 증가
        const spawnProb = Math.pow(Math.max(0, 1 - dist / (height * 0.3)), 2);

        if (Math.random() < spawnProb) { // 밀집된 별
          const r = Math.random() * 1.5 + 0.2;
          const opacity = Math.random() * 0.5 + 0.5;
          starsContent += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${opacity}" />`;
        } else if (Math.random() < 0.2) { // 흩어진 별
          const r = Math.random() * 0.8 + 0.1;
          const opacity = Math.random() * 0.6 + 0.2;
          starsContent += `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${opacity}" />`;
        }
      }
      // 빛나는 별
      for(let i=0; i<10; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const r = Math.random() * 1.5 + 1;
        starsContent += `<circle cx="${x}" cy="${y}" r="${r}" fill="#aaddff" filter="url(#starGlow)" />`;
      }
      
      // [4단계] 유성우 추가
      const meteorCount = Math.floor(Math.random() * 3) + 2;
      for(let i=0; i < meteorCount; i++) {
          const startX = Math.random() * width;
          const startY = Math.random() * height;
          const length = Math.random() * 150 + 50;
          const angle = (Math.random() - 0.5) * 80 - 45; // 은하수와 비슷한 각도로 떨어지도록
          const transform = `rotate(${angle} ${startX} ${startY})`;
          starsContent += `<line x1="${startX}" y1="${startY}" x2="${startX + length}" y2="${startY}" stroke="url(#meteorGradient)" stroke-width="2" transform="${transform}" />`
      }
      return starsContent;

    case 'matrix':
      const english = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numbers = '0123456789';
      const japanese = 'アイウエオカキクケコサシスセソタチツテトナニヌネノ';
      const hangul = '가나다라마바사아자차카타파하';
      const symbols = '-=/<>+*&%$#@!';
      const matrixChars = english.repeat(5) + numbers.repeat(2) + hangul + japanese + symbols;
      const matrixFontSize = 18;
      const columnWidth = matrixFontSize * 0.9;
      const columns = Math.floor(width / columnWidth);
      let matrixContent = '';

      const matrixDefs = `<defs><filter id="matrixGlow"><feGaussianBlur in="SourceGraphic" stdDeviation="1.0" result="blur" /></filter><filter id="leadingGlow"><feGaussianBlur in="SourceGraphic" stdDeviation="2.0" result="blur" /></filter></defs>`;
      matrixContent += matrixDefs;
      matrixContent += `<rect width="${width}" height="${height}" fill="#000000" />`;

      for (let i = 0; i < columns; i++) {
        if (Math.random() < 0.1) continue;
        const xJitter = (Math.random() - 0.5) * columnWidth;
        const x = i * columnWidth + xJitter;
        const startY = Math.random() * height * 1.5 - height * 0.5;
        const streamLength = Math.floor(Math.random() * (height / matrixFontSize * 0.8)) + 10;
        for (let j = 0; j < streamLength; j++) {
          const charIndex = Math.floor(Math.random() * matrixChars.length);
          const char = matrixChars[charIndex];
          const y = startY + j * matrixFontSize;
          if (y < 0 || y > height) continue;
          const isLeading = j === streamLength - 1;
          const color = isLeading ? '#c0ffc0' : '#00e030';
          const opacity = 0.1 + (j / streamLength) * 0.9;
          const filter = isLeading ? 'url(#leadingGlow)' : 'url(#matrixGlow)';
          matrixContent += `<text x="${x}" y="${y}" font-family="monospace" font-size="${matrixFontSize}px" fill="${color}" opacity="${opacity}" filter="${filter}">${escapeSVG(char)}</text>`;
        }
      }
      return matrixContent;
      
    case 'default':
    default:
      let defaultContent = '';
      const defaultDefs = `<defs><linearGradient id="defaultSky" x1="50%" y1="0%" x2="50%" y2="100%"><stop offset="0%" stop-color="#0d1b2a" /><stop offset="100%" stop-color="#1b263b" /></linearGradient></defs>`;
      defaultContent += defaultDefs;
      defaultContent += `<rect width="${width}" height="${height}" fill="url(#defaultSky)" />`;
      const defaultStarCount = 200;
      for (let i = 0; i < defaultStarCount; i++) {
        const x = Math.random() * width;
        const y = Math.random() * height;
        const r = Math.random() * 0.9 + 0.1;
        const opacity = Math.random() * 0.7 + 0.2;
        defaultContent += `<circle cx="${x}" cy="${y}" r="${r}" fill="#f0f8ff" opacity="${opacity}" />`;
      }
      return defaultContent;
  }
}

// --- 상수 ---
const constants = {
  width: 800,
  paddingX: 40,
  paddingY: 60,
  lineHeight: 1.6,
};

// --- 주 함수 핸들러 ---
exports.handler = async function(event) {
  try {
    const defaultParams = {
      text: '몽환적인 스타일의 {은하수} 배경입니다.|유성우가 떨어집니다.',
      textColor: '#ffffff',
      fontSize: 16,
      align: 'left',
      bg: 'stars',
    };
    const queryParams = event.queryStringParameters || {};
    const params = { ...defaultParams, ...queryParams };
    
    const fontSize = Math.max(10, Math.min(parseInt(params.fontSize, 10) || defaultParams.fontSize, 120));
    const textColor = escapeSVG(params.textColor);

    let textAnchor, x;
    switch (params.align) {
      case 'center': textAnchor = 'middle'; x = constants.width / 2; break;
      case 'right': textAnchor = 'end'; x = constants.width - constants.paddingX; break;
      default: textAnchor = 'start'; x = constants.paddingX; break;
    }

    const rawText = params.text;
    const lines = escapeSVG(rawText).split('|');
    const totalTextBlockHeight = (lines.length - 1) * (constants.lineHeight * fontSize) + fontSize;
    const height = Math.round(totalTextBlockHeight + (constants.paddingY * 2));
    
    const backgroundContent = generateBackgroundSVG(params.bg, constants.width, height);
    
    const startY = Math.round((height / 2) - (totalTextBlockHeight / 2) + (fontSize * 0.8));

    const textElements = lines.map((line, index) => {
      const innerContent = parseBoldText(line);
      const dy = index === 0 ? '0' : `${constants.lineHeight}em`;
      return `<tspan x="${x}" dy="${dy}">${innerContent}</tspan>`;
    }).join('');

    const mainTextStyle = `paint-order="stroke" stroke="#000000" stroke-width="2px" stroke-linejoin="round"`;

    const svg = `
      <svg width="${constants.width}" height="${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeSVG(rawText)}">
        <style>
          text { white-space: pre; }
        </style>
        ${backgroundContent}
        <text
          y="${startY}"
          font-family="sans-serif"
          font-size="${fontSize}px"
          fill="${textColor}"
          text-anchor="${textAnchor}"
          ${mainTextStyle}
        >
          ${textElements}
        </text>
      </svg>
    `;

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600, s-maxage=3600' },
      body: svg.trim(),
    };
  } catch (err) {
    console.error("SVG Generation Error:", err);
    const errorSvg = `<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f8d7da" /><text x="10" y="50%" font-family="monospace" font-size="16" fill="#721c24" dominant-baseline="middle">Error: ${escapeSVG(err.message)}</text></svg>`;
    return { statusCode: 500, headers: { 'Content-Type': 'image/svg+xml' }, body: errorSvg.trim() };
  }
};
