import isNumeric from 'd2-utilizr/lib/isNumeric';
import arrayContains from 'd2-utilizr/lib/arrayContains';
import arrayFrom from 'd2-utilizr/lib/arrayFrom';
import arrayUnique from 'd2-utilizr/lib/arrayUnique';
import stringTrim from 'd2-utilizr/lib/stringTrim';
import numberConstrain from 'd2-utilizr/lib/numberConstrain';

export var Period;

Period = function(config, refs) {
    var t = this;

    t.id = '' + config.id;
    t.name = config.name;

    // constants
    t.yearOffset = 5;

    // transient
    t.year = t.id.slice(0, 4);
    t.offset = parseInt(t.year) - (new Date()).getFullYear();
    t.generator = refs.calendarManager.periodGenerator;

    t.i18n = refs.i18nManager.get();

    // uninitialized
    t.sortId;

    t.typeSortId;
    t.typeName;

    t.displayName;

    t.getContextMenuItemsConfig;
};

Period.prototype.getPrefixedNumber = function(number) {
    return parseInt(number) < 10 ? '0' + number : number;
};

Period.prototype.getNameByIdAndType = function(type, id, year) {
    var t = this;

    year = year || this.year;

    var offset = parseInt(year) - (new Date()).getFullYear(),
        periods = t.generator.generateReversedPeriods(type, offset);

    for (var i = 0; i < periods.length; i++) {
        if (periods[i].iso === id) {
            return periods[i].name;
        }
    }
};

Period.prototype.getItemifiedPeriods = function(periods) {
    var items = [];

    periods = arrayFrom(periods);

    for (var i = 0; i < periods.length; i++) {
        items.push({
            id: periods[i].iso,
            name: periods[i].name
        });
    }

    return items;
};

Period.prototype.gen = function(type, offset) {
    return this.generator.generatePeriods(type, offset);
};

Period.prototype.genRev = function(type, offset) {
    return this.generator.generateReversedPeriods(type, offset);
};

Period.prototype.getTypeById = function(id) {
    if (!isNumeric(id.slice(0, 4))) {
        return;
    }

    if (id.length === 4) {
        return 'Yearly';
    }
    else if (arrayContains([6, 7], id.length)) {
        if (isNumeric(id)) {
            return 'Monthly';
        }
        else if (id.indexOf('W') !== -1) {
            return 'Weekly';
        }
        else if (id.indexOf('Q') !== -1) {
            return 'Quarterly';
        }
        else if (id.indexOf('S') !== -1) {
            return 'SixMonthly';
        }
        else if (id.indexOf('B') !== -1) {
            return 'BiMonthly';
        }
        else if (id.indexOf('Oct') !== -1) {
            return 'FinancialOct';
        }
    }
    else if (id.length === 8) {
        if (isNumeric(id.slice(4, 8))) {
            return 'Daily';
        }
        else if (id.indexOf('July') !== -1) {
            return 'FinancialJuly';
        }
    }
    else if (id.length === 9) {
        if (id.indexOf('April') !== -1) {
            return 'FinancialApril';
        }
    }
    else if (id.length === 11) {
        if (id.indexOf('AprilS') !== -1) {
            return 'SixMonthlyApril';
        }
    }
};

Period.prototype.getNameByParents = function(parents, defaultName) {
    if (parents.length !== 1 || parents[0].name === undefined) {
        return defaultName;
    }

    return defaultName + ' ' + parents[0].name;
};

// dep 1

Period.prototype.getItemsByTypeByFinancialApril = function(type, isAll) {
    var startDate = this.year + '-04-01';
    var endDate = (parseInt(this.year) + 1) + '-03-31';
    var startMonth = this.year + '-04';
    var endMonth = (parseInt(this.year) + 1) + '-04';

    // used by daily, weekly, monthly
    var thisPeriods = this.gen(type, this.offset);
    var thisSliceStartIndex;
    var nextPeriods = this.gen(type, this.offset + 1);
    var nextSliceEndIndex;

    var thisYear;
    var nextYear;

    if (type === 'FinancialApril') {
        if (isAll) {
            return this.getItemifiedPeriods(this.gen(type, this.offset - 1 + this.yearOffset).slice(0, 2));
        }

        return this.getItemifiedPeriods(this.gen(type, this.offset + this.yearOffset).slice(0, 1));
    }
    else if (type === 'FinancialJuly') {
        return this.getItemifiedPeriods(this.gen(type, this.offset - 1 + this.yearOffset).slice(0, 2));
    }
    else if (type === 'FinancialOct') {
        return this.getItemifiedPeriods(this.gen(type, this.offset - 1 + this.yearOffset).slice(0, 2));
    }
    else if (type === 'Yearly') {
        thisYear = this.gen(type, this.offset + this.yearOffset)[0];
        nextYear = this.gen(type, this.offset + 1 + this.yearOffset)[0];

        return this.getItemifiedPeriods([thisYear, nextYear]);
    }
    else if (type === 'SixMonthlyApril') {
        return this.getItemifiedPeriods(thisPeriods);
    }
    else if (type === 'SixMonthly') {
        return this.getItemifiedPeriods([].concat(thisPeriods, nextPeriods.slice(0, 1)));
    }
    else if (type === 'Quarterly') {
        return this.getItemifiedPeriods([].concat(thisPeriods.slice(1), nextPeriods.slice(0, 1)));
    }
    else if (type === 'BiMonthly') {
        return this.getItemifiedPeriods([].concat(thisPeriods.slice(1), nextPeriods.slice(0, 2)));
    }
    else if (type === 'Monthly') {
        for (var i = 0, month; i < thisPeriods.length; i++) {
            month = thisPeriods[i];

            if (month.startDate.slice(0, 7) === startMonth) {
                thisSliceStartIndex = i;
            }
        }

        for (var j = 0, month; j < nextPeriods.length; j++) {
            month = nextPeriods[j];

            if (month.startDate.slice(0, 7) === endMonth) {
                nextSliceEndIndex = j;
            }
        }

        return this.getItemifiedPeriods([].concat(thisPeriods.slice(thisSliceStartIndex), nextPeriods.slice(0, nextSliceEndIndex)));
    }
    else if (type === 'Weekly') {
        for (var i = 0, week; i < thisPeriods.length; i++) {
            week = thisPeriods[i];

            if (week.startDate.slice(0, 7) === startMonth || week.endDate.slice(0, 7) === startMonth) {
                thisSliceStartIndex = i;
            }
        }

        for (var j = 0, week; j < nextPeriods.length; j++) {
            week = nextPeriods[j];

            if (week.startDate.slice(0, 7) === endMonth && week.endDate.slice(0, 7) === endMonth) {
                nextSliceEndIndex = j;
            }
        }

        return this.getItemifiedPeriods([].concat(thisPeriods.slice(thisSliceStartIndex), nextPeriods.slice(0, nextSliceEndIndex)));
    }
    else if (type === 'Daily') {
        for (var i = 0, day; i < thisPeriods.length; i++) {
            if (thisPeriods[i].startDate === startDate) {
                thisSliceStartIndex = i;
            }
        }

        for (var j = 0, day; j < nextPeriods.length; j++) {
            if (nextPeriods[j].endDate === endDate) {
                nextSliceEndIndex = j + 1;
            }
        }

        return this.getItemifiedPeriods([].concat(thisPeriods.slice(thisSliceStartIndex), nextPeriods.slice(0, nextSliceEndIndex)));
    }

    return [];
};

Period.prototype.getItemsByTypeByFinancialJuly = function(type, isAll) {
    var startDate = this.year + '-07-01';
    var endDate = (parseInt(this.year) + 1) + '-06-30';
    var startMonth = this.year + '-07';
    var endMonth = (parseInt(this.year) + 1) + '-07';

    // used by daily, weekly, monthly
    var thisPeriods = this.gen(type, this.offset);
    var thisSliceStartIndex;
    var nextPeriods = this.gen(type, this.offset + 1);
    var nextSliceEndIndex;

    var thisYear;
    var nextYear;

    if (type === 'FinancialApril') {
        return this.getItemifiedPeriods(this.gen(type, this.offset + this.yearOffset).slice(0, 2));
    }
    else if (type === 'FinancialJuly') {
        if (isAll) {
            return this.getItemifiedPeriods(this.gen(type, this.offset - 1 + this.yearOffset).slice(0, 2));
        }

        return this.getItemifiedPeriods(this.gen(type, this.offset + this.yearOffset).slice(0, 1));
    }
    else if (type === 'FinancialOct') {
        return this.getItemifiedPeriods(this.gen(type, this.offset - 1 + this.yearOffset).slice(0, 2));
    }
    else if (type === 'Yearly') {
        thisYear = this.gen(type, this.offset + this.yearOffset)[0];
        nextYear = this.gen(type, this.offset + 1 + this.yearOffset)[0];

        return this.getItemifiedPeriods([thisYear, nextYear]);
    }
    else if (type === 'SixMonthlyApril') {
        return this.getItemifiedPeriods([].concat(thisPeriods, nextPeriods.slice(0, 1)));
    }
    else if (type === 'SixMonthly') {
        return this.getItemifiedPeriods([].concat(thisPeriods.slice(1), nextPeriods.slice(0, 1)));
    }
    else if (type === 'Quarterly') {
        return this.getItemifiedPeriods([].concat(thisPeriods.slice(2), nextPeriods.slice(0, 2)));
    }
    else if (type === 'BiMonthly') {
        return this.getItemifiedPeriods([].concat(thisPeriods.slice(3), nextPeriods.slice(0, 3)));
    }
    else if (type === 'Monthly') {
        for (var i = 0, month; i < thisPeriods.length; i++) {
            month = thisPeriods[i];

            if (month.startDate.slice(0, 7) === startMonth) {
                thisSliceStartIndex = i;
            }
        }

        for (var j = 0, month; j < nextPeriods.length; j++) {
            month = nextPeriods[j];

            if (month.startDate.slice(0, 7) === endMonth) {
                nextSliceEndIndex = j;
            }
        }

        return this.getItemifiedPeriods([].concat(thisPeriods.slice(thisSliceStartIndex), nextPeriods.slice(0, nextSliceEndIndex)));
    }
    else if (type === 'Weekly') {
        for (var i = 0, week; i < thisPeriods.length; i++) {
            week = thisPeriods[i];

            if (week.startDate.slice(0, 7) === startMonth || week.endDate.slice(0, 7) === startMonth) {
                thisSliceStartIndex = i;
            }
        }

        for (var j = 0, week; j < nextPeriods.length; j++) {
            week = nextPeriods[j];

            if (week.startDate.slice(0, 7) === endMonth && week.endDate.slice(0, 7) === endMonth) {
                nextSliceEndIndex = j;
            }
        }

        return this.getItemifiedPeriods([].concat(thisPeriods.slice(thisSliceStartIndex), nextPeriods.slice(0, nextSliceEndIndex)));
    }
    else if (type === 'Daily') {
        for (var i = 0, day; i < thisPeriods.length; i++) {
            if (thisPeriods[i].startDate === startDate) {
                thisSliceStartIndex = i;
            }
        }

        for (var j = 0, day; j < nextPeriods.length; j++) {
            if (nextPeriods[j].endDate === endDate) {
                nextSliceEndIndex = j + 1;
            }
        }

        return this.getItemifiedPeriods([].concat(thisPeriods.slice(thisSliceStartIndex), nextPeriods.slice(0, nextSliceEndIndex)));
    }

    return [];
};

