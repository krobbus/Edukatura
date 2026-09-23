export function capitalizeWords(value) {
    if (typeof value !== 'string') return value;

    return value
        .trim()
        .toLowerCase()
        .replace(/(^|[\s'-])(\p{L})/gu, (_, separator, letter) => `${separator}${letter.toUpperCase()}`);
}

export function capitalizeFirstLetter(value) {
    if (typeof value !== 'string') return value;

    return value.replace(/^(\s*)(\p{L})/u, (_, whitespace, letter) => `${whitespace}${letter.toUpperCase()}`);
}