import isString from 'd2-utilizr/lib/isString';
import isObject from 'd2-utilizr/lib/isObject';

export var Record;

Record = function(config) {
    var t = this;
    t.klass = Record;

    config = isObject(config) ? config : {};

    // constructor
    t.id = config.id;
    t.name = config.name;

    // tmp 2.22
    t.objectName = config.objectName;

    if (isString(config.dimensionItemType)) {
        t.dimensionItemType = config.dimensionItemType;
    }
};

Record.prototype.log = function(text, noError) {
    if (!noError) {
        console.log(text, this);
    }
};

Record.prototype.val = function(noError) {
    if (!this || !isString(this.id)) {
        this.log('(Record) Id is not a string', noError);
        return null;
    }

    return this;
};

Record.prototype.setName = function(name, response) {
    var t = this,
        item = response ? (response.metaData.items[t.id] || {}) : {};

    t.name = t.name || name || (response ? (item || {}).name : undefined);
};

Record.prototype.toPlugin = function() {
    delete this.klass;
};

Record.prototype.toPost = function() {
    delete this.klass;
    delete this.name;
    delete this.dimensionItemType;
};
