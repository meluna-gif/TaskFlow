// UI Module - Handles all DOM rendering and updates

const UI = (function() {
    
    function renderAllTasks(tasks, filter = 'all', searchQuery = '', sortMethod = 'dueDate') {
        // Apply filters
        let filteredTasks = [...tasks];
        
        // Apply search filter
        if (searchQuery) {
            filteredTasks = filteredTasks.filter(task => 
                task.title.toLowerCase().includes(searchQuery)
            );
        }
        
        // Apply status filter
        switch(filter) {
            case 'active':
                filteredTasks = filteredTasks.filter(t => !t.completed);
                break;
            case 'completed':
                filteredTasks = filteredTasks.filter(t => t.completed);
                break;
            case 'today':
                const today = new Date().toISOString().split('T')[0];
                filteredTasks = filteredTasks.filter(t => t.dueDate === today && !t.completed);
                break;
            case 'overdue':
                const todayDate = new Date().toISOString().split('T')[0];
                filteredTasks = filteredTasks.filter(t => {
                    if (t.completed) return false;
                    if (!t.dueDate) return false;
                    return t.dueDate < todayDate;
                });
                break;
            default:
                break;
        }
        
        // Apply sorting
        filteredTasks = sortTasksByMethod(filteredTasks, sortMethod);
        
        // Separate uncompleted and completed
        const uncompleted = filteredTasks.filter(t => !t.completed);
        const completed = filteredTasks.filter(t => t.completed);
        
        // Render
        renderTasks('uncompletedTasks', uncompleted, false);
        renderTasks('completedTasks', completed, true);
        
        // Update counts
        updateSectionCounts(uncompleted.length, completed.length);
    }
    
    function sortTasksByMethod(tasks, sortMethod) {
        const sorted = [...tasks];
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
    
    function renderTasks(containerId, tasks, isCompleted) {
        const container = document.getElementById(containerId);
        if (!container) return;
        
        if (tasks.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-check-circle"></i>
                    <p>No tasks here</p>
                    <small>Add a new task to get started</small>
                </div>
            `;
            return;
        }
        
        container.innerHTML = tasks.map(task => createTaskCardHTML(task, isCompleted)).join('');
        
        // Attach event listeners to new elements
        attachTaskEventListeners();
        
        // Set up drag and drop for new cards
        setupDragAndDrop();
    }
    
    function createTaskCardHTML(task, isCompleted) {
        const completedClass = isCompleted ? 'completed' : '';
        const checkedAttr = isCompleted ? 'checked' : '';
        
        // Format date for display
        let dateHtml = '';
        if (task.dueDate) {
            const dueDate = new Date(task.dueDate);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            let dateClass = '';
            if (!isCompleted && dueDate < today) {
                dateClass = 'overdue';
            }
            
            const formattedDate = dueDate.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
            });
            dateHtml = `<span class="task-date ${dateClass}"><i class="fas fa-calendar-alt"></i> ${formattedDate}</span>`;
        }
        
        // Priority icon and text
        const priorityConfig = {
            high: { icon: 'fa-arrow-up', text: 'High', class: 'priority-high' },
            medium: { icon: 'fa-minus', text: 'Medium', class: 'priority-medium' },
            low: { icon: 'fa-arrow-down', text: 'Low', class: 'priority-low' }
        };
        const priority = priorityConfig[task.priority] || priorityConfig.medium;
        
        // Category icon
        const categoryConfig = {
            personal: { icon: 'fa-user', text: 'Personal' },
            work: { icon: 'fa-briefcase', text: 'Work' },
            study: { icon: 'fa-graduation-cap', text: 'Study' }
        };
        const category = categoryConfig[task.category] || categoryConfig.personal;
        
        return `
            <div class="task-card ${completedClass}" data-id="${task.id}" data-priority="${task.priority}" draggable="true">
                <div class="task-left">
                    <i class="fas fa-grip-vertical task-drag-handle"></i>
                    <input type="checkbox" class="task-checkbox" ${checkedAttr}>
                    <div class="task-content">
                        <div class="task-title">${escapeHtml(task.title)}</div>
                        <div class="task-meta">
                            ${dateHtml}
                            <span class="task-category"><i class="fas ${category.icon}"></i> ${category.text}</span>
                            <span class="task-priority ${priority.class}"><i class="fas ${priority.icon}"></i> ${priority.text}</span>
                        </div>
                    </div>
                </div>
                <div class="task-actions">
                    <button class="task-btn edit-btn" data-id="${task.id}">
                        <i class="fas fa-edit"></i> Edit
                    </button>
                    <button class="task-btn delete-btn" data-id="${task.id}">
                        <i class="fas fa-trash"></i> Delete
                    </button>
                </div>
            </div>
        `;
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    function attachTaskEventListeners() {
        // Checkbox listeners
        document.querySelectorAll('.task-checkbox').forEach(cb => {
            cb.removeEventListener('change', handleCheckboxChange);
            cb.addEventListener('change', handleCheckboxChange);
        });
        
        // Edit button listeners
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.removeEventListener('click', handleEditClick);
            btn.addEventListener('click', handleEditClick);
        });
        
        // Delete button listeners
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.removeEventListener('click', handleDeleteClick);
            btn.addEventListener('click', handleDeleteClick);
        });
    }
    
    function handleCheckboxChange(e) {
        e.stopPropagation();
        const taskCard = e.target.closest('.task-card');
        if (taskCard) {
            const taskId = taskCard.getAttribute('data-id');
            if (typeof Tasks !== 'undefined') {
                Tasks.toggleComplete(taskId);
            }
        }
    }
    
    function handleEditClick(e) {
        e.stopPropagation();
        const btn = e.currentTarget;
        const taskId = btn.getAttribute('data-id');
        if (typeof Tasks !== 'undefined') {
            const tasks = Tasks.getTasks();
            const task = tasks.find(t => t.id === taskId);
            if (task && typeof Modal !== 'undefined') {
                Modal.showEditTask(task, (updates) => {
                    Tasks.editTask(taskId, updates);
                });
            }
        }
    }
    
    function handleDeleteClick(e) {
        e.stopPropagation();
        const btn = e.currentTarget;
        const taskId = btn.getAttribute('data-id');
        if (typeof Tasks !== 'undefined') {
            Tasks.deleteTask(taskId);
        }
    }
    
    // ========== DRAG & DROP FUNCTIONS ==========
    
    let draggedItem = null;
    
    function setupDragAndDrop() {
        const taskCards = document.querySelectorAll('.task-card');
        
        taskCards.forEach(card => {
            card.setAttribute('draggable', 'true');
            
            card.removeEventListener('dragstart', handleDragStart);
            card.removeEventListener('dragend', handleDragEnd);
            card.removeEventListener('dragover', handleDragOver);
            card.removeEventListener('dragleave', handleDragLeave);
            card.removeEventListener('drop', handleDrop);
            
            card.addEventListener('dragstart', handleDragStart);
            card.addEventListener('dragend', handleDragEnd);
            card.addEventListener('dragover', handleDragOver);
            card.addEventListener('dragleave', handleDragLeave);
            card.addEventListener('drop', handleDrop);
        });
    }
    
    function handleDragStart(e) {
        draggedItem = this;
        this.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', this.getAttribute('data-id'));
    }
    
    function handleDragEnd(e) {
        this.classList.remove('dragging');
        document.querySelectorAll('.task-card').forEach(card => {
            card.classList.remove('drag-over');
        });
        draggedItem = null;
    }
    
    function handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (this === draggedItem) return;
        this.classList.add('drag-over');
    }
    
    function handleDragLeave(e) {
        this.classList.remove('drag-over');
    }
    
    function handleDrop(e) {
        e.preventDefault();
        this.classList.remove('drag-over');
        
        if (!draggedItem) return;
        if (this === draggedItem) return;
        
        const draggedContainer = draggedItem.parentNode;
        const targetContainer = this.parentNode;
        
        if (draggedContainer.id !== targetContainer.id) {
            showToast('Tasks cannot be moved between sections. Complete the task to move it.', 'info');
            return;
        }
        
        const cards = Array.from(draggedContainer.children);
        const draggedIndex = cards.indexOf(draggedItem);
        const targetIndex = cards.indexOf(this);
        
        if (draggedIndex === -1 || targetIndex === -1) return;
        
        const allTasks = Storage.getTasks();
        const isCompletedSection = draggedContainer.id === 'completedTasks';
        
        let currentTasks = [...allTasks];
        
        // Simple reorder - just swap in the DOM and save
        const taskId = draggedItem.getAttribute('data-id');
        const targetId = this.getAttribute('data-id');
        
        const draggedTaskIndex = allTasks.findIndex(t => t.id === taskId);
        const targetTaskIndex = allTasks.findIndex(t => t.id === targetId);
        
        if (draggedTaskIndex !== -1 && targetTaskIndex !== -1) {
            const reorderedTasks = [...allTasks];
            const [movedTask] = reorderedTasks.splice(draggedTaskIndex, 1);
            reorderedTasks.splice(targetTaskIndex, 0, movedTask);
            Storage.saveTasks(reorderedTasks);
            
            if (typeof Tasks !== 'undefined' && Tasks.refresh) {
                Tasks.refresh();
            }
            
            showToast('Task reordered!', 'success');
        }
    }
    
    function updateStats(active, completed, today, overdue) {
        const activeEl = document.getElementById('activeCount');
        const completedEl = document.getElementById('completedCount');
        const todayEl = document.getElementById('todayCount');
        const overdueEl = document.getElementById('overdueCount');
        
        if (activeEl) activeEl.textContent = active;
        if (completedEl) completedEl.textContent = completed;
        if (todayEl) todayEl.textContent = today;
        if (overdueEl) overdueEl.textContent = overdue;
    }
    
    function updateSectionCounts(uncompleted, completed) {
        const uncompletedEl = document.getElementById('uncompletedCount');
        const completedEl = document.getElementById('completedTasksCount');
        
        if (uncompletedEl) uncompletedEl.textContent = uncompleted;
        if (completedEl) completedEl.textContent = completed;
    }
    
    function updateFilterButtons(activeFilter) {
        const buttons = document.querySelectorAll('.filter-btn');
        buttons.forEach(btn => {
            const filter = btn.getAttribute('data-filter');
            if (filter === activeFilter) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }
    
    function showToast(message, type = 'info') {
        let toast = document.querySelector('.toast-notification');
        if (!toast) {
            toast = document.createElement('div');
            toast.className = 'toast-notification';
            document.body.appendChild(toast);
            
            const style = document.createElement('style');
            style.textContent = `
                .toast-notification {
                    position: fixed;
                    bottom: 20px;
                    right: 20px;
                    padding: 12px 20px;
                    border-radius: 10px;
                    color: white;
                    font-size: 14px;
                    font-weight: 500;
                    z-index: 2000;
                    opacity: 0;
                    transform: translateX(100%);
                    transition: all 0.3s ease;
                    pointer-events: none;
                }
                .toast-notification.show {
                    opacity: 1;
                    transform: translateX(0);
                }
                .toast-notification.success {
                    background: #10b981;
                }
                .toast-notification.error {
                    background: #ef4444;
                }
                .toast-notification.info {
                    background: var(--accent);
                }
            `;
            document.head.appendChild(style);
        }
        
        toast.className = `toast-notification ${type}`;
        toast.textContent = message;
        
        setTimeout(() => toast.classList.add('show'), 10);
        
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
    
    function updateDateTime() {
        const dateDisplay = document.getElementById('dateDisplay');
        if (dateDisplay) {
            const now = new Date();
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            dateDisplay.innerHTML = `<i class="fas fa-calendar-alt"></i> ${now.toLocaleDateString('en-US', options)}`;
        }
    }
    
    function updateUserName() {
        const userName = Storage.getUserName();
        const userNameSpan = document.getElementById('userName');
        const userNameInput = document.getElementById('userNameInput');
        
        if (userNameSpan) userNameSpan.textContent = userName;
        if (userNameInput) userNameInput.value = userName;
    }
    
    function setupSettingsListeners() {
        const saveNameBtn = document.getElementById('saveNameBtn');
        const userNameInput = document.getElementById('userNameInput');
        
        if (saveNameBtn && userNameInput) {
            saveNameBtn.addEventListener('click', () => {
                const newName = userNameInput.value.trim();
                if (newName) {
                    Storage.saveUserName(newName);
                    updateUserName();
                    showToast('Name saved!', 'success');
                }
            });
        }
    }
    
    function init() {
        updateDateTime();
        updateUserName();
        setupSettingsListeners();
        setInterval(updateDateTime, 60000);
    }
    
    return {
        init,
        renderAllTasks,
        updateStats,
        updateFilterButtons,
        showToast,
        updateDateTime,
        updateUserName
    };
})();