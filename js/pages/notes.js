// notes.js - Versión actualizada para usar el api-client

// Variables globales
let notes = [];
let currentUser = null; 3
let editingNoteId = null;
let commentNoteId = null;

// Inicialización cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', function () {
    // Verificar si el usuario está autenticado
    if (!isUserAuthenticated()) {
        redirectToLogin();
        return;
    }

    initializeNotes();
    setupEventListeners();
});

// Inicializar la aplicación de notas
function initializeNotes() {
    // Obtener usuario actual
    currentUser = getCurrentUser();

    if (!currentUser) {
        redirectToLogin();
        return;
    }

    // Cargar notas
    loadNotes(currentUser.id);
}

// Configurar event listeners
function setupEventListeners() {
    // Botón para agregar nota
    const addNoteBtn = document.getElementById('add-note-btn');
    const firstNoteBtn = document.getElementById('first-note-btn');

    if (addNoteBtn) {
        addNoteBtn.addEventListener('click', showAddNoteModal);
    }

    if (firstNoteBtn) {
        firstNoteBtn.addEventListener('click', showAddNoteModal);
    }

    // Toggle de filtros
    const filterToggle = document.getElementById('filter-toggle');
    if (filterToggle) {
        filterToggle.addEventListener('click', toggleFilters);
    }

    // Formulario de nota
    const noteForm = document.getElementById('note-form');
    if (noteForm) {
        noteForm.addEventListener('submit', handleNoteSubmit);
    }

    // Filtros
    const filterSearch = document.getElementById('filter-search');
    const filterSort = document.getElementById('filter-sort');

    if (filterSearch) filterSearch.addEventListener('input', applyFilters);
    if (filterSort) filterSort.addEventListener('change', applyFilters);

    // Modales
    setupModalListeners();
}

// Cargar notas desde el API
async function loadNotes(UserId) {
    try {
        const response = await notesService.getNotesByUser(UserId);

        if (response) {
            notes = response;
            displayNotes(notes);
        } else {
            showEmptyState();
        }
    } catch (error) {
        console.error('Error loading notes:', error);
        showError('Error al cargar las notas');
    }
}

// Mostrar notas en la cuadrícula
function displayNotes(notesToDisplay) {
    const notesGrid = document.getElementById('notes-grid');

    if (!notesGrid) return;

    if (!notesToDisplay || notesToDisplay.length === 0) {
        showEmptyState();
        return;
    }

    // Limpiar cuadrícula
    notesGrid.innerHTML = '';

    // Crear elementos de nota
    notesToDisplay.forEach(note => {
        const noteElement = createNoteElement(note);
        notesGrid.appendChild(noteElement);
    });
}

// Crear elemento HTML para una nota
function createNoteElement(note) {
    const noteCard = document.createElement('div');
    noteCard.className = 'note-card note';
    noteCard.dataset.id = note.id;

    const formattedDate = formatDate(note.createdDate);

    noteCard.innerHTML = `
        <div class="note-header">
            <div class="note-icon note">
                <i class="fas fa-sticky-note"></i>
            </div>
            <div class="note-actions">
                <button class="note-action-btn edit" data-id="${note.id}">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="note-action-btn delete" data-id="${note.id}">
                    <i class="fas fa-trash"></i>
                </button>
                <button class="note-action-btn comment" data-id="${note.id}">
                    <i class="fas fa-comment"></i>
                </button>
            </div>
        </div>
        <div class="note-info">
            <h3 class="note-title">${escapeHtml(note.title)}</h3>
            <p class="note-content">${escapeHtml(note.content)}</p>
            <div class="note-meta">
                <span><i class="fas fa-user"></i> ${escapeHtml(note.userName)}</span>
                ${note.comments ? `<span><i class="fas fa-comments"></i> ${getCommentCount(note.comments)}</span>` : ''}
            </div>
        </div>
        <div class="note-footer">
            <span class="note-date">${formattedDate}</span>
        </div>
    `;

    // Agregar event listeners a los botones de acción
    noteCard.querySelector('.note-action-btn.edit').addEventListener('click', () => editNote(note.id));
    noteCard.querySelector('.note-action-btn.delete').addEventListener('click', () => confirmDeleteNote(note.id));
    noteCard.querySelector('.note-action-btn.comment').addEventListener('click', () => showCommentsModal(note.id));

    return noteCard;
}

