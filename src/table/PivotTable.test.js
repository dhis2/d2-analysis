const PivotTable = require('./PivotTable');
const PivotTableAxis = require('./PivotTable');

let rowAxis,
    colAxis;


before(() => {
    colAxis = new PivotTableAxis(refs, layout, response, 'col');
    rowAxis = new PivotTableAxis(refs, layout, response, 'row');

});

test('initialization of pivot table', () => {

});

test('building pivot table', () => {

    const table = new PivotTable(refs, layout, response, colAxis, rowAxis);
  
});

test('rendering pivot table', () => {
  
});
