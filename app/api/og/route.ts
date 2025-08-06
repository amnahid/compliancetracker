import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get('title') || 'ComplianceTracker';
  const description = searchParams.get('description') || 'Healthcare Compliance Management';

  // Simple HTML-based Open Graph image generation
  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body {
        margin: 0;
        padding: 60px;
        width: 1200px;
        height: 630px;
        font-family: 'Arial', sans-serif;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        display: flex;
        flex-direction: column;
        justify-content: center;
        box-sizing: border-box;
        position: relative;
      }
      .logo {
        position: absolute;
        top: 40px;
        left: 60px;
        font-size: 24px;
        font-weight: bold;
        color: white;
      }
      .title {
        font-size: 64px;
        font-weight: bold;
        line-height: 1.1;
        margin-bottom: 30px;
        max-width: 900px;
      }
      .description {
        font-size: 32px;
        opacity: 0.9;
        line-height: 1.3;
        max-width: 800px;
      }
      .badge {
        position: absolute;
        bottom: 40px;
        right: 60px;
        background: rgba(255, 255, 255, 0.2);
        padding: 10px 20px;
        border-radius: 25px;
        font-size: 18px;
        backdrop-filter: blur(10px);
      }
    </style>
  </head>
  <body>
    <div class="logo">ComplianceTracker</div>
    <h1 class="title">${title}</h1>
    <p class="description">${description}</p>
    <div class="badge">Healthcare Compliance</div>
  </body>
</html>`;

  return new NextResponse(html, {
    headers: {
      'Content-Type': 'text/html',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400', // Cache for 24 hours
    },
  });
}
