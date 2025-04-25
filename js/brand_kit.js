const DEFAULT_PRESETS = {
  swatches: {
    corporate: {
      light: [
        {
          name: "Professional Blue",
          primary: "#2B579A",
          secondary: "#6B8CBE",
          accent: "#E81123",
          neutral: "#F2F2F2",
          body_text: "#333333",
          background: "#FFFFFF"
        },
        {
          name: "Executive Gray",
          primary: "#5F6C72",
          secondary: "#8E9EA6",
          accent: "#DBAE58",
          neutral: "#EAEAEA",
          body_text: "#222222",
          background: "#F8F8F8"
        }
      ],
      dark: [
        {
          name: "Midnight Blue",
          primary: "#1E3F66",
          secondary: "#4A6FA5",
          accent: "#FF6B6B",
          neutral: "#1A1A1A",
          body_text: "#E0E0E0",
          background: "#121212"
        }
      ]
    },
    modern: {
      light: [
        {
          name: "Tech Modern",
          primary: "#4285F4",
          secondary: "#34A853",
          accent: "#EA4335",
          neutral: "#F5F5F5",
          body_text: "#212121",
          background: "#FFFFFF"
        }
      ],
      dark: [
        {
          name: "Dark Futuristic",
          primary: "#8AB4F8",
          secondary: "#81C995",
          accent: "#FD9185",
          neutral: "#202124",
          body_text: "#E8EAED",
          background: "#171717"
        }
      ]
    }
  },
  fonts: {
    corporate: [
      {
        main: "Roboto",
        sub: "Open Sans",
        main_category: "sans-serif",
        sub_category: "sans-serif"
      },
      {
        main: "Lato",
        sub: "Montserrat",
        main_category: "sans-serif",
        sub_category: "sans-serif"
      }
    ],
    modern: [
      {
        main: "Montserrat",
        sub: "Lato",
        main_category: "sans-serif",
        sub_category: "sans-serif"
      }
    ]
  },
  
  icons: {
    corporate: [
        {
            type: "Minimal Outline",
            source: "Material Icons",
            additional_sources: ["Font Awesome", "Ionicons", "Feather Icons"],
            icons: ["fas fa-building", "fas fa-chart-line", "fas fa-users"]
        }
    ],
    extraterrestrial: [ // Add this entry
        {
            type: "Futuristic",
            source: "Phosphor Icons",
            additional_sources: ["Hero Icons", "Radix Icons", "Universe Icons"],
            icons: ["fas fa-rocket", "fas fa-star", "fas fa-meteor"]
        }
    ]
  }
};


let presets = {...DEFAULT_PRESETS};



async function getGoogleFonts(style) {
    try {
        const response = await fetch(`/api/fonts.php?style=${encodeURIComponent(style)}`);
        if(!response.ok) throw new Error('Font fetch failed');
        const data = await response.json();
        return data.items.map(f => f.family);
    } catch(error) {
        console.error('Fonts API error:', error);
        return ['Arial', 'Helvetica']; // Fallback fonts
    }
}

async function loadPresets() {
  try {
    const [swatchesRes, fontsRes, iconsRes] = await Promise.all([
      fetch('/presets/swatches.json'),
      fetch('/presets/fonts.json'),
      fetch('/presets/icons.json')
    ]);

    // Check network errors
    if (!swatchesRes.ok) throw new Error(`Swatches failed: ${swatchesRes.status}`);
    if (!fontsRes.ok) throw new Error(`Fonts failed: ${fontsRes.status}`);
    if (!iconsRes.ok) throw new Error(`Icons failed: ${iconsRes.status}`);

    // Parse responses
    const [swatchesText, fontsText, iconsText] = await Promise.all([
      swatchesRes.text(),
      fontsRes.text(),
      iconsRes.text()
    ]);

    // Validate JSON syntax
    try {
      presets.swatches = JSON.parse(swatchesText);
      presets.fonts = JSON.parse(fontsText);
      presets.icons = JSON.parse(iconsText);
    } catch (e) {
      throw new Error(`JSON parse error: ${e.message}`);
    }

    console.log('Loaded presets successfully');
  } catch (error) {
    console.error("Preset Loading Error:", error.message);
    console.log('Using default presets as fallback');
    presets = {
      ...DEFAULT_PRESETS,
      icons: DEFAULT_PRESETS.icons // Add missing comma here
    };
  }
}

function generateColors(style, backgroundType) {
  if (!presets.swatches[style]?.[backgroundType]) {
    console.warn(`Invalid combo: ${style}/${backgroundType}. Using default.`);
    return {
            ...presets.swatches.corporate.light[0],
            name: "Default Swatch"
        };
  }
  
  const swatches = presets.swatches[style][backgroundType];
  return swatches[Math.floor(Math.random() * swatches.length)];
}

function isDarkColor(hexColor) {
    const rgb = parseInt(hexColor.substring(1), 16);
    const r = (rgb >> 16) & 0xff;
    const g = (rgb >> 8) & 0xff;
    const b = (rgb >> 0) & 0xff;
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    return luminance < 128; // Returns true if color is dark
}


function generateIcons(style) {
    const defaultConfig = {
        type: "generic",
        source: "System Icons",
        additional_sources: [],
        icons: []
    };

    try {
        const preset = presets.icons[style]?.[0] || DEFAULT_PRESETS.icons[style]?.[0];
        return {
            ...defaultConfig,
            ...preset,
            additional_sources: preset?.additional_sources || []
        };
    } catch {
        return defaultConfig;
    }
}




