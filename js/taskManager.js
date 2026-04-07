/**
 * Task Manager Module - CRUD operations สำหรับ Tasks
 */
const TaskManager = (() => {
    function generateId() {
        return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function getAll() {
        return Storage.getTasks();
    }

    function getById(id) {
        return getAll().find(t => t.id === id) || null;
    }

    function add(title, { description = '', deadline = '', tags = [], priority = 'medium' } = {}) {
        const tasks = getAll();
        const task = {
            id: generateId(),
            title: title.trim(),
            description: description.trim(),
            deadline,
            tags: tags.map(t => t.trim()).filter(Boolean),
            priority,
            completed: false,
            createdAt: new Date().toISOString(),
            completedAt: null,
        };
        tasks.unshift(task);
        Storage.saveTasks(tasks);
        return task;
    }

    function update(id, updates) {
        const tasks = getAll();
        const idx = tasks.findIndex(t => t.id === id);
        if (idx === -1) return null;
        tasks[idx] = { ...tasks[idx], ...updates };
        Storage.saveTasks(tasks);
        return tasks[idx];
    }

    function remove(id) {
        const tasks = getAll().filter(t => t.id !== id);
        Storage.saveTasks(tasks);
    }

    function toggleComplete(id) {
        const task = getById(id);
        if (!task) return null;
        return update(id, {
            completed: !task.completed,
            completedAt: !task.completed ? new Date().toISOString() : null
        });
    }

    // Filters
    function getToday() {
        const today = new Date().toISOString().split('T')[0];
        return getAll().filter(t => t.deadline === today && !t.completed);
    }

    function getOverdue() {
        const today = new Date().toISOString().split('T')[0];
        return getAll().filter(t => t.deadline && t.deadline < today && !t.completed);
    }

    function getCompleted() {
        return getAll().filter(t => t.completed);
    }

    function getActive() {
        return getAll().filter(t => !t.completed);
    }

    function getAllTags() {
        const tags = new Set();
        getAll().forEach(t => t.tags.forEach(tag => tags.add(tag)));
        return [...tags].sort();
    }

    function getByTag(tag) {
        return getAll().filter(t => t.tags.includes(tag));
    }

    function search(query) {
        const q = query.toLowerCase();
        return getAll().filter(t =>
            t.title.toLowerCase().includes(q) ||
            t.description.toLowerCase().includes(q) ||
            t.tags.some(tag => tag.toLowerCase().includes(q))
        );
    }

    function sort(tasks, sortBy) {
        const sorted = [...tasks];
        switch (sortBy) {
            case 'deadline':
                sorted.sort((a, b) => {
                    if (!a.deadline) return 1;
                    if (!b.deadline) return -1;
                    return a.deadline.localeCompare(b.deadline);
                });
                break;
            case 'name':
                sorted.sort((a, b) => a.title.localeCompare(b.title, 'th'));
                break;
            case 'created':
            default:
                sorted.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        }
        return sorted;
    }

    return {
        getAll, getById, add, update, remove, toggleComplete,
        getToday, getOverdue, getCompleted, getActive,
        getAllTags, getByTag, search, sort
    };
})();
