// js/blog-loader.js — Retro Magazine Edition

function initBlog() {
    fetch('config.json')
        .then(function(res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json();
        })
        .then(function(data) {
            console.log('文章配置加载成功: 共 ' + (data.top.length + data.list.length) + ' 篇文章');

            var gridContainer = document.getElementById('blogGrid');
            var listContainer = document.getElementById('blogList');

            if (gridContainer) renderFeatured(data.top, gridContainer);
            if (listContainer) renderArticleList(data.list, listContainer);
        })
        .catch(function(error) {
            console.error('博客数据加载失败:', error);
            var msg = '<div style="padding:2rem;text-align:center;font-style:italic;">数据加载失败: ' + error.message + '</div>';
            var gridContainer = document.getElementById('blogGrid');
            var listContainer = document.getElementById('blogList');
            if (gridContainer) gridContainer.innerHTML = msg;
            if (listContainer) listContainer.innerHTML = msg;
        });
}

function renderFeatured(posts, container) {
    container.innerHTML = '';
    posts.forEach(function(post) {
        var card = document.createElement('div');
        card.className = 'featured-card';
        card.innerHTML =
            '<div class="featured-card-category">' + (post.category || '') + '</div>' +
            '<div class="featured-card-title">' + post.title + '</div>' +
            '<div class="featured-card-excerpt">' + post.excerpt + '</div>';

        card.addEventListener('click', function() {
            openArticle(post);
        });

        container.appendChild(card);
    });
}

function renderArticleList(posts, container) {
    container.innerHTML = '';
    posts.forEach(function(post, index) {
        var item = document.createElement('div');
        item.className = 'article-item';
        item.innerHTML =
            '<div class="article-item-num">' + padNum(index + 1) + '</div>' +
            '<div class="article-item-main">' +
                '<div class="article-item-title">' + post.title + '</div>' +
                '<div class="article-item-excerpt">' + post.excerpt + '</div>' +
            '</div>' +
            '<div class="article-item-date">' + post.date + '</div>';

        item.addEventListener('click', function() {
            openArticle(post);
        });

        container.appendChild(item);
    });
}

function padNum(n) {
    return n < 10 ? '0' + n : '' + n;
}

function openArticle(post) {
    var modal = document.getElementById('articleModal');
    var overlay = document.getElementById('articleOverlay');
    var titleEl = document.getElementById('modalTitle');
    var contentEl = document.getElementById('modalContent');

    if (!modal) return;

    var scrollY = window.scrollY;
    document.body.style.position = 'fixed';
    document.body.style.top = '-' + scrollY + 'px';
    document.body.style.left = '0';
    document.body.style.width = '100%';
    document.body.classList.add('no-scroll');
    document.documentElement.classList.add('no-scroll');

    titleEl.textContent = post.title;
    contentEl.innerHTML = '<p style="font-style:italic;opacity:0.5;">Loading&hellip;</p>';

    if (overlay) overlay.style.display = 'block';

    requestAnimationFrame(function() {
        modal.classList.add('active');
        if (overlay) overlay.classList.add('active');
    });

    modal.addEventListener('wheel', stopPropagation, { passive: false });
    modal.addEventListener('touchmove', stopPropagation, { passive: false });

    if (post.content) {
        var html = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(post.content) : post.content;
        contentEl.innerHTML = html;
        contentEl.scrollTop = 0;
        return;
    }

    if (!post.file) {
        contentEl.innerHTML = '<div style="padding:2rem;text-align:center;font-style:italic;">无内容数据</div>';
        return;
    }

    fetch(post.file)
        .then(function(res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.text();
        })
        .then(function(mdText) {
            if (typeof marked === 'undefined') throw new Error("Marked 库缺失");
            var htmlContent = marked.parse(mdText);
            var cleanHtml = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(htmlContent) : htmlContent;
            contentEl.innerHTML = cleanHtml;
            contentEl.scrollTop = 0;
        })
        .catch(function(err) {
            console.error(err);
            contentEl.innerHTML = '<div style="padding:2rem;text-align:center;font-style:italic;"><h3>Unable to load</h3><p>' + err.message + '</p></div>';
        });
}

function stopPropagation(e) {
    e.stopPropagation();
}

window.closeArticle = function() {
    var modal = document.getElementById('articleModal');
    var overlay = document.getElementById('articleOverlay');

    if (!modal) return;

    modal.classList.remove('active');
    if (overlay) overlay.classList.remove('active');

    modal.removeEventListener('wheel', stopPropagation);
    modal.removeEventListener('touchmove', stopPropagation);

    document.body.classList.remove('no-scroll');
    document.documentElement.classList.remove('no-scroll');

    var scrollY = document.body.style.top;
    document.body.style.position = '';
    document.body.style.top = '';
    document.body.style.left = '';
    document.body.style.width = '';

    if (scrollY) {
        window.scrollTo(0, parseInt(scrollY) * -1);
    }

    setTimeout(function() {
        if (!modal.classList.contains('active')) {
            if (overlay) overlay.style.display = 'none';
        }
    }, 400);
};

// Back to top button
window.addEventListener('scroll', function() {
    var btn = document.getElementById('backToTop');
    if (!btn) return;
    if (window.scrollY > 600) {
        btn.classList.add('visible');
    } else {
        btn.classList.remove('visible');
    }
});

// Overlay click to close
document.addEventListener('DOMContentLoaded', function() {
    var overlay = document.getElementById('articleOverlay');
    if (overlay) {
        overlay.addEventListener('click', function() {
            if (window.closeArticle) {
                window.closeArticle();
            }
        });
    }
});

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initBlog);
} else {
    initBlog();
}