function updateIconSection(style, colors) {
    const config = generateIcons(style);
	const section = document.querySelector('.icon-section');
    const previewElement = document.getElementById('icon-preview');
	// Correct element references
    const styleElement = document.getElementById('icon-style-type');
    const sourceElement = document.getElementById('icon-source');
    const sourcesElement = document.getElementById('icon-other-sources');
	
	if (styleElement) {
        styleElement.textContent = config.type || 'Not Specified';
    }
    if (sourceElement) {
        sourceElement.textContent = config.source || 'Default Source';
    }
    if (sourcesElement) {
        const sources = Array.isArray(config.additional_sources) 
            ? config.additional_sources.join(', ')
            : 'No additional sources available';
        sourcesElement.textContent = sources;
    }
    
    if (previewElement) {
        previewElement.innerHTML = (config.icons || []).map(icon => {
            if (typeof icon === 'object') {
                if (icon.type === 'font-awesome') {
                    return `<i class="${icon.class}" style="color: ${colors.primary}"></i>`;
                }
                if (icon.type === 'local-svg') {
                    return `<img src="${icon.path}" class="custom-icon-svg color-replace" alt="${icon.name}">`;
                }
                if (icon.type === 'local-svg-fixed') {
                    return `<img src="${icon.path}" class="custom-icon-svg" alt="${icon.name}">`;
                }
                return `<span>${JSON.stringify(icon)}</span>`;
            }
            if (typeof icon === 'string') {
                return icon.startsWith('fas ') 
                    ? `<i class="${icon}" style="color: ${colors.primary}"></i>` 
                    : `<span>${icon}</span>`;
            }
            return '';
        }).join('');

        // Only apply color replacement to icons with the color-replace class
        document.querySelectorAll('.custom-icon-svg.color-replace').forEach(img => {
            fetch(img.src)
                .then(r => {
                    if (!r.ok) throw new Error('Failed to fetch SVG');
                    return r.text();
                })
                .then(svg => {
                    const coloredSVG = svg
                        .replace(/(fill|stroke)="#[0-9a-f]{6}"/gi, `$1="${colors.primary}"`)
                        .replace(/(fill|stroke)="currentColor"/gi, `$1="${colors.primary}"`);
                    
                    const base64SVG = btoa(unescape(encodeURIComponent(coloredSVG)));
                    img.src = `data:image/svg+xml;base64,${base64SVG}`;
                })
                .catch(error => {
                    console.error('Error processing SVG:', error);
                });
        });

        previewElement.style.color = colors.primary;
    }
    
    // Show section if hidden
    document.querySelector('.icon-section').classList.remove('hidden');
}

function processPreviewIcons(previewContainer, colors) {
    previewContainer.querySelectorAll('.custom-icon-svg.color-replace').forEach(img => {
        fetch(img.src)
            .then(r => r.text())
            .then(svg => {
                const coloredSVG = svg
                    .replace(/(fill|stroke)="#[0-9a-f]{6}"/gi, `$1="${colors.primary}"`)
                    .replace(/(fill|stroke)="currentColor"/gi, `$1="${colors.primary}"`);
                const base64SVG = btoa(unescape(encodeURIComponent(coloredSVG)));
                img.src = `data:image/svg+xml;base64,${base64SVG}`;
            })
            .catch(error => {
                console.error('Preview SVG error:', error);
            });
    });
}





