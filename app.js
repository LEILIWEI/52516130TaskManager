// DOM Elements
const taskForm = document.getElementById('task-form');
const taskInput = document.getElementById('task-input');
const categorySelect = document.getElementById('category-select');
const dueDateInput = document.getElementById('due-date-input');
const prioritySelect = document.getElementById('priority-select');
const taskList = document.getElementById('task-list');
const filterSelect = document.getElementById('filter-select');
const emptyState = document.getElementById('empty-state');
const completedCountEl = document.getElementById('completed-count');
const totalCountEl = document.getElementById('total-count');
const progressRingPath = document.getElementById('progress-ring-path');

// Settings Elements
const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings');
const apiKeyInput = document.getElementById('api-key-input');
const saveSettingsBtn = document.getElementById('save-settings-btn');
const themeToggleBtn = document.getElementById('theme-toggle-btn');

// Supabase Settings Elements
const supabaseUrlInput = document.getElementById('supabase-url-input');
const supabaseKeyInput = document.getElementById('supabase-key-input');
const saveSupabaseBtn = document.getElementById('save-supabase-btn');
const connectionDot = document.getElementById('connection-dot');
const connectionText = document.getElementById('connection-text');
const bannerDot = document.getElementById('banner-dot');
const bannerStatusText = document.getElementById('banner-status-text');

// AI Elements
const aiTaskInput = document.getElementById('ai-task-input');
const aiGenerateBtn = document.getElementById('ai-generate-btn');
const aiLoading = document.getElementById('ai-loading');
const aiResults = document.getElementById('ai-results');
const aiSubtasksList = document.getElementById('ai-subtasks-list');
const addAllAiBtn = document.getElementById('add-all-ai-btn');

// Toast Element
const toast = document.getElementById('toast');
const toastMessage = document.getElementById('toast-message');
const toastIcon = document.getElementById('toast-icon');

// ─── State ───────────────────────────────────────────────────────────────────
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let apiKey = localStorage.getItem('gemini_api_key') || '';
let supabaseUrl = localStorage.getItem('supabase_url') || '';
let supabaseAnonKey = localStorage.getItem('supabase_anon_key') || '';
let isDarkMode = localStorage.getItem('theme') !== 'light';
let generatedSubtasks = [];

// Drag and drop state
let draggedTaskId = null;
let draggedElement = null;

// ─── Initialize ───────────────────────────────────────────────────────────────
async function init() {
    // Populate settings inputs
    apiKeyInput.value = apiKey;
    supabaseUrlInput.value = supabaseUrl;
    supabaseKeyInput.value = supabaseAnonKey;

    // Apply saved theme
    if (!isDarkMode) {
        document.body.classList.add('light-theme');
        themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }

    // Show local cache immediately (fast first render)
    renderTasks();
    updateStats();
    setupEventListeners();

    // Attempt to connect to Supabase in the background
    await initSupabase();
}

async function initSupabase() {
    if (!supabaseUrl || !supabaseAnonKey) {
        updateConnectionStatus('offline');
        return;
    }

    updateConnectionStatus('connecting');

    const connected = await window.SupabaseDB.init(supabaseUrl, supabaseAnonKey);

    if (!connected) {
        updateConnectionStatus('offline');
        showToast('⚠️ Could not connect to Supabase. Running in offline mode.', 'error');
        return;
    }

    updateConnectionStatus('connected');

    // Migrate any local tasks if cloud is empty
    const localTasks = JSON.parse(localStorage.getItem('tasks')) || [];
    if (localTasks.length > 0) {
        try {
            const migrated = await window.SupabaseDB.migrateFromLocalStorage(localTasks);
            if (migrated > 0) {
                showToast(`☁️ Migrated ${migrated} local tasks to cloud`, 'success');
            }
        } catch (err) {
            console.warn('[App] Migration failed:', err);
        }
    }

    // Load fresh data from cloud
    try {
        const cloudTasks = await window.SupabaseDB.loadTasks();
        if (cloudTasks !== null) {
            tasks = cloudTasks;
            localStorage.setItem('tasks', JSON.stringify(tasks));
            renderTasks();
            updateStats();
        }
    } catch (err) {
        console.error('[App] Failed to load tasks from Supabase:', err);
        updateConnectionStatus('offline');
        showToast('Failed to load cloud tasks. Using local cache.', 'error');
    }
}

