import numberToFixed from 'd2-utilizr/lib/numberToFixed';
import isNumber from 'd2-utilizr/lib/isNumber';
import isBoolean from 'd2-utilizr/lib/isBoolean';

/** @description returns the rounded value of the given float.
 *  @param   {number} value 
 *  @param   {number} [dec=2] 
 *  @returns {number}
 */
export const getRoundedHtmlValue = (value, dec=2) => {
    return parseFloat(roundIf(value, 2)).toString();
};

/** @description round number if needed.
 *  @param   {number} number 
 *  @param   {number} precision 
 *  @returns {number}
 */
export const roundIf = (number, precision) => {
    number = parseFloat(number);
    precision = parseFloat(precision);

    if (isNumber(number) && isNumber(precision)) {
        var numberOfDecimals = getNumberOfDecimals(number);
        return numberOfDecimals > precision ? numberToFixed(number, precision) : number;
    }

    return number;
};

/** @description
 *  @param {number} number 
 *  @returns {number}
 */
export const getNumberOfDecimals = (number) => {
    var str = new String(number);
    return (str.indexOf('.') > -1) ? (str.length - str.indexOf('.') - 1) : 0;
};

/** @description get percentage representation of value.
 *  @param   {number} value 
 *  @param   {number} total 
 *  @returns {string}
 */
export const getPercentageHtml = (value, total) => {
    return getRoundedHtmlValue((value / total) * 100) + '%';
}

/** @description gets integer representation of given string.
 *  @param   {string} str 
 *  @returns {number}
 */
export const getValue = function(str) {
    var n = parseFloat(str);

    if (isBoolean(str)) {
        return 1;
    }

    if (!isNumber(n) || n != str) {
        return 0;
    }

    return n;
};