document.addEventListener('DOMContentLoaded', async () => {
    await loadPresets();
    
  function displayResults(colors, fonts, iconConfig, backgroundType) {
  console.log('Displaying results with:', { colors, fonts, iconConfig, backgroundType });
   if (!iconConfig?.icons) {
        console.warn('No icon configuration available');
        iconConfig = { icons: [] }; // Fallback empty icons
    }
  // Set CSS variables for easy theming
  document.documentElement.style.setProperty('--primary-color', colors.primary);
  document.documentElement.style.setProperty('--secondary-color', colors.secondary);
  document.documentElement.style.setProperty('--accent-color', colors.accent);
  document.documentElement.style.setProperty('--neutral-color', colors.neutral);
  document.documentElement.style.setProperty('--body-text-color', colors.body_text); 
  document.documentElement.style.setProperty('--background-color', colors.background);
  document.documentElement.style.setProperty('--body-font', fonts.sub);
  document.documentElement.style.setProperty('--header-font', fonts.main);
  // Update font display
  document.querySelector('.personality-font-example').style.fontFamily = fonts.main;
  document.querySelector('.body-font-example').style.fontFamily = fonts.sub;
  document.querySelector('.personality-font-name').textContent = fonts.main;
  document.querySelector('.body-font-name').textContent = fonts.sub;
  document.querySelector('.personality-font-category').textContent = fonts.main_category;
  document.querySelector('.body-font-category').textContent = fonts.sub_category;
  
  // Force font update
    document.querySelector('.personality-font-example').style.fontFamily = `'${fonts.main}'`;
    document.querySelector('.body-font-example').style.fontFamily = `'${fonts.sub}'`;
    document.querySelector('.personality-font-name').textContent = fonts.main;
    document.querySelector('.body-font-name').textContent = fonts.sub;
	document.querySelectorAll('.preview-header, .preview-mode-selector, #download-pdf')
        .forEach(el => el.classList.remove('hidden'));
  
  const previewSections = document.querySelectorAll('.preview-box, .website-preview, .print-preview');
  previewSections.forEach(section => {
    section.style.backgroundColor = colors.background;
  });

  // Get the selected style
  const style = document.getElementById('style').value;
  
  // Add mood description
  displayMoodDescription(style);
  
  // Add color swatches
  displayColorSwatches(colors, backgroundType);
  
  // Add contrast checks
  displayContrastChecks(colors);
  
// Generate previews - MODIFIED VERSION

const websitePreviewElement = document.getElementById('website-preview');
websitePreviewElement.innerHTML = generateWebsitePreview(colors, fonts, iconConfig, style); // Pass style here
processPreviewIcons(websitePreviewElement, colors);

const printPreviewElement = document.getElementById('print-preview');
printPreviewElement.innerHTML = generatePrintPreview(colors, fonts, iconConfig);
processPreviewIcons(printPreviewElement, colors);
  
   try {
    updateIconSection(style, colors);
  } catch (error) {
    console.error('Icon section error:', error);
    document.querySelector('.icon-section').classList.add('hidden');
  }
  
  // Set up preview mode switcher
  setupPreviewModeSwitcher();
  
  // Show results section
  document.getElementById('results').classList.remove('hidden');
  
    getFontWeights(fonts.main).then(weights => {
    const rec = recommendWeights('personality', weights);
    console.log('Main font weights:', weights, 'Selected:', rec); // Debug log
    document.querySelector('.personality-font-weight').textContent = rec;
});

getFontWeights(fonts.sub).then(weights => {
    const rec = recommendWeights('neutral', weights);
    console.log('Sub font weights:', weights, 'Selected:', rec); // Debug log
    document.querySelector('.body-font-weight').textContent = rec;
});
  
  
}
	
function displayMoodDescription(style) {
    const descriptions = {
    corporate: "📊 Mood/Feel: Professional, sophisticated, polished, and trustworthy. These colors evoke confidence and competence, ideal for a business setting.",
    modern: "🚀 Mood/Feel: Sleek, minimalist, and cutting-edge. The modern palette combines neutral tones with pops of bright, bold accents for a clean and dynamic look.",
    fun: "😜 Mood/Feel: Playful, energetic, and lighthearted. These colors bring a sense of joy, youthfulness, and excitement.",
    wild: "🎨 Mood/Feel: Bold, adventurous, and untamed. The wild palette is intense, vibrant, and full of energy, creating a sense of excitement and unpredictability.",
    extraterrestrial: "👽 Mood/Feel: Futuristic, otherworldly, and mysterious. These colors evoke the unknown, with glowing and metallic shades that suggest an alien or sci-fi influence."
    };
	
 
    const moodElement = document.querySelector('.mood-description');
    moodElement.innerHTML = `<p>${descriptions[style] || ''}</p>`;
}

function displayColorSwatches(colors, backgroundType) {
    const swatchGrid = document.querySelector('.swatch-grid');
    swatchGrid.innerHTML = '';
    
    const swatches = [
        { label: "Primary", value: colors.primary, usage: "60%", contrastTarget: 3 },
        { label: "Secondary", value: colors.secondary, usage: "30%", contrastTarget: 3 },
        { label: "Accent", value: colors.accent, usage: "10%", contrastTarget: 3 },
        { 
            label: "Neutral", 
            value: colors.neutral, 
            usage: "Backgrounds", 
            contrastTarget: backgroundType === 'light' ? 4.5 : 3
        },
        { label: "Body Text", value: colors.body_text, usage: "Text", contrastTarget: 4.5 },
        { label: "Background", value: colors.background, usage: "Base", contrastTarget: 1 }
    ];

    document.querySelector('.current-swatch-name').innerHTML = `Current Palette: <span class="swatch-name">${colors.name}</span>`;

    swatches.forEach(swatch => {
        const swatchItem = document.createElement('div');
        swatchItem.className = 'swatch-item';
        const contrastRatio = swatch.label !== "Background" ? 
            calculateContrastRatio(swatch.value, colors.background) : 0;
        
        // New contrast messaging logic
        let contrastMessage = '';
        if (swatch.label !== "Background") {
            const isAAA = contrastRatio >= 7;
            const meetsAA = contrastRatio >= swatch.contrastTarget;
            
            if (isAAA) {
                contrastMessage = '✅ AAA Excellent Contrast';
            } else if (meetsAA) {
                contrastMessage = '✅ AA Good Contrast';
            } else {
                contrastMessage = swatch.label === "Neutral" && backgroundType === 'light' ?
                    '⚠️ Low Contrast for Text' :
                    '⚠️ Low Contrast';
            }
        }

        swatchItem.innerHTML = `
            <div class="swatch-color" style="background:${swatch.value}"></div>
            <div class="swatch-label">${swatch.label}</div>
            <div class="bk-swatch-value">${swatch.value}</div>
            ${swatch.label !== "Background" ? `
                <div class="swatch-contrast-status" 
                     data-contrast="${contrastRatio.toFixed(1)}" 
                     data-required="${swatch.contrastTarget}">
                    Contrast: ${contrastRatio.toFixed(1)}:1
                    <div class="contrast-status-message">${contrastMessage}</div>
                </div>
            ` : ''}
        `;
        
        swatchGrid.appendChild(swatchItem);
    });
}



function displayContrastChecks(colors) {
    const contrastContainer = document.querySelector('.contrast-checks');
    contrastContainer.innerHTML = '';
    
    const checks = [
        { 
            label: "Primary Contrast", 
            color: colors.primary, 
            bgColor: colors.background,
            minRatio: 3 
        },
        { 
            label: "Secondary Contrast", 
            color: colors.secondary, 
            bgColor: colors.background,
            minRatio: 3 
        },
        { 
            label: "Accent Contrast", 
            color: colors.accent, 
            bgColor: colors.background,
            minRatio: 3 
        },
        { 
            label: "Body Text Contrast", 
            color: colors.body_text, 
            bgColor: colors.background,
            minRatio: 4.5 
        }
    ];
    
    const columns = document.createElement('div');
    columns.className = 'contrast-columns';
    
    checks.forEach(check => {
        const ratio = calculateContrastRatio(check.color, check.bgColor);
        const passesAA = ratio >= check.minRatio;
        const passesAAA = ratio >= 7; // WCAG AAA standard
        
        let statusText, statusSymbol;
        if (passesAAA) {
            statusSymbol = '✅';
            statusText = '(AAA compliant)';
        } else if (passesAA) {
            statusSymbol = '✅';
            statusText = '(AA compliant)';
        } else {
            statusSymbol = '❌';
            statusText = `(Needs ${check.minRatio}:1+)`;
        }

        const col = document.createElement('div');
        col.className = 'contrast-column';
        
        col.innerHTML = `
            <div class="contrast-item">
                <strong>${check.label}</strong>
                <span class="color-pair">${check.color} on ${check.bgColor}</span>
                <span class="contrast-ratio">Ratio: ${ratio.toFixed(1)}:1</span>
                <span class="compliance-status ${passesAA ? 'pass' : 'fail'}">
                    ${statusSymbol} ${statusText}
                </span>
            </div>
        `;
        
        columns.appendChild(col);
    });
    
    contrastContainer.appendChild(columns);
}
	
function setupPreviewModeSwitcher() {
  const buttons = document.querySelectorAll('.preview-mode-btn');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active button
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      
      // Show corresponding preview
      document.querySelectorAll('.preview-content').forEach(content => {
        content.classList.remove('active');
      });
      document.getElementById(`${btn.dataset.mode}-preview`).classList.add('active');
    });
  });
}	
	
	
function calculateContrastRatio(color1, color2) {
    // Convert hex to RGB and normalize to [0,1]
    const parseChannel = (hex, start) => parseInt(hex.substr(start, 2), 16) / 255;

    const r1 = parseChannel(color1, 1);
    const g1 = parseChannel(color1, 3);
    const b1 = parseChannel(color1, 5);

    const r2 = parseChannel(color2, 1);
    const g2 = parseChannel(color2, 3);
    const b2 = parseChannel(color2, 5);

    // Convert sRGB to linear RGB
    const toLinear = (c) => c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

    const lr1 = toLinear(r1);
    const lg1 = toLinear(g1);
    const lb1 = toLinear(b1);

    const lr2 = toLinear(r2);
    const lg2 = toLinear(g2);
    const lb2 = toLinear(b2);

    // Calculate relative luminance
    const luminance1 = 0.2126 * lr1 + 0.7152 * lg1 + 0.0722 * lb1;
    const luminance2 = 0.2126 * lr2 + 0.7152 * lg2 + 0.0722 * lb2;

    // Ensure L1 >= L2
    const L1 = Math.max(luminance1, luminance2);
    const L2 = Math.min(luminance1, luminance2);
    return (L1 + 0.05) / (L2 + 0.05);
}	
	
	
	// State Management
    let usedSwatches = {
        corporate: { light: [], dark: [] },
        modern: { light: [], dark: [] },
        fun: { light: [], dark: [] },
        wild: { light: [], dark: [] },
        extraterrestrial: { light: [], dark: [] }
    };
    
	let usedFontCombos = {
    corporate: [],
    modern: [],
    fun: [],
    wild: [],
    extraterrestrial: []
	};
	
	let currentState = {
        colors: null,
        fonts: null,
        iconConfig: null,
        style: null,
        background: null
    };
	
