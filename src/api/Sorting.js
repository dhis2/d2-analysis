export var Sorting;

Sorting = function(refs, config) {
    var t = this;

    t.id = config.id || null;
    t.direction = config.direction || null;
    t.emptyFirst = config.emptyFirst || false;

    var _keyMap = {
        'asc': 'DESC',
        'desc': 'ASC'
    };

    t.getKeyMap = function() {
        return _keyMap;
    };
};

Sorting.prototype.toggleDirection = function() {
    this.direction = this.getKeyMap()[(this.direction || '').toLowerCase()];
};
