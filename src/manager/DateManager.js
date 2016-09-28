export var DateManager;

DateManager = function() {
    this.klass = DateManager;
};

DateManager.isValid = function(param) {
	return !(Object.prototype.toString.call(param) === '[object Date]' && param.toString() !== 'Invalid date')
}

DateManager.getYYYYMMDD = function(param, skipValidation) {
    if (!skipValidation && DateManager.isValid(param)) {
        return null;
    }

    var date = new Date(param),
        month = '' + (1 + date.getMonth()),
        day = '' + date.getDate();

    month = month.length === 1 ? '0' + month : month;
    day = day.length === 1 ? '0' + day : day;

    return date.getFullYear() + '-' + month + '-' + day;
};

DateManager.getTimeDifference = function(param1, param2){
	var date2;
	if (param2 == undefined){
		date2 = new Date();
	}
	else{
		date2 = new Date(param2);
	}
	
	var date1 = new Date(param1);
	
	var diff = date2.getTime() - date1.getTime();
	var dateDiff = new Date(diff);
	var years = date2.getFullYear() - date1.getFullYear();
	var months = (date2.getMonth() + 12 * date2.getFullYear()) - (date1.getMonth() + 12 * date1.getFullYear());
	var days = Math.floor(diff / 1000 / 60 / (60 * 24));
	
	
	var formattedDateDiff= ""
	if (years > 0){
		formattedDateDiff = years + " year/s ago"; 
	}	
	else if (months > 0){
		formattedDateDiff = months + " month/s ago";
	}
	else if (days > 0){
		formattedDateDiff = days + " day/s ago";
	}
	else if (dateDiff.getHours() > 0){
		formattedDateDiff = dateDiff.getHours() + " hour/s ago";
	}
	else if (dateDiff.getMinutes() > 0){
		formattedDateDiff = dateDiff.getMinutes() + " minute/s ago";
	}
	else if (dateDiff.getSeconds() > 0){
		formattedDateDiff = dateDiff.getSeconds() + " second/s ago";
	}
	return formattedDateDiff;
}