function generateFonts(style) {
    if (!presets.fonts[style]) return DEFAULT_PRESETS.fonts[style];
    
    const available = presets.fonts[style].filter(
        combo => !usedFontCombos[style].includes(combo.main)
    );
    
    if (available.length === 0) {
        usedFontCombos[style] = [];
        showResetNotification('font');
    }
    
    const combo = available.length > 0 
        ? available[Math.floor(Math.random() * available.length)]
        : presets.fonts[style][Math.floor(Math.random() * presets.fonts[style].length)];
    
    usedFontCombos[style].push(combo.main);
    return combo;
}

		

    // Generate Button Handler
   document.getElementById('generate-btn').addEventListener('click', () => {
    const style = document.getElementById('style').value;
    const background = document.getElementById('background').value;
    
    try {
        // Generate new brand kit
        const newColors = generateColors(style, background);
        const newFonts = generateFonts(style);
        const iconConfig = generateIcons(style);

        // Update current state
        currentState = {
            colors: newColors,
            fonts: newFonts,
            iconConfig: iconConfig,
            style: style,
            background: background
        };

        // Track swatch usage
        trackSwatchUsage(style, background, newColors.name);
        
        // Update display - FIXED LINE 👇
        displayResults(currentState.colors, currentState.fonts, currentState.iconConfig, background);
        
        document.getElementById('results').classList.remove('hidden');
        document.getElementById('regenerate-swatch').style.display = 'inline-block';

        // Load fonts dynamically
        loadGoogleFont(newFonts.main);
        loadGoogleFont(newFonts.sub);
        
        // Show font section
        document.querySelector('.font-section').classList.add('visible');

    } catch (error) {
        console.error("Generation error:", error);
        alert("Error generating kit. Please try again.");
    }
    
    document.querySelector('.preview-mode-selector').classList.add('visible');
});

    // Regenerate Button Handler
    document.getElementById('regenerate-swatch').addEventListener('click', () => {
        if (!currentState.colors) {
            alert('Please generate a brand kit first!');
            return;
        }
        
        try {
            const newColors = getNewSwatch(currentState.style, currentState.background);
            currentState.colors = newColors;
            trackSwatchUsage(currentState.style, currentState.background, newColors.name);
            
            // Update display
            displayResults(currentState.colors, currentState.fonts, currentState.iconConfig, currentState.background);
            
            // Show reset notification if needed
            if (usedSwatches[currentState.style][currentState.background].length === 1) {
                showResetNotification();
            }
            
        } catch (error) {
            console.error("Regeneration error:", error);
            alert("Error regenerating swatch. Please try again.");
        }
    });
	
	//New Font button
	document.getElementById('regenerate-fonts').addEventListener('click', () => {
    if (!currentState.style) {
        alert('Generate a brand kit first!');
        return;
    }
    
    try {
        currentState.fonts = generateFonts(currentState.style);
        loadGoogleFont(currentState.fonts.main);
        loadGoogleFont(currentState.fonts.sub);
        
        // Pass iconConfig from currentState
        displayResults(
            currentState.colors, 
            currentState.fonts, 
            currentState.iconConfig, // Changed from currentState.icons
            currentState.background
        );
    } catch (error) {
        console.error("Font error:", error);
        alert("Error regenerating fonts. Please try again.");
    }
});

