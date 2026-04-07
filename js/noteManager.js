/**
 * Note Manager Module - Micro Notes CRUD
 */
const NoteManager = (() => {
    function generateId() {
        return 'note_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    function getAll() {
        return Storage.getNotes();
    }

    function add(content, color = '#FFF9C4') {
        const notes = getAll();
        const note = {
            id: generateId(),
            content: content.trim(),
            color,
            createdAt: new Date().toISOString(),
        };
        notes.unshift(note);
        Storage.saveNotes(notes);
        return note;
    }

    function update(id, updates) {
        const notes = getAll();
        const idx = notes.findIndex(n => n.id === id);
        if (idx === -1) return null;
        notes[idx] = { ...notes[idx], ...updates };
        Storage.saveNotes(notes);
        return notes[idx];
    }

    function remove(id) {
        const notes = getAll().filter(n => n.id !== id);
        Storage.saveNotes(notes);
    }

    function count() {
        return getAll().length;
    }

    return { getAll, add, update, remove, count };
})();
