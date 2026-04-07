/**
 * Storage Module - จัดการ LocalStorage
 */
const Storage = (() => {
    const KEYS = {
        TASKS: 'taskflow_tasks',
        NOTES: 'taskflow_notes',
    };

    function get(key) {
        try {
            const data = localStorage.getItem(key);
            return data ? JSON.parse(data) : [];
        } catch (e) {
            console.error('Storage read error:', e);
            return [];
        }
    }

    function set(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
        } catch (e) {
            console.error('Storage write error:', e);
        }
    }

    // Tasks
    function getTasks() { return get(KEYS.TASKS); }
    function saveTasks(tasks) { set(KEYS.TASKS, tasks); }

    // Notes
    function getNotes() { return get(KEYS.NOTES); }
    function saveNotes(notes) { set(KEYS.NOTES, notes); }

    // Export data as JSON
    function exportData() {
        return JSON.stringify({
            tasks: getTasks(),
            notes: getNotes(),
            exportedAt: new Date().toISOString()
        }, null, 2);
    }

    // Import data from JSON
    function importData(jsonString) {
        const data = JSON.parse(jsonString);
        if (data.tasks) saveTasks(data.tasks);
        if (data.notes) saveNotes(data.notes);
    }

    return { getTasks, saveTasks, getNotes, saveNotes, exportData, importData };
})();
