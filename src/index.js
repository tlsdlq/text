// WASM 라이브러리와 모듈을 불러옵니다.
import photon from "@silvia-odwyer/photon-node";
import WASM_MODULE from "WASM_MODULE";

// photon 라이브러리 초기화 (WASM 모듈을 넘겨줌)
photon.setWasm(WASM_MODULE);

// ArrayBuffer를 Base64로 변환하는 헬퍼 함수
function arrayBufferToBase64(buffer) {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

export default {
  async fetch(request, env, ctx) {
    try {
      const { searchParams } = new URL(request.url);
      const bgImg = searchParams.get('bgImg');
      const text = searchParams.get('text');
      const bgColor = searchParams.get('bgColor') || 'rgba(0,0,0,0.5)';
      const textColor = searchParams.get('textColor') || '#FFFFFF';
      const fontSize = searchParams.get('fontSize');

      if (!bgImg) throw new Error('bgImg parameter is required.');

      // 1. 외부 이미지 URL에서 이미지 데이터를 가져옵니다.
      const imageResponse = await fetch(decodeURIComponent(bgImg));
      if (!imageResponse.ok) {
        throw new Error(`Failed to fetch image: ${imageResponse.status}`);
      }
      const imageBuffer = await imageResponse.arrayBuffer();

      // 2. WASM을 사용하여 이미지 처리
      // photon 객체를 생성하고 이미지 데이터를 전달합니다.
      const image = photon.Photon.new_from_bytes(new Uint8Array(imageBuffer));
      
      // 이미지의 원본 너비와 높이를 가져옵니다.
      const finalWidth = image.get_width();
      const finalHeight = image.get_height();

      // 이미지를 WEBP 형식으로 변환합니다. (메모리 내에서 처리)
      const optimizedBuffer = image.get_bytes_webp(80); // quality 80
      const imageBase64 = arrayBufferToBase64(optimizedBuffer);
      const imageDataUri = `data:image/webp;base64,${imageBase64}`;

      // --- 3. 자동 줄바꿈 및 SVG 생성 로직 (이전과 동일) ---
      const boxHeight = finalHeight * 0.25;
      const boxY = finalHeight - boxHeight;
      const textPaddingX = finalWidth * 0.03;
      const maxTextWidth = finalWidth - (textPaddingX * 2);
      const baseFontSize = fontSize ? parseInt(fontSize, 10) : Math.floor(finalWidth / 28);
      
      const words = (text || '').split(' ');
      const lines = [];
      let currentLine = '';
      const charWidthFactor = 0.55;

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        if ((testLine.length * baseFontSize * charWidthFactor) > maxTextWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);
      
      let finalFontSize = baseFontSize;
      if (lines.length > 2) finalFontSize = baseFontSize * Math.pow(0.95, lines.length - 2);
      finalFontSize = Math.floor(finalFontSize);

      const lineHeight = finalFontSize * 1.2;
      const totalTextHeight = (lines.length > 0 ? lineHeight * (lines.length - 1) : 0) + finalFontSize;
      const startY = boxY + (boxHeight / 2) - (totalTextHeight / 2) + (finalFontSize * 0.4);

      const createTspan = (line) => line.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      
      const textElements = lines.length > 0
        ? `<tspan x="${textPaddingX}" y="${startY}">${createTspan(lines[0])}</tspan>` +
          lines.slice(1).map(line => `<tspan x="${textPaddingX}" dy="${lineHeight}">${createTspan(line)}</tspan>`).join('')
        : '';

      const svg = `<svg width="${finalWidth}" height="${finalHeight}" xmlns="http://www.w3.org/2000/svg">
        <image href="${imageDataUri}" x="0" y="0" width="100%" height="100%"/>
        <rect x="0" y="${boxY}" width="100%" height="${boxHeight}" fill="${bgColor}" />
        <text font-family="Arial, sans-serif" font-size="${finalFontSize}px" fill="${textColor}" text-anchor="start">
          ${textElements}
        </text>
      </svg>`;

      return new Response(svg.trim().replace(/\s{2,}/g, ' '), {
        status: 200,
        headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=3600' },
      });

    } catch (err) {
      const errorMessage = err.message.replace(/</g, "&lt;").replace(/>/g, "&gt;");
      const errorSvg = `<svg width="800" height="200" xmlns="http://www.w3.org/2000/svg"><rect width="100%" height="100%" fill="#f8d7da" /><text x="15" y="35" font-family="monospace" font-size="14" fill="#721c24"><tspan x="15" dy="1.2em">ERROR:</tspan><tspan x="15" dy="1.5em">${errorMessage.substring(0, 80)}</tspan></text></svg>`;
      return new Response(errorSvg.trim(), { status: 500, headers: { 'Content-Type': 'image/svg+xml' }});
    }
  }
};
