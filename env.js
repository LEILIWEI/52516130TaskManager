/**
 * env.js — 运行时环境配置
 *
 * ⚠️  此文件包含敏感配置，已加入 .gitignore，请勿提交到版本控制。
 *
 * 使用说明：
 *   1. 在 .env.local 中填写 SUPABASE_URL 和 SUPABASE_ANON_KEY
 *   2. 将对应的值复制到下方 window.__ENV__ 对象中
 *   3. 保存后刷新页面，应用将自动连接到数据库
 */
window.__ENV__ = {
    SUPABASE_URL: 'https://dhvhpltqjkhksgsjigdq.supabase.co',       // 填入你的 Supabase Project URL，例如: https://xxxx.supabase.co
    SUPABASE_ANON_KEY: 'sb_publishable_EfgyDq9EzRAuUAx-6Sn8HQ_3A9YXHjY',  // 填入你的 Supabase Anon (public) Key
};
