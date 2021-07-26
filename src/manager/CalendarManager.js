import isObject from 'd2-utilizr/lib/isObject';
import isFunction from 'd2-utilizr/lib/isFunction';
import arrayContains from 'd2-utilizr/lib/arrayContains';
import arrayTo from 'd2-utilizr/lib/arrayTo';

export var CalendarManager;

CalendarManager = function(refs, config) {
    var t = this;

    config = isObject(config) ? config : {};

    // constructor
    t.baseUrl = config.baseUrl || '..';
    t.dateFormat = config.dateFormat || 'yyyy-MM-dd';
    t.defaultCalendarId = 'gregorian';
    t.defaultCalendarIsoId = 'iso8601';
    t.calendarIds = ['coptic', 'ethiopian', 'islamic', 'julian', 'nepali', 'thai', 'persian'];

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

CalendarManager.prototype.applyTo = function(modules) {
    var t = this;

    arrayTo(modules).forEach(function(module) {
        module.calendarManager = t;
    });
};

// dep 1

CalendarManager.prototype.init = function(calendarId, callbackFn) {
    calendarId = this.getCalendarIdMap()[calendarId] || calendarId || this.defaultCalendarId;

    if (this.calendar && this.periodGenerator) {
        return;
    }

    var t = this,
        periodUrl = t.getPeriodScriptUrl(),
        success = function() {
            t.createCalendar(calendarId);
            t.createPeriodGenerator(calendarId);

            if (isFunction(callbackFn)) {
                callbackFn()
            }
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
