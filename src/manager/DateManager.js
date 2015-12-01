export var DateManager;

DateManager = function() {};

DateManager.prototype.getYYYYMMDD = function(param) {
    if (!(Object.prototype.toString.call(param) === '[object Date]' && param.toString() !== 'Invalid date')) {
        return null;
    }

    var date = new Date(param),
        month = '' + (1 + date.getMonth()),
        day = '' + date.getDate();

    month = month.length === 1 ? '0' + month : month;
    day = day.length === 1 ? '0' + day : day;

    return date.getFullYear() + '-' + month + '-' + day;
};