// ─── Connection Status ────────────────────────────────────────────────────────
function updateConnectionStatus(status) {
    const config = {
        connecting: { dotClass: 'dot-connecting', label: 'Connecting...' },
        connected:  { dotClass: 'dot-connected',  label: 'Cloud Sync ✓' },
        offline:    { dotClass: 'dot-offline',     label: 'Offline' },
    };

    const { dotClass, label } = config[status] || config.offline;

    // Header indicator
    connectionDot.className = `connection-dot ${dotClass}`;
    connectionText.textContent = label;

    // Modal banner
    bannerDot.className = `connection-dot ${dotClass}`;
    bannerStatusText.textContent =
        status === 'connected' ? 'Connected to Supabase' :
        status === 'connecting' ? 'Connecting...' :
        'Not connected — tasks saved locally only';
}

// ─── Event Listeners ──────────────────────────────────────────────────────────
function setupEventListeners() {
    taskForm.addEventListener('submit', handleAddTask);
    filterSelect.addEventListener('change', renderTasks);

    // Settings
    settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
    saveSettingsBtn.addEventListener('click', saveSettings);
    saveSupabaseBtn.addEventListener('click', saveSupabaseSettings);

    // Close modal on outside click
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) settingsModal.classList.add('hidden');
    });

    // AI
    aiGenerateBtn.addEventListener('click', handleAIGeneration);
    addAllAiBtn.addEventListener('click', handleAddAllSubtasks);

    // Theme
    themeToggleBtn.addEventListener('click', toggleTheme);

    // Drag and drop
    taskList.addEventListener('dragstart', handleDragStart);
    taskList.addEventListener('dragover', handleDragOver);
    taskList.addEventListener('drop', handleDrop);
    taskList.addEventListener('dragenter', e => e.preventDefault());
    taskList.addEventListener('dragend', handleDragEnd);
}

// ─── Theme Management ─────────────────────────────────────────────────────────
function toggleTheme() {
    isDarkMode = !isDarkMode;
    if (isDarkMode) {
        document.body.classList.remove('light-theme');
        themeToggleBtn.innerHTML = '<i class="fas fa-moon"></i>';
        localStorage.setItem('theme', 'dark');
    } else {
        document.body.classList.add('light-theme');
        themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
        localStorage.setItem('theme', 'light');
    }
}

// ─── Settings ─────────────────────────────────────────────────────────────────
function saveSettings() {
    apiKey = apiKeyInput.value.trim();
    localStorage.setItem('gemini_api_key', apiKey);
    settingsModal.classList.add('hidden');
    showToast('API key saved', 'success');
}

async function saveSupabaseSettings() {
    const newUrl = supabaseUrlInput.value.trim();
    const newKey = supabaseKeyInput.value.trim();

    if (!newUrl || !newKey) {
        showToast('Please enter both a Project URL and Anon Key', 'error');
        return;
    }

    supabaseUrl = newUrl;
    supabaseAnonKey = newKey;
    localStorage.setItem('supabase_url', supabaseUrl);
    localStorage.setItem('supabase_anon_key', supabaseAnonKey);

    settingsModal.classList.add('hidden');
    showToast('Connecting to Supabase...', 'info');

    await initSupabase();

    if (window.SupabaseDB.isConnected) {
        showToast('✅ Connected to Supabase!', 'success');
    }
}

// ─── Task Management ─────────────────────────────────────────────────────────
async function handleAddTask(e) {
    e.preventDefault();

    const title = taskInput.value.trim();
    const category = categorySelect.value;
    const dueDate = dueDateInput.value;
    const priority = prioritySelect.value;

    if (!title) return;

    const newTask = {
        id: Date.now().toString(),
        title,
        category,
        dueDate,
        priority,
        completed: false,
        createdAt: new Date().toISOString(),
    };

    // Optimistic update — show immediately
    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    updateStats();

    taskInput.value = '';
    dueDateInput.value = '';
    prioritySelect.value = 'Medium';
    showToast('Task added successfully', 'success');

    // Sync to Supabase (non-blocking)
    if (window.SupabaseDB && window.SupabaseDB.isConnected) {
        try {
            await window.SupabaseDB.addTask(newTask, 0);
        } catch (err) {
            console.error('[App] Failed to sync new task:', err);
            showToast('Task saved locally (cloud sync failed)', 'info');
        }
    }
}

async function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;

    task.completed = !task.completed;
    saveTasks();
    renderTasks();
    updateStats();

    // Sync to Supabase
    if (window.SupabaseDB && window.SupabaseDB.isConnected) {
        try {
            await window.SupabaseDB.updateTask(id, { completed: task.completed });
        } catch (err) {
            console.error('[App] Failed to sync task toggle:', err);
        }
    }
}

async function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
    updateStats();
    showToast('Task deleted', 'info');

    // Sync to Supabase
    if (window.SupabaseDB && window.SupabaseDB.isConnected) {
        try {
            await window.SupabaseDB.deleteTask(id);
        } catch (err) {
            console.error('[App] Failed to sync task deletion:', err);
        }
    }
}