//Download PDF
document.getElementById('download-pdf').addEventListener('click', async () => {
    try {
        await generatePDF();
    } catch (error) {
        console.error('PDF generation failed:', error);
        alert('Error generating PDF. Please try again.');
    }
});

async function generatePDF() {
	
	const { jsPDF } = window.jspdf; // Access from global scope
	const canvg = window.canvg; // Access from global scope
	
    if (!currentState.colors || !currentState.fonts) {
        alert('Please generate a brand kit first!');
        return;
    }

    const { colors, fonts, iconConfig, style } = currentState;
    const doc = new jspdf.jsPDF();
    
    // PDF Settings
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    let yPos = margin;
    
    // Add Style Name
    doc.setFontSize(22);
    doc.setTextColor(40);
    doc.text(`Brand Kit - ${style.toUpperCase()} Style`, pageWidth/2, yPos, { align: 'center' });
    yPos += 8;
	
	// Add contact info
	doc.setFontSize(16);
    doc.setTextColor(40);
    doc.text(`Need help? Contact: support@miketurko.com`, pageWidth/2, yPos, { align: 'center' });
    yPos += 15;
	

    // Add Color Swatches
    doc.setFontSize(16);
    doc.text('Color Palette', margin, yPos);
    yPos += 6;
	
	// Add swatch name
	doc.setFontSize(12);
	doc.text(`Palette Name: ${colors.name}`, margin, yPos);
	yPos += 8; // 
    
    const swatchSize = 20;
    const swatchSpacing = 25;
    const colorsToShow = [
        { label: 'Primary', color: colors.primary },
        { label: 'Secondary', color: colors.secondary },
        { label: 'Accent', color: colors.accent },
        { label: 'Neutral', color: colors.neutral },
        { label: 'Text', color: colors.body_text },
        { label: 'Background', color: colors.background }
    ];

    colorsToShow.forEach((swatch, index) => {
    const xPos = margin + (index % 3) * 60;
    // Modified spacing code 👇
    if (index % 3 === 0 && index !== 0) {
        yPos += swatchSpacing + 10;
    }
    
    // Draw color square
    doc.setFillColor(swatch.color);
    doc.rect(xPos, yPos, swatchSize, swatchSize, 'F');
    
    // Add text
    doc.setFontSize(10);
    doc.setTextColor(40);
    doc.text(swatch.label, xPos, yPos + swatchSize + 5);
    doc.text(swatch.color, xPos, yPos + swatchSize + 10);
});

yPos += swatchSpacing * 2; //You can also adjust this multiplier

    // Add Font Section
	const originalFont = doc.getFont().fontName;
	
    doc.setFontSize(16);
    doc.text('Typography', margin, yPos);
    yPos += 10;
    
    doc.setFontSize(12);
    doc.text(`Main Font: ${fonts.main} (${fonts.main_category})`, margin, yPos);
    yPos += 8;
    doc.text(`Secondary Font: ${fonts.sub} (${fonts.sub_category})`, margin, yPos);
    yPos += 12;
	
	doc.setFontSize(12);
	doc.text(`Typography Source: Google Fonts`, margin, yPos);
	yPos += 8;
	doc.setFontSize(12);
	doc.text(`Other Free Sources: Fontsquirrel`, margin, yPos);
	yPos += 15;



    

// Add Icons Section - REORDERED CODE
// Icon rendering section
const iconSize = 12;
const iconsPerRow = 6;
const verticalPadding = 4;

doc.setFont(originalFont);
doc.setFontSize(16);
doc.text('Icon Details', margin, yPos);
yPos += 9;

doc.setFontSize(12);
doc.text(`Style: ${iconConfig.type}`, margin, yPos);
yPos += 6; // Space before icons

// --- Set initial icon grid position ---
let xPos = margin;
let currentY = yPos; // Start icon grid below header

// Process icons
for await (const icon of iconConfig.icons) {
    try {
        let imgData;
        let iconPath = '';

        // Handle different icon types
        if (icon.type === 'local-svg' || icon.type === 'local-svg-fixed') {
            const fullPath = window.location.origin + icon.path;
            
            // Create temporary container
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            tempDiv.innerHTML = await (await fetch(fullPath)).text();
            
            if (icon.type === 'local-svg') {
                // Apply brand color to all path elements
                const paths = tempDiv.querySelectorAll('path');
                paths.forEach(path => {
                    path.style.fill = colors.primary;
                });
            }

            // Render to canvas
            document.body.appendChild(tempDiv);
            const iconCanvas = await html2canvas(tempDiv, {
                backgroundColor: null,
                logging: false
            });
            imgData = iconCanvas.toDataURL('image/png');
            document.body.removeChild(tempDiv);
        } else if (icon.type === 'font-awesome') {
            // Existing font-awesome handling
            const tempDiv = document.createElement('div');
            tempDiv.className = 'temp-icon-capture';
            tempDiv.innerHTML = `<i class="${icon.class}" style="color: ${colors.primary}"></i>`;
            document.body.appendChild(tempDiv);
            
            const iconCanvas = await html2canvas(tempDiv);
            imgData = iconCanvas.toDataURL();
            document.body.removeChild(tempDiv);
        }


        // Add image to PDF
        if (imgData) {
            // Check page boundaries
            if (currentY + iconSize > doc.internal.pageSize.height - 20) { // 40mm bottom margin
                doc.addPage();
                currentY = margin + 10; // Leave space for header on new page
                xPos = margin;
            }

            

            doc.addImage(imgData, 'PNG', xPos, currentY, iconSize, iconSize);
            xPos += iconSize + 8;

            // New row logic
            if (xPos > (pageWidth - margin - iconSize)) {
                xPos = margin;
                currentY += iconSize + 8;
            }
        }
    } catch (error) {
        console.error(`Failed to process icon ${icon.name}:`, error);
    }
}

    // Update Y position for subsequent content
    yPos = currentY + iconSize + 8;
		
	///end new code

	//icon text descriptions
    doc.setFont(originalFont);
	doc.setFontSize(16);
	yPos += 0;
    
    doc.setFontSize(12);
	doc.text(`Recommended Source: ${iconConfig.source}`, margin, yPos);
	yPos += 6;
	doc.text(`Other Free Sources: ${iconConfig.additional_sources.join(', ')}`, margin, yPos);
	yPos += 8;
    
    

    // Save PDF
    doc.save(`brandkit-${style}-${new Date().toISOString().slice(0,10)}.pdf`);
}

