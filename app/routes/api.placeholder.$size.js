import { json } from "@remix-run/node";

export async function loader({ request, params }) {
  try {
    const size = params.size || "200x150";
    const [width, height] = size.split("x").map(Number);
    
    // Validate dimensions
    if (!width || !height || width > 1000 || height > 1000) {
      return new Response("Invalid dimensions", { status: 400 });
    }
    
    // Create a simple SVG placeholder
    const svg = `
      <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <rect width="100%" height="100%" fill="#f3f4f6"/>
        <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="14" 
              fill="#9ca3af" text-anchor="middle" dy=".3em">
          No Image
        </text>
      </svg>
    `;

    return new Response(svg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year
      },
    });
  } catch (error) {
    console.error('Error generating placeholder:', error);
    return new Response("Error generating placeholder", { status: 500 });
  }
}
