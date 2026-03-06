// js/blog-loader.js

let postsData = {}; 

/**
 * 初始化博客数据
 * 下载 JSON 并触发事件
 */
export async function initBlog() {
    const gridContainer = document.getElementById('blogGrid');
    const listContainer = document.getElementById('blogList');
    
    try {
        console.log("正在请求 config.json...");
        const response = await fetch('config.json');
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        
        postsData = await response.json();
        console.log(`数据加载成功: ${postsData.top.length + postsData.list.length} 篇文章`);

        // 【关键步骤 1】挂载到 window，供非模块脚本或调试使用
        window.blogPostsData = postsData.top;

        // 【关键步骤 2】触发自定义事件，通知 3D 场景可以开始构建了
        window.dispatchEvent(new CustomEvent('blog-data-ready', { detail: postsData.top }));

        // 【关键步骤 3】渲染 HTML 列表 (如果存在)
        if (gridContainer) {
            renderBlogGrid(postsData.top, gridContainer);
        }
        if (listContainer) {
            renderBlogList(postsData.list, listContainer);
        }

    } catch (error) {
        console.error("博客数据加载失败:", error);
        if(gridContainer) {
            gridContainer.innerHTML = `<div style="color:#ff6b6b; text-align:center;">数据加载失败<br>${error.message}</div>`;
        }
        if(listContainer) {
            listContainer.innerHTML = `<div style="color:#ff6b6b; text-align:center;">数据加载失败<br>${error.message}</div>`;
        }
    }
}

// 渲染 HTML 列表函数
function renderBlogGrid(posts, container) {
    container.innerHTML = '';
    posts.forEach(post => {
        const article = document.createElement('article');
        article.className = 'blog-card';
        // 绑定数据
        article.dataset.file = post.file;
        article.dataset.title = post.title;
        
        article.innerHTML = `
            <div class="card-category">${post.category}</div>
                <h3 class="card-title">${post.title}</h3>
                <p class="card-excerpt">${post.excerpt}</p>
                <div class="card-meta">
                <span>${post.date}</span>
                </div>
            </div>
        `;
        
        // 绑定点击事件 -> 调用全局的 openArticle
        article.addEventListener('click', () => {
            if (window.openArticle) {
                window.openArticle(post);
            } else {
                alert("系统未就绪，请稍后");
            }
        });
        
        container.appendChild(article);
    });
}

// 渲染 HTML 列表函数
function renderBlogList(posts, container) {
    container.innerHTML = '';
    posts.forEach(post => {
        const article = document.createElement('article');
        article.className = 'blog-card';
        // 绑定数据
        article.dataset.file = post.file;
        article.dataset.title = post.title;
        
        article.innerHTML = `
            <h3 class="card-title">${post.title}</h3>
            <div class="card-meta">
            <p class="card-excerpt">${post.excerpt}</p>
        `;
        
        // 绑定点击事件 -> 调用全局的 openArticle
        article.addEventListener('click', () => {
            if (window.openArticle) {
                window.openArticle(post);
            } else {
                alert("系统未就绪，请稍后");
            }
        });
        
        container.appendChild(article);
    });
}

/**
 * 通用打开文章函数 (支持 Markdown 文件加载)
 * 挂载到 window 以便全局调用
 */