// HELPER FUNCTIONS

// new icon on pdf code
	async function processLocalSVG(iconPath, colors) {
    try {
        const response = await fetch(iconPath);
        if (!response.ok) throw new Error(`SVG fetch failed: ${response.status}`);
        
        const svgText = await response.text();
        
        // Color replacement
        const coloredSVG = svgText
            .replace(/fill=["']currentColor["']/gi, `fill="${colors.primary}"`)
            .replace(/stroke=["']currentColor["']/gi, `stroke="${colors.primary}"`)
            .replace(/<svg /, '<svg style="overflow:visible" ')
            .replace(/(fill|stroke)=["']none["']/gi, '$1="none"');

        // Extract viewBox dimensions
        const viewBoxMatch = coloredSVG.match(/viewBox=["'](-?\d+[\.]?\d*)\s+(-?\d+[\.]?\d*)\s+(\d+[\.]?\d*)\s+(\d+[\.]?\d*)["']/);
        const viewBoxWidth = viewBoxMatch ? parseFloat(viewBoxMatch[3]) : 24;
        const viewBoxHeight = viewBoxMatch ? parseFloat(viewBoxMatch[4]) : 24;

        // Calculate scaling
        const targetSizeMM = 12; // Match your iconSize
        const scale = targetSizeMM / Math.max(viewBoxWidth, viewBoxHeight);

        // Create canvas
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = viewBoxWidth * 10;
        tempCanvas.height = viewBoxHeight * 10;
        
        await canvg(tempCanvas, coloredSVG, {
            ignoreClear: true,
            scaleWidth: viewBoxWidth * scale * 10,
            scaleHeight: viewBoxHeight * scale * 10
        });

        // Add white background
        const ctx = tempCanvas.getContext('2d');
        ctx.globalCompositeOperation = 'destination-over';
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

        return tempCanvas.toDataURL('image/png');
    } catch (error) {
        console.error('SVG processing failed:', error);
        return null;
    }
}
//end new icon on pdf code

    function trackSwatchUsage(style, backgroundType, swatchName) {
        if (!usedSwatches[style][backgroundType].includes(swatchName)) {
            usedSwatches[style][backgroundType].push(swatchName);
        }
    }

    function getNewSwatch(style, backgroundType) {
        const available = presets.swatches[style][backgroundType].filter(
            swatch => !usedSwatches[style][backgroundType].includes(swatch.name)
        );
        
        if (available.length === 0) {
            usedSwatches[style][backgroundType] = [];
            showResetNotification();
            return presets.swatches[style][backgroundType][
                Math.floor(Math.random() * presets.swatches[style][backgroundType].length)
            ];
        }
        
        return available[Math.floor(Math.random() * available.length)];
    }

    function showResetNotification() {
        const notification = document.createElement('div');
        notification.className = 'reset-notification';
        notification.textContent = 'All combos shown - resetting list';
        document.body.appendChild(notification);
        setTimeout(() => notification.remove(), 2000);
    }
	
	// Font weight utilities

	async function getFontWeights(fontName) {
    try {
        const response = await fetch(`/api/font-weights.php?font=${encodeURIComponent(fontName)}`);
        return await response.json();
    } catch {
        return ['400']; // Fallback
    }
}

    function recommendWeights(fontType, weights) {
    // Convert all weights to numeric values
    const numericWeights = weights.map(w => {
        if(w === 'regular') return '400';
        if(w === 'bold') return '700';
        return w.replace(/\D/g,'');
    }).filter(w => w.length > 0).map(Number);

    // Preferred weights based on font role
    const preferredWeights = {
        personality: [700, 800, 900, 600], // Bold weights first
        neutral: [400, 300, 500, 600]      // Medium/regular first
    };

    // Find first matching preferred weight
    const preferred = preferredWeights[fontType].find(p => 
        numericWeights.includes(p)
    );

    // Fallback logic
    return preferred || 
           numericWeights.find(w => w >= 400) || // Closest to regular
           numericWeights[0] || 
           400;		   
		   
}
    
	function loadGoogleFont(fontName) {
    const link = document.createElement('link');
    link.href = `https://fonts.googleapis.com/css2?family=${fontName.replace(' ', '+')}&display=swap`;
    link.rel = 'stylesheet';
    document.head.appendChild(link);
}

/* LOAD ICONS-------*/
// Configuration
const ICON_CONFIG = {
    localIconPath: '/icons/' // Base path for all icons
};

// Main icon loading function
async function loadIcons(style) {
    try {
        const response = await fetch('/presets/icons.json');
        const iconsData = await response.json();
        const styleIcons = iconsData[style]?.[0]?.icons || [];
        
        // Validate icon structure
        return styleIcons.map(icon => {
            if (typeof icon === 'string') {
                // Convert legacy string format to object format
                return {
                    type: 'font-awesome',
                    class: icon
                };
            }
            return icon;
        });
        
    } catch (error) {
        console.error('Error loading icons:', error);
        return [];
    }
}


// SVG loader
async function loadSVG(iconPath) {
    try {
        const response = await fetch(iconPath);
        const svgText = await response.text();
        const parser = new DOMParser();
        return parser.parseFromString(svgText, "image/svg+xml").documentElement;
    } catch (error) {
        console.error('Error loading SVG:', error);
        return null;
    }
}

// Icon display handler
async function displayIcons(style) {
    const preview = document.getElementById('icon-preview');
    preview.innerHTML = ''; // Clear existing
    
    const icons = await loadIcons(style);
    
    icons.forEach(async (icon) => {
        const container = document.createElement('div');
        container.className = 'icon-container';
        
        try {
            if (typeof icon === 'object') {
                // Handle Font Awesome object icons
                if (icon.type === 'font-awesome') {
                    const i = document.createElement('i');
                    i.className = icon.class;
                    container.appendChild(i);
                }
                // Handle local SVG icons
                else if (icon.type === 'local-svg') {
                    const fullPath = ICON_CONFIG.localIconPath + icon.path.split('/').pop();
                    const svg = await loadSVG(fullPath);
                    if (svg) container.appendChild(svg);
                }
				
            }
            // Handle legacy string icons
            else if (typeof icon === 'string') {
                if (icon.startsWith('fas ')) {
                    const i = document.createElement('i');
                    i.className = icon;
                    container.appendChild(i);
                } else {
                    container.textContent = icon;
                }
            }
			          
            preview.appendChild(container);
        } catch (error) {
            console.error('Error rendering icon:', error);
        }
    });
}

/*END LOAD ICONS----*/

 

function generateWebsitePreview(colors, fonts, iconConfig, style) {
	 const icons = iconConfig?.icons || [];
	 
	 // Map styles to image paths
    const styleImages = {
        corporate: '/img/previews/corporate.jpg',
        modern: '/img/previews/modern.jpg',
        fun: '/img/previews/fun.jpg',
        wild: '/img/previews/wild.jpg',
        extraterrestrial: '/img/previews/futuristic.jpg'
    };

    // Fallback image if style not found
    const previewImage = styleImages[style] || '/img/previews/default.jpg';
	 
	 
  return `
    
	<div class="website-preview-wrap">
	
	<nav class="bk-nav" style="background-color: ${colors.primary};">
                <div class="nav-container">
                    <div class="logo" style="color: ${colors.background}; font-family: ${fonts.main};">miketurko.com</div>
                    
                    <!-- Desktop Navigation -->
                    <ul class="nav-links" style="color: ${colors.background};">
                        <li>Home</li>
                        <li>Services</li>
                        <li>About</li>
                        <li>Contact</li>
                    </ul>
                    
                    <!-- Mobile Hamburger -->
                    <div class="hamburger" style="color: ${colors.background};">
                        <span class="bar"></span>
                        <span class="bar"></span>
                        <span class="bar"></span>
                    </div>
                </div>
                
                <!-- Mobile Menu -->
                <ul class="mobile-nav-links" style="background-color: ${colors.primary}; color: ${colors.background};">
                    <li>Home</li>
                    <li>Services</li>
                    <li>About</li>
                    <li>Contact</li>
                </ul>
            </nav>
	
	<div class="website-preview" style="color: ${colors.body_text}; --bg-color: ${colors.background};">

      <div class="header-container">
        <div class="header-text">
          <h1 style="font-family: ${fonts.main}; color:${colors.primary}">Welcome to Brand <span class="swatch-name">${colors.name}</span></h1>
          <p class="subtitle" style="color: ${colors.secondary}">Crafting memorable experiences</p>
          <p>Discover how our new brand identity comes to life across digital experiences.</p>
        </div>
        
		<div class="image-placeholder" >
                    <img src="${previewImage}" 
                         alt="${style} style example" 
                         style="width: 100%; height: 100%;">
                </div>
            </div>

      <div class="content-block" style="background-color:${colors.primary}; color:${colors.background}">
        <p>Our new brand system combines modern aesthetics with functional design. The carefully selected color palette and typography create a cohesive visual language that represents our values.</p>
      </div>

      <div class="features">
        <div class="feature-item">
          <span class="feature-icon" style="color: ${colors.accent}">✓</span>
          <div>
            <strong>Visual Harmony</strong>
            <p>Colors and fonts work in perfect balance</p>
          </div>
        </div>
        <div class="feature-item">
          <span class="feature-icon" style="color: ${colors.accent}">✓</span>
          <div>
            <strong>Brand Consistency</strong>
            <p>Uniform appearance across all platforms</p>
          </div>
        </div>
      </div>
		<div class="bk-button-wrap">
      <a href="#" class="bk-button" style="background-color: ${colors.accent}; color: ${colors.background}">Explore Our Brand Guidelines</a></div>

      <div class="icon-row" style="color: ${colors.primary} !important">
        ${icons.map(icon => {
            if (typeof icon === 'object') {
                if (icon.type === 'font-awesome') {
                    return `<i class="${icon.class}" style="color: ${colors.primary}"></i>`;
                }
                if (icon.type === 'local-svg') {
                    return `<img src="${icon.path}" class="custom-icon-svg color-replace" alt="${icon.name}">`;
                }
				if (icon.type === 'local-svg-fixed') {
                            return `<img src="${icon.path}" class="custom-icon-svg" alt="${icon.name}">`;
                        }
                }
            if (typeof icon === 'string') {
                return icon.startsWith('fas ') 
                    ? `<i class="${icon}" style="color: ${colors.primary}"></i>`
                    : `<span class="icon">${icon}</span>`;
            }
            return '';
        }).join(' ')}
      </div>
    </div>
	</div>
  `;
}

function processPreviewIcons(previewContainer, colors) {
    previewContainer.querySelectorAll('.custom-icon-svg.color-replace').forEach(img => {
        fetch(img.src)
            .then(r => r.text())
            .then(svg => {
                const coloredSVG = svg
                    .replace(/(fill|stroke)="#[0-9a-f]{6}"/gi, `$1="${colors.primary}"`)
                    .replace(/(fill|stroke)="currentColor"/gi, `$1="${colors.primary}"`);
                const base64SVG = btoa(unescape(encodeURIComponent(coloredSVG)));
                img.src = `data:image/svg+xml;base64,${base64SVG}`;
            })
            .catch(error => {
                console.error('Preview SVG error:', error);
            });
    });
}



function generatePrintPreview(colors, fonts, iconConfig) {
  return `
    <div class="print-preview">
      <h1 style="font-family: ${fonts.main}; color: ${colors.primary}">Brand Flyer</h1>
	  <div class="image-placeholder" style="border-color: ${colors.neutral}; color: ${colors.neutral}">
          Your Image Here
        </div>
      <p>This is a sample print document preview using your brand kit. The colors, fonts, and icons are dynamically applied to showcase how your brand might look in a printed format.</p>
      <p>Here's a <span class="bk_highlight" style="background-color: ${colors.accent}; color: ${colors.neutral}">highlighted section</span> styled with your accent color.</p>
      <p>
        ${iconConfig.icons.map(icon => {
          if (typeof icon === 'object') {
            if (icon.type === 'font-awesome') {
              return `<i class="${icon.class}" style="color: ${colors.primary}"></i>`;
            }
            if (icon.type === 'local-svg') {
              return `<img src="${icon.path}" class="custom-icon" alt="${icon.name}">`;
            }
          }
          if (typeof icon === 'string') {
            return icon.startsWith('fas ') 
              ? `<i class="${icon}" style="color: ${colors.primary}"></i>`
              : icon;
          }
          return '';
        }).join(' ')}
      </p>
    </div>
  `;
}
});