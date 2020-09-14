import sanitizeHTML from 'sanitize-html'

export default function(value) {
    return value ? sanitizeHTML(value) : ''
}