// ─── Storage (localStorage backup) ───────────────────────────────────────────
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

// ─── Rendering ────────────────────────────────────────────────────────────────
function renderTasks() {
    const filter = filterSelect.value;
    const filteredTasks = filter === 'All'
        ? tasks
        : tasks.filter(t => t.category === filter);

    taskList.innerHTML = '';

    if (filteredTasks.length === 0) {
        emptyState.classList.remove('hidden');
    } else {
        emptyState.classList.add('hidden');

        filteredTasks.forEach(task => {
            const isAllFilter = filter === 'All';
            const li = document.createElement('li');
            li.className = `task-item ${task.completed ? 'completed' : ''}`;
            li.dataset.id = task.id;
            if (isAllFilter) {
                li.draggable = true;
                li.title = 'Drag to reorder';
            }

            const categoryClass = `category-${task.category.toLowerCase()}`;
            const priorityClass = `priority-${task.priority ? task.priority.toLowerCase() : 'medium'}`;

            let metaHtml = `<span class="task-category ${categoryClass}">${task.category}</span>`;
            if (task.priority) {
                metaHtml += `<span class="task-priority ${priorityClass}">${task.priority}</span>`;
            }
            if (task.dueDate) {
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const taskDate = new Date(task.dueDate);
                taskDate.setHours(0, 0, 0, 0);
                const isOverdue = taskDate < today && !task.completed;
                metaHtml += `<span class="task-date ${isOverdue ? 'overdue' : ''}"><i class="far fa-calendar-alt"></i> ${task.dueDate}</span>`;
            }

            li.innerHTML = `
                <input type="checkbox" class="task-checkbox" ${task.completed ? 'checked' : ''} onchange="toggleTask('${task.id}')">
                <div class="task-content">
                    <span class="task-name">${escapeHTML(task.title)}</span>
                    <div class="task-meta">
                        ${metaHtml}
                    </div>
                </div>
                <button class="task-delete" onclick="deleteTask('${task.id}')" title="Delete">
                    <i class="fas fa-trash-alt"></i>
                </button>
            `;

            taskList.appendChild(li);
        });
    }
}

function updateStats() {
    const total = tasks.length;
    const completed = tasks.filter(t => t.completed).length;

    totalCountEl.textContent = total;
    completedCountEl.textContent = completed;

    const percentage = total === 0 ? 0 : (completed / total) * 100;
    progressRingPath.style.strokeDasharray = `${percentage}, 100`;
}

// ─── Drag and Drop ────────────────────────────────────────────────────────────
function handleDragStart(e) {
    const taskItem = e.target.closest('.task-item');
    if (!taskItem || !taskItem.draggable) return;

    draggedTaskId = taskItem.dataset.id;
    draggedElement = taskItem;

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', draggedTaskId);

    setTimeout(() => {
        taskItem.classList.add('dragging');
    }, 0);
}

function handleDragOver(e) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const taskItem = e.target.closest('.task-item');
    if (taskItem && taskItem !== draggedElement && filterSelect.value === 'All') {
        const rect = taskItem.getBoundingClientRect();
        const midY = rect.top + rect.height / 2;
        if (e.clientY < midY) {
            taskItem.parentNode.insertBefore(draggedElement, taskItem);
        } else {
            taskItem.parentNode.insertBefore(draggedElement, taskItem.nextSibling);
        }
    }
}

async function handleDrop(e) {
    e.preventDefault();
    if (!draggedElement || filterSelect.value !== 'All') return;

    const newItems = Array.from(taskList.querySelectorAll('.task-item'));
    const newOrderIds = newItems.map(item => item.dataset.id);

    const taskMap = new Map(tasks.map(t => [t.id, t]));
    tasks = newOrderIds.map(id => taskMap.get(id));

    saveTasks();
    updateStats();

    // Sync new order to Supabase
    if (window.SupabaseDB && window.SupabaseDB.isConnected) {
        try {
            await window.SupabaseDB.updateTaskOrders(newOrderIds);
        } catch (err) {
            console.error('[App] Failed to sync task order:', err);
        }
    }
}

function handleDragEnd() {
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
    }
    draggedTaskId = null;
    draggedElement = null;
}

// ─── AI Integration ───────────────────────────────────────────────────────────
async function handleAIGeneration() {
    const promptText = aiTaskInput.value.trim();

    if (!promptText) {
        showToast('Please enter a task to break down', 'error');
        return;
    }

    if (!apiKey) {
        showToast('Please set your Gemini API Key in settings first', 'error');
        settingsModal.classList.remove('hidden');
        return;
    }

    aiGenerateBtn.disabled = true;
    aiLoading.classList.remove('hidden');
    aiResults.classList.add('hidden');

    try {
        const subtasks = await fetchGeminiBreakdown(promptText);
        generatedSubtasks = subtasks;
        renderAISubtasks();
        aiResults.classList.remove('hidden');
        showToast('Subtasks generated!', 'success');
    } catch (error) {
        console.error('AI Error:', error);
        showToast('Failed to generate subtasks. Check API key.', 'error');
    } finally {
        aiGenerateBtn.disabled = false;
        aiLoading.classList.add('hidden');
    }
}