// Mostrar modal para agregar/editar nota
function showAddNoteModal() {
    editingNoteId = null;
    document.getElementById('modal-title').textContent = 'Nueva Nota';
    document.getElementById('note-id').value = '';
    document.getElementById('note-title').value = '';
    document.getElementById('note-content').value = '';

    openModal('note-modal');
}

// Editar nota existente
async function editNote(noteId) {
    try {
        const response = await notesService.getNoteById(noteId);

        if (response) {
            const note = response;
            editingNoteId = noteId;

            document.getElementById('modal-title').textContent = 'Editar Nota';
            document.getElementById('note-id').value = note.id;
            document.getElementById('note-title').value = note.title;
            document.getElementById('note-content').value = note.content;

            openModal('note-modal');
        }
    } catch (error) {
        console.error('Error loading note for edit:', error);
        showError('Error al cargar la nota para editar');
    }
}

// Manejar envío del formulario de nota
async function handleNoteSubmit(e) {
    e.preventDefault();

    const noteId = document.getElementById('note-id').value;
    const title = document.getElementById('note-title').value.trim();
    const content = document.getElementById('note-content').value.trim();

    if (!title || !content) {
        showError('Por favor, completa todos los campos');
        return;
    }

    try {
        const noteData = {
            title: title,
            content: content,
            userId: currentUser.id
        };

        let response;
        if (noteId) {
            // Actualizar nota existente
            response = await notesService.updateNote(noteId, noteData);
        } else {
            // Crear nueva nota
            response = await notesService.createNote(noteData);
        }

        if (response) {
            closeModal('note-modal');
            loadNotes(currentUser.id); // Recargar la lista de notas
            showSuccess(noteId ? 'Nota actualizada correctamente' : 'Nota creada correctamente');
        }
    } catch (error) {
        console.error('Error saving note:', error);
        showError('Error al guardar la nota');
    }
}

// Confirmar eliminación de nota
async function confirmDeleteNote(noteId) {
    const note = notes.find(n => n.id == noteId);
    if (!note) return;

    document.getElementById('delete-note-title').textContent = `"${note.title}"`;
    openModal('delete-modal');

    // Configurar event listeners para los botones de confirmación
    document.getElementById('confirm-delete').onclick = () => deleteNote(noteId);
    document.getElementById('cancel-delete').onclick = () => closeModal('delete-modal');
}

// Eliminar nota
async function deleteNote(noteId) {
    try {
        const response = await notesService.deleteNote(noteId);

        if (response !== undefined) {
            closeModal('delete-modal');
            loadNotes(currentUser.id); // Recargar la lista de notas
            showSuccess('Nota eliminada correctamente');
        }
    } catch (error) {
        console.error('Error deleting note:', error);
        showError('Error al eliminar la nota');
    }
}

// Mostrar modal de comentarios
async function showCommentsModal(noteId) {
    commentNoteId = noteId;

    try {
        const response = await notesService.getNoteById(noteId);

        if (response) {
            const note = response;
            document.getElementById('comments-list').innerHTML = '';

            if (note.comments) {
                const comments = parseComments(note.comments);
                comments.forEach(comment => {
                    addCommentToDOM(comment);
                });
            }

            // Configurar event listener para agregar comentarios
            document.getElementById('add-comment-btn').onclick = addComment;

            openModal('comments-modal');
        }
    } catch (error) {
        console.error('Error loading comments:', error);
        showError('Error al cargar los comentarios');
    }
}

// Agregar comentario
async function addComment() {
    const commentText = document.getElementById('new-comment').value.trim();

    if (!commentText) {
        showError('Por favor, escribe un comentario');
        return;
    }

    try {
        const response = await notesService.addComment(commentNoteId, commentText);

        if (response) {
            document.getElementById('new-comment').value = '';

            // Actualizar la lista de comentarios
            const comment = {
                author: currentUser.name,
                text: commentText,
                date: new Date().toISOString()
            };

            addCommentToDOM(comment);
            showSuccess('Comentario agregado correctamente');

            // Recargar notas para actualizar el contador
            loadNotes(currentUser.id);
        }
    } catch (error) {
        console.error('Error adding comment:', error);
        showError('Error al agregar el comentario');
    }
}

