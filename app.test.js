import { beforeEach, describe, it, expect, vi } from 'vitest';
import fs from 'fs';
import path from 'path';

// Read index.html and app.js contents
const html = fs.readFileSync(path.resolve(__dirname, './index.html'), 'utf8');
const appScript = fs.readFileSync(path.resolve(__dirname, './app.js'), 'utf8');

describe('AI Task Manager Unit/Integration Tests', () => {
    let mockLocalStorage;

    beforeEach(() => {
        // Reset DOM
        document.documentElement.innerHTML = html.toString();

        // Mock localStorage
        let store = {};
        mockLocalStorage = {
            getItem: vi.fn((key) => store[key] || null),
            setItem: vi.fn((key, value) => {
                store[key] = value.toString();
            }),
            removeItem: vi.fn((key) => {
                delete store[key];
            }),
            clear: vi.fn(() => {
                store = {};
            })
        };
        vi.stubGlobal('localStorage', mockLocalStorage);

        // Execute app.js in a fresh, isolated execution context for this test
        (() => {
            eval(appScript);
        })();
    });

    it('should initialize with an empty state when localStorage is empty', () => {
        const taskList = document.getElementById('task-list');
        expect(taskList.children.length).toBe(0);

        const emptyState = document.getElementById('empty-state');
        expect(emptyState.classList.contains('hidden')).toBe(false);

        const totalCount = document.getElementById('total-count');
        const completedCount = document.getElementById('completed-count');
        expect(totalCount.textContent).toBe('0');
        expect(completedCount.textContent).toBe('0');
    });

    it('should add a new task successfully via the form', () => {
        const taskInput = document.getElementById('task-input');
        const categorySelect = document.getElementById('category-select');
        const taskForm = document.getElementById('task-form');

        taskInput.value = 'Learn testing with Vitest';
        categorySelect.value = 'Study';

        // Dispatch submit event
        taskForm.dispatchEvent(new Event('submit'));

        // Check task list UI
        const taskList = document.getElementById('task-list');
        expect(taskList.children.length).toBe(1);

        const taskItem = taskList.querySelector('.task-item');
        expect(taskItem.querySelector('.task-name').textContent).toBe('Learn testing with Vitest');
        expect(taskItem.querySelector('.task-category').textContent).toBe('Study');

        // Check empty state is hidden
        const emptyState = document.getElementById('empty-state');
        expect(emptyState.classList.contains('hidden')).toBe(true);

        // Check statistics updated
        const totalCount = document.getElementById('total-count');
        expect(totalCount.textContent).toBe('1');

        // Check localStorage calls
        expect(mockLocalStorage.setItem).toHaveBeenCalled();
        const storedTasks = JSON.parse(mockLocalStorage.setItem.mock.calls[0][1]);
        expect(storedTasks.length).toBe(1);
        expect(storedTasks[0].title).toBe('Learn testing with Vitest');
        expect(storedTasks[0].category).toBe('Study');
        expect(storedTasks[0].completed).toBe(false);
    });

    it('should toggle task completion status', () => {
        const taskInput = document.getElementById('task-input');
        const taskForm = document.getElementById('task-form');

        taskInput.value = 'Complete this task';
        taskForm.dispatchEvent(new Event('submit'));

        const taskList = document.getElementById('task-list');
        const taskItem = taskList.querySelector('.task-item');
        const taskId = taskItem.dataset.id;

        // Toggle task by calling global function directly
        window.toggleTask(taskId);

        // Check if task is marked completed in UI
        const updatedTaskItem = taskList.querySelector('.task-item');
        expect(updatedTaskItem.classList.contains('completed')).toBe(true);

        // Check stats updated
        const completedCount = document.getElementById('completed-count');
        expect(completedCount.textContent).toBe('1');

        // Check storage updated
        const storedTasks = JSON.parse(mockLocalStorage.setItem.mock.calls[1][1]);
        expect(storedTasks[0].completed).toBe(true);
    });

    it('should delete a task successfully', () => {
        const taskInput = document.getElementById('task-input');
        const taskForm = document.getElementById('task-form');

        taskInput.value = 'Task to delete';
        taskForm.dispatchEvent(new Event('submit'));

        // Check task is present
        const taskList = document.getElementById('task-list');
        expect(taskList.children.length).toBe(1);
        const taskItem = taskList.querySelector('.task-item');
        const taskId = taskItem.dataset.id;

        // Delete task by calling global function directly
        window.deleteTask(taskId);

        // Check task list UI is empty again
        expect(taskList.children.length).toBe(0);
        const emptyState = document.getElementById('empty-state');
        expect(emptyState.classList.contains('hidden')).toBe(false);

        // Check statistics updated
        const totalCount = document.getElementById('total-count');
        expect(totalCount.textContent).toBe('0');
    });

    it('should filter tasks by category', () => {
        const taskInput = document.getElementById('task-input');
        const categorySelect = document.getElementById('category-select');
        const taskForm = document.getElementById('task-form');

        // Add a 'Study' task
        taskInput.value = 'Study Network';
        categorySelect.value = 'Study';
        taskForm.dispatchEvent(new Event('submit'));

        // Add a 'Work' task
        taskInput.value = 'Write Report';
        categorySelect.value = 'Work';
        taskForm.dispatchEvent(new Event('submit'));

        const taskList = document.getElementById('task-list');
        expect(taskList.children.length).toBe(2);

        // Filter by 'Study'
        const filterSelect = document.getElementById('filter-select');
        filterSelect.value = 'Study';
        filterSelect.dispatchEvent(new Event('change'));

        expect(taskList.children.length).toBe(1);
        expect(taskList.querySelector('.task-name').textContent).toBe('Study Network');

        // Filter by 'Work'
        filterSelect.value = 'Work';
        filterSelect.dispatchEvent(new Event('change'));

        expect(taskList.children.length).toBe(1);
        expect(taskList.querySelector('.task-name').textContent).toBe('Write Report');

        // Filter by 'All'
        filterSelect.value = 'All';
        filterSelect.dispatchEvent(new Event('change'));
        expect(taskList.children.length).toBe(2);
    });

    it('should load existing tasks from localStorage on startup', () => {
        // Set tasks in localStorage mock store
        const mockTasks = [
            {
                id: '1',
                title: 'Existing Task 1',
                category: 'Personal',
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: '2',
                title: 'Existing Task 2',
                category: 'Work',
                completed: true,
                createdAt: new Date().toISOString()
            }
        ];

        // We stub global localStorage again with mock data
        let store = {
            'tasks': JSON.stringify(mockTasks)
        };
        const initMockLocalStorage = {
            getItem: vi.fn((key) => store[key] || null),
            setItem: vi.fn((key, value) => { store[key] = value.toString(); }),
            clear: vi.fn()
        };
        vi.stubGlobal('localStorage', initMockLocalStorage);

        // Run app.js again under the new localStorage state
        (() => {
            eval(appScript);
        })();

        const taskList = document.getElementById('task-list');
        expect(taskList.children.length).toBe(2);

        const totalCount = document.getElementById('total-count');
        const completedCount = document.getElementById('completed-count');
        expect(totalCount.textContent).toBe('2');
        expect(completedCount.textContent).toBe('1');
    });

    it('should show settings modal when API key is missing during AI breakdown', async () => {
        const aiTaskInput = document.getElementById('ai-task-input');
        const aiGenerateBtn = document.getElementById('ai-generate-btn');
        const settingsModal = document.getElementById('settings-modal');

        expect(settingsModal.classList.contains('hidden')).toBe(true);

        aiTaskInput.value = 'Complex Task';
        aiGenerateBtn.dispatchEvent(new Event('click'));

        // Since apiKey is empty, it should show settings modal and not invoke API
        expect(settingsModal.classList.contains('hidden')).toBe(false);
    });

    it('should call Gemini API and render subtasks correctly when API key is set', async () => {
        // Open settings, set API key, and save
        const settingsBtn = document.getElementById('settings-btn');
        const apiKeyInput = document.getElementById('api-key-input');
        const saveSettingsBtn = document.getElementById('save-settings-btn');

        settingsBtn.dispatchEvent(new Event('click'));
        apiKeyInput.value = 'mock-api-key';
        saveSettingsBtn.dispatchEvent(new Event('click'));

        const aiTaskInput = document.getElementById('ai-task-input');
        const aiGenerateBtn = document.getElementById('ai-generate-btn');

        aiTaskInput.value = 'Learn Docker';

        // Mock fetch API call
        const mockSubtasks = ['Install Docker Desktop', 'Run hello-world container', 'Create a Dockerfile'];
        const mockResponse = {
            ok: true,
            json: async () => ({
                candidates: [{
                    content: {
                        parts: [{
                            text: JSON.stringify(mockSubtasks)
                        }]
                    }
                }]
            })
        };
        const fetchSpy = vi.stubGlobal('fetch', vi.fn().mockResolvedValue(mockResponse));

        // Call the click handler
        aiGenerateBtn.dispatchEvent(new Event('click'));

        // Wait for asynchronous breakdown
        await vi.waitFor(() => {
            const aiResults = document.getElementById('ai-results');
            expect(aiResults.classList.contains('hidden')).toBe(false);
        });

        // Verify API was called
        expect(fetch).toHaveBeenCalled();
        const fetchUrl = fetch.mock.calls[0][0];
        expect(fetchUrl).toContain('gemini-2.5-flash');
        expect(fetchUrl).toContain('key=mock-api-key');

        // Check subtasks UI
        const subtasksList = document.getElementById('ai-subtasks-list');
        expect(subtasksList.children.length).toBe(3);
        expect(subtasksList.children[0].textContent).toContain('Install Docker Desktop');

        // Test adding one AI subtask to main list
        window.addAISubtask(0);

        // Verify it was added to main list
        const taskList = document.getElementById('task-list');
        expect(taskList.children.length).toBe(1);
        expect(taskList.querySelector('.task-name').textContent).toBe('Install Docker Desktop');
        expect(taskList.querySelector('.task-category').textContent).toBe('Other');

        // Test adding all remaining subtasks
        const addAllAiBtn = document.getElementById('add-all-ai-btn');
        addAllAiBtn.dispatchEvent(new Event('click'));

        // The remaining 2 tasks should be added, total 3 tasks now.
        expect(taskList.children.length).toBe(3);
    });
});
