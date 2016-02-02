import {arrayFrom} from 'd2-utilizr';
import {Dimension} from './Dimension.js';

export var Axis;

Axis = function(config) {
    var t = [];
    t.klass = Axis;

    config = arrayFrom(config);

    // constructor
    config.forEach(function(dimension) {
        t.push((new Dimension(dimension)).val());
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
        return clone(this).sort(function(a, b) {return a.dimension > b.dimension;});
    };

    t.toPlugin = function() {
        delete t.klass;

        t.forEach(function(item) {
            item.toPlugin();
        });
    };

    return t;
};
