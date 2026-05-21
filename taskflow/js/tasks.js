// Tasks Module - Handles all task CRUD operations

const Tasks = (function() {
    let tasks = [];
    let currentFilter = 'all';
    let currentSearchQuery = '';
    
   function loadTasks() {
    tasks = Storage.getTasks();
    //UI.updateFilterContext(currentFilter, currentSearchQuery);
    UI.renderAllTasks(tasks, currentFilter, currentSearchQuery, currentSort);
    updateStats();
    
    // Sync calendar when tasks change
    if (typeof Calendar !== 'undefined' && Calendar.renderCalendar) {
        Calendar.renderCalendar();
    }
    
    // Refresh progress charts
    if (typeof Progress !== 'undefined' && Progress.refresh) {
        Progress.refresh();
    }
}
    
    function addTask(title, dueDate, priority, category) {
    if (!title.trim()) {
        UI.showToast('Please enter a task title', 'error');
        return false;
    }
    
    const now = new Date().toISOString();
    
    const newTask = {
        title: title.trim(),
        dueDate: dueDate || '',
        priority: priority || 'medium',
        category: category || 'personal',
        completed: false,
        createdAt: now,
        updatedAt: now
    };
    
    Storage.addTask(newTask);
    loadTasks();
    UI.showToast('Task added successfully!', 'success');
    return true;
}
    
    function editTask(taskId, updates) {
    Storage.updateTask(taskId, {
        ...updates,
        updatedAt: new Date().toISOString()
    });
    loadTasks();
    UI.showToast('Task updated successfully!', 'success');
}
    
    function deleteTask(taskId) {
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            Modal.showDeleteConfirm(task.title, () => {
                Storage.deleteTask(taskId);
                loadTasks();
                UI.showToast('Task deleted successfully!', 'success');
            });
        }
    }
   function toggleComplete(taskId) {
    const task = tasks.find(t => t.id === taskId);
    
    if (task) {
        Storage.updateTask(taskId, {
            completed: !task.completed,
            updatedAt: new Date().toISOString()
        });
        
        loadTasks();
        
        UI.showToast(
            `Task marked as ${!task.completed ? 'completed' : 'uncompleted'}!`,
            'success'
        );
    }
}
    
    function clearAllTasks() {
        Modal.showClearAllConfirm(() => {
            Storage.clearAllTasks();
            loadTasks();
            UI.showToast('All tasks cleared!', 'info');
        });
    }
    
    function exportTasks() {
        const tasks = Storage.getTasks();
        const dataStr = JSON.stringify(tasks, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `taskflow-export-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        UI.showToast('Tasks exported successfully!', 'success');
    }
    
    function updateStats() {
        const activeTasks = tasks.filter(t => !t.completed).length;
        const completedTasks = tasks.filter(t => t.completed).length;
        
        const today = new Date().toISOString().split('T')[0];
        const todayTasks = tasks.filter(t => t.dueDate === today && !t.completed).length;
        
        const overdueTasks = tasks.filter(t => {
            if (t.completed) return false;
            if (!t.dueDate) return false;
            return t.dueDate < today;
        }).length;
        
        UI.updateStats(activeTasks, completedTasks, todayTasks, overdueTasks);
    }
    
    function setFilter(filter) {
    currentFilter = filter;
    //UI.updateFilterContext(currentFilter, currentSearchQuery);
    UI.updateFilterButtons(filter);
    UI.renderAllTasks(tasks, currentFilter, currentSearchQuery, currentSort);
}

function setSearchQuery(query) {
    currentSearchQuery = query.toLowerCase();
    //UI.updateFilterContext(currentFilter, currentSearchQuery);
    UI.renderAllTasks(tasks, currentFilter, currentSearchQuery, currentSort);
}
    
    function getTasks() {
        return tasks;
    }
    
    function refresh() {
        loadTasks();
    }
    
    // Initialize
    function init() {
        loadTasks();
        setupEventListeners();
    }
    
    function setupEventListeners() {
        // Import button
const importBtn = document.getElementById('importBtn');
const importFileInput = document.getElementById('importFileInput');
const mergeImportBtn = document.getElementById('mergeImportBtn');
const replaceImportBtn = document.getElementById('replaceImportBtn');
const cancelImportBtn = document.getElementById('cancelImportBtn');
const importStatus = document.getElementById('importStatus');

let pendingImportTasks = null;

if (importBtn && importFileInput) {
    importBtn.addEventListener('click', () => {
        importFileInput.click();
    });
    
    importFileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        importStatus.textContent = '📖 Reading file...';
        importStatus.style.color = 'var(--accent)';
        
        try {
            const result = await importTasksFromFile(file);
            pendingImportTasks = result.validTasks;
            
            // Show import options
            mergeImportBtn.style.display = 'inline-flex';
            replaceImportBtn.style.display = 'inline-flex';
            cancelImportBtn.style.display = 'inline-flex';
            
            importStatus.innerHTML = `✅ Found ${result.validTasks.length} valid tasks${result.invalidCount > 0 ? ` (${result.invalidCount} invalid skipped)` : ''}. Choose import method:`;
            importStatus.style.color = '#10b981';
            
        } catch (error) {
            importStatus.textContent = '❌ ' + error.message;
            importStatus.style.color = '#ef4444';
            pendingImportTasks = null;
        }
        
        // Clear file input so same file can be selected again
        importFileInput.value = '';
    });
    
    mergeImportBtn.addEventListener('click', () => {
        if (!pendingImportTasks) return;
        
        const result = mergeImportedTasks(pendingImportTasks);
        loadTasks();
        
        importStatus.innerHTML = `✅ Merged: Added ${result.added} new tasks${result.duplicates > 0 ? ` (${result.duplicates} duplicates skipped)` : ''}`;
        importStatus.style.color = '#10b981';
        
        // Hide import options
        mergeImportBtn.style.display = 'none';
        replaceImportBtn.style.display = 'none';
        cancelImportBtn.style.display = 'none';
        pendingImportTasks = null;
        
        UI.showToast(`Imported ${result.added} tasks successfully!`, 'success');
    });
    
    replaceImportBtn.addEventListener('click', () => {
        if (!pendingImportTasks) return;
        
        Modal.showDeleteConfirm('ALL existing tasks', () => {
            const result = replaceAllTasks(pendingImportTasks);
            loadTasks();
            
            importStatus.innerHTML = `✅ Replaced: ${result.added} tasks loaded`;
            importStatus.style.color = '#10b981';
            
            // Hide import options
            mergeImportBtn.style.display = 'none';
            replaceImportBtn.style.display = 'none';
            cancelImportBtn.style.display = 'none';
            pendingImportTasks = null;
            
            UI.showToast(`Imported ${result.added} tasks (replaced all)`, 'success');
        });
    });
    
    cancelImportBtn.addEventListener('click', () => {
        pendingImportTasks = null;
        mergeImportBtn.style.display = 'none';
        replaceImportBtn.style.display = 'none';
        cancelImportBtn.style.display = 'none';
        importStatus.textContent = '';
        UI.showToast('Import cancelled', 'info');
    });
}
        // Add task button
        const addBtn = document.getElementById('addTaskBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const title = document.getElementById('taskTitleInput')?.value || '';
                const date = document.getElementById('taskDateInput')?.value || '';
                const priority = document.getElementById('prioritySelect')?.value || 'medium';
                const category = document.getElementById('categorySelect')?.value || 'personal';
                
                addTask(title, date, priority, category);
                
                // Clear inputs
                const titleInput = document.getElementById('taskTitleInput');
                const dateInput = document.getElementById('taskDateInput');
                if (titleInput) titleInput.value = '';
                if (dateInput) dateInput.value = '';
            });
        }
        
        // Enter key in task input
        const taskInput = document.getElementById('taskTitleInput');
        if (taskInput) {
            taskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    document.getElementById('addTaskBtn')?.click();
                }
            });
        }
        
        // Filter buttons
        const filterBtns = document.querySelectorAll('.filter-btn');
        filterBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                const filter = btn.getAttribute('data-filter');
                if (filter) setFilter(filter);
            });
        });
        
        // Search input
        const searchInput = document.getElementById('searchInput');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                setSearchQuery(e.target.value);
            });
        }
        
        // Export button
        const exportBtn = document.getElementById('exportDataBtn');
        if (exportBtn) {
            exportBtn.addEventListener('click', exportTasks);
        }
        
        // Clear all button
        const clearBtn = document.getElementById('clearDataBtn');
        if (clearBtn) {
            clearBtn.addEventListener('click', clearAllTasks);
        }
        // Sort dropdown
// Sort dropdown with persistence
const sortSelect = document.getElementById('sortSelect');
if (sortSelect) {
    // Load saved sort preference
    const savedSort = localStorage.getItem('taskflow_sort');
    if (savedSort) {
        currentSort = savedSort;
        sortSelect.value = savedSort;
    }
    
    sortSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        localStorage.setItem('taskflow_sort', currentSort);
        UI.renderAllTasks(tasks, currentFilter, currentSearchQuery, currentSort);
    });
}
    }
    // Import tasks from JSON file
function importTasksFromFile(file, mode = 'merge') {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        
        reader.onload = function(e) {
            try {
                const importedTasks = JSON.parse(e.target.result);
                
                // Validate imported data
                if (!Array.isArray(importedTasks)) {
                    reject(new Error('Invalid format: Expected an array of tasks'));
                    return;
                }
                
                // Validate each task has required fields
                const validTasks = [];
                const invalidTasks = [];
                
                for (const task of importedTasks) {
                    if (task.title && typeof task.title === 'string') {
                        // Ensure task has all required fields
                        const cleanTask = {
                            id: task.id || Date.now().toString() + Math.random(),
                            title: task.title,
                            dueDate: task.dueDate || '',
                            priority: ['low', 'medium', 'high'].includes(task.priority) ? task.priority : 'medium',
                            category: ['personal', 'work', 'study'].includes(task.category) ? task.category : 'personal',
                            completed: task.completed === true,
                            createdAt: task.createdAt || new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        };
                        validTasks.push(cleanTask);
                    } else {
                        invalidTasks.push(task);
                    }
                }
                
                if (validTasks.length === 0) {
                    reject(new Error('No valid tasks found in file'));
                    return;
                }
                
                resolve({
                    validTasks,
                    invalidCount: invalidTasks.length,
                    totalCount: importedTasks.length
                });
                
            } catch (error) {
                reject(new Error('Invalid JSON file: ' + error.message));
            }
        };
        
        reader.onerror = function() {
            reject(new Error('Failed to read file'));
        };
        
        reader.readAsText(file);
    });
}

function mergeImportedTasks(validTasks) {
    const currentTasks = Storage.getTasks();
    
    // Filter out duplicates by title+dueDate+priority
    const newTasks = validTasks.filter(task => !isDuplicateTask(task, currentTasks));
    const duplicateCount = validTasks.length - newTasks.length;
    
    const allTasks = [...currentTasks, ...newTasks];
    Storage.saveTasks(allTasks);
    
    return {
        added: newTasks.length,
        duplicates: duplicateCount,
        total: allTasks.length
    };
}

function replaceAllTasks(validTasks) {
    const now = new Date().toISOString();
    
    // Ensure all tasks have timestamps
    const cleanedTasks = validTasks.map(task => ({
        ...task,
        createdAt: task.createdAt || now,
        updatedAt: task.updatedAt || now
    }));
    
    Storage.saveTasks(cleanedTasks);
    return {
        added: cleanedTasks.length,
        total: cleanedTasks.length
    };
}
// Helper function to check for duplicate tasks (by title + dueDate + priority)
function isDuplicateTask(task, existingTasks) {
    return existingTasks.some(existing => 
        existing.title === task.title && 
        existing.dueDate === task.dueDate && 
        existing.priority === task.priority
    );
}
// ========== SORTING FUNCTIONS ==========

let currentSort = 'dueDate';

function sortTasks(tasksToSort, sortMethod) {
    const sorted = [...tasksToSort];
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    
    switch(sortMethod) {
        case 'dueDate':
            sorted.sort((a, b) => {
                if (!a.dueDate && !b.dueDate) return 0;
                if (!a.dueDate) return 1;
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            });
            break;
            
        case 'priority':
            sorted.sort((a, b) => {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            });
            break;
            
        case 'alphabetical':
            sorted.sort((a, b) => a.title.localeCompare(b.title));
            break;
            
        case 'newest':
            sorted.sort((a, b) => {
                return new Date(b.createdAt) - new Date(a.createdAt);
            });
            break;
            
        case 'oldest':
            sorted.sort((a, b) => {
                return new Date(a.createdAt) - new Date(b.createdAt);
            });
            break;
            
        default:
            break;
    }
    
    return sorted;
}

function setSortMethod(sortMethod) {
    currentSort = sortMethod;
    // Re-render with new sort
    UI.renderAllTasks(tasks, currentFilter, currentSearchQuery, currentSort);
}
    return {
        init,
        addTask,
        editTask,
        deleteTask,
        toggleComplete,
        getTasks,
        refresh,
        setFilter,
        setSearchQuery
    };
})();