// netlify/functions/TTS.js

const fs = require('fs');
const path = require('path');

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

function getImageMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.webp') return 'image/webp';
  return 'application/octet-stream';
}

// --- 상수 및 사전 로딩 ---

const constants = {
  width: 1200,
  paddingX: 40,
  paddingY: 60,
  lineHeight: 1.6,
};

const backgroundFilePaths = {
  'default': path.resolve(__dirname, '../../images/background.webp'),
  'stars': path.resolve(__dirname, '../../images/stars.webp'),
  'matrix': path.resolve(__dirname, '../../images/matrix.webp')
};

// [최적화 1] 함수 로드 시점에 이미지를 미리 읽어 메모리에 캐시
const preloadedImages = Object.fromEntries(
  Object.entries(backgroundFilePaths).map(([key, filePath]) => {
    try {
      const data = fs.readFileSync(filePath, 'base64');
      const mimeType = getImageMimeType(filePath);
      return [key, { data, mimeType }];
    } catch (e) {
      // 파일 로드 실패 시 에러를 기록하고 해당 항목은 제외
      console.error(`Failed to load background image for key: ${key}`, e);
      return [key, null];
    }
  }).filter(([, value]) => value !== null) // 로드 실패한 항목 제거
);


// --- 주 함수 핸들러 ---

exports.handler = async function(event) {
  try {
    // [최적화 2] 기본 파라미터 처리 개선
    const defaultParams = {
      text: '이제 폰트 기능이 없습니다.|시스템 기본 폰트를 사용합니다.',
      textColor: '#ffffff',
      fontSize: 16,
      align: 'left',
      bg: 'default',
    };
    const queryParams = event.queryStringParameters || {};
    const params = { ...defaultParams, ...queryParams };
    
    // [안정성 강화] 숫자형 파라미터 파싱 및 범위 제한
    const fontSize = Math.max(10, Math.min(parseInt(params.fontSize, 10) || defaultParams.fontSize, 120));
    const textColor = escapeSVG(params.textColor);

    // [최적화 1 적용] 메모리에서 이미지 데이터 가져오기
    const bgKey = params.bg in preloadedImages ? params.bg : 'default';
    const { data: bgData, mimeType: bgMimeType } = preloadedImages[bgKey];
    
    // 텍스트 정렬 설정
    let textAnchor, x;
    switch (params.align) {
      case 'center':
        textAnchor = 'middle';
        x = constants.width / 2;
        break;
      case 'right':
        textAnchor = 'end';
        x = constants.width - constants.paddingX;
        break;
      default:
        textAnchor = 'start';
        x = constants.paddingX;
        break;
    }

    // 텍스트 및 SVG 높이 계산
    const rawText = params.text;
    const lines = escapeSVG(rawText).split('|');
    const totalTextBlockHeight = (lines.length - 1) * (constants.lineHeight * fontSize) + fontSize;
    const height = Math.round(totalTextBlockHeight + (constants.paddingY * 2));
    
    // SVG 컨텐츠 생성
    const backgroundContent = `<image href="data:${bgMimeType};base64,${bgData}" x="0" y="0" width="${constants.width}" height="${height}" preserveAspectRatio="xMidYMid slice"/>`;
    
    const startY = Math.round((height / 2) - (totalTextBlockHeight / 2) + (fontSize * 0.8));

    const textElements = lines.map((line, index) => {
      const innerContent = parseBoldText(line);
      const dy = index === 0 ? '0' : `${constants.lineHeight}em`;
      return `<tspan x="${x}" dy="${dy}">${innerContent}</tspan>`;
    }).join('');

    const svg = `
      <svg width="${constants.width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
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
    console.error("SVG Generation Error:", err);
    const errorSvg = `<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f8d7da" /><text x="10" y="50%" font-family="monospace" font-size="16" fill="#721c24" dominant-baseline="middle">Error: ${escapeSVG(err.message)}</text></svg>`;
    return { statusCode: 500, headers: { 'Content-Type': 'image/svg+xml' }, body: errorSvg.trim() };
  }
};
