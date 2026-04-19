(() => {
    function escapeHtml(value) {
        return String(value)
            .replaceAll('&', '&amp;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;');
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function filenameFromPath(path) {
        if (!path) {
            return '';
        }

        return String(path).split('/').pop() || '';
    }

    function getInitials(fullName) {
        const normalized = String(fullName || '').trim();
        if (!normalized) {
            return '?';
        }

        const parts = normalized.split(/\s+/).filter(Boolean);
        const firstLetter = Array.from(parts[0] || '')[0] || '';

        if (parts.length === 1) {
            return firstLetter.toUpperCase();
        }

        const lastLetter = Array.from(parts[parts.length - 1] || '')[0] || '';
        return `${firstLetter}${lastLetter}`.toUpperCase();
    }

    window.AppUtils = {
        escapeHtml,
        clamp,
        filenameFromPath,
        getInitials
    };
})();

