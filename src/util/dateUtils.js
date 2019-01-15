export const formatDate = (value, locale) => {
    const intlAvailable = typeof global.Intl !== 'undefined' && Intl.DateTimeFormat;

    if (!intlAvailable) {
        return value.split("T")[0];
    } else {
        return new Intl.DateTimeFormat(locale || 'en', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        }).format(new Date(value));
    }
};
