
/** Builds the pivot table, combining row dimension, column dimension and value table.
 * @param {number} rowStart 
 * @param {number} rowEnd 
 * @param {number} columnStart 
 * @param {number} columnEnd 
 * @returns {array}
 */
const buildTable = (rowStart, rowEnd, columnStart, columnEnd) => {
    let rowAxis = buildRowAxis(rowStart, rowEnd, columnStart),
        colAxis = buildColumnAxis(columnStart, columnEnd, rowStart),
        values = buildValueTable(rowStart, rowEnd, columnStart, columnEnd);

    for (let i = 0; i < rowAxis.length; i++) {
        rowAxis[i].push(...values[i]);
    }
    
    return toRow(colAxis).concat(rowAxis);
}

/** @description Builds the column axis dimension of the table.
 *  @param {number} columnStart 
 *  @param {number} columnEnd 
 *  @param {number} rowStart
 *  @return {array}
 */ 
const buildColumnAxis = (columnStart, columnEnd, rowStart) => {
    if (!colAxis.type) return getDimensionColArray();

    let axis = new Array(columnEnd - columnStart);

    for (let i=0,x=columnStart; x <= columnEnd; i++, x++) {
        axis[i] = buildColumnAxisColumn(x, rowStart);
    }

    return axis;
}

/** @description Builds the row axis dimension of the table.
 *  @param {number} rowStart 
 *  @param {number} rowEnd 
 *  @param {number} columnStart
 *  @return {array}  
 */ 
const buildRowAxis = (rowStart, rowEnd, columnStart) => {
    rowEnd -= colAxis.dims;

    let axis = new Array(rowEnd - rowStart);

    if(!rowAxis.type) {
        if (layout.showDimensionLabels) {
            axis[0] = [{ type: 'transparent', cls: 'pivot-transparent-row' }];
        }
        return axis;
    }
    
    for (let i=0,y=rowStart; y <= rowEnd; i++, y++) {
        axis[i] = buildRowAxisRow(y, columnStart);
    }

    return axis;
}

/** Builds the value table of the table.
 * @param {number} rowStart 
 * @param {number} rowEnd 
 * @param {number} columnStart 
 * @param {number} columnEnd 
 * @returns {array}
 */
const buildValueTable = function(rowStart, rowEnd, columnStart, columnEnd) {
    rowEnd    -= colAxis.dims;
    columnEnd -= rowAxis.dims;

    let table = buildTable2D(rowEnd - rowStart + 1, columnEnd - columnStart + 1);

    for (let i=0, y=rowStart; i < table.length; i++, y++) {
        for (let j=0, x=columnStart; j < table[i].length; j++, x++) {
            // TODO: FIX THIS
            // if (doSortableColumnHeaders()) {
            //     totalIdComb = new ResponseRowIdCombination(['total', rowAxis.ids[y]]);
            //     // idValueMap[totalIdComb.get()] = false ? null : cellCounter['totalRowAllCells' + x];
            // }

            table[i][j] = getValueCell(x, y);
        }
    }
    
    if (doRowPercentage()) transformRowPercentage(table);
    if (doColPercentage()) transformColPercentage(table);

    return table;
}