// --- 유틸리티 함수 ---
// (기존 코드와 동일)
function escapeSVG(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
}

function parseBoldText(line) {
  if (typeof line !== 'string') return '';
  const parts = line.split(/\{([^}]+)\}/g).filter(part => part);
  return parts.map((part, index) => {
    const isBold = index % 2 === 1;
    const escapedPart = escapeSVG(part);
    return isBold ? `<tspan font-weight="700">${escapedPart}</tspan>` : escapedPart;
  }).join('');
}

// --- SVG 배경 생성 함수 (kuro 스타일 재설계) ---
// (기존 코드와 동일)
function generateBackgroundSVG(bgType, width, height) {
  const seed = Math.floor(Math.random() * 1000);
  
  switch (bgType) {
    case 'kuro':
      const kuroDefs = `
        <defs>
          <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <filter id="strongGlow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="6" result="bigBlur"/>
            <feGaussianBlur stdDeviation="2" result="smallBlur"/>
            <feMerge> 
              <feMergeNode in="bigBlur"/>
              <feMergeNode in="smallBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
      `;
      
      let kuroContent = `<rect width="${width}" height="${height}" fill="#000008" />`;
      kuroContent += kuroDefs;

      const scaleX = width / 800;
      const scaleY = height / 600;
      
      const maze = [
        `M${40*scaleX} ${120*scaleY} L${180*scaleX} ${120*scaleY} L${180*scaleX} ${80*scaleY} L${280*scaleX} ${80*scaleY} L${280*scaleX} ${160*scaleY} L${200*scaleX} ${160*scaleY} L${200*scaleX} ${200*scaleY} L${120*scaleX} ${200*scaleY} L${120*scaleX} ${280*scaleY}`,
        `M${280*scaleX} ${80*scaleY} L${380*scaleX} ${80*scaleY} L${380*scaleX} ${40*scaleY}`,
        `M${380*scaleX} ${120*scaleY} L${480*scaleX} ${120*scaleY} L${480*scaleX} ${200*scaleY} L${420*scaleX} ${200*scaleY} L${420*scaleX} ${280*scaleY} L${360*scaleX} ${280*scaleY} L${360*scaleX} ${240*scaleY}`,
        `M${480*scaleX} ${120*scaleY} L${580*scaleX} ${120*scaleY} L${580*scaleX} ${80*scaleY} L${680*scaleX} ${80*scaleY} L${680*scaleX} ${160*scaleY} L${620*scaleX} ${160*scaleY} L${620*scaleX} ${240*scaleY}`,
        `M${680*scaleX} ${80*scaleY} L${760*scaleX} ${80*scaleY}`,
        `M${120*scaleX} ${280*scaleY} L${240*scaleX} ${280*scaleY} L${240*scaleX} ${360*scaleY} L${160*scaleX} ${360*scaleY} L${160*scaleX} ${440*scaleY} L${280*scaleX} ${440*scaleY} L${280*scaleX} ${320*scaleY} L${360*scaleX} ${320*scaleY}`,
        `M${360*scaleX} ${240*scaleY} L${360*scaleX} ${320*scaleY} L${420*scaleX} ${320*scaleY} L${420*scaleX} ${360*scaleY} L${500*scaleX} ${360*scaleY} L${500*scaleX} ${280*scaleY} L${580*scaleX} ${280*scaleY} L${580*scaleX} ${240*scaleY}`,
        `M${580*scaleX} ${240*scaleY} L${620*scaleX} ${240*scaleY} L${620*scaleX} ${320*scaleY} L${680*scaleX} ${320*scaleY} L${680*scaleX} ${280*scaleY} L${760*scaleX} ${280*scaleY}`,
        `M${160*scaleX} ${440*scaleY} L${160*scaleX} ${520*scaleY} L${240*scaleX} ${520*scaleY} L${240*scaleX} ${480*scaleY} L${320*scaleX} ${480*scaleY} L${320*scaleX} ${520*scaleY} L${400*scaleX} ${520*scaleY} L${400*scaleX} ${440*scaleY}`,
        `M${400*scaleX} ${440*scaleY} L${480*scaleX} ${440*scaleY} L${480*scaleX} ${400*scaleY} L${560*scaleX} ${400*scaleY} L${560*scaleX} ${480*scaleY} L${640*scaleX} ${480*scaleY} L${640*scaleX} ${440*scaleY} L${720*scaleX} ${440*scaleY} L${720*scaleX} ${520*scaleY}`,
        `M${200*scaleX} ${200*scaleY} L${200*scaleX} ${280*scaleY}`,
        `M${420*scaleX} ${280*scaleY} L${420*scaleX} ${200*scaleY}`,
        `M${500*scaleX} ${360*scaleY} L${500*scaleX} ${440*scaleY} L${400*scaleX} ${440*scaleY}`,
        `M${680*scaleX} ${320*scaleY} L${680*scaleX} ${400*scaleY} L${640*scaleX} ${400*scaleY} L${640*scaleX} ${440*scaleY}`,
        `M${240*scaleX} ${360*scaleY} L${320*scaleX} ${360*scaleY} L${320*scaleX} ${400*scaleY} L${280*scaleX} ${400*scaleY} L${280*scaleX} ${440*scaleY}`,
        `M${360*scaleX} ${320*scaleY} L${360*scaleX} ${400*scaleY} L${320*scaleX} ${400*scaleY}`,
        `M${580*scaleX} ${280*scaleY} L${580*scaleX} ${320*scaleY}`,
        `M${500*scaleX} ${200*scaleY} L${540*scaleX} ${200*scaleY} L${540*scaleX} ${160*scaleY} L${580*scaleX} ${160*scaleY}`,
        `M${120*scaleX} ${200*scaleY} L${160*scaleX} ${200*scaleY} L${160*scaleX} ${240*scaleY} L${200*scaleX} ${240*scaleY}`,
        `M${40*scaleX} ${320*scaleY} L${80*scaleX} ${320*scaleY} L${80*scaleX} ${400*scaleY} L${120*scaleX} ${400*scaleY} L${120*scaleX} ${360*scaleY}`,
        `M${240*scaleX} ${280*scaleY} L${280*scaleX} ${280*scaleY}`,
        `M${420*scaleX} ${360*scaleY} L${420*scaleX} ${400*scaleY} L${480*scaleX} ${400*scaleY}`,
        `M${620*scaleX} ${320*scaleY} L${620*scaleX} ${360*scaleY} L${580*scaleX} ${360*scaleY}`,
        `M${340*scaleX} ${240*scaleY} L${340*scaleX} ${280*scaleY}`,
        `M${460*scaleX} ${280*scaleY} L${460*scaleX} ${320*scaleY}`,
        `M${200*scaleX} ${240*scaleY} L${240*scaleX} ${240*scaleY}`,
        `M${320*scaleX} ${320*scaleY} L${340*scaleX} ${320*scaleY}`,
        `M${20*scaleX} ${40*scaleY} L${20*scaleX} ${560*scaleY}`,
        `M${780*scaleX} ${100*scaleY} L${780*scaleX} ${500*scaleY}`,
        `M${40*scaleX} ${40*scaleY} L${760*scaleX} ${40*scaleY}`,
        `M${160*scaleX} ${560*scaleY} L${640*scaleX} ${560*scaleY}`,
      ];
      
      const pathData = maze.join(' ');
      const scale = Math.min(width, height) / 800;
      
      kuroContent += `<g stroke="#cc77ff" fill="none" filter="url(#strongGlow)">`;
      const pathWidths = [7, 6, 8, 6, 5, 7, 6, 8, 7, 6, 5, 6, 7, 5, 4, 5, 6, 4, 5, 6, 4, 5, 4, 3, 4, 3, 4, 5, 8, 6, 4, 3];
      const paths = pathData.split(' M').filter(p => p);
      
      paths.forEach((path, index) => {
        const fullPath = index === 0 ? path : 'M' + path;
        const pathWidth = Math.max(3, (pathWidths[index % pathWidths.length] || 5) * scale);
        kuroContent += `<path d="${fullPath}" stroke-width="${pathWidth}" stroke-linecap="round" stroke-linejoin="round" />`;
      });
      kuroContent += `</g>`;
      
      kuroContent += `<g stroke="#ffffff" fill="none" filter="url(#neonGlow)" opacity="0.9">`;
      const coreWidths = [2, 1.5, 2, 1.5, 1, 2, 1.5, 2, 2, 1.5, 1, 1.5, 2, 1, 1, 1, 1.5, 1, 1, 1.5, 1, 1, 1, 1, 1, 1, 1, 1.5, 2, 1.5, 1, 1];
      
      paths.forEach((path, index) => {
        const fullPath = index === 0 ? path : 'M' + path;
        const coreWidth = Math.max(0.5, (coreWidths[index % coreWidths.length] || 1.5) * scale);
        kuroContent += `<path d="${fullPath}" stroke-width="${coreWidth}" stroke-linecap="round" stroke-linejoin="round" />`;
      });
      kuroContent += `</g>`;
      
      return kuroContent;

    case 'stars':
      const galaxyDefs = `
        <defs>
          <filter id="starGlow"><feGaussianBlur stdDeviation="1.5" result="coloredBlur" /></filter>
          <filter id="nebulaCloud" x="-50%" y="-50%" width="200%" height="200%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02 0.05" numOctaves="4" seed="${seed}" result="turbulence" />
            <feGaussianBlur in="turbulence" stdDeviation="15" result="softTurbulence" />
            <feColorMatrix in="softTurbulence" type="matrix" values="1 0 0 0 0 0 1 0 0 0 0 0 1 0 0 0 0 0 2 -0.3" result="alphaChannel" />
          </filter>
          <linearGradient id="galaxyGradient" gradientTransform="rotate(${Math.random() * 360})">
            <stop offset="20%" stop-color="#2d0e4d" /><stop offset="45%" stop-color="#c1a2ff" /><stop offset="50%" stop-color="#f0e8ff" /><stop offset="55%" stop-color="#c1a2ff" /><stop offset="80%" stop-color="#2d0e4d" />
          </linearGradient>
          <mask id="galaxyMask">
            <rect x="0" y="0" width="${width}" height="${height}" fill="white" />
            <rect x="0" y="0" width="${width}" height="${height}" fill="black" filter="url(#nebulaCloud)" />
          </mask>
          <linearGradient id="meteorGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="rgba(200, 225, 255, 0)" /><stop offset="50%" stop-color="rgba(200, 225, 255, 0.8)" /><stop offset="100%" stop-color="#fff" />
          </linearGradient>
        </defs>
      `;

      let starsContent = galaxyDefs;
      starsContent += `<rect width="${width}" height="${height}" fill="#01010a" />`;
      starsContent += `<rect x="0" y="0" width="${width}" height="${height}" fill="url(#galaxyGradient)" mask="url(#galaxyMask)" opacity="0.6" />`;
      
      const galaxyBand = { slope: (Math.random() - 0.5) * 0.8, intercept: height / 2 + (Math.random() - 0.5) * (height * 0.4), width: height * (Math.random() * 0.2 + 0.3) };
      const isInGalaxyBand = (x, y) => { const lineY = galaxyBand.slope * x + galaxyBand.intercept; return Math.abs(y - lineY) < galaxyBand.width / 2; };
      for (let i = 0; i < 2000; i++) { const x = Math.random() * width; const y = Math.random() * height; if (isInGalaxyBand(x, y)) { starsContent += `<circle cx="${x}" cy="${y}" r="${Math.random() * 0.5 + 0.1}" fill="#fff" opacity="${Math.random() * 0.7 + 0.2}" />`; } }
      for (let i = 0; i < 150; i++) { starsContent += `<circle cx="${Math.random() * width}" cy="${Math.random() * height}" r="${Math.random() * 0.6 + 0.2}" fill="#e0e8ff" opacity="${Math.random() * 0.6 + 0.2}" />`; }
      for (let i = 0; i < 20; i++) { const r = Math.random() * 1.0 + 0.4; starsContent += `<circle cx="${Math.random() * width}" cy="${Math.random() * height}" r="${r}" fill="#f0f8ff" filter="url(#starGlow)" opacity="${Math.random() * 0.4 + 0.6}" />`; }
      const meteorCount = Math.floor(Math.random() * 3) + 1;
      for(let i=0; i < meteorCount; i++) { const startX = Math.random() * width; const startY = Math.random() * height; const length = Math.random() * 100 + 50; const angle = (Math.random() - 0.5) * 80; const meteorTransform = `rotate(${angle} ${startX} ${startY})`; starsContent += `<line x1="${startX}" y1="${startY}" x2="${startX + length}" y2="${startY}" stroke="url(#meteorGradient)" stroke-width="1.2" transform="${meteorTransform}" />` }
      return starsContent;
    
    case 'matrix':
      const matrixChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.repeat(5) + '0123456789'.repeat(2) + 'アイウエオカキクケコサシスセソタチツテトナニヌネノ' + '가나다라마바사아자차카타파하' + '-=/<>+*&%$#@!';
      const matrixFontSize = 18;
      const columnWidth = matrixFontSize * 0.9;
      const columns = Math.floor(width / columnWidth);
      let matrixContent = `<defs><filter id="matrixGlow"><feGaussianBlur in="SourceGraphic" stdDeviation="1.0" result="blur" /></filter></defs><rect width="${width}" height="${height}" fill="#000000" />`;
      for (let i = 0; i < columns; i++) {
        if (Math.random() < 0.1) continue;
        const x = i * columnWidth + (Math.random() - 0.5) * columnWidth;
        const startY = Math.random() * height * 1.5 - height * 0.5;
        const streamLength = Math.floor(Math.random() * (height / matrixFontSize * 0.8)) + 10;
        const streamTspans = [];
        for (let j = 0; j < streamLength; j++) {
          const y = startY + j * matrixFontSize;
          if (y < 0 || y > height) continue;
          const char = matrixChars[Math.floor(Math.random() * matrixChars.length)];
          const posAttr = j === 0 ? `y="${startY}"` : `dy="1.2em"`;
          streamTspans.push(`<tspan x="${x}" ${posAttr} fill="#00e030" opacity="${0.1 + (j / streamLength) * 0.9}">${escapeSVG(char)}</tspan>`);
        }
        if (streamTspans.length > 0) { matrixContent += `<text font-family="monospace" font-size="${matrixFontSize}px" filter="url(#matrixGlow)">${streamTspans.join('')}</text>`; }
      }
      return matrixContent;

    default:
      return `<rect width="${width}" height="${height}" fill="#000000" />`;
  }
}

