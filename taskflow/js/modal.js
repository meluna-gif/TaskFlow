// Modal Module - Handles all modal dialogs

const Modal = (function() {
    const modal = document.getElementById('modal');
    const modalTitle = document.getElementById('modalTitle');
    const modalBody = document.getElementById('modalBody');
    const closeBtn = document.querySelector('.modal-close');
    const cancelBtn = document.querySelector('.cancel-btn');
    const confirmBtn = document.querySelector('.confirm-btn');
    
    let currentCallback = null;
    
    function show(options) {
        modalTitle.textContent = options.title || 'Confirm';
        modalBody.innerHTML = options.body || '';
        modal.classList.add('active');
        
        // Store callback
        currentCallback = options.onConfirm;
        
        // Update confirm button text/style
        if (options.confirmText) {
            confirmBtn.textContent = options.confirmText;
        } else {
            confirmBtn.textContent = 'Confirm';
        }
        
        if (options.isDanger) {
            confirmBtn.classList.add('danger-btn');
        } else {
            confirmBtn.classList.remove('danger-btn');
        }
        
        // Handle confirm click
        const confirmHandler = () => {
            if (currentCallback) currentCallback();
            hide();
        };
        
        const cancelHandler = () => {
            if (options.onCancel) options.onCancel();
            hide();
        };
        
        // Remove old listeners and add new ones
        confirmBtn.removeEventListener('click', confirmHandler);
        cancelBtn.removeEventListener('click', cancelHandler);
        closeBtn.removeEventListener('click', cancelHandler);
        
        confirmBtn.addEventListener('click', confirmHandler);
        cancelBtn.addEventListener('click', cancelHandler);
        closeBtn.addEventListener('click', cancelHandler);
        
        // Close on backdrop click
        modal.addEventListener('click', function backdropHandler(e) {
            if (e.target === modal) {
                hide();
                modal.removeEventListener('click', backdropHandler);
            }
        });
    }
    
    function hide() {
        modal.classList.remove('active');
        currentCallback = null;
    }
    
    // Edit task modal
    function showEditTask(task, onSave) {
        const body = `
            <label>Task Title</label>
            <input type="text" id="editTaskTitle" value="${escapeHtml(task.title)}">
            <label>Due Date</label>
            <input type="date" id="editTaskDate" value="${task.dueDate || ''}">
            <label>Priority</label>
            <select id="editTaskPriority">
                <option value="low" ${task.priority === 'low' ? 'selected' : ''}>🟢 Low</option>
                <option value="medium" ${task.priority === 'medium' ? 'selected' : ''}>🟡 Medium</option>
                <option value="high" ${task.priority === 'high' ? 'selected' : ''}>🔴 High</option>
            </select>
            <label>Category</label>
            <select id="editTaskCategory">
                <option value="personal" ${task.category === 'personal' ? 'selected' : ''}>👤 Personal</option>
                <option value="work" ${task.category === 'work' ? 'selected' : ''}>💼 Work</option>
                <option value="study" ${task.category === 'study' ? 'selected' : ''}>📚 Study</option>
            </select>
        `;
        
        show({
            title: '✏️ Edit Task',
            body: body,
            confirmText: 'Save Changes',
            onConfirm: () => {
                const newTitle = document.getElementById('editTaskTitle').value;
                const newDate = document.getElementById('editTaskDate').value;
                const newPriority = document.getElementById('editTaskPriority').value;
                const newCategory = document.getElementById('editTaskCategory').value;
                
                if (newTitle.trim()) {
                    onSave({
                        title: newTitle,
                        dueDate: newDate,
                        priority: newPriority,
                        category: newCategory
                    });
                }
            }
        });
    }
    
    // Delete confirmation modal
    function showDeleteConfirm(taskTitle, onConfirm) {
        show({
            title: '🗑️ Delete Task',
            body: `<p>Are you sure you want to delete "<strong>${escapeHtml(taskTitle)}</strong>"?</p><p style="color: var(--text-secondary); font-size: 14px; margin-top: 8px;">This action cannot be undone.</p>`,
            confirmText: 'Delete',
            isDanger: true,
            onConfirm: onConfirm
        });
    }
    
    // Clear all tasks confirmation
    function showClearAllConfirm(onConfirm) {
        show({
            title: '⚠️ Clear All Tasks',
            body: '<p>Are you sure you want to delete <strong>ALL</strong> tasks?</p><p style="color: #ef4444; font-size: 14px; margin-top: 8px;">This action cannot be undone. All your data will be permanently lost.</p>',
            confirmText: 'Yes, Delete All',
            isDanger: true,
            onConfirm: onConfirm
        });
    }
    
    // Helper function to escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    return {
        show,
        hide,
        showEditTask,
        showDeleteConfirm,
        showClearAllConfirm
    };
})();