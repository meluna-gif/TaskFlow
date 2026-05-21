// Calendar Module - Handles calendar view (FIXED VERSION)

const Calendar = (function() {
    let currentDate = new Date();
    let selectedDate = null;  // FIX #2: Initialize as null
    let currentTasks = [];
    
    function init() {
        selectedDate = new Date();  // FIX #2: Set in init instead
        renderCalendar();
        setupEventListeners();
    }
    
    function renderCalendar() {
        const year = currentDate.getFullYear();
        const month = currentDate.getMonth();
        
        // Update header
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                           'July', 'August', 'September', 'October', 'November', 'December'];
        const headerEl = document.getElementById('currentMonthYear');
        if (headerEl) {
            headerEl.textContent = `${monthNames[month]} ${year}`;
        }
        
        // Get first day of month and total days
        const firstDay = new Date(year, month, 1);
        const startDay = firstDay.getDay(); // 0 = Sunday
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        // Get days from previous month
        const prevMonthDays = new Date(year, month, 0).getDate();
        
        // Get all tasks
        const allTasks = Storage.getTasks();
        
        // Build calendar days
        const calendarDays = document.getElementById('calendarDays');
        if (!calendarDays) return;
        
        calendarDays.innerHTML = '';
        
        // Fill in previous month days
        for (let i = startDay - 1; i >= 0; i--) {
            const dayNum = prevMonthDays - i;
            const date = new Date(year, month - 1, dayNum);
            const dateStr = date.toISOString().split('T')[0];
            const tasksForDay = allTasks.filter(t => t.dueDate === dateStr);
            
            const dayDiv = createDayElement(dayNum, date, true, tasksForDay.length > 0);
            calendarDays.appendChild(dayDiv);
        }
        
        // Fill in current month days
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day);
            const dateStr = date.toISOString().split('T')[0];
            const tasksForDay = allTasks.filter(t => t.dueDate === dateStr);
            
            const dayDiv = createDayElement(day, date, false, tasksForDay.length > 0);
            calendarDays.appendChild(dayDiv);
        }
        
        // Fill in next month days to complete grid (42 days total)
        const totalDays = calendarDays.children.length;
        const remainingDays = 42 - totalDays;
        
        for (let day = 1; day <= remainingDays; day++) {
            const date = new Date(year, month + 1, day);
            const dateStr = date.toISOString().split('T')[0];
            const tasksForDay = allTasks.filter(t => t.dueDate === dateStr);
            
            const dayDiv = createDayElement(day, date, true, tasksForDay.length > 0);
            calendarDays.appendChild(dayDiv);
        }
        
        // Highlight selected date
        highlightSelectedDate();  // FIX #4: Now works with data-date attribute
        
        // Load tasks for selected date
        if (selectedDate) {
            loadTasksForDate(selectedDate);
        }
    }
    
    function createDayElement(dayNum, date, isOtherMonth, hasTasks) {
        const dayDiv = document.createElement('div');
        dayDiv.className = 'calendar-day';
        if (isOtherMonth) dayDiv.classList.add('other-month');
        if (hasTasks) dayDiv.classList.add('has-tasks');
        
        // FIX #3: Add data-date attribute
        const dateStr = date.toISOString().split('T')[0];
        dayDiv.setAttribute('data-date', dateStr);
        
        dayDiv.innerHTML = `
            <div class="day-number">${dayNum}</div>
            ${hasTasks ? '<div class="task-indicator">●</div>' : ''}
        `;
        
        dayDiv.addEventListener('click', () => {
            // Remove selected class from all days
            document.querySelectorAll('.calendar-day').forEach(d => {
                d.classList.remove('selected');
            });
            dayDiv.classList.add('selected');
            
            selectedDate = date;
            loadTasksForDate(selectedDate);
        });
        
        // Auto-select today's date on initial load
        const todayStr = new Date().toISOString().split('T')[0];
        if (!isOtherMonth && dateStr === todayStr && !selectedDate) {
            dayDiv.classList.add('selected');
            selectedDate = date;
        }
        
        return dayDiv;
    }
    
    // FIX #4: Fixed highlightSelectedDate function
    function highlightSelectedDate() {
        if (!selectedDate) return;
        
        const selectedDateStr = selectedDate.toISOString().split('T')[0];
        
        document.querySelectorAll('.calendar-day').forEach(day => {
            if (day.getAttribute('data-date') === selectedDateStr) {
                day.classList.add('selected');
            } else {
                day.classList.remove('selected');
            }
        });
    }
    
    function loadTasksForDate(date) {
        if (!date) return;
        
        const allTasks = Storage.getTasks();
        const dateStr = date.toISOString().split('T')[0];
        
        const tasksForDate = allTasks.filter(t => t.dueDate === dateStr);
        currentTasks = tasksForDate;
        
        const titleEl = document.getElementById('selectedDateTitle');
        const tasksListEl = document.getElementById('calendarTasksList');
        
        if (titleEl) {
            const options = { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' };
            titleEl.innerHTML = `<i class="fas fa-calendar-day"></i> Tasks for ${date.toLocaleDateString('en-US', options)}`;
        }
        
        if (tasksListEl) {
            if (tasksForDate.length === 0) {
                tasksListEl.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-check-circle"></i>
                        <p>No tasks for this day</p>
                        <small>Add a task using the form below</small>
                    </div>
                `;
            } else {
                tasksListEl.innerHTML = tasksForDate.map(task => `
                    <div class="calendar-task-item ${task.completed ? 'completed' : ''}" data-id="${task.id}">
                        <div class="task-info">
                            <input type="checkbox" class="calendar-task-checkbox" ${task.completed ? 'checked' : ''} data-id="${task.id}">
                            <span class="task-title">${escapeHtml(task.title)}</span>
                            <span class="task-priority priority-${task.priority}">
                                ${task.priority === 'high' ? '🔴 High' : task.priority === 'medium' ? '🟡 Med' : '🟢 Low'}
                            </span>
                        </div>
                        <button class="calendar-delete-btn" data-id="${task.id}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `).join('');
                
                // Attach event listeners to checkboxes and delete buttons
                attachCalendarTaskListeners();
            }
        }
    }
    
    function attachCalendarTaskListeners() {
        // Checkbox listeners
        document.querySelectorAll('.calendar-task-checkbox').forEach(cb => {
            cb.removeEventListener('change', handleCalendarCheckbox);
            cb.addEventListener('change', handleCalendarCheckbox);
        });
        
        // Delete button listeners
        document.querySelectorAll('.calendar-delete-btn').forEach(btn => {
            btn.removeEventListener('click', handleCalendarDelete);
            btn.addEventListener('click', handleCalendarDelete);
        });
    }
    
    function handleCalendarCheckbox(e) {
        const taskId = e.target.getAttribute('data-id');
        Tasks.toggleComplete(taskId);
        // Refresh calendar view
        setTimeout(() => {
            renderCalendar();
            if (selectedDate) {
                loadTasksForDate(selectedDate);
            }
        }, 100);
    }
    
    function handleCalendarDelete(e) {
        const taskId = e.target.closest('.calendar-delete-btn').getAttribute('data-id');
        const task = Storage.getTasks().find(t => t.id === taskId);
        if (task) {
            Modal.showDeleteConfirm(task.title, () => {
                Storage.deleteTask(taskId);
                renderCalendar();
                if (selectedDate) {
                    loadTasksForDate(selectedDate);
                }
                Tasks.refresh(); // Refresh dashboard
                UI.showToast('Task deleted!', 'success');
            });
        }
    }
    
    function addTaskForSelectedDate(title) {
        if (!title.trim()) {
            UI.showToast('Please enter a task title', 'error');
            return;
        }
        
        const dateStr = selectedDate.toISOString().split('T')[0];
        
        Storage.addTask({
            title: title.trim(),
            dueDate: dateStr,
            priority: 'medium',
            category: 'personal',
            completed: false
        });
        
        // Clear input
        const inputEl = document.getElementById('calendarTaskInput');
        if (inputEl) inputEl.value = '';
        
        // Refresh everything
        renderCalendar();
        if (selectedDate) {
            loadTasksForDate(selectedDate);
        }
        Tasks.refresh();
        UI.showToast('Task added to calendar!', 'success');
    }
    
    function setupEventListeners() {
        // Previous month button
        const prevBtn = document.getElementById('prevMonthBtn');
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                currentDate.setMonth(currentDate.getMonth() - 1);
                renderCalendar();
            });
        }
        
        // Next month button
        const nextBtn = document.getElementById('nextMonthBtn');
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                currentDate.setMonth(currentDate.getMonth() + 1);
                renderCalendar();
            });
        }
        
        // Add task button
        const addBtn = document.getElementById('calendarAddBtn');
        if (addBtn) {
            addBtn.addEventListener('click', () => {
                const inputEl = document.getElementById('calendarTaskInput');
                if (inputEl) {
                    addTaskForSelectedDate(inputEl.value);
                }
            });
        }
        
        // Enter key in task input
        const taskInput = document.getElementById('calendarTaskInput');
        if (taskInput) {
            taskInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    addTaskForSelectedDate(taskInput.value);
                }
            });
        }
    }
    
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    return {
        init,
        renderCalendar
    };
})();