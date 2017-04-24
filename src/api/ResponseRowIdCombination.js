import arrayContains from 'd2-utilizr/lib/arrayContains';
import arrayFrom from 'd2-utilizr/lib/arrayFrom';
import isArray from 'd2-utilizr/lib/isArray';
import isString from 'd2-utilizr/lib/isString';

export var ResponseRowIdCombination;

ResponseRowIdCombination = function(refs, config) {
    var t = this;

    config = isArray(config) ? config : (isString(config) ? config.split('-') : null);

    // constructor
    t.ids = config || [];
};

ResponseRowIdCombination.prototype.add = function(id) {
    if (id) {
        this.ids = this.ids.concat(id.split('-'));
    }
};

ResponseRowIdCombination.prototype.get = function() {
    return this.ids.join('-');
};

ResponseRowIdCombination.prototype.getNames = function(response) {
    return this.ids.map(id => response.getNameById(id));
};

ResponseRowIdCombination.prototype.getDxIdByIds = function(dxIds) {
    return this.ids.filter(id => arrayContains(arrayFrom(dxIds), id))[0];
};

ResponseRowIdCombination.prototype.getPeIdbyIds = function(peIds) {
  return this.ids.filter(id => arrayContains(arrayFrom(peIds), id))[0];
};
