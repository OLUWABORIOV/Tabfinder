const fs = require('fs');
const sharp = require('sharp');

// Extract the SVG content from our template
const htmlContent = fs.readFileSync('icon_template.html', 'utf8');
const svgMatch = htmlContent.match(/<svg[^>]*>[\s\S]*?<\/svg>/);

if (!svgMatch) {
    console.error('Could not find SVG content in template file');
    process.exit(1);
}

const svgContent = svgMatch[0];

// Define the sizes we need
const sizes = [16, 48, 128];

// Generate each size
Promise.all(sizes.map(size => {
    return sharp(Buffer.from(svgContent))
        .resize(size, size)
        .png()
        .toFile(`icon${size}.png`);
}))
.then(() => {
    console.log('Icons generated successfully!');
    console.log('Created:');
    sizes.forEach(size => {
        console.log(`- icon${size}.png`);
    });
})
.catch(err => {
    console.error('Error generating icons:', err);
}); 