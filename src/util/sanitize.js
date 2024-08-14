import sanitizeHTML from 'sanitize-html'

export default function(value) {
    return value ? sanitizeHTML(value) : ''
}

/* Escape characters in the URL.
 *
 * Given the current implementation of the requests, where strings are aded unescaped to the URL,
 * there is no good way to handle this. Special chars like '&' or '%' are being simply added, which
 * will generate a wrong URL. Neither can we simply encodeURIComponent it as %CODE, as % will be
 * escaped again by request.run (which calls encodeURI).
 *
 * Workaround:
 *   - Escape literal '%' -> '!!!'
 *   - encodeURIComponent (so we get '%NN' escapes)
 *   - Custom escape '%NN' to '@@@NN'
 *   - Unescape '!!!' to recover '%' literals
 * */

const percentLiteralEscaped = '!!!';
const percentEscaped = '@@@';

export function escape(s) {
    return encodeURIComponent(s.replace(/%/g, percentLiteralEscaped))
             .replace(/%/g, percentEscaped)
             .replace(new RegExp(percentLiteralEscaped, "g"), percentEscaped + '26');
}

export function unescape(s) {
    return s.replace(new RegExp(percentEscaped, "g"), '%');
}
