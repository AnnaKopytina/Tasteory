const fs = require('fs');
const path = require('path');

const FRONTEND_ROOT = path.resolve(__dirname, '..');
const ICONS_FILE = path.join(FRONTEND_ROOT, 'components', 'icons', 'icons.js');

function readFile(filePath) {
    return fs.readFileSync(filePath, 'utf8');
}

function extractObjectBody(source, marker) {
    const markerIndex = source.indexOf(marker);
    if (markerIndex === -1) {
        return '';
    }

    const startBrace = source.indexOf('{', markerIndex);
    if (startBrace === -1) {
        return '';
    }

    let depth = 0;
    for (let i = startBrace; i < source.length; i += 1) {
        const char = source[i];
        if (char === '{') {
            depth += 1;
        }

        if (char === '}') {
            depth -= 1;
            if (depth === 0) {
                return source.slice(startBrace + 1, i);
            }
        }
    }

    return '';
}

function extractKeys(objectBody) {
    const keys = new Set();
    const keyPattern = /^\s*([A-Za-z_$][A-Za-z0-9_$]*)\s*:/gm;
    let match = keyPattern.exec(objectBody);
    while (match) {
        keys.add(match[1]);
        match = keyPattern.exec(objectBody);
    }
    return keys;
}

function walkFiles(root, collector = []) {
    const entries = fs.readdirSync(root, { withFileTypes: true });
    entries.forEach((entry) => {
        const absPath = path.join(root, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === 'bin' || entry.name === 'obj') {
                return;
            }
            walkFiles(absPath, collector);
            return;
        }

        if (/\.(js|html)$/i.test(entry.name)) {
            collector.push(absPath);
        }
    });
    return collector;
}

function collectIconUsages(filePath, source) {
    const usages = [];
    const patterns = [
        /data-icon\s*=\s*["']([^"']+)["']/g,
        /AppIcons(?:\?\.|\.)render\??\.?\(\s*["']([^"']+)["']/g,
        /renderIcon\(\s*["']([^"']+)["']/g
    ];

    patterns.forEach((pattern) => {
        let match = pattern.exec(source);
        while (match) {
            usages.push({
                iconName: match[1],
                filePath
            });
            match = pattern.exec(source);
        }
    });

    return usages;
}

function main() {
    const iconsSource = readFile(ICONS_FILE);
    const iconsBody = extractObjectBody(iconsSource, 'const ICONS =');

    const iconKeys = extractKeys(iconsBody);

    const allFiles = walkFiles(FRONTEND_ROOT);
    const usages = allFiles.flatMap((filePath) => collectIconUsages(filePath, readFile(filePath)));

    const missing = [];

    usages.forEach(({ iconName, filePath }) => {
        if (iconKeys.has(iconName)) {
            return;
        }

        missing.push(`${path.relative(FRONTEND_ROOT, filePath)} -> ${iconName}`);
    });


    if (missing.length) {
        console.error('[icons] missing icon names found:');
        missing.sort().forEach((row) => console.error(` - ${row}`));
        process.exit(1);
    }

    console.log(`[icons] OK: checked ${allFiles.length} files, ${usages.length} usages`);
}

main();

