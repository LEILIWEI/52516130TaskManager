-- =============================================================
-- AI Task Manager — Supabase 数据库配置
-- =============================================================
-- 操作步骤：
-- 1. 登录 https://supabase.com 并进入你的项目
-- 2. 在左侧菜单点击 "SQL Editor"
-- 3. 粘贴此文件内容并点击 "Run" 执行
-- 4. 前往 Authentication > Providers，确保 "Anonymous Sign-ins" 已启用
-- 5. 在 Project Settings > API 中复制 Project URL 和 anon/public key
-- 6. 打开 AI Task Manager 的 Settings，填入上述凭据并点击 "Connect to Cloud"
-- =============================================================

-- 创建任务表
CREATE TABLE IF NOT EXISTS public.tasks (
    id          TEXT PRIMARY KEY,
    user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title       TEXT NOT NULL,
    category    TEXT NOT NULL DEFAULT 'Other',
    due_date    TEXT,
    priority    TEXT NOT NULL DEFAULT 'Medium',
    completed   BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 为任务表启用行级安全策略 (Row Level Security)
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- 策略：用户只能读取/修改自己的任务（支持匿名用户）
CREATE POLICY "Users can manage their own tasks"
    ON public.tasks
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- 常用查询索引，提升加载性能
CREATE INDEX IF NOT EXISTS tasks_user_id_idx ON public.tasks (user_id);
CREATE INDEX IF NOT EXISTS tasks_sort_order_idx ON public.tasks (user_id, sort_order);
