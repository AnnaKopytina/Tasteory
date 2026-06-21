import {el} from "../../core/dom.js";


export function createLoadMoreBtn({currentPage, totalPages, onLoad}) {
    if (currentPage >= totalPages) {
        return null;
    }

    const btn = el('button', {class: 'load-more-btn'}, 'Показать ещё');

    btn.addEventListener('click', async (e) => {
        e.preventDefault();
        btn.disabled = true;
        const originalText = btn.textContent;
        btn.textContent = 'Загрузка...';

        try {
            await onLoad();
        } catch (err) {
            btn.disabled = false;
            btn.textContent = originalText;
            console.error('Ошибка при дозагрузке:', err);
        }
    });

    return el('div', {class: 'pagination-wrapper', id: 'load-more-wrapper'}, btn);
}