import numberToFixed from 'd2-utilizr/lib/numberToFixed';
import isNumber from 'd2-utilizr/lib/isNumber';
import isNumeric from 'd2-utilizr/lib/isNumeric';
import { NA_AGGREGATION_TOTAL, DEFAULT_NUMBER_DECIMALS, SKIP_ROUNDING_NUMBER_DECIMALS, SMALL_NUMBER_DECIMALS } from './PivotTableConstants';

export const getDefaultNumberDisplayValue = (value, skipRounding) =>
    skipRounding ?
        getRoundedHtmlValue(value, SKIP_ROUNDING_NUMBER_DECIMALS) :
        getRoundedHtmlValue(value, value < 1 && value > -1 ? SMALL_NUMBER_DECIMALS : DEFAULT_NUMBER_DECIMALS);

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
 *  @param   {number} [dec=NUMBER_OF_DECIMALS]
 *  @returns {number}
 */
export const getRoundedHtmlValue = (value, dec = DEFAULT_NUMBER_DECIMALS) => {
    return parseFloat(roundAndStrip(value, dec)).toString();
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

/** @description round number if needed.
 *  @param   {number} number
 *  @param   {number} precision
 *  @returns {number}
 */
export const roundAndStrip = (number, precision) => {
    var n = parseFloat(number);

    if (!(isNumeric(number) && isNumber(n))) {
        return number;
    }

    if (!isNumeric(precision)) {
        return n;
    }

    return n.toFixed(precision);
};

export const addMerge = (a, b) => {
    Object.keys(a).forEach(key => {
        if(b[key]) {
            a[key] += b[key];
        }
    });
};

export const addMergeValueObject = (a, b) => {
    Object.keys(a).forEach(key => {
        if (key in b) {
            if (typeof a[key] === 'number') {
                a[key] += b[key];
                return;
            }
            else if (key === 'totalAggregationType') {
                a[key] = !a[key] ? b[key] : (a[key] !== b[key]) ? NA_AGGREGATION_TOTAL : a[key];
            }
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