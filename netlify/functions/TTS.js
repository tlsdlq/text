const fs = require('fs');
const path = require('path');

// SVG 내용에 포함될 수 있는 특수 문자를 이스케이프합니다.
function escapeSVG(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// --- 리소스(폰트, 이미지) 미리 읽어오기 ---
const resources = {};
try {
  // 폰트 읽기
  resources['regularFont'] = fs.readFileSync(path.resolve(__dirname, '../../fonts/NotoSansKR-Regular.woff2'), 'base64');
  resources['boldFont'] = fs.readFileSync(path.resolve(__dirname, '../../fonts/NotoSansKR-Bold.woff2'), 'base64');

  // 배경 이미지 읽기
  const bgImagePath = path.resolve(__dirname, '../../images/background.jpg');
  resources['bgImage'] = fs.readFileSync(bgImagePath, 'base64');

} catch (error) {
  console.error("리소스 파일을 읽는 중 오류 발생:", error);
}

// 파일 확장자에 따라 이미지 MIME 타입을 반환하는 함수
function getImageMimeType(imageFileName) {
    const extension = path.extname(imageFileName).toLowerCase();
    if (extension === '.jpg' || extension === '.jpeg') return 'image/jpeg';
    if (extension === '.png') return 'image/png';
    return 'application/octet-stream';
}

exports.handler = async function(event) {
  try {
    if (!resources.regularFont) throw new Error('Server font not loaded.');

    const params = event.queryStringParameters || {};

    const width = Math.min(parseInt(params.width, 10) || 800, 2000);
    const height = Math.min(parseInt(params.height, 10) || 400, 2000);

    // --- 배경 처리 ---
    let backgroundContent = '';
    // useBg=true 파라미터가 있을 때만 배경 이미지를 사용
    if (params.useBg === 'true' && resources.bgImage) {
        const bgImageFileName = 'background.jpg';
        const bgImageMimeType = getImageMimeType(bgImageFileName);
        const bgFit = params.bgFit === 'contain' ? 'xMidYMid meet' : 'xMidYMid slice';
        backgroundContent = `<image href="data:${bgImageMimeType};base64,${resources.bgImage}" x="0" y="0" width="100%" height="100%" preserveAspectRatio="${bgFit}"/>`;
    } else {
        // 이미지 미사용 시 기본 배경을 검은색으로 설정
        const colorRegex = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
        const bgColor = colorRegex.test(params.bgColor) ? params.bgColor : '#000000';
        backgroundContent = `<rect width="100%" height="100%" fill="${bgColor}" />`;
    }

    // --- 폰트 및 텍스트 처리 ---
    // 기본 글자색을 흰색(#ffffff)으로 고정
    const textColor = escapeSVG(params.textColor || '#ffffff');
    const textToShow = escapeSVG(params.text || '밤하늘 배경 테스트');
    const fontSize = Math.min(parseInt(params.fontSize, 10) || Math.min(width / 12, height / 5), 1000);
    const fontWeight = params.fontWeight === 'bold' ? 'bold' : 'normal';
    const fontToUse = fontWeight === 'bold' ? resources.boldFont : resources.regularFont;

    // --- SVG 최종 생성 ---
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <style>
          @font-face {
            font-family: 'CustomFont';
            src: url(data:font/woff2;base64,${fontToUse}) format('woff2');
          }
        </style>
        ${backgroundContent}
        <text
          x="50%"
          y="50%"
          font-family="CustomFont, sans-serif"
          font-size="${fontSize}"
          font-weight="${fontWeight}"
          fill="${textColor}"
          text-anchor="middle"
          dominant-baseline="middle"
          paint-order="stroke"
          stroke="#000000"
          stroke-width="2px"
        >
          ${textToShow}
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
