const fs = require('fs');
const path = require('path');

// 이미지 파일 경로 라이브러리
const backgroundLibrary = {
  'default': path.resolve(__dirname, '../../images/background.jpg'),
  'stars': path.resolve(__dirname, '../../images/background.jpg'),
  'matrix': path.resolve(__dirname, '../../images/matrix.jpg')
};

// 파일 확장자에 따른 MIME 타입 반환 함수
function getImageMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.jpg' || ext === '.jpeg') return 'image/jpeg';
  if (ext === '.png') return 'image/png';
  return 'application/octet-stream';
}

exports.handler = async function(event) {
  try {
    const params = event.queryStringParameters || {};
    const bgKey = params.bg || 'default';
    const bgPath = backgroundLibrary[bgKey] || backgroundLibrary['default'];
    
    // 파일을 Buffer 형태로 직접 읽습니다.
    const imageBuffer = fs.readFileSync(bgPath);
    const mimeType = getImageMimeType(bgPath);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': mimeType,
        // 브라우저와 CDN에 1년간 캐시하도록 설정 (immutable은 내용이 절대 변하지 않음을 의미)
        'Cache-Control': 'public, max-age=31536000, s-maxage=31536000, immutable',
      },
      // Buffer를 Base64로 인코딩하고, isBase64Encoded 플래그를 true로 설정해야 합니다.
      // Netlify가 응답을 보낼 때 자동으로 디코딩하여 바이너리 데이터로 보내줍니다.
      body: imageBuffer.toString('base64'),
      isBase64Encoded: true,
    };
  } catch (err) {
    return { statusCode: 500, body: err.message };
  }
};
