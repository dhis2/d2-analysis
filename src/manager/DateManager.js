export var DateManager;

DateManager = function() {
    this.klass = DateManager;
};

DateManager.isValid = function(param) {
	return (Object.prototype.toString.call(param) === '[object Date]' && param.toString() !== 'Invalid Date')
}

DateManager.getYYYYMMDD = function(param, skipValidation) {
    if (!skipValidation && !DateManager.isValid(param)) {
        return null;
    }

    var date = new Date(param),
        month = '' + (1 + date.getMonth()),
        day = '' + date.getDate();

    month = month.length === 1 ? '0' + month : month;
    day = day.length === 1 ? '0' + day : day;

    return date.getFullYear() + '-' + month + '-' + day;
};

DateManager.getTimeDifference = function(date){
	var seconds = Math.floor((new Date() - new Date(date)) / 1000);
	// Dirty hack to avoid having negative time due to difference between client zone and server zone
	while (seconds < 0) {
		seconds += 3600;
	}
    var interval = Math.floor(seconds / 31536000);

    if (interval > 1) {
        return interval + " years";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval > 1) {
        return interval + " months";
    }
    interval = Math.floor(seconds / 86400);
    if (interval > 1) {
        return interval + " days";
    }
    interval = Math.floor(seconds / 3600);
    if (interval > 1) {
        return interval + " hours";
    }
    interval = Math.floor(seconds / 60);
    if (interval > 1) {
        return interval + " minutes";
    }
    return Math.floor(seconds) + " seconds";
}