Period.prototype.getItemsByTypeByFinancialOct = function(type, isAll) {
    var startDate = this.year + '-10-01';
    var endDate = (parseInt(this.year) + 1) + '-09-30';
    var startMonth = this.year + '-10';
    var endMonth = (parseInt(this.year) + 1) + '-10';

    // used by daily, weekly, monthly
    var thisPeriods = this.gen(type, this.offset);
    var thisSliceStartIndex;
    var nextPeriods = this.gen(type, this.offset + 1);
    var nextSliceEndIndex;

    var thisYear;
    var nextYear;

    if (type === 'FinancialApril') {
        return this.getItemifiedPeriods(this.gen(type, this.offset + this.yearOffset).slice(0, 2));
    }
    else if (type === 'FinancialJuly') {
        return this.getItemifiedPeriods(this.gen(type, this.offset + this.yearOffset).slice(0, 2));
    }
    else if (type === 'FinancialOct') {
        if (isAll) {
            return this.getItemifiedPeriods(this.gen(type, this.offset - 1 + this.yearOffset).slice(0, 2));
        }

        return this.getItemifiedPeriods(this.gen(type, this.offset + this.yearOffset).slice(0, 1));
    }
    else if (type === 'Yearly') {
        thisYear = this.gen(type, this.offset + this.yearOffset)[0];
        nextYear = this.gen(type, this.offset + 1 + this.yearOffset)[0];

        return this.getItemifiedPeriods([thisYear, nextYear]);
    }
    else if (type === 'SixMonthlyApril') {
        return this.getItemifiedPeriods([].concat(thisPeriods.slice(1), nextPeriods.slice(0, 1)));
    }
    else if (type === 'SixMonthly') {
        return this.getItemifiedPeriods([].concat(thisPeriods.slice(1), nextPeriods));
    }
    else if (type === 'Quarterly') {
        return this.getItemifiedPeriods([].concat(thisPeriods.slice(3), nextPeriods.slice(0, 3)));
    }
    else if (type === 'BiMonthly') {
        return this.getItemifiedPeriods([].concat(thisPeriods.slice(4), nextPeriods.slice(0, 5)));
    }
    else if (type === 'Monthly') {
        for (var i = 0, month; i < thisPeriods.length; i++) {
            month = thisPeriods[i];

            if (month.startDate.slice(0, 7) === startMonth) {
                thisSliceStartIndex = i;
            }
        }

        for (var j = 0, month; j < nextPeriods.length; j++) {
            month = nextPeriods[j];

            if (month.startDate.slice(0, 7) === endMonth) {
                nextSliceEndIndex = j;
            }
        }

        return this.getItemifiedPeriods([].concat(thisPeriods.slice(thisSliceStartIndex), nextPeriods.slice(0, nextSliceEndIndex)));
    }
    else if (type === 'Weekly') {
        for (var i = 0, week; i < thisPeriods.length; i++) {
            week = thisPeriods[i];

            if (week.startDate.slice(0, 7) === startMonth || week.endDate.slice(0, 7) === startMonth) {
                thisSliceStartIndex = i;
            }
        }

        for (var j = 0, week; j < nextPeriods.length; j++) {
            week = nextPeriods[j];

            if (week.startDate.slice(0, 7) === endMonth && week.endDate.slice(0, 7) === endMonth) {
                nextSliceEndIndex = j;
            }
        }

        return this.getItemifiedPeriods([].concat(thisPeriods.slice(thisSliceStartIndex), nextPeriods.slice(0, nextSliceEndIndex)));
    }
    else if (type === 'Daily') {
        for (var i = 0, day; i < thisPeriods.length; i++) {
            if (thisPeriods[i].startDate === startDate) {
                thisSliceStartIndex = i;
            }
        }

        for (var j = 0, day; j < nextPeriods.length; j++) {
            if (nextPeriods[j].endDate === endDate) {
                nextSliceEndIndex = j + 1;
            }
        }

        return this.getItemifiedPeriods([].concat(thisPeriods.slice(thisSliceStartIndex), nextPeriods.slice(0, nextSliceEndIndex)));
    }

    return [];
};

Period.prototype.getItemsByTypeByYear = function(type) {
    if (type === 'FinancialOct') {
        return this.getItemifiedPeriods(this.genRev(type, this.offset - 5).slice(0, 2));
    }
    else if (type === 'FinancialJuly') {
        return this.getItemifiedPeriods(this.genRev(type, this.offset - 5).slice(0, 2));
    }
    else if (type === 'FinancialApril') {
        return this.getItemifiedPeriods(this.genRev(type, this.offset - 5).slice(0, 2));
    }
    else if (type === 'Yearly') {
        return this.getItemifiedPeriods(this.genRev(type, this.offset - 5).slice(0, 1));
    }
    else if (type === 'SixMonthlyApril') {
        return this.getItemifiedPeriods(this.genRev(type, this.offset));
    }
    else if (type === 'SixMonthly') {
        return this.getItemifiedPeriods(this.genRev(type, this.offset));
    }
    else if (type === 'Quarterly') {
        return this.getItemifiedPeriods(this.genRev(type, this.offset));
    }
    else if (type === 'BiMonthly') {
        return this.getItemifiedPeriods(this.genRev(type, this.offset));
    }
    else if (type === 'Monthly') {
        return this.getItemifiedPeriods(this.genRev(type, this.offset));
    }
    else if (type === 'Weekly') {
        return this.getItemifiedPeriods(this.genRev(type, this.offset));
    }
    else if (type === 'Daily') {
        return this.getItemifiedPeriods(this.genRev(type, this.offset));
    }

    return [];
};

Period.prototype.getItemsByTypeBySixmonthApril = function(type, isAll) {
    var sixmonthaprilStr = this.id.slice(10, 11),
        sixmonthapril = parseInt(sixmonthaprilStr);

    if (type === 'FinancialOct') {
        offset = sixmonthapril === 1 ? -1 : 0;
        return this.getItemifiedPeriods(this.gen(type, this.offset + this.yearOffset + offset).slice(0, 1));
    }
    else if (type === 'FinancialJuly') {
        offset = sixmonthapril === 1 ? -1 : 0;
        sliceEndIndex = offset === -1 ? 2 : 1;

        return this.getItemifiedPeriods(this.gen(type, this.offset + this.yearOffset + offset).slice(0, sliceEndIndex));
    }
    else if (type === 'FinancialApril') {
        return this.getItemifiedPeriods(this.gen(type, this.offset + this.yearOffset).slice(0, 1));
    }
    else if (type === 'Yearly') {
        var sliceEndIndex = sixmonthapril === 1 ? 1 : 2;
        return this.getItemifiedPeriods(this.gen(type, this.offset + this.yearOffset).slice(0, sliceEndIndex));
    }
    else if (type === 'SixMonthlyApril') {
        if (isAll) {
            return this.getItemifiedPeriods(this.gen(type, this.offset - 1).slice(1, 2).concat(this.gen(type, this.offset)));
        }

        return this.getItemifiedPeriods([this.gen(type, this.offset)[sixmonthapril - 1]]);
    }
    else if (type === 'SixMonthly') {
        var offset = sixmonthapril === 1 ? 0 : 1;
        return this.getItemifiedPeriods(this.gen(type, this.offset).slice(1, 2).concat(this.gen(type, this.offset + offset).slice(0, 1)));
    }
    else if (type === 'Quarterly') {
        var quarters = [];

        if (sixmonthapril === 1) {
            quarters = quarters.concat(this.gen(type, this.offset).slice(1, 3));
        }
        else {
            quarters = quarters.concat(this.gen(type, this.offset).slice(3, 4));
            quarters = quarters.concat(this.gen(type, this.offset + 1).slice(0, 1));
        }

        return this.getItemifiedPeriods(quarters);
    }
    else if (type === 'BiMonthly') {
        var bimonths = [];

        if (sixmonthapril === 1) {
            bimonths = bimonths.concat(this.gen(type, this.offset).slice(1, 5));
        }
        else {
            bimonths = bimonths.concat(this.gen(type, this.offset).slice(4, 6));
            bimonths = bimonths.concat(this.gen(type, this.offset + 1).slice(0, 2));
        }

        return this.getItemifiedPeriods(bimonths);
    }
    else if (type === 'Monthly') {
        var months = [];

        if (sixmonthapril === 1) {
            months = months.concat(this.gen(type, this.offset).slice(3, 9));
        }
        else {
            months = months.concat(this.gen(type, this.offset).slice(9, 12));
            months = months.concat(this.gen(type, this.offset + 1).slice(0, 3));
        }

        return this.getItemifiedPeriods(months);
    }
    else if (type === 'Weekly') {
        var allWeeks = this.gen(type, this.offset),
            weeks = [];

        if (sixmonthapril === 1) {
            for (var i = 0, week, sm, em; i < allWeeks.length; i++) {
                week = allWeeks[i];
                sm = parseInt(week.startDate.substring(5, 7));
                em = parseInt(week.endDate.substring(5, 7));

                if (numberConstrain(sm, 4, 9) === sm || numberConstrain(em, 4, 9) === em) {
                    weeks.push(week);
                }
            }
        }
        else {
            var allWeeksNext = this.gen(type, this.offset + 1),
                sliceStartIndex,
                sliceEndIndex;

            // this year
            for (var i = 0, week, sm, em; i < allWeeks.length; i++) {
                week = allWeeks[i];
                sm = parseInt(week.startDate.substring(5, 7));
                em = parseInt(week.endDate.substring(5, 7));

                if (sm === 10 || em === 10) {
                    sliceStartIndex = i;
                    break;
                }
            }

            weeks = weeks.concat(allWeeks.slice(sliceStartIndex));

            // next year
            for (var i = 0, week, sm, em; i < allWeeksNext.length; i++) {
                week = allWeeks[i];
                sm = parseInt(week.startDate.substring(5, 7));
                em = parseInt(week.endDate.substring(5, 7));

                if (sm === 4 && em === 4) {
                    sliceEndIndex = i - 1;
                    break;
                }
            }

            weeks = weeks.concat(allWeeksNext.slice(0, sliceEndIndex));
        }

        return this.getItemifiedPeriods(weeks);
    }
    else if (type === 'Daily') {
        var allDays = this.gen(type, this.offset),
            days = [];

        if (sixmonthapril === 1) {
            for (var i = 0, day, m; i < allDays.length; i++) {
                day = allDays[i];
                m = parseInt(day.startDate.substring(5, 7));

                if (numberConstrain(m, 4, 9) === m) {
                    days.push(day);
                }
            }
        }
        else {
            var allDaysNext = this.gen(type, this.offset + 1),
                sliceStartIndex,
                sliceEndIndex;

            // this year
            for (var i = 0, day, m; i < allDays.length; i++) {
                day = allDays[i];
                m = parseInt(day.startDate.substring(5, 7));

                if (m === 10) {
                    sliceStartIndex = i;
                    break;
                }
            }

            days = days.concat(allDays.slice(sliceStartIndex));

            // next year
            for (var i = 0, day, m; i < allDaysNext.length; i++) {
                day = allDaysNext[i];
                m = parseInt(day.startDate.substring(5, 7));

                if (m === 4) {
                    sliceEndIndex = i - 1;
                    break;
                }
            }

            days = days.concat(allDaysNext.slice(0, sliceEndIndex));
        }

        return this.getItemifiedPeriods(days);
    }

    return [];
};