async function openArticle(post) {
    const modal = document.getElementById('article-modal');
    const overlay = document.getElementById('article-overlay');
    const titleEl = document.getElementById('modal-title');
    const contentEl = document.getElementById('modal-content');

    if (!modal) return;

    // --- 【核心修改 1】锁定背景滚动 ---
    // 记录当前的滚动位置，以便关闭时恢复 (防止页面跳动)
    const scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollY}px`;
    document.body.style.left = '0';
    document.body.style.width = '100%';
    document.body.classList.add('no-scroll');
    document.documentElement.classList.add('no-scroll'); // 锁定 html

    // 显示内容
    titleEl.textContent = post.title;
    contentEl.innerHTML = '<div class="loading-text">🌌 正在从星云下载数据...</div>';
    
    // 显示模态框和遮罩
    modal.style.display = 'flex';
    if (overlay) overlay.style.display = 'block';
    
    // 触发入场动画
    requestAnimationFrame(() => {
        modal.classList.add('active');
        if (overlay) overlay.classList.add('active');
    });

    // 暂停 3D 旋转
    if (window.controls3D) window.controls3D.autoRotate = false;

    // --- 【核心修改 2】阻止滚动穿透 (Scroll Jacking Prevention) ---
    // 当鼠标在模态框内滚动时，阻止事件冒泡
    modal.addEventListener('wheel', stopPropagation, { passive: false });
    modal.addEventListener('touchmove', stopPropagation, { passive: false });

    try {
        // ... (原有的 fetch 和渲染逻辑保持不变) ...
        let htmlContent = '';
        if (post.file) {
            const res = await fetch(post.file);
            if (!res.ok) throw new Error("文件不存在");
            const mdText = await res.text();
            if (typeof marked === 'undefined') throw new Error("Marked 库缺失");
            htmlContent = marked.parse(mdText);
        } else if (post.content) {
            htmlContent = post.content; 
        } else {
            throw new Error("无内容数据");
        }
        const cleanHtml = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(htmlContent) : htmlContent;
        contentEl.innerHTML = cleanHtml;
        contentEl.scrollTop = 0;
    } catch (err) {
        console.error(err);
        contentEl.innerHTML = `<div style="color:#ff6b6b;text-align:center"><h3>传输中断</h3><p>${err.message}</p></div>`;
    }
}

// 辅助函数：阻止事件冒泡
function stopPropagation(e) {
    e.stopPropagation();
    // 如果需要在模态框内允许滚动，不要 preventDefault()
    // 只有当你想完全禁止模态框滚动时才用 e.preventDefault()
    // 这里我们只阻止冒泡，让模态框自己处理滚动
}

// 关闭函数
window.closeArticle = function() {
    console.log("Closing article...");
    const modal = document.getElementById('article-modal');
    const overlay = document.getElementById('article-overlay');
    
    if (!modal) return;

    // 1. 仅仅移除 active 类
    // CSS 中的 transition 会自动处理 opacity 从 1 -> 0 的过程
    modal.classList.remove('active');
    if (overlay) overlay.classList.remove('active');

    // 2. 移除滚动拦截
    modal.removeEventListener('wheel', stopPropagation);
    modal.removeEventListener('touchmove', stopPropagation);

    // 3. 恢复 3D 旋转 (立即执行，无需等待动画)
    if (window.controls3D && !window.isBlogViewActive) {
        window.controls3D.autoRotate = true;
    }

    // 4. 恢复背景滚动 (立即执行，用户体验更好)
    // 注意：此时虽然视觉上还在淡出，但底层页面已经可以滚动了
    // 如果你希望动画完全结束后再允许滚动，可以把这段代码移到 setTimeout 里
    document.body.classList.remove('no-scroll');
    document.documentElement.classList.remove('no-scroll');
    
    const scrollY = document.body.style.top;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.width = '';
    
    if (scrollY) {
        window.scrollTo(0, parseInt(scrollY) * -1);
    }

    // 5. 【关键修改】不再手动设置 display: none
    // 依靠 CSS 的 visibility: hidden 在 opacity 为 0 时自动隐藏
    // 如果必须清理 display，请使用 setTimeout 等待动画结束，但通常不需要
    
    // 可选：如果你非常想清理 DOM 结构，可以在动画结束后执行
    setTimeout(() => {
        // 只有当类确实被移除（即没有再次打开）时才强制隐藏
        // 防止用户在动画期间快速开关导致状态错乱
        if (!modal.classList.contains('active')) {
             modal.style.display = 'none';
             if (overlay) overlay.style.display = 'none';
        }
    }, 400); // 必须与 CSS transition 时间一致
};

// 暴露给全局
window.openArticle = openArticle;

// 【重要】页面加载完成后自动启动数据下载
// 这样不管 script 标签顺序如何，只要 DOM Ready 就会开始下载
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBlog);
} else {
    initBlog();
}

document.addEventListener('DOMContentLoaded', () => {
    const overlay = document.getElementById('article-overlay');
    if (overlay) {
        overlay.addEventListener('click', () => {
            if (window.closeArticle) {
                window.closeArticle();
            }
        });
    }
});