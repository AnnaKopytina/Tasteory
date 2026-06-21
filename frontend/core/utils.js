import { el } from "./dom.js";

export function escapeHtml(value) {
    const map = {
        "&": "&" + "amp;",
        "<": "&" + "lt;",
        ">": "&" + "gt;",
        '"': "&" + "quot;",
        "'": "&#" + "39;"
    };
    return String(value).replace(/[&<>"']/g, (ch) => map[ch]);
}

export function clamp(value, min, max) {
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

export function renderRestrictedContent(root) {
    root.replaceChildren(el("div", { className: "restricted-container", style: {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "60vh",
        textAlign: "center",
        fontFamily: "'Montserrat', sans-serif"
    }},
        el("h2", { style: { color: "#0a2533", marginBottom: "20px" }},
            "Войдите или зарегистрируйтесь, ",
            el("br"),
            "чтобы пользоваться этой страницей"
        ),
        el("button", {
            id: "restricted-login-btn",
            style: {
                backgroundColor: "#f28c50",
                color: "white",
                border: "none",
                padding: "12px 30px",
                borderRadius: "15px",
                fontSize: "18px",
                fontWeight: "bold",
                cursor: "pointer",
                transition: "transform 0.2s"
            },
            textContent: "Войти",
            onClick: () => window.AppRouter.navigate("/auth")
        })
    ));
}

window.AppUtils = { escapeHtml, clamp, filenameFromPath, getInitials, renderRestrictedContent };