export var ResponseRow;

ResponseRow = function(config) {
    var t = arrayFrom(config);

    t.getAt = function(index) {
        return this[index];
    };

    t.setIdCombination = function(idCombination) {
        this.idCombination = idCombination;
    };

    // uninitialized
    t.idCombination;

    return t;
};
