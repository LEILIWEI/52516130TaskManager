/**
 * supabase-db.js
 * Supabase 数据库模块 — AI Task Manager
 *
 * 依赖：在此脚本之前加载 Supabase CDN (UMD build)，它会挂载全局 `supabase` 对象。
 * 本模块在 window.SupabaseDB 上暴露所有数据库操作方法。
 */
(function () {
    'use strict';

    let client = null;
    let _isConnected = false;
    let currentUserId = null;

    /**
     * 初始化 Supabase 客户端并进行匿名登录。
     * @param {string} url - Supabase 项目 URL
     * @param {string} anonKey - Supabase 匿名公钥
     * @returns {Promise<boolean>} 是否连接成功
     */
    async function init(url, anonKey) {
        if (!url || !anonKey) return false;

        if (typeof supabase === 'undefined') {
            console.error('[SupabaseDB] Supabase CDN 未加载，请检查网络连接。');
            return false;
        }

        try {
            const { createClient } = supabase;
            client = createClient(url, anonKey, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                },
            });

            // 尝试恢复已有 session（避免重复匿名登录）
            const { data: { session } } = await client.auth.getSession();

            if (session) {
                currentUserId = session.user.id;
            } else {
                // 首次使用：匿名登录，自动分配唯一 user_id
                const { data, error } = await client.auth.signInAnonymously();
                if (error) throw error;
                currentUserId = data.user?.id;
            }

            _isConnected = true;
            console.log('[SupabaseDB] 已连接，user_id:', currentUserId);
            return true;
        } catch (err) {
            console.error('[SupabaseDB] 初始化失败:', err);
            _isConnected = false;
            client = null;
            return false;
        }
    }

    /**
     * 加载当前用户的所有任务，按 sort_order ASC, created_at DESC 排序。
     * @returns {Promise<Array|null>}
     */
    async function loadTasks() {
        if (!client || !_isConnected) return null;

        const { data, error } = await client
            .from('tasks')
            .select('*')
            .order('sort_order', { ascending: true })
            .order('created_at', { ascending: false });

        if (error) throw error;

        // 将数据库格式转换为应用格式
        return data.map((row) => ({
            id: row.id,
            title: row.title,
            category: row.category,
            dueDate: row.due_date || '',
            priority: row.priority,
            completed: row.completed,
            createdAt: row.created_at,
            sortOrder: row.sort_order,
        }));
    }

    /**
     * 插入一条新任务。
     * @param {Object} task - 应用格式的任务对象
     * @param {number} sortOrder - 列表中的位置（越小越靠前）
     */
    async function addTask(task, sortOrder = 0) {
        if (!client || !_isConnected) throw new Error('未连接到 Supabase');

        const { error } = await client.from('tasks').insert({
            id: task.id,
            user_id: currentUserId,
            title: task.title,
            category: task.category,
            due_date: task.dueDate || null,
            priority: task.priority,
            completed: task.completed,
            sort_order: sortOrder,
            created_at: task.createdAt,
        });

        if (error) throw error;
    }

    /**
     * 更新任务的指定字段。
     * @param {string} id - 任务 ID
     * @param {Object} changes - 要更新的字段（应用格式）
     */
    async function updateTask(id, changes) {
        if (!client || !_isConnected) throw new Error('未连接到 Supabase');

        const dbChanges = {};
        if ('completed' in changes) dbChanges.completed = changes.completed;
        if ('title' in changes) dbChanges.title = changes.title;
        if ('category' in changes) dbChanges.category = changes.category;
        if ('priority' in changes) dbChanges.priority = changes.priority;
        if ('dueDate' in changes) dbChanges.due_date = changes.dueDate || null;
        if ('sortOrder' in changes) dbChanges.sort_order = changes.sortOrder;

        const { error } = await client
            .from('tasks')
            .update(dbChanges)
            .eq('id', id);

        if (error) throw error;
    }

    /**
     * 删除指定 ID 的任务。
     * @param {string} id - 任务 ID
     */
    async function deleteTask(id) {
        if (!client || !_isConnected) throw new Error('未连接到 Supabase');

        const { error } = await client
            .from('tasks')
            .delete()
            .eq('id', id);

        if (error) throw error;
    }

    /**
     * 批量插入多条任务（用于 AI 生成的子任务）。
     * @param {Array} taskList - 应用格式的任务数组
     */
    async function batchAddTasks(taskList) {
        if (!client || !_isConnected) throw new Error('未连接到 Supabase');

        const rows = taskList.map((task, i) => ({
            id: task.id,
            user_id: currentUserId,
            title: task.title,
            category: task.category,
            due_date: task.dueDate || null,
            priority: task.priority,
            completed: task.completed,
            sort_order: i,
            created_at: task.createdAt,
        }));

        const { error } = await client.from('tasks').insert(rows);
        if (error) throw error;
    }

    /**
     * 更新多个任务的排列顺序（拖拽后调用）。
     * @param {string[]} orderedIds - 按新顺序排列的任务 ID 数组
     */
    async function updateTaskOrders(orderedIds) {
        if (!client || !_isConnected) throw new Error('未连接到 Supabase');

        const updates = orderedIds.map((id, index) =>
            client.from('tasks').update({ sort_order: index }).eq('id', id)
        );

        const results = await Promise.all(updates);
        const failed = results.find((r) => r.error);
        if (failed) throw failed.error;
    }

    /**
     * 将 localStorage 中的历史任务迁移到 Supabase（仅在云端无数据时执行）。
     * @param {Array} localTasks - 来自 localStorage 的任务数组
     * @returns {Promise<number>} 成功迁移的任务数量
     */
    async function migrateFromLocalStorage(localTasks) {
        if (!client || !_isConnected || !localTasks || localTasks.length === 0) return 0;

        // 检查云端是否已存在数据
        const { data: existing, error: checkError } = await client
            .from('tasks')
            .select('id')
            .limit(1);

        if (checkError) throw checkError;
        if (existing && existing.length > 0) return 0; // 云端已有数据，跳过迁移

        const rows = localTasks.map((task, i) => ({
            id: task.id,
            user_id: currentUserId,
            title: task.title,
            category: task.category,
            due_date: task.dueDate || null,
            priority: task.priority,
            completed: task.completed || false,
            sort_order: i,
            created_at: task.createdAt || new Date().toISOString(),
        }));

        const { error } = await client.from('tasks').insert(rows);
        if (error) throw error;

        return rows.length;
    }

    // 将模块挂载到全局 window 对象
    window.SupabaseDB = {
        init,
        loadTasks,
        addTask,
        updateTask,
        deleteTask,
        batchAddTasks,
        updateTaskOrders,
        migrateFromLocalStorage,
        get isConnected() {
            return _isConnected;
        },
    };
})();
