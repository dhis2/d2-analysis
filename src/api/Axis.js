import arrayFrom from 'd2-utilizr/lib/arrayFrom';
import {Dimension} from './Dimension.js';

export var Axis;

Axis = function(config) {
    var t = [];
    t.klass = Axis;

    config = arrayFrom(config);

    // constructor
    config.forEach(function(dimensionConfig) {
        t.push((new Dimension(dimensionConfig)).val());
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

    t.add = function(dimensionConfig) {
        var dimension = (new Dimension(dimensionConfig)).val();

        if (dimension) {
            t.push(dimension);
        }
    };

    t.clone = function() {
        return Axis(this);
    };

    t.empty = function() {
        var cache = t.slice(0);

        for (var i = 0, len = t.length; i < len; i++) {
            t.pop();
        }

        return cache;
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

    t.toPlugin = function() {
        delete t.klass;

        t.forEach(function(item) {
            item.toPlugin();
        });
    };

    return t;
};
