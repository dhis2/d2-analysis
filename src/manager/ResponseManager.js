import arrayClean from 'd2-utilizr/lib/arrayClean';
import arrayInsert from 'd2-utilizr/lib/arrayInsert';
import clone from 'd2-utilizr/lib/clone';

export var ResponseManager;

ResponseManager = function() {
    var t = this;

    t.addOuHierarchyDimensions = function(response) {
        var headers = response.headers,
            ouHierarchy = response.metaData.ouHierarchy,
            rows = response.rows,
            ouIndex,
            numLevels = 0,
            initArray = [],
            newHeaders = [],
            a;

        if (!ouHierarchy) {
            return;
        }

        // get ou index
        for (var i = 0; i < headers.length; i++) {
            if (headers[i].name === 'ou') {
                ouIndex = i;
                break;
            }
        }

        // get numLevels
        for (var i = 0; i < rows.length; i++) {
            numLevels = Math.max(numLevels, arrayClean(ouHierarchy[rows[i][ouIndex]].split('/')).length);
        }

        // init array
        for (var i = 0; i < numLevels; i++) {
            initArray.push('');
        }

        // extend rows
        for (var i = 0, row, ouArray; i < rows.length; i++) {
            row = rows[i];
            ouArray = Ext.applyIf(arrayClean(ouHierarchy[row[ouIndex]].split('/')), clone(initArray));

            arrayInsert(row, ouIndex, ouArray);
        }

        // create new headers
        for (var i = 0; i < numLevels; i++) {
            newHeaders.push({
                column: 'Organisation unit',
                hidden: false,
                meta: true,
                name: 'ou',
                type: 'java.lang.String'
            });
        }

        arrayInsert(headers, ouIndex, newHeaders);

        return response;
    };

    t.printResponseCSV = function(response) {
        var headers = response.headers,
            names = response.metaData.names,
            rows = response.rows,
            csv = '',
            alink;

        // headers
        for (var i = 0; i < headers.length; i++) {
            csv += '"' + headers[i].column + '"' + (i < headers.length - 1 ? ',' : '\n');
        }

        // rows
        for (var i = 0; i < rows.length; i++) {
            for (var j = 0, id, isMeta; j < rows[i].length; j++) {
                val = rows[i][j];
                isMeta = headers[j].meta;

                csv += '"' + (isMeta && names[val] ? names[val] : val) + '"';
                csv += j < rows[i].length - 1 ? ',' : '\n';
            }
        }

        alink = document.createElement('a');
        alink.setAttribute('href', 'data:text/csv;charset=utf-8,' + encodeURIComponent(csv));
        alink.setAttribute('download', 'data.csv');
        alink.click();
    };
};
