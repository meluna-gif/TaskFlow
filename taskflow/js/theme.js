// Theme Module - Handles all theme switching and persistence

const Theme = (function() {
    const themeStylesheet = document.getElementById('themeStylesheet');
    let currentTheme = Storage.getTheme();
    
    // Theme CSS file mapping
    const themeFiles = {
        light: 'css/themes/light.css',
        dark: 'css/themes/dark.css',
        blue: 'css/themes/blue.css',
        black: 'css/themes/black.css'
    };
    
    function applyTheme(theme) {
        // Update CSS file
        if (themeFiles[theme]) {
            themeStylesheet.href = themeFiles[theme];
        }
        
        // Update body class for any additional styling
        document.body.classList.remove('theme-light', 'theme-dark', 'theme-blue', 'theme-black');
        document.body.classList.add(`theme-${theme}`);
        
        // Save to storage
        Storage.saveTheme(theme);
        currentTheme = theme;
        
        // Update radio buttons in settings
        updateRadioButtons(theme);
        
        // Update theme selector UI
        updateThemeSelectorUI(theme);
        
        console.log(`Theme applied: ${theme}`);
    }
    
    function updateRadioButtons(theme) {
        const radioButtons = document.querySelectorAll('input[name="theme"]');
        radioButtons.forEach(radio => {
            if (radio.value === theme) {
                radio.checked = true;
                radio.closest('.theme-option')?.classList.add('selected');
            } else {
                radio.closest('.theme-option')?.classList.remove('selected');
            }
        });
    }
    
    function updateThemeSelectorUI(theme) {
        const themeOptions = document.querySelectorAll('.theme-option');
        themeOptions.forEach(option => {
            const optionTheme = option.getAttribute('data-theme');
            if (optionTheme === theme) {
                option.classList.add('selected');
            } else {
                option.classList.remove('selected');
            }
        });
    }
    
    function initializeThemeSelector() {
        const themeOptions = document.querySelectorAll('.theme-option');
        
        themeOptions.forEach(option => {
            const radio = option.querySelector('input[type="radio"]');
            if (radio) {
                radio.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        applyTheme(e.target.value);
                    }
                });
            }
            
            // Also make clicking the whole label work
            option.addEventListener('click', (e) => {
                // Don't trigger if clicking directly on the radio (to avoid double event)
                if (e.target.tagName !== 'INPUT') {
                    const radio = option.querySelector('input[type="radio"]');
                    if (radio && !radio.checked) {
                        radio.checked = true;
                        applyTheme(radio.value);
                    }
                }
            });
        });
    }
    
    function getCurrentTheme() {
        return currentTheme;
    }
    
    // Initialize theme on load
    function init() {
        initializeThemeSelector();
        applyTheme(currentTheme);
    }
    
    return {
        init,
        applyTheme,
        getCurrentTheme
    };
})();