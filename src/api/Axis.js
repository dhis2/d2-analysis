import {arrayFrom} from 'd2-utilizr';
import {Dimension} from 'd2-analysis';

export var Axis;

Axis = function(config) {
    var t = [];

    config = arrayFrom(config);

    // constructor
    config.forEach(function(dimension) {
        t.push((new Dimension(dimension)).val());
    });

    // prototype
    t.log = function(text, noError) {
        if (!noError) {
            console.log(text, this);
        }
    };

    t.val = function(noError) {
        if (!this.length) {
            this.log('(Axis) No dimensions', noError);
            return null;
        }

        return this;
    };

    t.has = function(dimensionName) {
        return this.some(function(dimension) {
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

    t.sorted = function() {
        return clone(this).sort(function(a, b) { return a.dimension > b.dimension;});
    };

    return t;
};
