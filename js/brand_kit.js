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
            type: "minimal outline",
            source: "Material Icons",
            additional_sources: ["Font Awesome", "Ionicons", "Feather Icons"],
            icons: ["fas fa-building", "fas fa-chart-line", "fas fa-users"]
        }
    ],
    extraterrestrial: [ // Add this entry
        {
            type: "futuristic",
            source: "Phosphor Icons",
            additional_sources: ["Hero Icons", "Radix Icons", "Universe Icons"],
            icons: ["fas fa-rocket", "fas fa-star", "fas fa-meteor"]
        }
    ]
  }
};


let presets = {...DEFAULT_PRESETS};

//const GFONTS_API_KEY = 'AIzaSyCZXwIUwMq07UdWclEKu_5uS282ZfV6giQ'; 

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

function updateIconSection(style) {
    const config = generateIcons(style);
    const section = document.querySelector('.icon-section');
    
    // Safe element references
    const styleElement = document.getElementById('icon-style-type');
    const sourceElement = document.getElementById('icon-source');
    const sourcesElement = document.getElementById('icon-other-sources');
    const previewElement = document.getElementById('icon-preview');

    // Update content with null checks
    if (styleElement) styleElement.textContent = config.type || 'Not Specified';
    if (sourceElement) sourceElement.textContent = config.source || 'Default Source';
    
    // Safe array join
    if (sourcesElement) {
        sourcesElement.textContent = Array.isArray(config.additional_sources) 
            ? config.additional_sources.join(', ')
            : 'No additional sources available';
    }

    // Safe icon display
    if (previewElement) {
        previewElement.innerHTML = (config.icons || []).map(icon => 
            icon.startsWith('fas ') 
                ? `<i class="${icon}"></i>` 
                : `<span>${icon}</span>`
        ).join('');
    }

    // Show section if hidden
    section.classList.remove('hidden');
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
	document.querySelectorAll('.preview-header, .preview-mode-selector, .download-section')
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
  
    

  // Generate previews
  document.getElementById('website-preview').innerHTML = generateWebsitePreview(colors, fonts, iconConfig);
  document.getElementById('print-preview').innerHTML = generatePrintPreview(colors, fonts, iconConfig);
  
   try {
    updateIconSection(style);
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
            // Dynamic contrast target based on background type
            contrastTarget: backgroundType === 'dark' ? 4.5 : 3 
        },
        { label: "Body Text", value: colors.body_text, usage: "Text", contrastTarget: 4.5 },
        { label: "Background", value: colors.background, usage: "Base", contrastTarget: 1 }
    ];
    
    // Display current swatch name
    document.querySelector('.current-swatch-name').textContent = `Current Swatch: ${colors.name}`;

    swatches.forEach(swatch => {
        const swatchItem = document.createElement('div');
        swatchItem.className = 'swatch-item';
        const contrastRatio = swatch.label !== "Background" ? 
            calculateContrastRatio(swatch.value, colors.background) : 0;
        
        swatchItem.innerHTML = `
            <div class="swatch-color" style="background:${swatch.value}"></div>
            <div class="swatch-label">${swatch.label}</div>
            <div class="bk-swatch-value">${swatch.value}</div>
            ${swatch.label !== "Background" ? `
                <div class="swatch-contrast-status" 
                     data-contrast="${contrastRatio.toFixed(1)}" 
                     data-required="${swatch.contrastTarget}">
                    Contrast: ${contrastRatio.toFixed(1)}:1
                    <div class="contrast-status-message"></div>
                </div>
            ` : ''}
        `;
        
        swatchGrid.appendChild(swatchItem);
    });

    // Update contrast status messages
    document.querySelectorAll('.swatch-contrast-status').forEach(item => {
    const contrast = parseFloat(item.dataset.contrast);
    const required = parseFloat(item.dataset.required);
    const message = item.querySelector('.contrast-status-message');
    
    // Get the swatch label from parent element
    const swatchLabel = item.closest('.swatch-item')
                          .querySelector('.swatch-label').textContent.trim();

    if (contrast >= required) {
        message.textContent = swatchLabel === "Neutral" 
            ? "✅ Sufficient Contrast" 
            : "✅ Good Contrast";
        message.classList.add('contrast-good');
    } else {
        message.textContent = swatchLabel === "Neutral"
            ? "⚠️ Low Contrast for Background"
            : "⚠️ Low Contrast";
        message.classList.add('contrast-warning');
    }
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
        const passes = ratio >= check.minRatio;
        
        const col = document.createElement('div');
        col.className = 'contrast-column';
        
        // Fixed template literal with proper line breaks
        col.innerHTML = `
            <div class="contrast-item">
                <strong>${check.label}</strong>
                <span class="color-pair">${check.color} on ${check.bgColor}</span>
                <span class="contrast-ratio">Ratio: ${ratio.toFixed(1)}:1</span>
                <span class="compliance-status ${passes ? 'pass' : 'fail'}">
                    ${passes ? '✅' : '❌'} 
                    ${passes ? '(AA compliant)' : `(Needs ${check.minRatio}:1+)`}
                </span>
            </div>
        `;  // <-- Make sure this backtick is properly aligned
        
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
    // Convert hex to RGB
    const r1 = parseInt(color1.substr(1, 2), 16) / 255;
    const g1 = parseInt(color1.substr(3, 2), 16) / 255;
    const b1 = parseInt(color1.substr(5, 2), 16) / 255;
    
    const r2 = parseInt(color2.substr(1, 2), 16) / 255;
    const g2 = parseInt(color2.substr(3, 2), 16) / 255;
    const b2 = parseInt(color2.substr(5, 2), 16) / 255;
    
    // Calculate relative luminance
    const luminance1 = 0.2126 * r1 + 0.7152 * g1 + 0.0722 * b1;
    const luminance2 = 0.2126 * r2 + 0.7152 * g2 + 0.0722 * b2;
    
    // Calculate contrast ratio
    const lighter = Math.max(luminance1, luminance2);
    const darker = Math.min(luminance1, luminance2);
    return (lighter + 0.05) / (darker + 0.05);
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

// HELPER FUNCTIONS
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
        notification.textContent = 'All swatches shown - resetting list';
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

 

function generateWebsitePreview(colors, fonts, iconConfig) {
	 const icons = iconConfig?.icons || [];
  return `
    <div class="website-preview" style="color: ${colors.body_text}">
      <div class="header-container">
        <div class="header-text">
          <h1 style="font-family: ${fonts.main}">Welcome to Our Brand</h1>
          <p class="subtitle" style="color: ${colors.secondary}">Crafting memorable experiences</p>
          <p>Discover how our new brand identity comes to life across digital experiences.</p>
        </div>
        <div class="image-placeholder" style="border-color: ${colors.neutral}; color: ${colors.neutral}">
          Your Image Here
        </div>
      </div>

      <div class="content-block">
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

      <a href="#" class="button" style="background-color: ${colors.accent}; color: ${colors.neutral}">Explore Our Brand Guidelines</a>

      <div class="icon-row">
                ${icons.map(icon => 
                    icon.startsWith('fas ') 
                        ? `<i class="${icon}" style="color: ${colors.primary};"></i>`
                        : `<span class="icon">${icon}</span>`
                ).join(' ')}
            </div>
        </div>
  `;
}

function generatePrintPreview(colors, fonts, iconConfig) { // Changed parameter name
  return `
    <div class="print-preview">
      <h1 style="font-family: ${fonts.main}; color: ${colors.primary}">Brand Flyer</h1>
      <p>This is a sample print document preview using your brand kit. The colors, fonts, and icons are dynamically applied to showcase how your brand might look in a printed format.</p>
      <p>Here's a <span class="highlight" style="background-color: ${colors.accent}; color: ${colors.neutral}">highlighted section</span> styled with your accent color.</p>
      <p>
        ${iconConfig.icons.map(icon => 
          `<span class="icon" style="color: ${colors.primary}">${
            icon.startsWith('fas ') ? `<i class="${icon}"></i>` : icon
          }</span>`
        ).join(' ')}
      </p>
    </div>
  `;
}
});