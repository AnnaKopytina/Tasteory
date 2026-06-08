export function el(tag, attrs = {}, ...children) {
    const element = document.createElement(tag);

    if (attrs) {
        for (const [key, value] of Object.entries(attrs)) {
            if (value === null || value === undefined) {
                continue;
            }

            switch (key) {
                case 'class':
                case 'className':
                    element.className = value;
                    break;
                case 'dataset':
                    for (const [dKey, dVal] of Object.entries(value)) {
                        if (dVal !== null && dVal !== undefined) {
                            element.dataset[dKey] = dVal;
                        }
                    }
                    break;
                case 'style':
                    if (typeof value === 'object') {
                        Object.assign(element.style, value);
                    } else {
                        element.setAttribute('style', value);
                    }
                    break;
                case 'textContent':
                case 'value':
                case 'innerHTML':
                    element[key] = value;
                    break;
                default:
                    if (key.startsWith('on') && typeof value === 'function') {
                        const eventName = key.startsWith('on-')
                            ? key.slice(3)
                            : key.slice(2).toLowerCase();
                        element.addEventListener(eventName, value);
                    } else if (typeof value === 'boolean') {
                        if (key in element) element[key] = value;

                        if (value) element.setAttribute(key, '');
                        else element.removeAttribute(key);
                    } else {
                        element.setAttribute(key, value);
                    }
                    break;
            }
        }
    }

    children.flat(Infinity).forEach(child => {
        if (child === null || child === undefined || typeof child === 'boolean') {
            return;
        }

        if (child instanceof Node) {
            element.appendChild(child);
        } else {
            element.append(child);
        }
    });

    return element;
}