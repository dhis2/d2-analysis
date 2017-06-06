import arrayContains from 'd2-utilizr/lib/arrayContains';
import arrayClean from 'd2-utilizr/lib/arrayClean';
import uuid from 'd2-utilizr/lib/uuid';

export var EventDataTable;

EventDataTable = function(refs, layout, response) {
    var t = this;

    var { appManager, uiManager, i18nManager, dimensionConfig, optionConfig } = refs;

    var { ResponseRowIdCombination } = refs.api;

    var i18n = i18nManager.get();

    var FIXED_HEADERS = ['eventdate'];

    var filteredHeaders = response.getFilteredHeaders([].concat(FIXED_HEADERS, layout.getDimensionNames()));

    var rows = response.rows;
    var items = response.metaData.items;
    var cls = [];
    var html = '';

    var pager = response.metaData.pager;
    var count = pager.page * pager.pageSize - pager.pageSize;

    var sortableIdObjects = [];

    cls.push('pivot');
    cls.push(layout.displayDensity !== optionConfig.getDisplayDensity('normal') ? ' displaydensity-' + layout.displayDensity : null);
    cls.push(layout.fontSize !== optionConfig.getFontSize('normal') ? ' fontsize-' + layout.fontSize : null);

    html += '<table class="' + arrayClean(cls).join(' ') + '"><tr>';
    html += '<td class="pivot-dim pivot-dim-subtotal">' + '#' + '</td>';

    // get header indexes
    filteredHeaders.forEach(header => {
        var uid = uuid();

        html += '<td id="' + uid + '" class="pivot-dim td-sortable">' + header.column + '</td>';

        sortableIdObjects.push({
            id: header.name,
            uuid: uid
        });
    });

    html += '</tr>';

    // rows
    for (var i = 0, row, rowHtml; i < rows.length; i++) {
        row = rows[i];
        rowHtml = '';

        for (var ii = 0, header, rowValue, itemKey, name; ii < filteredHeaders.length; ii++) {
            header = filteredHeaders[ii];
            rowValue = row[header.index];

            itemKey = (header.isPrefix ? header.name + '_' : '') + rowValue;

            name = (items[itemKey] || {}).name || rowValue;

            //isBoolean = header.type === 'java.lang.Boolean';
            //str = row[header.index];
            //str = optionNames[header.name + str] || optionNames[str] || (isBoolean ? booleanNames[str] : null) || names[str] || str;
            //name = web.report.query.format(str);

            //if (header.name === 'ouname' && layout.showHierarchy) {
                //var a = Ext.Array.clean(name.split('/'));
                //name = '';

                //for (var k = 0, isLast; k < a.length; k++) {
                    //isLast = !!(i === a.length - 1);

                    //name += (!isLast ? '<span class="text-weak">' : '') + a[i] + (!isLast ? '</span>' : '') + (!isLast ? ' / ' : '');
                //}
            //}

            rowHtml += '<td class="pivot-value align-left">' + name + '</td>';
        }

        html += '<tr><td class="pivot-value align-right">' + (count + (i + 1)) + '</td>' + rowHtml + '</tr>';
    }

    html += '</table>';

    return {
        sortableIdObjects,
        html
    };
};
