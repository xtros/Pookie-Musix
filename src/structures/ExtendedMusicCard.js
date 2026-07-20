const { createCanvas, loadImage, GlobalFonts } = require("@napi-rs/canvas");

async function buildExtendedCard({ thumbnail, title, artist, duration }) {
    const canvas = createCanvas(1200, 400); // Extended width
    const ctx = canvas.getContext("2d");

    // Try to load fonts if any available, or just use system sans-serif
    // Default background
    ctx.fillStyle = "#121212";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    let artImage;
    try {
        artImage = await loadImage(thumbnail);
    } catch (e) {
        artImage = await loadImage("C:\\Users\\APPUz\\Documents\\me\\Pookie Musix\\mainlogo.png");
    }

    // Draw blurred background
    ctx.filter = 'blur(40px) brightness(0.5)';
    ctx.drawImage(artImage, -100, -100, 1400, 600);
    ctx.filter = 'none';

    // Draw Album Art
    const artSize = 300;
    const padding = 50;
    
    ctx.save();
    ctx.beginPath();
    ctx.roundRect(padding, padding, artSize, artSize, 20);
    ctx.clip();
    ctx.drawImage(artImage, padding, padding, artSize, artSize);
    ctx.restore();

    // Text configuration
    const textX = padding * 2 + artSize;
    let textWidth = canvas.width - textX - padding;

    // Now Playing Header
    ctx.font = "bold 25px sans-serif";
    ctx.fillStyle = "#E2B4CE";
    ctx.textBaseline = "middle";
    ctx.fillText("NOW PLAYING", textX, 95);

    // Track Title
    ctx.font = "bold 45px sans-serif";
    ctx.fillStyle = "#FFFFFF";
    
    // Simple text truncation if STILL too long, but we gave it a lot of space
    let displayTitle = title;
    if (ctx.measureText(displayTitle).width > textWidth) {
        while (ctx.measureText(displayTitle + '...').width > textWidth && displayTitle.length > 0) {
            displayTitle = displayTitle.slice(0, -1);
        }
        displayTitle += '...';
    }
    ctx.fillText(displayTitle, textX, 160);

    // Artist Name (We will allow it to be smaller but show fully, or multi-line)
    ctx.font = "35px sans-serif";
    ctx.fillStyle = "#B3B3B3";
    
    // We can wrap text for artist if needed, or just let it fill the space. 
    // Since the user wants to see the author completely, we can split it into multiple lines if needed.
    const words = artist.split(' ');
    let line = '';
    let y = 220;
    const lineHeight = 45;

    for (let n = 0; n < words.length; n++) {
        const testLine = line + words[n] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        if (testWidth > textWidth && n > 0) {
            ctx.fillText(line, textX, y);
            line = words[n] + ' ';
            y += lineHeight;
        } else {
            line = testLine;
        }
    }
    ctx.fillText(line, textX, y);

    // Duration
    ctx.font = "bold 30px sans-serif";
    ctx.fillStyle = "#FFFFFF";
    ctx.fillText(`Duration: ${duration}`, textX, 330);

    return canvas.toBuffer("image/png");
}

module.exports = { buildExtendedCard };
