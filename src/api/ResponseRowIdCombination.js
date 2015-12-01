export var ResponseRowIdCombination;

ResponseRowIdCombination = function(config) {
    var t = this;

    config = isArray(config) ? config : (isString(config) ? config.split('-') : null);

    // constructor
    t.ids = config || [];
};

ResponseRowIdCombination.prototype.add = function(id) {
    this.ids.push(id);
};

ResponseRowIdCombination.prototype.get = function() {
    return this.ids.join('-');
};
