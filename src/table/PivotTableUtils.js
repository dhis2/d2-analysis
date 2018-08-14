import numberToFixed from 'd2-utilizr/lib/numberToFixed';
import isNumber from 'd2-utilizr/lib/isNumber';

/** @description returns the number of decumal of given float
 *  @param   {number} number 
 *  @returns {number}
 *  @deprecated should switch to use function located in d2-utilizr
 */
export const getNumberOfDecimals = (number) => {
    var str = new String(number);
    return (str.indexOf('.') > -1) ? (str.length - str.indexOf('.') - 1) : 0;
};

/** @description returns the rounded value of the given float.
 *  @param   {number} value 
 *  @param   {number} [dec=2] 
 *  @returns {number}
 */
export const getRoundedHtmlValue = (value, dec=2) => {
    return parseFloat(roundIf(value, 2)).toString();
};

/** @description get percentage representation of value.
 *  @param   {number} value 
 *  @param   {number} total 
 *  @returns {string}
 */
export const getPercentageHtml = (value, total) => {
    return getRoundedHtmlValue((value / total) * 100) + '%';
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

export const addMerge = (a, b) => {
    Object.keys(a).forEach(key => {
        if(b[key]) {
            a[key] += b[key];
        }
    });
};

export const defaultProxyGenerator = defaultReturnValue => {
    return new Proxy(
        {}, 
        { get: (target, name) => name in target ? target[name] : defaultReturnValue }
    );
};

export const assert = (condition, message) => {
    if (!condition) {
        message = message || "Assertion failed";
        if (typeof Error !== "undefined") {
            throw new Error(message);
        }
        throw message; // Fallback
    }
}