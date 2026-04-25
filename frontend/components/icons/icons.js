(() => {
    const escapeHtml = window.AppUtils?.escapeHtml || ((value) => String(value)
        .replaceAll('&', '&amp;')
        .replaceAll('<', '&lt;')
        .replaceAll('>', '&gt;')
        .replaceAll('"', '&quot;')
        .replaceAll("'", '&#39;'));

    const ICONS = {
        bookmark: `
            <svg viewBox="0 0 19 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                <path class="icon-bookmark__fill" d="M17.9167 22.75L9.45833 16.7083L1 22.75V3.41667C1 2.77573 1.25461 2.16104 1.70783 1.70783C2.16104 1.25461 2.77573 1 3.41667 1H15.5C16.1409 1 16.7556 1.25461 17.2088 1.70783C17.6621 2.16104 17.9167 2.77573 17.9167 3.41667V22.75Z" fill="currentColor" />
                <path class="icon-bookmark__stroke" d="M17.9167 22.75L9.45833 16.7083L1 22.75V3.41667C1 2.77573 1.25461 2.16104 1.70783 1.70783C2.16104 1.25461 2.77573 1 3.41667 1H15.5C16.1409 1 16.7556 1.25461 17.2088 1.70783C17.6621 2.16104 17.9167 2.77573 17.9167 3.41667V22.75Z" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
        `,
        time: `
            <svg viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M14.375 7.4375C14.375 11.2692 11.2693 14.375 7.4375 14.375C3.60575 14.375 0.5 11.2692 0.5 7.4375C0.5 3.60575 3.60575 0.5 7.4375 0.5C11.2693 0.5 14.375 3.60575 14.375 7.4375Z" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" />
                <path d="M10.0112 9.64451L7.18372 7.95776V4.32251" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
        `,
        separator: `
            <svg viewBox="0 0 4 4" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                <circle cx="2" cy="2" r="2" fill="currentColor" />
            </svg>
        `,
        delete: `
            <svg viewBox="0 0 24 27" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                <path d="M1 5.83333H3.41667M3.41667 5.83333H22.75M3.41667 5.83333V22.75C3.41667 23.3909 3.67128 24.0056 4.12449 24.4588C4.5777 24.9121 5.19239 25.1667 5.83333 25.1667H17.9167C18.5576 25.1667 19.1723 24.9121 19.6255 24.4588C20.0787 24.0056 20.3333 23.3909 20.3333 22.75V5.83333M7.04167 5.83333V3.41667C7.04167 2.77573 7.29628 2.16104 7.74949 1.70783C8.20271 1.25461 8.81739 1 9.45833 1H14.2917C14.9326 1 15.5473 1.25461 16.0005 1.70783C16.4537 2.16104 16.7083 2.77573 16.7083 3.41667V5.83333M9.45833 11.875V19.125M14.2917 11.875V19.125" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `,
        plus: `
            <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                <path d="M9.75 1V18.5M1 9.75H18.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
        `,
        minus: `
            <svg viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                <path d="M1 9.75H18.5" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            </svg>
        `,
        open: `
            <svg viewBox="0 0 10 17" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                <path d="M1 15.5L8.25 8.25L1 1" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
        `,
        book: `
            <svg viewBox="0 0 27 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                <path d="M13.0833 5.83333C13.0833 4.55145 12.5741 3.32208 11.6677 2.41565C10.7613 1.50922 9.53188 1 8.25 1H1V19.125H9.45833C10.4197 19.125 11.3418 19.5069 12.0216 20.1867C12.7014 20.8666 13.0833 21.7886 13.0833 22.75M13.0833 5.83333V22.75M13.0833 5.83333C13.0833 4.55145 13.5926 3.32208 14.499 2.41565C15.4054 1.50922 16.6348 1 17.9167 1H25.1667V19.125H16.7083C15.7469 19.125 14.8249 19.5069 14.1451 20.1867C13.4653 20.8666 13.0833 21.7886 13.0833 22.75" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
        `,
        group: `
            <svg viewBox="0 0 29 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                <path d="M20.3333 22.75V20.3333C20.3333 19.0515 19.8241 17.8221 18.9177 16.9157C18.0113 16.0092 16.7819 15.5 15.5 15.5H5.83333C4.55145 15.5 3.32208 16.0092 2.41565 16.9157C1.50922 17.8221 1 19.0515 1 20.3333V22.75M27.5833 22.75V20.3333C27.5825 19.2624 27.2261 18.2221 26.57 17.3757C25.9139 16.5293 24.9952 15.9248 23.9583 15.6571M19.125 1.15708C20.1647 1.42328 21.0862 2.02793 21.7442 2.87571C22.4023 3.72349 22.7595 4.76617 22.7595 5.83938C22.7595 6.91258 22.4023 7.95526 21.7442 8.80304C21.0862 9.65082 20.1647 10.2555 19.125 10.5217M15.5 5.83333C15.5 8.50271 13.336 10.6667 10.6667 10.6667C7.99729 10.6667 5.83333 8.50271 5.83333 5.83333C5.83333 3.16396 7.99729 1 10.6667 1C13.336 1 15.5 3.16396 15.5 5.83333Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
        `,
        profile: `
            <svg viewBox="0 0 22 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                <path d="M20.3333 22.75V20.3333C20.3333 19.0515 19.8241 17.8221 18.9177 16.9157C18.0113 16.0092 16.7819 15.5 15.5 15.5H5.83333C4.55145 15.5 3.32208 16.0092 2.41565 16.9157C1.50922 17.8221 1 19.0515 1 20.3333V22.75M15.5 5.83333C15.5 8.50271 13.336 10.6667 10.6667 10.6667C7.99729 10.6667 5.83333 8.50271 5.83333 5.83333C5.83333 3.16396 7.99729 1 10.6667 1C13.336 1 15.5 3.16396 15.5 5.83333Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
        `,
        favorite: `
            <svg viewBox="0 0 19 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                <path d="M17.9167 22.75L9.45833 16.7083L1 22.75V3.41667C1 2.77573 1.25461 2.16104 1.70783 1.70783C2.16104 1.25461 2.77573 1 3.41667 1H15.5C16.1409 1 16.7556 1.25461 17.2088 1.70783C17.6621 2.16104 17.9167 2.77573 17.9167 3.41667V22.75Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
        `,
        timeCircle: `
            <svg viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                <path fill-rule="evenodd" clip-rule="evenodd" d="M25.6769 14.5003C25.6769 20.6737 20.6732 25.6774 14.4998 25.6774C8.32646 25.6774 3.32275 20.6737 3.32275 14.5003C3.32275 8.32695 8.32646 3.32324 14.4998 3.32324C20.6732 3.32324 25.6769 8.32695 25.6769 14.5003Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18.6462 18.0558L14.0908 15.3382V9.48145" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `,
        pointer: `
            <svg viewBox="0 0 28 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                <path d="M2 2L14 14L26 2" stroke="currentColor" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" />
            </svg>
        `,
        favoritesSmall: `
            <svg viewBox="0 0 29 29" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                <path d="M22.9582 25.375L14.4998 19.3333L6.0415 25.375V6.04167C6.0415 5.40073 6.29612 4.78604 6.74933 4.33283C7.20254 3.87961 7.81723 3.625 8.45817 3.625H20.5415C21.1824 3.625 21.7971 3.87961 22.2503 4.33283C22.7036 4.78604 22.9582 5.40073 22.9582 6.04167V25.375Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `,
        dots: `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                <circle cx="12" cy="5" r="1.5" fill="currentColor" />
                <circle cx="12" cy="12" r="1.5" fill="currentColor" />
                <circle cx="12" cy="19" r="1.5" fill="currentColor" />
            </svg>
        `,
        logout: `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                <path d="M14 4H8C6.89543 4 6 4.89543 6 6V18C6 19.1046 6.89543 20 8 20H14" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M10 12H21" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18 8L22 12L18 16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `,
        edit: `
            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                <path d="M11 4H4C2.89543 4 2 4.89543 2 6V20C2 21.1046 2.89543 22 4 22H18C19.1046 22 20 21.1046 20 20V13" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="M18.5 2.5C19.3284 1.67157 20.6716 1.67157 21.5 2.5C22.3284 3.32843 22.3284 4.67157 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
        `
    };

    function normalizeIconName(name) {
        if (typeof name !== 'string') {
            return '';
        }

        return name.trim();
    }

    function list() {
        return Object.keys(ICONS);
    }

    function render(name, className = '') {
        const normalizedName = normalizeIconName(name);
        const icon = ICONS[normalizedName];
        if (!icon) {
            console.warn(`Icon "${name}" not found`);
            return '';
        }

        if (!className) {
            return icon.trim();
        }

        return icon.replace('<svg ', `<svg class="${escapeHtml(className)}" `).trim();
    }

    window.AppIcons = {
        render,
        list,
        escapeHtml
    };
})();