// --- 상수 (기존 값 800px 유지) ---
const constants = {
  width: 800,
  paddingX: 40,
  paddingY: 60,
  lineHeight: 1.6,
};

// --- Vercel 핸들러 함수 ---
// Netlify의 exports.handler를 Vercel 형식으로 변경
export default function handler(request, response) {
  try {
    const defaultParams = {
      text: 'Dynamic {SVG} on Vercel|Special Chars: < & >',
      textColor: '#ffffff',
      fontSize: 16,
      align: 'left',
      bg: 'default',
    };
    
    // 쿼리 파라미터 가져오는 방식 변경
    // event.queryStringParameters -> request.query
    const queryParams = request.query || {};
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
    const lines = rawText.split('|');
    
    const totalTextBlockHeight = (lines.length - 1) * (constants.lineHeight * fontSize) + fontSize;
    const height = Math.round(totalTextBlockHeight + (constants.paddingY * 2));
    
    const backgroundContent = generateBackgroundSVG(params.bg, constants.width, height);
    
    const startY = Math.round((height / 2) - (totalTextBlockHeight / 2) + (fontSize * 0.8));

    const mainTextStyle = `paint-order="stroke" stroke="#000000" stroke-width="2px" stroke-linejoin="round"`;
    const textElements = lines.map((line, index) => {
      const innerContent = parseBoldText(line);
      const yPos = startY + (index * constants.lineHeight * fontSize);
      return `<text x="${x}" y="${yPos}" font-family="sans-serif" font-size="${fontSize}px" fill="${textColor}" text-anchor="${textAnchor}" ${mainTextStyle}>${innerContent}</text>`;
    }).join('');

    const svg = `
      <svg width="${constants.width}" height="${height}" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${escapeSVG(rawText)}">
        <style>
          text { white-space: pre; }
        </style>
        ${backgroundContent}
        ${textElements}
      </svg>
    `;

    // 응답 반환 방식 변경
    response.status(200);
    response.setHeader('Content-Type', 'image/svg+xml');
    response.setHeader('Cache-Control', 'public, max-age=3600, s-maxage=3600');
    response.send(svg.trim());

  } catch (err) {
    console.error("SVG Generation Error:", err);
    const errorSvg = `<svg width="400" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f8d7da" /><text x="10" y="50%" font-family="monospace" font-size="16" fill="#721c24" dominant-baseline="middle">Error: ${escapeSVG(err.message)}</text></svg>`;
    
    // 에러 응답 방식 변경
    response.status(500);
    response.setHeader('Content-Type', 'image/svg+xml');
    response.send(errorSvg.trim());
  }
}
