// Load presets
let presets = {
    swatches: {},
    fonts: {}
};

// Fetch presets from JSON files
async function loadPresets() {
    try {
        const [swatchesRes, fontsRes] = await Promise.all([
            fetch('/presets/swatches.json'),
            fetch('/presets/fonts.json')
        ]);
        
        presets.swatches = await swatchesRes.json();
        presets.fonts = await fontsRes.json();
    } catch (error) {
        console.error("Error loading presets:", error);
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    await loadPresets();
    
    document.getElementById('generate-btn').addEventListener('click', generateBrandKit);
    document.getElementById('download-btn').addEventListener('click', generatePDF);
});

// Main generation function
function generateBrandKit() {
    const style = document.getElementById('style').value;
    const backgroundType = document.getElementById('background').value;
    
    // Generate colors
    const colors = generateColors(style, backgroundType);
    
    // Generate fonts
    const fonts = generateFonts(style);
    
    // Generate icons
    const icons = generateIcons(style);
    
    // Display results
    displayResults(colors, fonts, icons, backgroundType);
    
    // Show results section
    document.getElementById('results').classList.remove('hidden');
}

// Color generation (similar to your Python logic)
function generateColors(style, backgroundType) {
    const styleSwatches = presets.swatches[style][backgroundType];
    const randomIndex = Math.floor(Math.random() * styleSwatches.length);
    return styleSwatches[randomIndex];
}

// Font generation
function generateFonts(style) {
    if (presets.fonts[style]) {
        const fontCombos = presets.fonts[style];
        const randomIndex = Math.floor(Math.random() * fontCombos.length);
        return fontCombos[randomIndex];
    }
    return { main: "Arial", sub: "Helvetica" };
}

// Icon generation
function generateIcons(style) {
    const iconSets = {
        "corporate": ["fas fa-rocket", "fas fa-lightbulb", "fas fa-paper-plane"],
        "fun": ["🎈", "🍕", "🎊"],
        "modern": ["fas fa-feather", "fas fa-pen", "fas fa-ruler"],
        "wild": ["🦄", "🎨", "🔥"]
    };
    return iconSets[style] || iconSets["corporate"];
}

// Display all results
function displayResults(colors, fonts, icons, backgroundType) {
    displayColorPalette(colors, backgroundType);
    displayTypography(fonts);
    displayIcons(icons);
    displayPreview(colors, fonts, icons, backgroundType);
}

// Display color palette
function displayColorPalette(colors, backgroundType) {
    const container = document.getElementById('color-palette');
    // Similar to your Streamlit display logic but in HTML
    // Include contrast calculations and accessibility checks
}

// Other display functions would follow similar patterns