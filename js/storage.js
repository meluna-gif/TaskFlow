// Storage Module - Handles all localStorage operations

const Storage = (function() {
    const STORAGE_KEYS = {
        TASKS: 'taskflow_tasks',
        THEME: 'taskflow_theme',
        SIDEBAR_COLLAPSED: 'taskflow_sidebar_collapsed',
        USER_NAME: 'taskflow_user_name'
    };

    // Task functions
    function getTasks() {
        const tasks = localStorage.getItem(STORAGE_KEYS.TASKS);
        if (!tasks) {
            // Return sample tasks for demo
            return [
                {
                    id: '1',
                    title: 'Finish database chapter',
                    dueDate: getTomorrowDate(),
                    priority: 'high',
                    category: 'study',
                    completed: false,
                    createdAt: new Date().toISOString()
                },
                {
                    id: '2',
                    title: 'Review pull requests',
                    dueDate: getTodayDate(),
                    priority: 'medium',
                    category: 'work',
                    completed: false,
                    createdAt: new Date().toISOString()
                },
                {
                    id: '3',
                    title: 'Design system update',
                    dueDate: getNextWeekDate(),
                    priority: 'low',
                    category: 'work',
                    completed: false,
                    createdAt: new Date().toISOString()
                },
                {
                    id: '4',
                    title: 'Finish assignment',
                    dueDate: getYesterdayDate(),
                    priority: 'medium',
                    category: 'study',
                    completed: true,
                    createdAt: new Date().toISOString()
                },
                {
                    id: '5',
                    title: 'Team meeting',
                    dueDate: getMondayDate(),
                    priority: 'high',
                    category: 'work',
                    completed: true,
                    createdAt: new Date().toISOString()
                }
            ];
        }
        return JSON.parse(tasks);
    }

    function saveTasks(tasks) {
        localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    }

    function addTask(task) {
        const tasks = getTasks();
        const newTask = {
            id: Date.now().toString(),
            ...task,
            createdAt: new Date().toISOString(),
            completed: false
        };
        tasks.push(newTask);
        saveTasks(tasks);
        return tasks;
    }

    function updateTask(taskId, updates) {
        const tasks = getTasks();
        const index = tasks.findIndex(t => t.id === taskId);
        if (index !== -1) {
            tasks[index] = { ...tasks[index], ...updates };
            saveTasks(tasks);
        }
        return tasks;
    }

    function deleteTask(taskId) {
        const tasks = getTasks();
        const filtered = tasks.filter(t => t.id !== taskId);
        saveTasks(filtered);
        return filtered;
    }

    function toggleComplete(taskId) {
        const tasks = getTasks();
        const task = tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            saveTasks(tasks);
        }
        return tasks;
    }

    function clearAllTasks() {
        saveTasks([]);
        return [];
    }

    // Settings functions
    function getTheme() {
        return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
    }

    function saveTheme(theme) {
        localStorage.setItem(STORAGE_KEYS.THEME, theme);
    }

    function getSidebarCollapsed() {
        return localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true';
    }

    function saveSidebarCollapsed(collapsed) {
        localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, collapsed);
    }

    function getUserName() {
        return localStorage.getItem(STORAGE_KEYS.USER_NAME) || 'Mel';
    }

    function saveUserName(name) {
        localStorage.setItem(STORAGE_KEYS.USER_NAME, name);
    }

    // Helper date functions for sample data
    function getTodayDate() {
        return new Date().toISOString().split('T')[0];
    }

    function getTomorrowDate() {
        const date = new Date();
        date.setDate(date.getDate() + 1);
        return date.toISOString().split('T')[0];
    }

    function getYesterdayDate() {
        const date = new Date();
        date.setDate(date.getDate() - 1);
        return date.toISOString().split('T')[0];
    }

    function getNextWeekDate() {
        const date = new Date();
        date.setDate(date.getDate() + 7);
        return date.toISOString().split('T')[0];
    }

    function getMondayDate() {
        const date = new Date();
        const day = date.getDay();
        const diff = day === 1 ? 0 : day === 0 ? -6 : 1 - day;
        date.setDate(date.getDate() + diff);
        return date.toISOString().split('T')[0];
    }

    return {
        getTasks,
        saveTasks,
        addTask,
        updateTask,
        deleteTask,
        toggleComplete,
        clearAllTasks,
        getTheme,
        saveTheme,
        getSidebarCollapsed,
        saveSidebarCollapsed,
        getUserName,
        saveUserName
    };
})();