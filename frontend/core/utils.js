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

    window.AppUtils = {
        escapeHtml,
        clamp,
        filenameFromPath
    };
})();