Period.prototype.getItemsByTypeBySixmonth = function(type, isAll) {
    var sixmonthStr = this.id.slice(5, 6),
        sixmonth = parseInt(sixmonthStr),
        firstMonth = sixmonth === 1 ? 1 : 7,
        lastMonth = sixmonth === 1 ? 6 : 12,
        startIndex,
        endIndex,
        offset,
        sliceEndIndex;

    if (type === 'FinancialOct') {
        offset = -1;
        sliceEndIndex = sixmonth === 1 ? 1 : 2;
        return this.getItemifiedPeriods(this.gen(type, this.offset + this.yearOffset + offset).slice(0, sliceEndIndex));
    }
    else if (type === 'FinancialJuly') {
        offset = sixmonth === 1 ? -1 : 0;
        return this.getItemifiedPeriods(this.gen(type, this.offset + this.yearOffset + offset).slice(0, 1));
    }
    else if (type === 'FinancialApril') {
        offset = sixmonth === 1 ? -1 : 0;
        sliceEndIndex = sixmonth === 1 ? 2 : 1;
        return this.getItemifiedPeriods(this.gen(type, this.offset + this.yearOffset + offset).slice(0, sliceEndIndex));
    }
    else if (type === 'Yearly') {
        return this.getItemifiedPeriods(this.gen(type, this.offset + this.yearOffset).slice(0, 1));
    }
    else if (type === 'SixMonthlyApril') {
        var allSixmonthaprils = this.gen(type, this.offset),
            this1 = allSixmonthaprils[0],
            this2 = allSixmonthaprils[1],
            prev = this.gen(type, this.offset - 1)[1],
            sixmonthaprils = [];

        if (sixmonth === 1) {
            sixmonthaprils.push(prev, this1);
        }
        else if (sixmonth === 2) {
            sixmonthaprils.push(this1, this2);
        }

        return this.getItemifiedPeriods(sixmonthaprils);
    }
    else if (type === 'SixMonthly') {
        if (isAll) {
            return this.getItemifiedPeriods(this.gen(type, this.offset));
        }

        return this.getItemifiedPeriods([this.gen(type, this.offset)[sixmonth - 1]]);
    }
    else if (type === 'Quarterly') {
        var sliceStartIndex = sixmonth === 1 ? 0 : 2,
            sliceEndIndex = sixmonth === 1 ? 2 : 4;

        return this.getItemifiedPeriods(this.gen(type, this.offset).slice(sliceStartIndex, sliceEndIndex));
    }
    else if (type === 'BiMonthly') {
        var sliceStartIndex = sixmonth === 1 ? 0 : 3,
            sliceEndIndex = sixmonth === 1 ? 3 : 6;

        return this.getItemifiedPeriods(this.gen(type, this.offset).slice(sliceStartIndex, sliceEndIndex));
    }
    else if (type === 'Monthly') {
        var sliceStartIndex = sixmonth === 1 ? 0 : 6,
            sliceEndIndex = sixmonth === 1 ? 6 : 12;

        return this.getItemifiedPeriods(this.gen(type, this.offset).slice(sliceStartIndex, sliceEndIndex));
    }
    else if (type === 'Weekly') {
        var allWeeks = this.gen(type, this.offset),
            weeks = [];

        for (var i = 0, sd, ed, sy, ey; i < allWeeks.length; i++) {
            sd = parseInt(allWeeks[i].startDate.substring(5, 7));
            ed = parseInt(allWeeks[i].endDate.substring(5, 7));
            sy = allWeeks[i].startDate.substring(0, 4);
            ey = allWeeks[i].endDate.substring(0, 4);

            if ((sd >= firstMonth && sd <= lastMonth) || (ed >= firstMonth && ed <= lastMonth)) {
                if ((sixmonth === 1 && ey !== this.year) || (sixmonth === 2 && sy !== this.year)) {
                    continue;
                }

                weeks.push(allWeeks[i]);
            }
        }

        return this.getItemifiedPeriods(weeks);
    }
    else if (type === 'Daily') {
        var allDays = this.gen(type, this.offset),
            days = [];

        for (var i = 0, m; i < allDays.length; i++) {
            m = parseInt(allDays[i].iso.substring(4, 6));

            if (m >= firstMonth && m <= lastMonth) {
                days.push(allDays[i]);
            }
        }

        return this.getItemifiedPeriods(days);
    }

    return [];
};

Period.prototype.getItemsByTypeByQuarter = function(type, isAll) {
    var quarterStr = this.id.slice(5, 6),
        quarter = parseInt(quarterStr),
        firstMonth = (quarter === 1) ? 1 : (quarter === 2 ? 4 : (quarter === 3 ? 7 : 10)),
        lastMonth = (quarter === 1) ? 3 : (quarter === 2 ? 6 : (quarter === 3 ? 9 : 12)),
        startIndex,
        endIndex,
        offset;

    if (type === 'FinancialOct') {
        offset = quarter <= 3 ? 4 : 5;
        return this.getItemifiedPeriods(this.gen(type, this.offset + offset).slice(0, 1));
    }
    else if (type === 'FinancialJuly') {
        offset = quarter <= 2 ? 4 : 5;
        return this.getItemifiedPeriods(this.gen(type, this.offset + offset).slice(0, 1));
    }
    else if (type === 'FinancialApril') {
        offset = quarter === 1 ? 4 : 5;
        return this.getItemifiedPeriods(this.gen(type, this.offset + offset).slice(0, 1));
    }
    else if (type === 'Yearly') {
        return this.getItemifiedPeriods(this.gen(type, this.offset + 5).slice(0, 1));
    }
    else if (type === 'SixMonthlyApril') {
        var offset = (quarter < 2) ? -1 : (quarter > 3 ? 1 : 0),
            index = (quarter < 2 || quarter > 3) ? 1 : 2;

        return this.getItemifiedPeriods(this.genRev(type, this.offset + offset).slice(0, index));
    }
    else if (type === 'SixMonthly') {
        startIndex = (quarter <= 2) ? 0 : 1;
        endIndex = startIndex + 1;

        return this.getItemifiedPeriods(this.gen(type, this.offset).slice(startIndex, endIndex));
    }
    else if (type === 'Quarterly') {
        if (isAll) {
            return this.getItemifiedPeriods(this.gen(type, this.offset));
        }

        return this.getItemifiedPeriods(this.gen(type, this.offset).slice(quarter - 1, quarter));
    }
    else if (type === 'BiMonthly') {
        startIndex = (quarter === 1) ? 0 : (quarter === 2 ? 1 : (quarter === 3 ? 3 : 4));
        endIndex = startIndex + 2;

        return this.getItemifiedPeriods(this.gen(type, this.offset).slice(startIndex, endIndex));
    }
    else if (type === 'Monthly') {
        startIndex = (quarter === 1) ? 0 : (quarter === 2 ? 3 : (quarter === 3 ? 6 : 9));
        endIndex = startIndex + 3;

        return this.getItemifiedPeriods(this.gen(type, this.offset).slice(startIndex, endIndex));
    }
    else if (type === 'Weekly') {
        var allWeeks = this.gen(type, this.offset),
            weeks = [];

        for (var i = 0, sd, ed, sy, ey; i < allWeeks.length; i++) {
            sd = parseInt(allWeeks[i].startDate.substring(5, 7));
            ed = parseInt(allWeeks[i].endDate.substring(5, 7));
            sy = allWeeks[i].startDate.substring(0, 4);
            ey = allWeeks[i].endDate.substring(0, 4);

            if ((sd >= firstMonth && sd <= lastMonth) || (ed >= firstMonth && ed <= lastMonth)) {
                if ((quarter === 1 && ey !== this.year) || (quarter === 4 && sy !== this.year)) {
                    continue;
                }

                weeks.push(allWeeks[i]);
            }
        }

        return this.getItemifiedPeriods(weeks);
    }
    else if (type === 'Daily') {
        var allDays = this.gen(type, this.offset),
            days = [];

        for (var i = 0, m; i < allDays.length; i++) {
            m = parseInt(allDays[i].iso.substring(4, 6));

            if (m >= firstMonth && m <= lastMonth) {
                days.push(allDays[i]);
            }
        }

        return this.getItemifiedPeriods(days);
    }

    return [];
};

