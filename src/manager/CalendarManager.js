import {isObject} from 'd2-utilizr';

export var CalendarManager;

CalendarManager = function(config) {
    var t = this;

    config = isObject(config) ? config : {};

    // constructor
    t.baseUrl = config.baseUrl || '..';
    t.dateFormat = config.dateFormat || null;
    t.defaultCalendarId = 'gregorian';
    t.defaultCalendarIsoId = 'iso8601';
    t.calendarIds = ['coptic', 'ethiopian', 'islamic', 'julian', 'nepali', 'thai'];

    // uninitialized
    t.calendar;
    t.periodGenerator;

    // transient
    t.calendarIdMap;
};

CalendarManager.prototype.setBaseUrl = function(baseUrl) {
    this.baseUrl = baseUrl;
};

CalendarManager.prototype.setDateFormat = function(dateFormat) {
    this.dateFormat = dateFormat;
};

CalendarManager.prototype.getPeriodScriptUrl = function() {
    return this.baseUrl + '/dhis-web-commons/javascripts/dhis2/dhis2.period.js';
};

CalendarManager.prototype.getCalendarScriptUrl = function(calendarId) {
    return this.baseUrl + '/dhis-web-commons/javascripts/jQuery/calendars/jquery.calendars.' + calendarId + '.min.js';
};

CalendarManager.prototype.getCalendarIdMap = function() {
    if (this.calendarIdMap) {
        return this.calendarIdMap;
    }

    this.calendarIdMap = {};
    this.calendarIdMap[this.defaultCalendarIsoId] = this.defaultCalendarId;

    return this.calendarIdMap;
};

CalendarManager.prototype.createCalendar = function(calendarId) {
    this.calendar = $.calendars.instance(calendarId);
};

CalendarManager.prototype.createPeriodGenerator = function(calendarId) {
    this.periodGenerator = new dhis2.period.PeriodGenerator(this.calendar, this.dateFormat);

};

// dep 1

CalendarManager.prototype.generate = function(calendarId, dateFormat) {
    calendarId = this.getCalendarIdMap()[calendarId] || calendarId || this.defaultCalendarId;

    if (this.calendar && this.periodGenerator) {
        return;
    }

    var t = this,
        periodUrl = t.getPeriodScriptUrl(),
        success = function() {
            t.createCalendar(calendarId);
            t.createPeriodGenerator(calendarId);
        };

    if (arrayContains(t.calendarIds, calendarId)) {
        var calendarUrl = t.getCalendarScriptUrl(calendarId);

        $.getScript(calendarUrl, function() {
            $.getScript(periodUrl, function() {
                success();
            });
        });
    }
    else {
        $.getScript(periodUrl, function() {
            success();
        });
    }
};
