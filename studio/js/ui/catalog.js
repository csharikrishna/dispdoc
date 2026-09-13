/**
 * PanelProbe — Test catalog: category tabs and test cards, generated
 * from the registry so labels and hotkeys can never drift from behavior.
 */
(function (DD) {
    'use strict';

    const ACCENT_BY_CATEGORY = Object.fromEntries(DD.CATEGORIES.map((c) => [c.id, c.accent]));

    function escapeHtml(str) {
        return String(str).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
    }

    function keyLabel(key) {
        return key.toUpperCase();
    }

    function cardHtml(test) {
        const accent = ACCENT_BY_CATEGORY[test.category] || 'cyan';
        return `
            <button type="button" class="test-card" data-test="${test.id}" aria-keyshortcuts="${keyLabel(test.key)}">
                <span class="card-header">
                    <span class="card-icon-wrap icon-${accent}">${DD.icon(test.icon, 18)}</span>
                    <kbd class="card-key" title="Keyboard shortcut">${keyLabel(test.key)}</kbd>
                </span>
                <span class="card-title">${escapeHtml(test.title)}</span>
                <span class="card-desc">${escapeHtml(test.desc)}</span>
                <span class="card-footer">
                    <span class="card-meta">${escapeHtml(test.meta)}</span>
                    <span class="card-arrow">${DD.icon('arrowRight', 14)}</span>
                </span>
            </button>`;
    }

    function blockHtml(category, tests) {
        const suiteCount = tests.filter((t) => t.suite).length;
        const meta = `${tests.length} ${tests.length === 1 ? 'test' : 'tests'}${suiteCount !== tests.length ? ` • ${suiteCount} in Test All` : ''}`;
        return `
            <section class="category-block" data-category="${category.id}" aria-labelledby="cat-${category.id}">
                <div class="block-header">
                    <div class="block-title-group">
                        <span class="block-kicker">${escapeHtml(category.kicker)}</span>
                        <h2 id="cat-${category.id}">${escapeHtml(category.heading)}</h2>
                    </div>
                    <span class="block-meta">${meta}</span>
                </div>
                <div class="cards-grid">${tests.map(cardHtml).join('')}</div>
            </section>`;
    }

    function renderTabs(nav) {
        const tabs = [{ id: 'all', label: 'All Tests' }, ...DD.CATEGORIES];
        nav.innerHTML = tabs.map((t, i) => `
            <button type="button" class="nav-tab${i === 0 ? ' active' : ''}" data-filter="${t.id}" aria-pressed="${i === 0}">${escapeHtml(t.label)}</button>`).join('');

        nav.addEventListener('click', (e) => {
            const tab = e.target.closest('.nav-tab');
            if (!tab) return;
            nav.querySelectorAll('.nav-tab').forEach((t) => {
                const active = t === tab;
                t.classList.toggle('active', active);
                t.setAttribute('aria-pressed', String(active));
            });
            const filter = tab.getAttribute('data-filter');
            document.querySelectorAll('.category-block').forEach((block) => {
                block.hidden = filter !== 'all' && block.getAttribute('data-category') !== filter;
            });
            DD.Audio.click();
        });
    }

    DD.Catalog = {
        /**
         * @param {(testId: string) => void} onLaunch  called synchronously inside
         *        the click handler so fullscreen can be requested.
         */
        init(onLaunch) {
            const container = document.getElementById('catalog');
            const nav = document.getElementById('categoryNav');
            if (!container || !nav) return;

            container.innerHTML = DD.CATEGORIES
                .map((cat) => blockHtml(cat, DD.TESTS.filter((t) => t.category === cat.id)))
                .join('');
            renderTabs(nav);

            container.addEventListener('click', (e) => {
                const card = e.target.closest('.test-card');
                if (card) onLaunch(card.getAttribute('data-test'));
            });

            const suiteCount = DD.suiteTests().length;
            document.querySelectorAll('[data-suite-count]').forEach((el) => {
                el.textContent = String(suiteCount);
            });
        }
    };
})(window.DD);