async function fetchGeminiBreakdown(taskDescription) {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;

    const prompt = `
    I have a large task: "${taskDescription}".
    Please break this down into 3-7 manageable subtasks.
    Return ONLY a valid JSON array of strings, where each string is a subtask.
    Do not include markdown blocks, just the JSON array.
    Example: ["Subtask 1", "Subtask 2", "Subtask 3"]
    `;

    const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.2, responseMimeType: 'application/json' },
        }),
    });

    if (!response.ok) throw new Error('API Request Failed');

    const data = await response.json();
    try {
        const textResponse = data.candidates[0].content.parts[0].text;
        return JSON.parse(textResponse);
    } catch (e) {
        console.error('Failed to parse AI response:', e);
        throw new Error('Invalid format returned by AI');
    }
}

function renderAISubtasks() {
    aiSubtasksList.innerHTML = '';

    if (generatedSubtasks.length > 0) {
        addAllAiBtn.classList.remove('hidden');

        generatedSubtasks.forEach((subtask, index) => {
            const li = document.createElement('li');
            li.className = 'ai-subtask-item';
            li.innerHTML = `
                <span>${index + 1}. ${escapeHTML(subtask)}</span>
                <button class="ai-subtask-add" onclick="addAISubtask(${index})" title="Add to Tasks">
                    <i class="fas fa-plus"></i> Add
                </button>
            `;
            aiSubtasksList.appendChild(li);
        });
    } else {
        addAllAiBtn.classList.add('hidden');
    }
}

async function addAISubtask(index) {
    const subtask = generatedSubtasks[index];
    if (!subtask) return;

    const newTask = {
        id: Date.now().toString() + index,
        title: subtask,
        category: 'Other',
        priority: 'Medium',
        dueDate: '',
        completed: false,
        createdAt: new Date().toISOString(),
    };

    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    updateStats();

    generatedSubtasks.splice(index, 1);
    renderAISubtasks();
    showToast('Subtask added', 'success');

    // Sync to Supabase
    if (window.SupabaseDB && window.SupabaseDB.isConnected) {
        try {
            await window.SupabaseDB.addTask(newTask, 0);
        } catch (err) {
            console.error('[App] Failed to sync AI subtask:', err);
        }
    }
}

async function handleAddAllSubtasks() {
    const newTasks = generatedSubtasks.map((subtask, index) => ({
        id: Date.now().toString() + index,
        title: subtask,
        category: 'Other',
        priority: 'Medium',
        dueDate: '',
        completed: false,
        createdAt: new Date().toISOString(),
    }));

    tasks = [...newTasks.reverse(), ...tasks];
    saveTasks();
    renderTasks();
    updateStats();

    generatedSubtasks = [];
    renderAISubtasks();
    aiResults.classList.add('hidden');
    aiTaskInput.value = '';
    showToast(`Added ${newTasks.length} tasks`, 'success');

    // Sync batch to Supabase
    if (window.SupabaseDB && window.SupabaseDB.isConnected) {
        try {
            await window.SupabaseDB.batchAddTasks(newTasks);
        } catch (err) {
            console.error('[App] Failed to sync AI subtasks batch:', err);
        }
    }
}

// ─── UI Helpers ───────────────────────────────────────────────────────────────
function showToast(message, type = 'info') {
    toastMessage.textContent = message;

    if (type === 'success') {
        toastIcon.className = 'fas fa-check-circle';
        toastIcon.style.color = 'var(--success-color)';
    } else if (type === 'error') {
        toastIcon.className = 'fas fa-exclamation-circle';
        toastIcon.style.color = 'var(--danger-color)';
    } else {
        toastIcon.className = 'fas fa-info-circle';
        toastIcon.style.color = 'var(--primary-color)';
    }

    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3000);
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g,
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

// ─── Boot ─────────────────────────────────────────────────────────────────────
init();

// Expose functions for inline event handlers and tests
if (typeof window !== 'undefined') {
    window.toggleTask = toggleTask;
    window.deleteTask = deleteTask;
    window.addAISubtask = addAISubtask;
}
if (typeof document !== 'undefined' && document.defaultView) {
    document.defaultView.toggleTask = toggleTask;
    document.defaultView.deleteTask = deleteTask;
    document.defaultView.addAISubtask = addAISubtask;
}
