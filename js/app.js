// Main App Module - Initializes everything

document.addEventListener('DOMContentLoaded', () => {
    console.log('TaskFlow Initializing...');
    
    // Initialize only core modules (not Progress)
    Theme.init();
    UI.init();
    Tasks.init();
    
    // Setup sidebar
    setupSidebar();
    
    // Setup navigation
    setupNavigation();
    
    // Setup mobile menu
    setupMobileMenu();
    
    console.log('TaskFlow Ready! 🚀');
});

function setupSidebar() {
    const sidebar = document.getElementById('sidebar');
    const collapseBtn = document.getElementById('collapseBtn');
    
    if (sidebar && collapseBtn) {
        const isCollapsed = Storage.getSidebarCollapsed();
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
        }
        
        collapseBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            Storage.saveSidebarCollapsed(sidebar.classList.contains('collapsed'));
        });
    }
}

function setupNavigation() {
    const navItems = document.querySelectorAll('.nav-item');
    const pages = document.querySelectorAll('.page');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            if (item.classList.contains('disabled')) {
                UI.showToast('Coming soon! 🚀', 'info');
                return;
            }
            
            const pageId = item.getAttribute('data-page');
            
            navItems.forEach(nav => nav.classList.remove('active'));
            item.classList.add('active');
            
            pages.forEach(page => {
                if (page.getAttribute('data-page') === pageId) {
                    page.classList.add('active');
                } else {
                    page.classList.remove('active');
                }
            });
            
            // Refresh tasks when switching to dashboard
            if (pageId === 'dashboard') {
                Tasks.refresh();
            }
            
            // Refresh progress charts when switching to progress page
            if (pageId === 'progress' && typeof Progress !== 'undefined') {
                setTimeout(() => {
                    Progress.refresh();
                }, 100);
            }
            
            window.location.hash = pageId;
        });
    });
    
    const hash = window.location.hash.slice(1);
    if (hash) {
        const targetNav = document.querySelector(`.nav-item[data-page="${hash}"]`);
        if (targetNav && !targetNav.classList.contains('disabled')) {
            targetNav.click();
        }
    }
}

function setupMobileMenu() {
    const mobileBtn = document.getElementById('mobileMenuBtn');
    const sidebar = document.getElementById('sidebar');
    
    if (mobileBtn && sidebar) {
        mobileBtn.addEventListener('click', () => {
            sidebar.classList.toggle('mobile-open');
        });
        
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                if (!sidebar.contains(e.target) && !mobileBtn.contains(e.target)) {
                    sidebar.classList.remove('mobile-open');
                }
            }
        });
    }
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.focus();
            UI.showToast('🔍 Search focused!', 'info');
        }
    }
    
    if (e.key === 'Escape') {
        const searchInput = document.getElementById('searchInput');
        if (searchInput && document.activeElement === searchInput) {
            searchInput.value = '';
            Tasks.setSearchQuery('');
            UI.showToast('Search cleared', 'info');
        }
    }
});