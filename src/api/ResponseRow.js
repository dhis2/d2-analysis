import arrayFrom from 'd2-utilizr/lib/arrayFrom';

export var ResponseRow;

ResponseRow = function(refs, config) {
    var t = arrayFrom(config);

    t.getAt = function(index) {
        return this[index];
    };

    t.setIdCombination = function(idCombination) {
        t.idCombination = idCombination;
    };

    t.getNames = function(response, ignoreIndexes) {
        if (!t.idCombination) {
            t.setIdCombination(new refs.api.ResponseRowIdCombination(refs, t));
        }

        return t.idCombination.getNames(response, ignoreIndexes);
    };

    t.toFloat = function(index) {
        t[index] = parseFloat(t[index]);
    };

    t.getRowHtml = function(response, trClass, tdClass, ignoreIndexes) {
        trClass = trClass ? ' class="' + trClass + '"' : '';
        tdClass = tdClass ? ' class="' + tdClass + '"' : '';

        var tdStyle = ' style="padding:0 5px"';

        return '<tr' + trClass + '>' + t.getNames(response, ignoreIndexes).map(name => '<td' + tdClass + tdStyle + '>' + name + '</td>').join('') + '</tr>';
    };

    // uninitialized
    t.idCombination;

    return t;
};