Period.prototype.getItemsByTypeByBimonth = function(type, isAll) {
    var bimonthStr = this.id.slice(4, 6),
        bimonth = parseInt(bimonthStr),
        firstMonth = (bimonth * 2) - 1,
        lastMonth = bimonth * 2,
        startIndex,
        endIndex,
        offset;

    if (type === 'FinancialOct') {
        var isPrev = firstMonth < 10,
            isThis = lastMonth >= 10,
            offset = 0 + (isPrev ? -1 : 0),
            sliceEndIndex = 0 + (isPrev ? 1 : 0) + (isThis ? 1 : 0),
            financialoctobers = [];

        return this.getItemifiedPeriods(this.gen(type, this.offset + this.yearOffset + offset).slice(0, sliceEndIndex));
    }
    else if (type === 'FinancialJuly') {
        var isPrev = firstMonth < 7,
            isThis = lastMonth >= 7,
            offset = 0 + (isPrev ? -1 : 0),
            sliceEndIndex = 0 + (isPrev ? 1 : 0) + (isThis ? 1 : 0),
            financialoctobers = [];

        return this.getItemifiedPeriods(this.gen(type, this.offset + this.yearOffset + offset).slice(0, sliceEndIndex));
    }
    else if (type === 'FinancialApril') {
        var isPrev = firstMonth < 4,
            isThis = lastMonth >= 4,
            offset = 0 + (isPrev ? -1 : 0),
            sliceEndIndex = 0 + (isPrev ? 1 : 0) + (isThis ? 1 : 0),
            financialoctobers = [];

        return this.getItemifiedPeriods(this.gen(type, this.offset + this.yearOffset + offset).slice(0, sliceEndIndex));
    }
    else if (type === 'Yearly') {
        return this.getItemifiedPeriods(this.gen(type, this.offset + 5).slice(0, 1));
    }
    else if (type === 'SixMonthlyApril') {
        var sixmonthaprils = [];

        if (bimonth === 1) {
            sixmonthaprils.push(this.gen('SixMonthlyApril', this.offset - 1)[1]);
        }
        else if (bimonth === 2) {
            sixmonthaprils.push(this.gen('SixMonthlyApril', this.offset - 1)[1]);
            sixmonthaprils.push(this.gen('SixMonthlyApril', this.offset)[0]);
        }
        else if (bimonth < 5) {
            sixmonthaprils.push(this.gen('SixMonthlyApril', this.offset)[0]);
        }
        else if (bimonth === 5) {
            sixmonthaprils.push(this.gen('SixMonthlyApril', this.offset)[0]);
            sixmonthaprils.push(this.gen('SixMonthlyApril', this.offset)[1]);
        }
        else {
            sixmonthaprils.push(this.gen('SixMonthlyApril', this.offset)[1]);
        }

        return this.getItemifiedPeriods(sixmonthaprils);
    }
    else if (type === 'SixMonthly') {
        var sliceStartIndex = bimonth < 4 ? 0 : 1,
            sliceEndIndex = bimonth < 4 ? 1 : 2;

        return this.getItemifiedPeriods(this.gen(type, this.offset).slice(sliceStartIndex, sliceEndIndex));
    }
    else if (type === 'Quarterly') {
        var sliceStartIndex = bimonth === 1 ? 0 : (bimonth === 2 ? 0 : (bimonth === 3 ? 1 : (bimonth === 4 ? 2 : (bimonth === 5 ? 2 : 3)))),
            sliceEndIndex = bimonth === 1 ? 1 : (bimonth === 2 ? 2 : (bimonth === 3 ? 2 : (bimonth === 4 ? 3 : (bimonth === 5 ? 4 : 4))));

        return this.getItemifiedPeriods(this.gen('Quarterly', this.offset).slice(sliceStartIndex, sliceEndIndex));
    }
    else if (type === 'BiMonthly') {
        if (isAll) {
            return this.getItemifiedPeriods(this.gen(type, this.offset));
        }

        return this.getItemifiedPeriods(this.gen(type, this.offset).slice(bimonth - 1, bimonth));
    }
    else if (type === 'Monthly') {
        var sliceStartIndex = bimonth === 1 ? 0 : (bimonth === 2 ? 2 : (bimonth === 3 ? 4 : (bimonth === 4 ? 6: (bimonth === 5 ? 8 : 10)))),
            sliceEndIndex = bimonth === 1 ? 2 : (bimonth === 2 ? 4 : (bimonth === 3 ? 6 : (bimonth === 4 ? 8 : (bimonth === 5 ? 10 : 12))));

        return this.getItemifiedPeriods(this.gen(type, this.offset).slice(sliceStartIndex, sliceEndIndex));
    }
    else if (type === 'Weekly') {
        var allWeeks = this.gen(type, this.offset),
            weeks = [];

        for (var i = 0, sd, ed, sy, ey; i < allWeeks.length; i++) {
            sd = parseInt(allWeeks[i].startDate.substring(5, 7));
            ed = parseInt(allWeeks[i].endDate.substring(5, 7));
            sy = allWeeks[i].startDate.substring(0, 4);
            ey = allWeeks[i].endDate.substring(0, 4);

            if ((sd >= firstMonth && sd <= lastMonth) || (ed >= firstMonth && ed <= lastMonth)) {
                if ((bimonth === 1 && ey !== this.year) || (bimonth === 4 && sy !== this.year)) {
                    continue;
                }

                weeks.push(allWeeks[i]);
            }
        }

        return this.getItemifiedPeriods(weeks);
    }
    else if (type === 'Daily') {
        var allDays = this.gen(type, this.offset),
            days = [];

        for (var i = 0, m; i < allDays.length; i++) {
            m = parseInt(allDays[i].iso.substring(4, 6));

            if (m >= firstMonth && m <= lastMonth) {
                days.push(allDays[i]);
            }
        }

        return this.getItemifiedPeriods(days);
    }

    return [];
};

Period.prototype.getItemsByTypeByMonth = function(type, isAll) {
    var monthStr = this.id.slice(4, 6),
        month = parseInt(monthStr),
        offset;

    if (type === 'FinancialOct') {
        offset = month <= 9 ? 4 : 5;
        return this.getItemifiedPeriods(this.gen(type, this.offset + offset).slice(0, 1));
    }
    else if (type === 'FinancialJuly') {
        offset = month <= 6 ? 4 : 5;
        return this.getItemifiedPeriods(this.gen(type, this.offset + offset).slice(0, 1));
    }
    else if (type === 'FinancialApril') {
        offset = month <= 3 ? 4 : 5;
        return this.getItemifiedPeriods(this.gen(type, this.offset + offset).slice(0, 1));
    }
    else if (type === 'Yearly') {
        return this.getItemifiedPeriods(this.genRev(type, this.offset - 5).slice(0, 1));
    }
    else if (type === 'SixMonthlyApril') {
        var offset = (month < 4) ? -1 : 0,
            index = (month < 4 || month > 9) ? 1 : 2;

        return this.getItemifiedPeriods(this.genRev(type, this.offset + offset).slice(0, index));
    }
    else if (type === 'SixMonthly') {
        var startIndex = (month <= 6) ? 0 : 1,
            endIndex = startIndex + 1;

        return this.getItemifiedPeriods(this.gen(type, this.offset).slice(startIndex, endIndex));
    }
    else if (type === 'Quarterly') {
        var startIndex = (month <= 3) ? 0 : (month <= 6 ? 1 : (month <= 9 ? 2 : 3))
        endIndex = startIndex + 1;

        return this.getItemifiedPeriods(this.gen(type, this.offset).slice(startIndex, endIndex));
    }
    else if (type === 'BiMonthly') {
        var startIndex = (month <= 2) ? 0 : (month <= 4 ? 1 : (month <= 6 ? 2 : (month <= 8 ? 3 : (month <= 10 ? 4 : 5))))
        endIndex = startIndex + 1;

        return this.getItemifiedPeriods(this.gen(type, this.offset).slice(startIndex, endIndex));
    }
    else if (type === 'Monthly') {
        if (isAll) {
            return this.getItemifiedPeriods(this.gen(type, this.offset));
        }

        return this.getItemifiedPeriods(this.gen(type, this.offset).slice(month - 1, month));
    }
    else if (type === 'Weekly') {
        var t = this,
            isFirstOrLast = month === 1 || month === 12,
            allWeeks = function() {
                var a = [];
                a = a.concat(isFirstOrLast ? t.gen(type, t.offset - 1) : []);
                a = a.concat(t.gen(type, t.offset));
                a = a.concat(isFirstOrLast ? t.gen(type, t.offset + 1) : []);
                return a;
            }(),
            monthTestString = this.year + '-' + monthStr,
            weeks = [];

        for (var i = 0, sd, ed, week; i < allWeeks.length; i++) {
            week = allWeeks[i];
            sd = week.startDate;
            ed = week.endDate;

            if (sd.substring(0, 7) === monthTestString || ed.substring(0, 7) === monthTestString) {
                weeks.push(week);
            }
        }

        return this.getItemifiedPeriods(weeks);
    }
    else if (type === 'Daily') {
        var allDays = this.gen(type, this.offset),
            days = [];

        for (var i = 0, m; i < allDays.length; i++) {
            m = allDays[i].iso;

            if (m.substring(4, 6) === monthStr) {
                days.push(allDays[i]);
            }
        }

        return this.getItemifiedPeriods(days);
    }

    return [];
};

