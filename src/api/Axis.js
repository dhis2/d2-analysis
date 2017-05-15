import arrayFrom from 'd2-utilizr/lib/arrayFrom';

export var Axis;

Axis = function(refs, config) {
    var t = [];

    var { Axis, Dimension } = refs.api;

    config = arrayFrom(config);

    // constructor
    config.forEach(function(dimensionConfig) {
        t.push((new Dimension(refs, dimensionConfig)).val());
    });

    // prototype
    t.log = function(text, noError) {
        if (!noError) {
            console.log(text, this, config);
        }
    };

    t.val = function(noError) {
        if (!this.length) {
            this.log('(Axis) No dimensions', noError);
            return null;
        }

        return this;
    };

    t.add = function(dimensionConfig, skipValidation) {
        var dimension = skipValidation ? dimensionConfig : (new Dimension(refs, dimensionConfig)).val();

        if (dimension) {
            t.push(dimension);
        }
    };

    t.clone = function() {
        return Axis(refs, this);
    };

    t.empty = function() {
        var cache = t.slice(0);

        for (var i = 0, len = t.length; i < len; i++) {
            t.pop();
        }

        return cache;
    };

    t.getRecordIds = function(isSorted, asString) {
        var ids = asString ? '' : [];

        t.forEach(function(dimension, dIndex, dArray) {
            dimension.getRecordIds(isSorted, null, true).forEach(function(id, nIndex, nArray) {
                if (asString) {
                    ids += id + (nIndex !== nArray.length - 1 ? ', ' : '');
                }
                else {
                    ids.push(id);
                }
            });

            if (asString) {
                ids += (dIndex !== dArray.length - 1 ? ' - ' : '');
            }
        });

        return ids;
    };

    t.getRecordNames = function(isSorted, response, asString) {
        var names = asString ? '' : [];

        t.forEach(function(dimension, dIndex, dArray) {
            dimension.getRecordNames(isSorted, response, true).forEach(function(name, nIndex, nArray) {
                if (asString) {
                    names += name + (nIndex !== nArray.length - 1 ? ', ' : '');
                }
                else {
                    names.push(name);
                }
            });

            if (asString) {
                names += (dIndex !== dArray.length - 1 ? ' - ' : '');
            }
        });

        return names;
    };

    t.getDimension = function(dimensionName) {
        return this.find(function(dimension) {
            return dimension.dimension === dimensionName;
        });
    };

    t.getDimensionNames = function() {
        var names = [];

        this.forEach(function(dimension) {
            names.push(dimension.dimension);
        });

        return names;
    };

    t.has = function(dimensionName) {
        return !!t.getDimension(dimensionName);
    };

    t.sorted = function() {
        return t.clone().sort(function(a, b) {return a.dimension > b.dimension;});
    };

    t.extendRecords = function(response) {
        t.forEach(function(dimension) {
            dimension.extendRecords(response);
        });
    };

    t.strip = function() {
        var rest = [];

        while (t.length > 1) {
            rest.push(t.pop());
        }

        return rest.reverse();
    };

    t.toPlugin = function() {
        delete t.klass;

        t.forEach(function(item) {
            item.toPlugin();
        });
    };

    t.replaceDimensionByName = function(dimension) {
        for (let i = 0; i < this.length; ++i) {
            if (this[i].dimension === dimension.dimension) {
                this[i] = dimension;
            }
        }
    };

    return t;
};