// Aplicar filtros
function applyFilters() {
    const searchValue = document.getElementById('filter-search')?.value?.toLowerCase() || '';
    const sortValue = document.getElementById('filter-sort')?.value || 'newest';

    let filteredNotes = [...notes];

    // Filtrar por texto en título o contenido
    if (searchValue) {
        filteredNotes = filteredNotes.filter(note => {
            return (
                note.title.toLowerCase().includes(searchValue) ||
                note.content.toLowerCase().includes(searchValue)
            );
        });
    }

    // Ordenar
    if (sortValue === 'newest') {
        filteredNotes.sort((a, b) => new Date(b.createdDate) - new Date(a.createdDate));
    } else if (sortValue === 'oldest') {
        filteredNotes.sort((a, b) => new Date(a.createdDate) - new Date(b.createdDate));
    } else if (sortValue === 'title') {
        filteredNotes.sort((a, b) => a.title.localeCompare(b.title));
    }

    displayNotes(filteredNotes);
}

// Alternar visibilidad de filtros
function toggleFilters() {
    const filtersSection = document.getElementById('filters-section');
    if (filtersSection) {
        filtersSection.classList.toggle('hidden');
    }
}

// Funciones auxiliares
function showEmptyState() {
    const notesGrid = document.getElementById('notes-grid');
    if (!notesGrid) return;

    notesGrid.innerHTML = `
        <div class="no-data">
            <i class="fas fa-sticky-note"></i>
            <p>No tienes notas registradas</p>
            <button class="btn btn-primary" id="first-note-btn">Crear primera nota</button>
        </div>
    `;

    document.getElementById('first-note-btn').addEventListener('click', showAddNoteModal);
}

function getCurrentUser() {
    // Obtener usuario del localStorage
    const userData = getLocalStorage('currentUser');
    if (userData) {
        try {
            return typeof userData === 'string' ? JSON.parse(userData) : userData;
        } catch (e) {
            console.error('Error parsing user data:', e);
            return null;
        }
    }
    return null;
}

function isUserAuthenticated() {
    return !!getLocalStorage('authToken');
}

function redirectToLogin() {
    window.location.href = 'index.html';
}

function parseComments(comments) {
    if (Array.isArray(comments)) {
        return comments;
    }
    if (typeof comments === 'string') {
        // Si el string contiene saltos de línea, lo divide en comentarios individuales
        return comments.split('\n').filter(c => c.trim() !== '').map(c => ({
            author: 'Desconocido',
            text: c.trim(),
            date: null
        }));
    }
    return [];
}

function getCommentCount(comments) {
    const parsed = parseComments(comments);
    return parsed.length;
}

function addCommentToDOM(comment) {
    const commentsList = document.getElementById('comments-list');
    if (!commentsList) return;

    const commentElement = document.createElement('div');
    commentElement.className = 'comment-item';
    commentElement.innerHTML = `
        <p class="comment-text">${escapeHtml(comment.text)}</p>
    `;

    commentsList.appendChild(commentElement);
}

// Utilidades
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Notificaciones tipo toast
function showToast(message, type = 'success') {
    let toast = document.getElementById('toast-notes');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-notes';
        toast.className = 'toast-notes';
        document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = `toast-notes toast-${type}`;
    toast.style.display = 'block';
    // Animación de entrada
    setTimeout(() => {
        toast.classList.add('toast-show');
    }, 10);
    // Animación de salida
    setTimeout(() => {
        toast.classList.remove('toast-show');
        setTimeout(() => { toast.style.display = 'none'; }, 400);
    }, 2200);
}

function showError(message) {
    showToast(message, 'error');
}

function showSuccess(message) {
    showToast(message, 'success');
}

// Configuración de modales
function setupModalListeners() {
    // Cerrar modales al hacer clic en la X
    document.querySelectorAll('.close-modal').forEach(closeBtn => {
        closeBtn.addEventListener('click', function () {
            const modal = this.closest('.modal');
            modal.classList.remove('show');
        });
    });

    // Cerrar modales al hacer clic fuera del contenido
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function (e) {
            if (e.target === this) {
                this.classList.remove('show');
            }
        });
    });
}

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
    }
}

// Funciones de localStorage (deben estar definidas en utils.js)
function getLocalStorage(key) {
    return localStorage.getItem(key);
}

function setLocalStorage(key, value) {
    localStorage.setItem(key, value);
}

function removeLocalStorage(key) {
    localStorage.removeItem(key);
}