Period.prototype.getItemsByTypeByWeek = function(type, isAll) {
    var weekStr = this.id.slice(5,7),
        week = parseInt(weekStr),
        allWeeks = this.gen('Weekly', this.offset),
        weekPeriod = allWeeks[week - 1],
        startDateMonth = parseInt(weekPeriod.startDate.substring(5, 7)),
        endDateMonth = parseInt(weekPeriod.endDate.substring(5, 7)),
        startDateYear = parseInt(weekPeriod.startDate.substring(0, 4)),
        endDateYear = parseInt(weekPeriod.endDate.substring(0, 4)),
        offset;

    if (type === 'FinancialOct') {
        var isPrev = startDateMonth < 10 || startDateYear < this.year,
            isThis = endDateMonth >= 10 || startDateYear > this.year,
            offset = isPrev ? -1 : 0,
            sliceEndIndex = 1 + (isPrev ? 1 : 0) + (isThis ? 1 : 0),
            financialaprils = [];

        return this.getItemifiedPeriods(this.gen('FinancialOct', this.offset + this.yearOffset + offset).slice(0, sliceEndIndex));
    }
    else if (type === 'FinancialJuly') {
        var isPrev = startDateMonth < 7 || startDateYear < this.year,
            isThis = endDateMonth >= 7 || startDateYear > this.year,
            offset = isPrev ? -1 : 0,
            sliceEndIndex = 1 + (isPrev ? 1 : 0) + (isThis ? 1 : 0),
            financialaprils = [];

        return this.getItemifiedPeriods(this.gen('FinancialJuly', this.offset + this.yearOffset + offset).slice(0, sliceEndIndex));
    }
    else if (type === 'FinancialApril') {
        var isPrev = startDateMonth < 4 || startDateYear < this.year,
            isThis = endDateMonth >= 4 || startDateYear > this.year,
            offset = isPrev ? -1 : 0,
            sliceEndIndex = 1 + (isPrev ? 1 : 0) + (isThis ? 1 : 0),
            financialaprils = [];

        return this.getItemifiedPeriods(this.gen('FinancialApril', this.offset + this.yearOffset + offset).slice(0, sliceEndIndex));
    }
    else if (type === 'Yearly') {
        var offset = startDateYear < parseInt(this.year) ? -1 : 0,
            sliceEndIndex = 1 + (startDateYear !== endDateYear ? 1 : 0);

        return this.getItemifiedPeriods(this.gen('Yearly', (this.offset + this.yearOffset + offset)).slice(0, sliceEndIndex));
    }
    else if (type === 'SixMonthlyApril') {
        var sixmonthaprils = [];

        if (startDateMonth < 4 || startDateYear < this.year) {
            sixmonthaprils.push(this.gen('SixMonthlyApril', this.offset - 1)[1]);
        }

        if (numberConstrain(startDateMonth, 4, 9) === startDateMonth || numberConstrain(endDateMonth, 4, 9) === endDateMonth) {
            sixmonthaprils.push(this.gen('SixMonthlyApril', this.offset)[0]);
        }

        if (endDateMonth > 9 || endDateYear > this.year) {
            sixmonthaprils.push(this.gen('SixMonthlyApril', this.offset)[1]);
        }

        return this.getItemifiedPeriods(sixmonthaprils);
    }
    else if (type === 'SixMonthly') {
        var allSixmonths = this.gen(type, this.offset),
            actualSixmonthIndexes = arrayUnique([Math.ceil(startDateMonth / 6), Math.ceil(endDateMonth / 6)]),
            sixmonths = [];

        for (var i = 0; i < actualSixmonthIndexes.length; i++) {
            sixmonths.push(allSixmonths[actualSixmonthIndexes[i] - 1]);
        }

        return this.getItemifiedPeriods(sixmonths);
    }
    else if (type === 'Quarterly') {
        var allQuarters = this.gen(type, this.offset),
            actualQuarterIndexes = arrayUnique([Math.ceil(startDateMonth / 3), Math.ceil(endDateMonth / 3)]),
            quarters = [];

        for (var i = 0; i < actualQuarterIndexes.length; i++) {
            quarters.push(allQuarters[actualQuarterIndexes[i] - 1]);
        }

        return this.getItemifiedPeriods(quarters);
    }
    else if (type === 'BiMonthly') {
        var allBimonths = this.gen(type, this.offset),
            actualBimonthIndexes = arrayUnique([Math.ceil(startDateMonth / 2), Math.ceil(endDateMonth / 2)]),
            bimonths = [];

        for (var i = 0; i < actualBimonthIndexes.length; i++) {
            bimonths.push(allBimonths[actualBimonthIndexes[i] - 1]);
        }

        return this.getItemifiedPeriods(bimonths);
    }
    else if (type === 'Monthly') {
        var allMonths = this.gen(type, this.offset),
            months = [];

        if (startDateMonth === 12 && endDateMonth === 1) {
            months.push(this.gen(type, this.offset - 1)[11]);
            months.push(allMonths[0]);
        }
        else if (startDateMonth === 1 && endDateMonth === 12) {
            months.push(allMonths[11]);
            months.push(this.gen(type, this.offset + 1)[0]);
        }
        else {
            var actualMonthIndexes = arrayUnique([startDateMonth, endDateMonth]);

            for (var i = 0, monthIndexes = arrayUnique([startDateMonth, endDateMonth]); i < monthIndexes.length; i++) {
                months.push(allMonths[monthIndexes[i] - 1]);
            }
        }

        return this.getItemifiedPeriods(months);
    }
    else if (type === 'Weekly') {
        var allWeeks = this.gen(type, this.offset),
            weekPeriod = allWeeks[week - 1];

        if (isAll) {
            return this.getItemifiedPeriods(allWeeks);
        }

        return this.getItemifiedPeriods(weekPeriod);
    }
    else if (type === 'Daily') {
        var allDays = this.gen(type, this.offset),
            startSlice,
            endSlice,
            weekPeriod = this.gen('Weekly', this.offset)[week - 1],
            days = [];

        if (isAll) {
            return this.getItemifiedPeriods(allDays);
        }

        // last year
        if (weekPeriod.startDate.slice(0, 4) < this.year) {
            for (var i = 0, lastDaysLastYear = this.gen(type, this.offset - 1).slice(358), day; i < lastDaysLastYear.length; i++) {
                day = lastDaysLastYear[i];

                if (day.startDate === weekPeriod.startDate) {
                    days = days.concat(lastDaysLastYear.slice(i));
                }
            }
        }

        // this year
        for (var i = 0, sd; i < allDays.length; i++) {
            sd = allDays[i].startDate;

            if (sd === weekPeriod.startDate) {
                startSlice = i;
            }
            else if (sd === weekPeriod.endDate) {
                endSlice = i + 1;
            }
        }

        days = days.concat(allDays.slice(startSlice, endSlice));

        // next year
        if (weekPeriod.endDate.slice(0, 4) > this.year) {
            for (var i = 0, firstDaysNextYear = this.gen(type, this.offset + 1).slice(0, 7), day; i < firstDaysNextYear.length; i++) {
                day = firstDaysNextYear[i];

                days.push(day);

                if (day.endDate === weekPeriod.endDate) {
                    break;
                }
            }
        }

        return this.getItemifiedPeriods(days);
    }

    return [];
};

Period.prototype.getItemsByTypeByDay = function(type, isAll) {
    var dayStr = this.id.slice(6, 8),
        day = parseInt(dayStr),
        monthStr = this.id.slice(4, 6),
        month = parseInt(monthStr),
        offset;

    if (type === 'FinancialOct') {
        offset = month <= 9 ? 4 : 5;
        return this.getItemifiedPeriods(this.gen(type, this.offset + offset).slice(0, 1));
    }
    else if (type === 'FinancialJuly') {
        offset = month <= 6 ? 4 : 5;
        return this.getItemifiedPeriods(this.gen(type, this.offset + offset).slice(0, 1));
    }
    else if (type === 'FinancialApril') {
        offset = month <= 3 ? 4 : 5;
        return this.getItemifiedPeriods(this.gen(type, this.offset + offset).slice(0, 1));
    }
    else if (type === 'Yearly') {
        return this.getItemifiedPeriods(this.genRev(type, this.offset - 5).slice(0, 1));
    }
    else if (type === 'SixMonthlyApril') {
        var offset = month < 4 ? -1 : 0,
            sliceStartIndex = (month < 4 || month > 9) ? 1 : 0,
            sliceEndIndex = sliceStartIndex + 1;

        return this.getItemifiedPeriods(this.gen(type, this.offset + offset).slice(sliceStartIndex, sliceEndIndex));
    }
    else if (type === 'SixMonthly') {
        var sliceStartIndex = (month <= 6) ? 0 : 1,
            sliceEndIndex = sliceStartIndex + 1;

        return this.getItemifiedPeriods(this.gen(type, this.offset).slice(sliceStartIndex, sliceEndIndex));
    }
    else if (type === 'Quarterly') {
        var sliceStartIndex = (month <= 3) ? 0 : (month <= 6 ? 1 : (month <= 9 ? 2 : 3))
        sliceEndIndex = sliceStartIndex + 1;

        return this.getItemifiedPeriods(this.gen(type, this.offset).slice(sliceStartIndex, sliceEndIndex));
    }
    else if (type === 'BiMonthly') {
        var sliceStartIndex = (month <= 2) ? 0 : (month <= 4 ? 1 : (month <= 6 ? 2 : (month <= 8 ? 3 : (month <= 10 ? 4 : 5))))
        sliceEndIndex = sliceStartIndex + 1;

        return this.getItemifiedPeriods(this.gen(type, this.offset).slice(sliceStartIndex, sliceEndIndex));
    }
    else if (type === 'Monthly') {
        return this.getItemifiedPeriods(this.gen(type, this.offset).slice(month - 1, month));
    }
    else if (type === 'Weekly') {
        var allWeeks = this.gen(type, this.offset),
            week;

        for (var i = 0, sd, ed; i < allWeeks.length; i++) {
            sd = allWeeks[i].startDate;
            ed = allWeeks[i].endDate;

            if (sd.substring(5, 7) === monthStr || ed.substring(5, 7) === monthStr) {
                if (sd.substring(8, 10) <= dayStr || ed.substring(8, 10) >= dayStr) {
                    week = allWeeks[i];
                    break;
                }
            }
        }

        return this.getItemifiedPeriods(week);
    }
    else if (type === 'Daily') {
        var allDays = this.gen(type, this.offset),
            day;

        if (isAll) {
            return this.getItemifiedPeriods(allDays);
        }

        for (var i = 0, sd; i < allDays.length; i++) {
            sd = allDays[i].startDate;

            if (sd.substring(5, 7) === monthStr && sd.substring(8, 10) === dayStr) {
                day = allDays[i];
            }
        }

        return this.getItemifiedPeriods(day);
    }

    return [];
};

