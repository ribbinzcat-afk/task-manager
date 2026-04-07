/**
 * App Module - UI Controller (Fixed Version)
 */
;(function () {
    'use strict';

    // ── State ──
    let currentView = 'all';
    let currentTag = null;
    let currentSort = 'created';
    let searchQuery = '';
    let selectedNoteColor = '#FFF9C4';

    // ── DOM Helpers ──
    const $ = (sel) => document.querySelector(sel);
    const $$ = (sel) => Array.from(document.querySelectorAll(sel));

    // ── Wait for DOM ──
    document.addEventListener('DOMContentLoaded', () => {

        // ── DOM Elements ──
        const DOM = {
            sidebar:       $('.sidebar'),
            hamburger:     $('#hamburger-btn'),
            navBtns:       $$('.nav-btn'),
            viewTitle:     $('#view-title'),
            taskView:      $('#task-view'),
            notesView:     $('#notes-view'),
            taskList:      $('#task-list'),
            emptyState:    $('#empty-state'),
            notesGrid:     $('#notes-grid'),
            notesEmpty:    $('#notes-empty'),
            // Task Form
            taskForm:      $('#task-form'),
            taskTitle:     $('#task-title'),
            taskDeadline:  $('#task-deadline'),
            taskTags:      $('#task-tags'),
            taskPriority:  $('#task-priority'),
            taskDescription: $('#task-description'),
            // Note Form
            noteForm:      $('#note-form'),
            noteContent:   $('#note-content'),
            // Search / Sort
            searchInput:   $('#search-input'),
            sortSelect:    $('#sort-select'),
            // Modal
            modal:         $('#task-modal'),
            modalClose:    $('#modal-close'),
            editForm:      $('#edit-task-form'),
            editId:        $('#edit-task-id'),
            editTitle:     $('#edit-task-title'),
            editDesc:      $('#edit-task-description'),
            editDeadline:  $('#edit-task-deadline'),
            editTags:      $('#edit-task-tags'),
            editPriority:  $('#edit-task-priority'),
            deleteBtn:     $('#delete-task-btn'),
            // Badges
            badgeAll:      $('#badge-all'),
            badgeToday:    $('#badge-today'),
            badgeOverdue:  $('#badge-overdue'),
            badgeCompleted:$('#badge-completed'),
            badgeNotes:    $('#badge-notes'),
            // Tags
            tagFilterList: $('#tag-filter-list'),
            // Toast
            toast:         $('#toast'),
        };

        // ── Debug: ตรวจว่า DOM elements หาเจอไหม ──
        console.log('🔍 DOM Check:', {
            taskForm:  !!DOM.taskForm,
            taskList:  !!DOM.taskList,
            taskTitle: !!DOM.taskTitle,
        });

        // ============================================
        // Utility Functions
        // ============================================

        function showToast(msg) {
            DOM.toast.textContent = msg;
            DOM.toast.classList.add('show');
            setTimeout(() => DOM.toast.classList.remove('show'), 2500);
        }

        function escapeHTML(str) {
            const div = document.createElement('div');
            div.textContent = str;
            return div.innerHTML;
        }

        function formatDate(iso) {
            if (!iso) return '';
            const d = new Date(iso + 'T00:00:00');
            return d.toLocaleDateString('th-TH', {
                day: 'numeric', month: 'short', year: 'numeric'
            });
        }

        function formatDateTime(iso) {
            const d = new Date(iso);
            return d.toLocaleDateString('th-TH', {
                day: 'numeric', month: 'short', year: 'numeric'
            }) + ' ' + d.toLocaleTimeString('th-TH', {
                hour: '2-digit', minute: '2-digit'
            });
        }

        function getTodayString() {
            const d = new Date();
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, '0');
            const day = String(d.getDate()).padStart(2, '0');
            return `${y}-${m}-${day}`;
        }

        function getDeadlineClass(deadline) {
            if (!deadline) return '';
            const today = getTodayString();
            if (deadline < today) return 'deadline-overdue';
            if (deadline === today) return 'deadline-today';
            return 'deadline-normal';
        }

        function getDeadlineLabel(deadline) {
            if (!deadline) return '';
            const today = getTodayString();
            if (deadline < today) return '⚠️ เลยกำหนด!';
            if (deadline === today) return '📅 วันนี้';
            return '🗓️ ' + formatDate(deadline);
        }

        // ============================================
        // Render Functions
        // ============================================

        function renderBadges() {
            DOM.badgeAll.textContent       = TaskManager.getActive().length;
            DOM.badgeToday.textContent     = TaskManager.getToday().length;
            DOM.badgeOverdue.textContent   = TaskManager.getOverdue().length;
            DOM.badgeCompleted.textContent = TaskManager.getCompleted().length;
            DOM.badgeNotes.textContent     = NoteManager.count();
        }

        function renderTagFilters() {
            const tags = TaskManager.getAllTags();
            if (tags.length === 0) {
                DOM.tagFilterList.innerHTML =
                    '<span style="font-size:12px;color:#999;">ยังไม่มีแท็ก</span>';
            } else {
                DOM.tagFilterList.innerHTML = tags.map(tag =>
                    `<button class="tag-filter-btn ${currentTag === tag ? 'active' : ''}"
                             data-tag="${escapeHTML(tag)}">${escapeHTML(tag)}</button>`
                ).join('');
            }
        }

        function getFilteredTasks() {
            let tasks;
            switch (currentView) {
                case 'today':     tasks = TaskManager.getToday(); break;
                case 'overdue':   tasks = TaskManager.getOverdue(); break;
                case 'completed': tasks = TaskManager.getCompleted(); break;
                default:          tasks = TaskManager.getActive(); break;
            }

            if (currentTag) {
                tasks = tasks.filter(t => t.tags.includes(currentTag));
            }

            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                tasks = tasks.filter(t =>
                    t.title.toLowerCase().includes(q) ||
                    t.description.toLowerCase().includes(q) ||
                    t.tags.some(tag => tag.toLowerCase().includes(q))
                );
            }

            return TaskManager.sort(tasks, currentSort);
        }

        function createTaskHTML(task) {
            const deadlineHTML = task.deadline
                ? `<span class="task-deadline ${getDeadlineClass(task.deadline)}">${getDeadlineLabel(task.deadline)}</span>`
                : '';

            const tagsHTML = task.tags
                .map(t => `<span class="tag">${escapeHTML(t)}</span>`)
                .join('');

            return `
                <div class="task-card priority-${task.priority} ${task.completed ? 'completed' : ''}"
                     data-id="${task.id}">
                    <button class="task-checkbox ${task.completed ? 'checked' : ''}"
                            data-id="${task.id}" title="เสร็จสิ้น">
                        ${task.completed ? '✓' : ''}
                    </button>
                    <div class="task-body" data-id="${task.id}">
                        <div class="task-title">${escapeHTML(task.title)}</div>
                        ${task.description
                            ? `<div class="task-desc">${escapeHTML(task.description)}</div>`
                            : ''}
                        <div class="task-meta">
                            ${deadlineHTML}
                            <div class="task-tags">${tagsHTML}</div>
                        </div>
                    </div>
                    <div class="task-actions">
                        <button class="task-action-btn edit-btn"
                                data-id="${task.id}" title="แก้ไข">✏️</button>
                        <button class="task-action-btn delete-btn"
                                data-id="${task.id}" title="ลบ">🗑️</button>
                    </div>
                </div>
            `;
        }

        function renderTasks() {
            const tasks = getFilteredTasks();
            console.log('📋 Rendering tasks:', tasks.length, 'items');

            if (tasks.length === 0) {
                DOM.taskList.innerHTML = '';
                DOM.emptyState.style.display = 'block';
            } else {
                DOM.emptyState.style.display = 'none';
                DOM.taskList.innerHTML = tasks.map(createTaskHTML).join('');
            }

            renderBadges();
            renderTagFilters();
        }

        function renderNotes() {
            const notes = NoteManager.getAll();

            if (notes.length === 0) {
                DOM.notesGrid.innerHTML = '';
                DOM.notesEmpty.style.display = 'block';
            } else {
                DOM.notesEmpty.style.display = 'none';
                DOM.notesGrid.innerHTML = notes.map(note => `
                    <div class="note-card" style="background:${note.color}" data-id="${note.id}">
                        <button class="note-delete" data-id="${note.id}" title="ลบ">&times;</button>
                        ${escapeHTML(note.content)}
                        <span class="note-time">${formatDateTime(note.createdAt)}</span>
                    </div>
                `).join('');
            }

            renderBadges();
        }

        // ============================================
        // View Switching
        // ============================================

        function switchView(view) {
            currentView = view;
            currentTag = null;

            DOM.navBtns.forEach(btn => {
                btn.classList.toggle('active', btn.dataset.view === view);
            });

            const isNotes = (view === 'notes');
            DOM.taskView.classList.toggle('active', !isNotes);
            DOM.notesView.classList.toggle('active', isNotes);

            const titles = {
                all:       '📁 งานทั้งหมด',
                today:     '📅 งานวันนี้',
                overdue:   '🔴 เลยกำหนด',
                completed: '✅ เสร็จแล้ว',
                notes:     '📝 Micro Notes',
            };
            DOM.viewTitle.textContent = titles[view] || '';

            if (isNotes) {
                renderNotes();
            } else {
                renderTasks();
            }

            DOM.sidebar.classList.remove('open');
        }

        // ============================================
        // Modal
        // ============================================

        function openEditModal(taskId) {
            const task = TaskManager.getById(taskId);
            if (!task) return;

            DOM.editId.value       = task.id;
            DOM.editTitle.value    = task.title;
            DOM.editDesc.value     = task.description;
            DOM.editDeadline.value = task.deadline;
            DOM.editTags.value     = task.tags.join(', ');
            DOM.editPriority.value = task.priority;

            DOM.modal.classList.add('show');
        }

        function closeModal() {
            DOM.modal.classList.remove('show');
        }

        // ============================================
        // Event Bindings
        // ============================================

        // Navigation
        DOM.navBtns.forEach(btn => {
            btn.addEventListener('click', () => switchView(btn.dataset.view));
        });

        // Hamburger
        DOM.hamburger.addEventListener('click', () => {
            DOM.sidebar.classList.toggle('open');
        });

        // Click outside sidebar (mobile)
        document.addEventListener('click', (e) => {
            if (window.innerWidth <= 768
                && !DOM.sidebar.contains(e.target)
                && e.target !== DOM.hamburger) {
                DOM.sidebar.classList.remove('open');
            }
        });

        // ── ADD TASK (จุดสำคัญ!) ──
        DOM.taskForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const title = DOM.taskTitle.value.trim();
            if (!title) {
                console.warn('⚠️ Title is empty');
                return;
            }

            const tags = DOM.taskTags.value
                ? DOM.taskTags.value.split(',').map(t => t.trim()).filter(Boolean)
                : [];

            const newTask = TaskManager.add(title, {
                description: DOM.taskDescription.value.trim(),
                deadline:    DOM.taskDeadline.value,
                tags:        tags,
                priority:    DOM.taskPriority.value,
            });

            console.log('✅ Task added:', newTask);
            console.log('💾 All tasks in storage:', TaskManager.getAll());

            // Reset form
            DOM.taskForm.reset();

            // ★ สำคัญ: ต้องกลับไป view "all" เพื่อให้เห็น task ที่เพิ่ม
            if (currentView !== 'all') {
                switchView('all');
            } else {
                renderTasks();
            }

            showToast('✅ เพิ่ม Task สำเร็จ!');
        });

        // ── Task List Click Delegation ──
        DOM.taskList.addEventListener('click', (e) => {
            const target = e.target;

            // Checkbox toggle
            if (target.classList.contains('task-checkbox')) {
                e.stopPropagation();
                const task = TaskManager.toggleComplete(target.dataset.id);
                renderTasks();
                showToast(task && task.completed ? '✅ เสร็จสิ้น!' : '↩️ ยกเลิกเสร็จสิ้น');
                return;
            }

            // Delete button
            if (target.classList.contains('delete-btn')) {
                e.stopPropagation();
                if (confirm('ต้องการลบ Task นี้?')) {
                    TaskManager.remove(target.dataset.id);
                    renderTasks();
                    showToast('🗑️ ลบ Task แล้ว');
                }
                return;
            }

            // Edit button
            if (target.classList.contains('edit-btn')) {
                e.stopPropagation();
                openEditModal(target.dataset.id);
                return;
            }

            // Click on task body → edit
            const body = target.closest('.task-body');
            if (body) {
                openEditModal(body.dataset.id);
            }
        });

        // ── Modal Events ──
        DOM.modalClose.addEventListener('click', closeModal);

        DOM.modal.addEventListener('click', (e) => {
            if (e.target === DOM.modal) closeModal();
        });

        DOM.editForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const tags = DOM.editTags.value
                ? DOM.editTags.value.split(',').map(t => t.trim()).filter(Boolean)
                : [];

            TaskManager.update(DOM.editId.value, {
                title:       DOM.editTitle.value.trim(),
                description: DOM.editDesc.value.trim(),
                deadline:    DOM.editDeadline.value,
                tags:        tags,
                priority:    DOM.editPriority.value,
            });

            closeModal();
            renderTasks();
            showToast('✏️ อัปเดตเรียบร้อย!');
        });

        DOM.deleteBtn.addEventListener('click', () => {
            if (confirm('ต้องการลบ Task นี้?')) {
                TaskManager.remove(DOM.editId.value);
                closeModal();
                renderTasks();
                showToast('🗑️ ลบ Task แล้ว');
            }
        });

        // ── Search ──
        DOM.searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            renderTasks();
        });

        // ── Sort ──
        DOM.sortSelect.addEventListener('change', (e) => {
            currentSort = e.target.value;
            renderTasks();
        });

        // ── Tag Filter ──
        DOM.tagFilterList.addEventListener('click', (e) => {
            if (e.target.classList.contains('tag-filter-btn')) {
                const tag = e.target.dataset.tag;
                currentTag = (currentTag === tag) ? null : tag;

                if (currentView === 'notes') switchView('all');
                renderTasks();
            }
        });

        // ── ADD NOTE ──
        DOM.noteForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const content = DOM.noteContent.value.trim();
            if (!content) return;

            NoteManager.add(content, selectedNoteColor);
            DOM.noteForm.reset();
            renderNotes();
            showToast('📝 เพิ่ม Note สำเร็จ!');
        });

        // Note color picker
        $$('.color-dot').forEach(dot => {
            dot.addEventListener('click', () => {
                $$('.color-dot').forEach(d => d.classList.remove('active'));
                dot.classList.add('active');
                selectedNoteColor = dot.dataset.color;
            });
        });

        // ── Notes Delete ──
        DOM.notesGrid.addEventListener('click', (e) => {
            if (e.target.classList.contains('note-delete')) {
                e.stopPropagation();
                NoteManager.remove(e.target.dataset.id);
                renderNotes();
                showToast('🗑️ ลบ Note แล้ว');
            }
        });

        // Escape key closes modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') closeModal();
        });

        // ============================================
        // Initialize
        // ============================================

        console.log('🚀 TaskFlow initializing...');
        console.log('💾 Existing tasks:', TaskManager.getAll().length);
        console.log('📝 Existing notes:', NoteManager.getAll().length);

        switchView('all');

    }); // end DOMContentLoaded

})();
