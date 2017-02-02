import uuid from 'd2-utilizr/lib/uuid';

export var EventDataTable;

EventDataTable = function(refs, layout, response) {
    var t = this;

    var { appManager, uiManager, dimensionConfig, optionConfig } = refs;

    var { ResponseRowIdCombination } = refs.api;

    var table = {};

    //var dimensionHeaders = xResponse.dimensionHeaders,
    var dimensionHeaders = response.headers,
        //rows = xResponse.rows,
        rows = response.rows,
        //names = xResponse.metaData.names,
        names = xResponse.metaData.names,
        optionNames = xResponse.metaData.optionNames,
        booleanNames = {
            '1': NS.i18n.yes,
            '0': NS.i18n.no
        },
        //pager = xResponse.metaData.pager,
        pager = response.metaData.pager,
        count = pager.page * pager.pageSize - pager.pageSize
        cls = 'pivot',
        html = '';

    table.sortableIdObjects = [];

    cls += layout.displayDensity && layout.displayDensity !== conf.finals.style.none ? ' displaydensity-' + layout.displayDensity : '';
    cls += layout.fontSize && layout.fontSize !== conf.finals.style.normal ? ' fontsize-' + layout.fontSize : '';

    html += '<table class="' + cls + '"><tr>';
    html += '<td class="pivot-dim pivot-dim-subtotal">' + '#' + '</td>';

    // get header indexes
    for (var i = 0, header, uuid; i < dimensionHeaders.length; i++) {
        header = dimensionHeaders[i];
        uuid = uuid();

        html += '<td id="' + uuid + '" class="pivot-dim td-sortable">' + header.column + '</td>';

        table.sortableIdObjects.push({
            id: header.name,
            uuid: uuid
        });
    }

    html += '</tr>';

    // rows
    for (var i = 0, row; i < rows.length; i++) {
        row = rows[i];
        html += '<tr>';
        html += '<td class="pivot-value align-right">' + (count + (i + 1)) + '</td>';

        for (var j = 0, str, header, name; j < dimensionHeaders.length; j++) {
            header = dimensionHeaders[j];
            isBoolean = header.type === 'java.lang.Boolean';
            str = row[header.index];
            str = optionNames[header.name + str] || optionNames[str] || (isBoolean ? booleanNames[str] : null) || names[str] || str;
            name = web.report.query.format(str);

            //if (header.name === 'ouname' && layout.showHierarchy) {
                //var a = Ext.Array.clean(name.split('/'));
                //name = '';

                //for (var k = 0, isLast; k < a.length; k++) {
                    //isLast = !!(i === a.length - 1);

                    //name += (!isLast ? '<span class="text-weak">' : '') + a[i] + (!isLast ? '</span>' : '') + (!isLast ? ' / ' : '');
                //}
            //}

            html += '<td class="pivot-value align-left">' + name + '</td>';
        }

        html += '</tr>';
    }

    html += '</table>';

    return {
        html: html
    };
};
