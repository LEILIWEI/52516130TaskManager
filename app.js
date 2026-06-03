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

// State
let tasks = JSON.parse(localStorage.getItem('tasks')) || [];
let apiKey = localStorage.getItem('gemini_api_key') || '';
let isDarkMode = localStorage.getItem('theme') !== 'light';
let generatedSubtasks = [];

// Drag and drop state
let draggedTaskId = null;
let draggedElement = null;

// Initialize
function init() {
    apiKeyInput.value = apiKey;
    if (!isDarkMode) {
        document.body.classList.add('light-theme');
        themeToggleBtn.innerHTML = '<i class="fas fa-sun"></i>';
    }
    renderTasks();
    updateStats();
    setupEventListeners();
}

// Event Listeners
function setupEventListeners() {
    taskForm.addEventListener('submit', handleAddTask);
    filterSelect.addEventListener('change', renderTasks);
    
    // Settings
    settingsBtn.addEventListener('click', () => settingsModal.classList.remove('hidden'));
    closeSettingsBtn.addEventListener('click', () => settingsModal.classList.add('hidden'));
    saveSettingsBtn.addEventListener('click', saveSettings);
    
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

// Theme Management
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

// Task Management
function handleAddTask(e) {
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
        createdAt: new Date().toISOString()
    };
    
    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    updateStats();
    
    taskInput.value = '';
    dueDateInput.value = '';
    prioritySelect.value = 'Medium';
    showToast('Task added successfully', 'success');
}

function toggleTask(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.completed = !task.completed;
        saveTasks();
        renderTasks();
        updateStats();
    }
}

function deleteTask(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
    updateStats();
    showToast('Task deleted', 'info');
}

// Storage
function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
}

function saveSettings() {
    apiKey = apiKeyInput.value.trim();
    localStorage.setItem('gemini_api_key', apiKey);
    settingsModal.classList.add('hidden');
    showToast('Settings saved', 'success');
}

// Rendering
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
                li.title = "Drag to reorder";
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
    
    // Update progress ring
    const percentage = total === 0 ? 0 : (completed / total) * 100;
    const offset = 100 - percentage;
    progressRingPath.style.strokeDasharray = `${percentage}, 100`;
}

// Drag and Drop Management
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

function handleDrop(e) {
    e.preventDefault();
    if (!draggedElement || filterSelect.value !== 'All') return;
    
    const newItems = Array.from(taskList.querySelectorAll('.task-item'));
    const newOrderIds = newItems.map(item => item.dataset.id);
    
    const taskMap = new Map(tasks.map(t => [t.id, t]));
    tasks = newOrderIds.map(id => taskMap.get(id));
    
    saveTasks();
    updateStats();
}

function handleDragEnd(e) {
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
    }
    draggedTaskId = null;
    draggedElement = null;
}

// AI Integration
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

    // UI Updates
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
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.2,
                responseMimeType: "application/json"
            }
        })
    });

    if (!response.ok) {
        throw new Error('API Request Failed');
    }

    const data = await response.json();
    try {
        const textResponse = data.candidates[0].content.parts[0].text;
        return JSON.parse(textResponse);
    } catch (e) {
        console.error("Failed to parse AI response:", e);
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

function addAISubtask(index) {
    const subtask = generatedSubtasks[index];
    if (!subtask) return;
    
    const newTask = {
        id: Date.now().toString() + index,
        title: subtask,
        category: 'Other', // Default category for AI generated
        priority: 'Medium',
        dueDate: '',
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
    updateStats();
    
    // Optional: remove from the generated list
    generatedSubtasks.splice(index, 1);
    renderAISubtasks();
    
    showToast('Subtask added', 'success');
}

function handleAddAllSubtasks() {
    const newTasks = generatedSubtasks.map((subtask, index) => ({
        id: Date.now().toString() + index,
        title: subtask,
        category: 'Other',
        priority: 'Medium',
        dueDate: '',
        completed: false,
        createdAt: new Date().toISOString()
    }));
    
    tasks = [...newTasks.reverse(), ...tasks]; // Add to top in order
    saveTasks();
    renderTasks();
    updateStats();
    
    generatedSubtasks = [];
    renderAISubtasks();
    aiResults.classList.add('hidden');
    aiTaskInput.value = '';
    
    showToast(`Added ${newTasks.length} tasks`, 'success');
}

// UI Helpers
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
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

// Run app
init();

// Expose functions to window object for testing and inline event handler support
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
