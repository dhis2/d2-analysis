import isNumeric from 'd2-utilizr/lib/isNumeric';

export default function(type) {
    switch (type) {
        case 'STRING':
        case 'TEXT':
            return item => '' + item;
        case 'INTEGER':
        case 'NUMBER':
            return item => isNumeric(item) ? parseFloat(item) : item;
        default:
            return item => item;
    }
}