//TYPE                ID              NAME
//Financial October   2015Oct         Oct 2015 to Sep 2016
//Financial July      2015July        Jul 2015 to Jun 2016
//Financial April     2015April       Apr 2015 to Mar 2016
//Yearly              2015            2015
//Six-monthly April   2015AprilS1     Apr to Sep 2015
//Six-monthly April   2015AprilS2     Oct to Mar 2014
//Six-monthly         2015S1          Jan to Jun 2015
//Quarterly           2015Q1          Jan to Mar 2015
//Bi-monthly          201501B         Jan to Feb 2015
//Monthly             201501          January 2015
//Weekly              2015W1          2015W1
//Daily               20150101        2015-01-01

// dep 2

Period.prototype.generateDisplayProperties = function() {
    var p = this;

    var id = p.id,
        months = 'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec'.split('|'),
        offset = parseInt(p.year) - (new Date()).getFullYear(),
        generator = refs.calendarManager.generator,
        getSuffix = function(array) {
            return array.length > 1 ? 's' : '';
        };

    var type = p.getTypeById(id);

    if (type === 'Daily') {
        this.sortId = id;
        this.typeSortId = '01';
        this.typeName = 'Daily';
        this.displayName = parseInt(this.name.split('-')[2]) + ' ' + months[(new Date(this.name)).getMonth()] + ', ' + this.year;

        this.getContextMenuItemsConfig = function() {
            var items = [];

            // drill up
            items.push({
                isSubtitle: true,
                style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
                text: this.i18n.drill_up
            });

            // financial april
            (function() {
                items.push({
                    items: p.getItemsByTypeByDay('FinancialApril'),
                    text: 'Show <span class="name">financial April ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // financial july
            (function() {
                items.push({
                    items: p.getItemsByTypeByDay('FinancialJuly'),
                    text: 'Show <span class="name">financial July ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // financial october
            (function() {
                items.push({
                    items: p.getItemsByTypeByDay('FinancialOct'),
                    text: 'Show <span class="name">financial October ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // yearly
            (function() {
                items.push({
                    items: p.getItemsByTypeByDay('Yearly'),
                    text: 'Show <span class="name">year ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // six-monthly april
            (function() {
                items.push({
                    items: p.getItemsByTypeByDay('SixMonthlyApril'),
                    text: 'Show <span class="name">six-month April ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // six-monthly
            (function() {
                items.push({
                    items: p.getItemsByTypeByDay('SixMonthly'),
                    text: 'Show <span class="name">six-month ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // quarterly
            (function() {
                items.push({
                    items: p.getItemsByTypeByDay('Quarterly'),
                    text: 'Show <span class="name">quarter ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // bi-monthly
            (function() {
                items.push({
                    items: p.getItemsByTypeByDay('BiMonthly'),
                    text: 'Show <span class="name">bi-month ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // monthly
            (function() {
                items.push({
                    items: p.getItemsByTypeByDay('Monthly'),
                    text: 'Show <span class="name">month ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // weekly
            (function() {
                items.push({
                    items: p.getItemsByTypeByDay('Weekly'),
                    text: 'Show <span class="name">week ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // same level
            items.push({
                isSubtitle: true,
                style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
                text: this.i18n.daily
            });

            items.push({
                items: p.getItemsByTypeByDay('Daily'),
                text: 'Show <span class="name">' + p.displayName + '</span> only',
                iconCls: 'ns-menu-item-float'
            });

            items.push({
                items: p.getItemsByTypeByDay('Daily', true),
                text: 'Show all <span class="name">days</span> in <span class="name">' + p.year + '</span>',
                iconCls: 'ns-menu-item-float'
            });

            return items;
        };
    }
    else if (type === 'Weekly') {
        this.sortId = function() {
            var a = id.split('W');
            return a[0] + (a[1].length === 1 ? '000' : '00') + a[1];
        }();
        this.typeSortId = '02';
        this.typeName = 'Weekly';
        this.displayName = 'Week ' + id.split('W')[1] + ', ' + this.year;

        this.getContextMenuItemsConfig = function() {
            var items = [];

            // drill up
            items.push({
                isSubtitle: true,
                style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
                text: this.i18n.drill_up
            });

            // financial april
            (function() {
                items.push({
                    items: p.getItemsByTypeByWeek('FinancialApril'),
                    text: 'Show <span class="name">financial April ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // financial july
            (function() {
                items.push({
                    items: p.getItemsByTypeByWeek('FinancialJuly'),
                    text: 'Show <span class="name">financial July ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // financial october
            (function() {
                var periods = p.getItemsByTypeByWeek('FinancialOct');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">financial October' + getSuffix(periods) + ' ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // yearly
            (function() {
                items.push({
                    items: p.getItemsByTypeByWeek('Yearly'),
                    text: 'Show <span class="name">' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // six-monthly april
            (function() {
                items.push({
                    items: p.getItemsByTypeByWeek('SixMonthlyApril'),
                    text: 'Show <span class="name">six-month April ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // six-monthly
            (function() {
                items.push({
                    items: p.getItemsByTypeByWeek('SixMonthly'),
                    text: 'Show <span class="name">six-month ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // quarterly
            (function() {
                items.push({
                    items: p.getItemsByTypeByWeek('Quarterly'),
                    text: 'Show <span class="name">quarter ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // bi-monthly
            (function() {
                items.push({
                    items: p.getItemsByTypeByWeek('BiMonthly'),
                    text: 'Show <span class="name">bi-month ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // monthly
            (function() {
                var periods = p.getItemsByTypeByWeek('Monthly');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">month' + getSuffix(periods) + ' ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // same level
            items.push({
                isSubtitle: true,
                style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
                text: this.i18n.weekly
            });

            items.push({
                items: p.getItemsByTypeByWeek('Weekly'),
                text: 'Show <span class="name">' + p.displayName + '</span> only',
                iconCls: 'ns-menu-item-float'
            });

            items.push({
                items: p.getItemsByTypeByWeek('Weekly', true),
                text: 'Show all <span class="name">weeks</span> in <span class="name">' + p.year + '</span>',
                iconCls: 'ns-menu-item-float'
            });

            // drill down
            items.push({
                isSubtitle: true,
                style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
                text: this.i18n.drill_down
            });

            // daily
            (function() {
                items.push({
                    items: p.getItemsByTypeByWeek('Daily'),
                    text: 'Show <span class="name">days</span> in <span class="name">' + p.displayName + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            return items;
        };
    }
    else if (type === 'Monthly') {
        this.sortId = this.year + '00' + id.slice(4,6);
        this.typeSortId = '03';
        this.typeName = 'Monthly';
        this.displayName = this.name.split(' ')[0] + ' ' + this.year;

        this.getContextMenuItemsConfig = function() {
            var items = [];

            // drill up
            items.push({
                isSubtitle: true,
                style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
                text: this.i18n.drill_up
            });

            // financial april
            (function() {
                var periods = p.getItemsByTypeByMonth('FinancialApril');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">financial April' + getSuffix(periods) + ' ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // financial july
            (function() {
                var periods = p.getItemsByTypeByMonth('FinancialJuly');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">financial July' + getSuffix(periods) + ' ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // financial october
            (function() {
                var periods = p.getItemsByTypeByMonth('FinancialOct');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">financial October' + getSuffix(periods) + ' ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // yearly
            (function() {
                var periods = p.getItemsByTypeByMonth('Yearly');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">year' + getSuffix(periods) + ' ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // six-monthly april
            (function() {
                var periods = p.getItemsByTypeByMonth('SixMonthlyApril');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">six-month April' + getSuffix(periods) + ' ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // six-monthly
            (function() {
                var periods = p.getItemsByTypeByMonth('SixMonthly');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">' + p.getNameByParents(periods, 'six-month') + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // quarterly
            (function() {
                var periods = p.getItemsByTypeByMonth('Quarterly');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">' + p.getNameByParents(periods, 'quarter') + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // bi-monthly
            (function() {
                var periods = p.getItemsByTypeByMonth('BiMonthly');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">' + p.getNameByParents(periods, 'bimonthly') + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // same level
            items.push({
                isSubtitle: true,
                style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
                text: this.i18n.monthly
            });

            items.push({
                items: p.getItemsByTypeByMonth('Monthly'),
                text: 'Show <span class="name">' + p.displayName + '</span> only',
                iconCls: 'ns-menu-item-float'
            });

            items.push({
                items: p.getItemsByTypeByMonth('Monthly', true),
                text: 'Show all <span class="name">months</span> in <span class="name">' + p.year + '</span>',
                iconCls: 'ns-menu-item-float'
            });

            // drill down
            items.push({
                isSubtitle: true,
                style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
                text: this.i18n.drill_down
            });

            // weekly
            (function() {
                items.push({
                    items: p.getItemsByTypeByMonth('Weekly'),
                    text: 'Show <span class="name">weeks</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // daily
            (function() {
                items.push({
                    items: p.getItemsByTypeByMonth('Daily'),
                    text: 'Show <span class="name">days</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            return items;
        };
    }
    else if (type === 'BiMonthly') {
        this.sortId = id.slice(0, 4) + '00' + id.slice(4,6);
        this.typeSortId = '04';
        this.typeName = 'Bi-monthly';
        this.displayName = stringTrim(this.name.split(this.year)[0]);

        this.getContextMenuItemsConfig = function() {
            var items = [];

            // drill up
            items.push({
                isSubtitle: true,
                style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
                text: this.i18n.drill_up
            });

            // financial april
            (function() {
                var periods = p.getItemsByTypeByBimonth('FinancialApril');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">financial April' + getSuffix(periods) + ' ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // financial july
            (function() {
                var periods = p.getItemsByTypeByBimonth('FinancialJuly');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">financial July' + getSuffix(periods) + ' ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // financial october
            (function() {
                var periods = p.getItemsByTypeByBimonth('FinancialOct');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">financial October' + getSuffix(periods) + ' ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // yearly
            (function() {
                var periods = p.getItemsByTypeByBimonth('Yearly');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // six-monthly april
            (function() {
                var periods = p.getItemsByTypeByBimonth('SixMonthlyApril');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">' + p.getNameByParents(periods, 'six-month') + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // six-monthly
            (function() {
                var periods = p.getItemsByTypeByBimonth('SixMonthly');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">' + p.getNameByParents(periods, 'six-month') + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // quarterly
            (function() {
                var periods = p.getItemsByTypeByBimonth('Quarterly');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">' + p.getNameByParents(periods, 'quarter') + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // same level
            items.push({
                isSubtitle: true,
                style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
                text: this.i18n.bimonthly
            });

            // bimonthly
            items.push({
                items: p.getItemsByTypeByBimonth('BiMonthly'),
                text: 'Show <span class="name">' + p.displayName + '</span> only',
                iconCls: 'ns-menu-item-float'
            });

            items.push({
                items: p.getItemsByTypeByBimonth('BiMonthly', true),
                text: 'Show all <span class="name">bi-months</span> in <span class="name">' + p.year + '</span>',
                iconCls: 'ns-menu-item-float'
            });

            // drill down
            items.push({
                isSubtitle: true,
                style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
                text: this.i18n.drill_down
            });

            // monthly
            (function() {
                items.push({
                    items: p.getItemsByTypeByBimonth('Monthly'),
                    text: 'Show <span class="name">months</span> in <span class="name">' + p.displayName + ' ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // weekly
            (function() {
                items.push({
                    items: p.getItemsByTypeByBimonth('Weekly'),
                    text: 'Show <span class="name">weeks</span> in <span class="name">' + p.displayName + ' ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // daily
            (function() {
                items.push({
                    items: p.getItemsByTypeByBimonth('Daily'),
                    text: 'Show <span class="name">days</span> in <span class="name">' + p.displayName + ' ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            return items;
        };
    }
    else if (type === 'Quarterly') {
        this.sortId = function() {
            var a = id.split('Q');
            return a[0] + (a[1].length === 1 ? '000' : '00') + a[1];
        }();
        this.typeSortId = '05';
        this.typeName = 'Quarterly';
        this.displayName = stringTrim(this.name.split(this.year)[0]);

        this.getContextMenuItemsConfig = function() {
            var items = [];

            // drill up
            items.push({
                isSubtitle: true,
                style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
                text: this.i18n.drill_up
            });

            // financial april
            (function() {
                items.push({
                    items: p.getItemsByTypeByQuarter('FinancialApril'),
                    text: 'Show <span class="name">financial April ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // financial july
            (function() {
                items.push({
                    items: p.getItemsByTypeByQuarter('FinancialJuly'),
                    text: 'Show <span class="name">financial July ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // financial october
            (function() {
                items.push({
                    items: p.getItemsByTypeByQuarter('FinancialOct'),
                    text: 'Show <span class="name">financial October ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // yearly
            (function() {
                items.push({
                    items: p.getItemsByTypeByQuarter('Yearly'),
                    text: 'Show <span class="name">' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // six-monthly april
            (function() {
                items.push({
                    items: p.getItemsByTypeByQuarter('SixMonthlyApril'),
                    text: 'Show <span class="name">six-month April ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // six-monthly
            (function() {
                items.push({
                    items: p.getItemsByTypeByQuarter('SixMonthly'),
                    text: 'Show <span class="name">six-month ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // same level
            items.push({
                isSubtitle: true,
                style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
                text: this.i18n.quarterly
            });

            // quarterly
            items.push({
                items: p.getItemsByTypeByQuarter('Quarterly'),
                text: 'Show <span class="name">' + p.name + '</span> only',
                iconCls: 'ns-menu-item-float'
            });

            items.push({
                items: p.getItemsByTypeByQuarter('Quarterly', true),
                text: 'Show all <span class="name">quarters</span> in <span class="name">' + p.year + '</span>',
                iconCls: 'ns-menu-item-float'
            });

            // drill down
            items.push({
                isSubtitle: true,
                style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
                text: this.i18n.drill_down
            });

            // bi-monthly
            (function() {
                items.push({
                    items: p.getItemsByTypeByQuarter('BiMonthly'),
                    text: 'Show <span class="name">bi-months</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // monthly
            (function() {
                items.push({
                    items: p.getItemsByTypeByQuarter('Monthly'),
                    text: 'Show <span class="name">months</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // weekly
            (function() {
                items.push({
                    items: p.getItemsByTypeByQuarter('Weekly'),
                    text: 'Show <span class="name">weeks</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // daily
            (function() {
                items.push({
                    items: p.getItemsByTypeByQuarter('Daily'),
                    text: 'Show <span class="name">days</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            return items;
        };
    }
    else if (type === 'SixMonthly') {
        this.sortId = function() {
            var a = id.split('S');
            return a[0] + (a[1].length === 1 ? '000' : '00') + a[1];
        }();
        this.typeSortId = '06';
        this.typeName = 'Six-monthly';
        this.displayName = stringTrim(this.name.split(this.year)[0]);

        this.getContextMenuItemsConfig = function() {
            var items = [];

            // drill up
            items.push({
                isSubtitle: true,
                style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
                text: this.i18n.drill_up
            });

            // financial april
            (function() {
                var periods = p.getItemsByTypeBySixmonth('FinancialApril');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">financial April ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // financial july
            (function() {
                var periods = p.getItemsByTypeBySixmonth('FinancialJuly');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">financial July ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // financial october
            (function() {
                var periods = p.getItemsByTypeBySixmonth('FinancialOct');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">financial October' + getSuffix(periods) + ' ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // yearly
            (function() {
                var periods = p.getItemsByTypeBySixmonth('Yearly');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">year' + getSuffix(periods) + ' ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // six-monthly april
            (function() {
                var periods = p.getItemsByTypeBySixmonth('SixMonthlyApril');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">six-month April' + getSuffix(periods) + ' ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // same level
            items.push({
                isSubtitle: true,
                style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
                text: this.i18n.sixmonthly
            });

            // six-monthly
            items.push({
                items: p.getItemsByTypeBySixmonth('SixMonthly'),
                text: 'Show <span class="name">' + p.name + '</span> only',
                iconCls: 'ns-menu-item-float'
            });

            items.push({
                items: p.getItemsByTypeBySixmonth('SixMonthly', true),
                text: 'Show all <span class="name">six-months</span> in <span class="name">' + p.year + '</span>',
                iconCls: 'ns-menu-item-float'
            });

            // drill down
            items.push({
                isSubtitle: true,
                style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
                text: this.i18n.drill_down
            });

            // quarterly
            (function() {
                items.push({
                    items: p.getItemsByTypeBySixmonth('Quarterly'),
                    text: 'Show <span class="name">quarters</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // bi-monthly
            (function() {
                items.push({
                    items: p.getItemsByTypeBySixmonth('BiMonthly'),
                    text: 'Show <span class="name">bi-months</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // weekly
            (function() {
                items.push({
                    items: p.getItemsByTypeBySixmonth('Weekly'),
                    text: 'Show <span class="name">weeks</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // daily
            (function() {
                items.push({
                    items: p.getItemsByTypeBySixmonth('Daily'),
                    text: 'Show <span class="name">days</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            return items;
        };
        //return;
    }
    else if (type === 'SixMonthlyApril') {
        this.sortId = function() {
            var a = id.split('AprilS');
            return a[0] + (a[1].length === 1 ? '000' : '00') + a[1];
        }();
        this.typeSortId = '07';
        this.typeName = 'Six-monthly April';
        this.displayName = stringTrim(this.name.split(this.year)[0]);

        this.getContextMenuItemsConfig = function() {
            var items = [];

            // drill up
            items.push({
                isSubtitle: true,
                style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
                text: this.i18n.drill_up
            });

            // financial april
            (function() {
                var periods = p.getItemsByTypeBySixmonthApril('FinancialApril');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">financial Apri ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // financial july
            (function() {
                var periods = p.getItemsByTypeBySixmonthApril('FinancialJuly');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">financial July' + getSuffix(periods) + ' ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // financial october
            (function() {
                var periods = p.getItemsByTypeBySixmonthApril('FinancialOct');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">financial October' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // yearly
            (function() {
                var periods = p.getItemsByTypeBySixmonthApril('Yearly');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">' + (getSuffix(periods) ? 'parent years' :  p.year) + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // same level
            items.push({
                isSubtitle: true,
                style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
                text: this.i18n.sixmonthly
            });

            // six-monthly april
            items.push({
                items: p.getItemsByTypeBySixmonthApril('SixMonthlyApril'),
                text: 'Show <span class="name">' + p.name + '</span> only',
                iconCls: 'ns-menu-item-float'
            });

            items.push({
                items: p.getItemsByTypeBySixmonthApril('SixMonthlyApril', true),
                text: 'Show all <span class="name">six-month Aprils</span> in <span class="name">' + p.year + '</span>',
                iconCls: 'ns-menu-item-float'
            });

            // drill down
            items.push({
                isSubtitle: true,
                style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
                text: this.i18n.drill_down
            });

            // six-monthly
            (function() {
                var periods = p.getItemsByTypeBySixmonthApril('SixMonthly');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">six-months</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // quarterly
            (function() {
                items.push({
                    items: p.getItemsByTypeBySixmonthApril('Quarterly'),
                    text: 'Show <span class="name">quarters</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // bi-monthly
            (function() {
                items.push({
                    items: p.getItemsByTypeBySixmonthApril('BiMonthly'),
                    text: 'Show <span class="name">bi-months</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // weekly
            (function() {
                items.push({
                    items: p.getItemsByTypeBySixmonthApril('Weekly'),
                    text: 'Show <span class="name">weeks</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // daily
            (function() {
                items.push({
                    items: p.getItemsByTypeBySixmonthApril('Daily'),
                    text: 'Show <span class="name">days</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            return items;
        };
    }
    else if (type === 'Yearly') {
        this.sortId = id + '0000';
        this.typeSortId = '08';
        this.typeName = 'Yearly';
        this.displayName = this.name;

        this.getContextMenuItemsConfig = function() {
            var items = [];

            // drill up
            items.push({
                isSubtitle: true,
                style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
                text: this.i18n.drill_up
            });

            // financial april
            (function() {
                var periods = p.getItemsByTypeByYear('FinancialApril');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">financial April' + getSuffix(periods) + ' ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // financial july
            (function() {
                var periods = p.getItemsByTypeByYear('FinancialJuly');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">financial July' + getSuffix(periods) + ' ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // financial october
            (function() {
                var periods = p.getItemsByTypeByYear('FinancialOct');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">financial October' + getSuffix(periods) + ' ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // same level
            items.push({
                isSubtitle: true,
                style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
                text: this.i18n.yearly
            });

            items.push({
                items: p.getItemsByTypeByYear('Yearly'),
                text: 'Show <span class="name">' + p.displayName + '</span> only',
                iconCls: 'ns-menu-item-float'
            });

            // drill down
            items.push({
                isSubtitle: true,
                style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
                text: this.i18n.drill_down
            });

            // six-monthly april
            (function() {
                items.push({
                    items: p.getItemsByTypeByYear('SixMonthlyApril'),
                    text: 'Show <span class="name">six-month Aprils</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // six-monthly
            (function() {
                items.push({
                    items: p.getItemsByTypeByYear('SixMonthly'),
                    text: 'Show <span class="name">six-months</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // quarterly
            (function() {
                items.push({
                    items: p.getItemsByTypeByYear('Quarterly'),
                    text: 'Show <span class="name">quarters</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // bi-monthly
            (function() {
                items.push({
                    items: p.getItemsByTypeByYear('BiMonthly'),
                    text: 'Show <span class="name">bi-months</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // monthly
            (function() {
                items.push({
                    items: p.getItemsByTypeByYear('Monthly'),
                    text: 'Show <span class="name">months</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // weekly
            (function() {
                items.push({
                    items: p.getItemsByTypeByYear('Weekly'),
                    text: 'Show <span class="name">weeks</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // daily
            (function() {
                items.push({
                    items: p.getItemsByTypeByYear('Daily'),
                    text: 'Show <span class="name">days</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            return items;
        };
    }
    else if (type === 'FinancialOct') {
        this.sortId = id.slice(0, 4) + '0003';
        this.typeSortId = '11';
        this.typeName = 'Financial October';
        this.displayName = this.name;

        this.getContextMenuItemsConfig = function() {
            var items = [];

            // drill up
            items.push({
                isSubtitle: true,
                style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
                text: this.i18n.drill_up
            });

            // financial april
            (function() {
                var periods = p.getItemsByTypeByFinancialOct('FinancialApril');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">financial April' + getSuffix(periods) + ' ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // financial july
            (function() {
                var periods = p.getItemsByTypeByFinancialOct('FinancialJuly');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">financial July' + getSuffix(periods) + ' ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // same level
            items.push({
                isSubtitle: true,
                style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
                text: this.i18n.financial_oct
            });

            // financial october
            items.push({
                items: p.getItemsByTypeByFinancialOct('FinancialOct'),
                text: 'Show <span class="name">' + p.name + '</span> only',
                iconCls: 'ns-menu-item-float'
            });

            items.push({
                items: p.getItemsByTypeByFinancialOct('FinancialOct', true),
                text: 'Show all <span class="name">financial Octobers</span> in <span class="name">' + p.year + '</span>',
                iconCls: 'ns-menu-item-float'
            });

            // drill down
            items.push({
                isSubtitle: true,
                style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
                text: this.i18n.drill_down
            });

            // yearly
            (function() {
                items.push({
                    items: p.getItemsByTypeByFinancialOct('Yearly'),
                    text: 'Show <span class="name">years</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // six-monthly april
            (function() {
                items.push({
                    items: p.getItemsByTypeByFinancialOct('SixMonthlyApril'),
                    text: 'Show <span class="name">six-month Aprils</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // six-monthly
            (function() {
                items.push({
                    items: p.getItemsByTypeByFinancialOct('SixMonthly'),
                    text: 'Show <span class="name">six-months</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // quarterly
            (function() {
                items.push({
                    items: p.getItemsByTypeByFinancialOct('Quarterly'),
                    text: 'Show <span class="name">quarters</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // bi-monthly
            (function() {
                items.push({
                    items: p.getItemsByTypeByFinancialOct('BiMonthly'),
                    text: 'Show <span class="name">bi-months</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // monthly
            (function() {
                items.push({
                    items: p.getItemsByTypeByFinancialOct('Monthly'),
                    text: 'Show <span class="name">months</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // weekly
            (function() {
                items.push({
                    items: p.getItemsByTypeByFinancialOct('Weekly'),
                    text: 'Show <span class="name">weeks</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // daily
            (function() {
                items.push({
                    items: p.getItemsByTypeByFinancialOct('Daily'),
                    text: 'Show <span class="name">days</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            return items;
        };
    }
    else if (type === 'FinancialJuly') {
        this.sortId = id.slice(0, 4) + '0002';
        this.typeSortId = '10';
        this.typeName = 'Financial July';
        this.displayName = this.name;

        this.getContextMenuItemsConfig = function() {
            var items = [];

            // drill up
            items.push({
                isSubtitle: true,
                style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
                text: this.i18n.drill_up
            });

            // financial april
            (function() {
                var periods = p.getItemsByTypeByFinancialJuly('FinancialApril');

                items.push({
                    items: periods,
                    text: 'Show <span class="name">financial April' + getSuffix(periods) + ' ' + p.year + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // same level
            items.push({
                isSubtitle: true,
                style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
                text: this.i18n.financial_july
            });

            // financial july
            items.push({
                items: p.getItemsByTypeByFinancialJuly('FinancialJuly'),
                text: 'Show <span class="name">' + p.name + '</span> only',
                iconCls: 'ns-menu-item-float'
            });

            items.push({
                items: p.getItemsByTypeByFinancialJuly('FinancialJuly', true),
                text: 'Show all <span class="name">financial Julys</span> in <span class="name">' + p.year + '</span>',
                iconCls: 'ns-menu-item-float'
            });

            // drill down
            items.push({
                isSubtitle: true,
                style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
                text: this.i18n.drill_down
            });

            // financial oct
            (function() {
                items.push({
                    items: p.getItemsByTypeByFinancialJuly('FinancialOct'),
                    text: 'Show <span class="name">financial Octobers</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // yearly
            (function() {
                items.push({
                    items: p.getItemsByTypeByFinancialJuly('Yearly'),
                    text: 'Show <span class="name">years</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // six-monthly april
            (function() {
                items.push({
                    items: p.getItemsByTypeByFinancialJuly('SixMonthlyApril'),
                    text: 'Show <span class="name">six-month Aprils</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // six-monthly
            (function() {
                items.push({
                    items: p.getItemsByTypeByFinancialJuly('SixMonthly'),
                    text: 'Show <span class="name">six-months</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // quarterly
            (function() {
                items.push({
                    items: p.getItemsByTypeByFinancialJuly('Quarterly'),
                    text: 'Show <span class="name">quarters</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // bi-monthly
            (function() {
                items.push({
                    items: p.getItemsByTypeByFinancialJuly('BiMonthly'),
                    text: 'Show <span class="name">bi-months</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // monthly
            (function() {
                items.push({
                    items: p.getItemsByTypeByFinancialJuly('Monthly'),
                    text: 'Show <span class="name">months</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // weekly
            (function() {
                items.push({
                    items: p.getItemsByTypeByFinancialJuly('Weekly'),
                    text: 'Show <span class="name">weeks</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // daily
            (function() {
                items.push({
                    items: p.getItemsByTypeByFinancialJuly('Daily'),
                    text: 'Show <span class="name">days</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            return items;
        };
    }
    else if (type === 'FinancialApril') {
        this.sortId = id.slice(0, 4) + '0001';
        this.typeSortId = '09';
        this.typeName = 'Financial April';
        this.displayName = this.name;

        this.getContextMenuItemsConfig = function() {
            var items = [];

            // same level
            items.push({
                isSubtitle: true,
                style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
                text: this.i18n.financial_april
            });

            // financial april
            items.push({
                items: p.getItemsByTypeByFinancialApril('FinancialApril'),
                text: 'Show <span class="name">' + p.name + '</span> only',
                iconCls: 'ns-menu-item-float'
            });

            items.push({
                items: p.getItemsByTypeByFinancialApril('FinancialApril', true),
                text: 'Show all <span class="name">financial Aprils</span> in <span class="name">' + p.year + '</span>',
                iconCls: 'ns-menu-item-float'
            });

            // drill down
            items.push({
                isSubtitle: true,
                style: 'padding: 5px 5px 5px 5px; font-size: 120%; font-weight:bold',
                text: this.i18n.drill_down
            });

            // financial july
            (function() {
                items.push({
                    items: p.getItemsByTypeByFinancialApril('FinancialJuly'),
                    text: 'Show <span class="name">financial Julys</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // financial october
            (function() {
                items.push({
                    items: p.getItemsByTypeByFinancialApril('FinancialOct'),
                    text: 'Show <span class="name">financial Octobers</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // yearly
            (function() {
                items.push({
                    items: p.getItemsByTypeByFinancialApril('Yearly'),
                    text: 'Show <span class="name">years</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // six-monthly april
            (function() {
                items.push({
                    items: p.getItemsByTypeByFinancialApril('SixMonthlyApril'),
                    text: 'Show <span class="name">six-month Aprils</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // six-monthly
            (function() {
                items.push({
                    items: p.getItemsByTypeByFinancialApril('SixMonthly'),
                    text: 'Show <span class="name">six-months</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // quarterly
            (function() {
                items.push({
                    items: p.getItemsByTypeByFinancialApril('Quarterly'),
                    text: 'Show <span class="name">quarters</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // bi-monthly
            (function() {
                items.push({
                    items: p.getItemsByTypeByFinancialApril('BiMonthly'),
                    text: 'Show <span class="name">bi-months</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // monthly
            (function() {
                items.push({
                    items: p.getItemsByTypeByFinancialApril('Monthly'),
                    text: 'Show <span class="name">months</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // weekly
            (function() {
                items.push({
                    items: p.getItemsByTypeByFinancialApril('Weekly'),
                    text: 'Show <span class="name">weeks</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            // daily
            (function() {
                items.push({
                    items: p.getItemsByTypeByFinancialApril('Daily'),
                    text: 'Show <span class="name">days</span> in <span class="name">' + p.name + '</span>',
                    iconCls: 'ns-menu-item-float'
                });
            })();

            return items;
        };
    }
};
