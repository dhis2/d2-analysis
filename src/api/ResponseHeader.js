import isObject from 'd2-utilizr/lib/isObject';
import isNumeric from 'd2-utilizr/lib/isNumeric';

export var ResponseHeader;

ResponseHeader = function(refs, config) {
    var t = this;

    config = isObject(config) ? config : {};

    // constructor
    $.extend(this, config);

    // uninitialized
    t.index;
};

ResponseHeader.prototype.setIndex = function(index) {
    if (isNumeric(index)) {
        this.index = parseInt(index);
    }
};

ResponseHeader.prototype.getIndex = function(index) {
    return this.index;
};
