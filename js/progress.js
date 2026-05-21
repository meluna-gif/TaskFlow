// Progress Module - Handles charts and analytics

const Progress = (function() {
    let charts = {};
    
    function refresh() {
        const tasks = Storage.getTasks();
        
        // Check if canvas elements exist before trying to draw
        if (!document.getElementById('completionDonutChart')) {
            return;
        }
        
        const stats = calculateStats(tasks);
        updateStatCards(stats);
        updateDonutChart(stats);
        updatePriorityChart(tasks);
        updateCategoryChart(tasks);
        updateWeeklyTrendChart(tasks);
        updateInsights(stats, tasks);
    }
    
    function calculateStats(tasks) {
        const total = tasks.length;
        const completed = tasks.filter(t => t.completed).length;
        const pending = total - completed;
        const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);
        
        // Weekly stats - using updatedAt or createdAt
        const today = new Date();
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(today.getDate() - 7);
        
        const weeklyCompleted = tasks.filter(t => {
            if (!t.completed) return false;
            const completedDate = new Date(t.updatedAt || t.createdAt);
            return completedDate >= sevenDaysAgo;
        }).length;
        
        const currentStreak = calculateStreak(tasks);
        
        return {
            total,
            completed,
            pending,
            completionRate,
            weeklyCompleted,
            currentStreak
        };
    }
    
    function calculateStreak(tasks) {
        const completedTasks = tasks.filter(t => t.completed);
        if (completedTasks.length === 0) return 0;
        
        const completedDates = [...new Set(completedTasks.map(t => {
            const date = new Date(t.updatedAt || t.createdAt);
            return date.toISOString().split('T')[0];
        }))].sort().reverse();
        
        let streak = 0;
        const today = new Date().toISOString().split('T')[0];
        let expectedDate = new Date(today);
        
        for (let i = 0; i < completedDates.length; i++) {
            const dateStr = expectedDate.toISOString().split('T')[0];
            if (completedDates[i] === dateStr) {
                streak++;
                expectedDate.setDate(expectedDate.getDate() - 1);
            } else {
                break;
            }
        }
        
        return streak;
    }
    
    function updateStatCards(stats) {
        const rateEl = document.getElementById('completionRate');
        const totalEl = document.getElementById('totalTasks');
        const weeklyEl = document.getElementById('weeklyCompleted');
        const streakEl = document.getElementById('currentStreak');
        
        if (rateEl) rateEl.textContent = `${stats.completionRate}%`;
        if (totalEl) totalEl.textContent = stats.total;
        if (weeklyEl) weeklyEl.textContent = stats.weeklyCompleted;
        if (streakEl) streakEl.textContent = stats.currentStreak;
    }
    
    function updateDonutChart(stats) {
        const canvas = document.getElementById('completionDonutChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (charts.donut) {
            charts.donut.destroy();
        }
        
        charts.donut = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Completed', 'Pending'],
                datasets: [{
                    data: [stats.completed, stats.pending],
                    backgroundColor: ['#3b82f6', '#e5e7eb'],
                    borderWidth: 0,
                    cutout: '70%'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.label}: ${context.raw} tasks`
                        }
                    }
                }
            }
        });
        
        const donutPercentage = document.getElementById('donutPercentage');
        const legendCompleted = document.getElementById('legendCompleted');
        const legendPending = document.getElementById('legendPending');
        
        if (donutPercentage) donutPercentage.textContent = stats.completionRate;
        if (legendCompleted) legendCompleted.textContent = stats.completed;
        if (legendPending) legendPending.textContent = stats.pending;
    }
    
    function updatePriorityChart(tasks) {
        const canvas = document.getElementById('priorityBarChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (charts.priority) {
            charts.priority.destroy();
        }
        
        const priorities = ['high', 'medium', 'low'];
        const priorityNames = ['High', 'Medium', 'Low'];
        const totalByPriority = priorities.map(p => 
            tasks.filter(t => t.priority === p).length
        );
        const completedByPriority = priorities.map(p => 
            tasks.filter(t => t.priority === p && t.completed).length
        );
        
        charts.priority = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: priorityNames,
                datasets: [
                    {
                        label: 'Total Tasks',
                        data: totalByPriority,
                        backgroundColor: '#3b82f6',
                        borderRadius: 8
                    },
                    {
                        label: 'Completed',
                        data: completedByPriority,
                        backgroundColor: '#10b981',
                        borderRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Number of Tasks' },
                        stepSize: 1
                    }
                }
            }
        });
    }
    
    function updateCategoryChart(tasks) {
        const canvas = document.getElementById('categoryBarChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (charts.category) {
            charts.category.destroy();
        }
        
        const categories = ['personal', 'work', 'study'];
        const categoryNames = ['👤 Personal', '💼 Work', '📚 Study'];
        const totalByCategory = categories.map(c => 
            tasks.filter(t => t.category === c).length
        );
        const completedByCategory = categories.map(c => 
            tasks.filter(t => t.category === c && t.completed).length
        );
        
        charts.category = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categoryNames,
                datasets: [
                    {
                        label: 'Total Tasks',
                        data: totalByCategory,
                        backgroundColor: '#8b5cf6',
                        borderRadius: 8
                    },
                    {
                        label: 'Completed',
                        data: completedByCategory,
                        backgroundColor: '#10b981',
                        borderRadius: 8
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Number of Tasks' },
                        stepSize: 1
                    }
                }
            }
        });
    }
    
    function updateWeeklyTrendChart(tasks) {
        const canvas = document.getElementById('weeklyTrendChart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        if (charts.weekly) {
            charts.weekly.destroy();
        }
        
        const days = [];
        const completedData = [];
        const createdData = [];
        
        for (let i = 6; i >= 0; i--) {
            const date = new Date();
            date.setDate(date.getDate() - i);
            const dateStr = date.toISOString().split('T')[0];
            const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
            days.push(dayName);
            
            const completed = tasks.filter(t => {
                if (!t.completed) return false;
                const completedDate = new Date(t.updatedAt || t.createdAt);
                return completedDate.toISOString().split('T')[0] === dateStr;
            }).length;
            completedData.push(completed);
            
            const created = tasks.filter(t => {
                const createdDate = new Date(t.createdAt);
                return createdDate.toISOString().split('T')[0] === dateStr;
            }).length;
            createdData.push(created);
        }
        
        charts.weekly = new Chart(ctx, {
            type: 'line',
            data: {
                labels: days,
                datasets: [
                    {
                        label: 'Tasks Completed',
                        data: completedData,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        tension: 0.3,
                        fill: true,
                        pointRadius: 4,
                        pointBackgroundColor: '#10b981'
                    },
                    {
                        label: 'Tasks Created',
                        data: createdData,
                        borderColor: '#3b82f6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        tension: 0.3,
                        fill: true,
                        pointRadius: 4,
                        pointBackgroundColor: '#3b82f6'
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'top' }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        title: { display: true, text: 'Number of Tasks' },
                        stepSize: 1
                    }
                }
            }
        });
    }
    
    function updateInsights(stats, tasks) {
        const insightsList = document.getElementById('insightsList');
        if (!insightsList) return;
        
        const insights = [];
        
        if (stats.completionRate >= 70) {
            insights.push({
                icon: '🎉',
                text: `Great job! You've completed ${stats.completionRate}% of all tasks.`,
                badge: 'Excellent'
            });
        } else if (stats.completionRate >= 40) {
            insights.push({
                icon: '📈',
                text: `You're making progress with ${stats.completionRate}% completion rate. Keep going!`,
                badge: 'Good'
            });
        } else if (stats.total > 0) {
            insights.push({
                icon: '💪',
                text: `You have ${stats.pending} pending tasks. Time to catch up!`,
                badge: 'Action Needed'
            });
        }
        
        const highPriorityPending = tasks.filter(t => t.priority === 'high' && !t.completed).length;
        if (highPriorityPending > 0) {
            insights.push({
                icon: '⚠️',
                text: `You have ${highPriorityPending} high priority task${highPriorityPending > 1 ? 's' : ''} waiting.`,
                badge: 'Urgent'
            });
        }
        
        const studyPending = tasks.filter(t => t.category === 'study' && !t.completed).length;
        const workPending = tasks.filter(t => t.category === 'work' && !t.completed).length;
        
        if (studyPending > workPending && studyPending > 0) {
            insights.push({
                icon: '📚',
                text: `Focus on your ${studyPending} pending study tasks first.`,
                badge: 'Suggestion'
            });
        } else if (workPending > 0) {
            insights.push({
                icon: '💼',
                text: `Your work section has ${workPending} pending tasks.`,
                badge: 'Suggestion'
            });
        }
        
        if (stats.currentStreak >= 3) {
            insights.push({
                icon: '🔥',
                text: `${stats.currentStreak} day streak! You're on fire!`,
                badge: 'Streak'
            });
        } else if (stats.currentStreak === 0 && stats.total > 0) {
            insights.push({
                icon: '⭐',
                text: `Complete a task today to start your streak!`,
                badge: 'Motivation'
            });
        }
        
        if (stats.total === 0) {
            insights.push({
                icon: '✨',
                text: 'Add your first task to see analytics and insights!',
                badge: 'Getting Started'
            });
        }
        
        insightsList.innerHTML = insights.map(insight => `
            <div class="insight-item">
                <i>${insight.icon}</i>
                <div class="insight-text">${insight.text}</div>
                <div class="insight-badge">${insight.badge}</div>
            </div>
        `).join('');
    }
    
    return {
        refresh
    };
})();