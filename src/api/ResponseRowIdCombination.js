import isString from 'd2-utilizr/lib/isString';
import isArray from 'd2-utilizr/lib/isArray';

export var ResponseRowIdCombination;

ResponseRowIdCombination = function(refs, config) {
    var t = this;

    config = isArray(config) ? config : (isString(config) ? config.split('-') : null);

    // constructor
    t.ids = config || [];
};

ResponseRowIdCombination.prototype.add = function(id) {
    if (id) {
        this.ids.push(id);
    }
};

ResponseRowIdCombination.prototype.get = function() {
    return this.ids.join('-');
};
