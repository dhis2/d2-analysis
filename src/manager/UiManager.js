import {arrayTo} from 'd2-utilizr';

export var UiManager;

UiManager = function() {
     var t = this;

    // uninitialized
    t.viewport;
    t.menuRegion;

    // support
    t.getScrollbarSize = function() {
        var size,
            body = document.body,
            div = document.createElement('div');

        div.style.width = div.style.height = '100px';
        div.style.overflow = 'scroll';
        div.style.position = 'absolute';

        body.appendChild(div);

        size = {
            width: div.offsetWidth - div.clientWidth,
            height: div.offsetHeight - div.clientHeight
        };

        body.removeChild(div);

        return size;
    };

    t.isScrolled = function(e) {
        var el = e.srcElement,
            scrollBottom = el.scrollTop + ((el.clientHeight / el.scrollHeight) * el.scrollHeight);

        return scrollBottom / el.scrollHeight > 0.9;
    };

    t.msSetHeight = function(ms, panel, fill) {
        var toolbarHeight = 25,
            height;

        ms.forEach(function(item) {
            height = panel.getHeight() - fill - (item.hasToolbar ? toolbarHeight : 0);
            item.setHeight(height);
        });
    };

    t.msSelect = function(a, s) {
        var selected = a.getValue();
        if (selected.length) {
            var array = [];
            Ext.Array.each(selected, function(item) {
                array.push(a.store.getAt(a.store.findExact('id', item)));
            });
            s.store.add(array);
        }
        this.filterAvailable(a, s);
    };

    t.msSelectAll = function(a, s, isReverse) {
        var array = a.store.getRange();
        if (isReverse) {
            array.reverse();
        }
        s.store.add(array);
        this.filterAvailable(a, s);
    };

    t.msUnselect = function(a, s) {
        var selected = s.getValue();
        if (selected.length) {
            Ext.Array.each(selected, function(id) {
                a.store.add(s.store.getAt(s.store.findExact('id', id)));
                s.store.remove(s.store.getAt(s.store.findExact('id', id)));
            });
            this.filterAvailable(a, s);
            a.store.sortStore();
        }
    };

    t.msUnselectAll = function(a, s) {
        a.store.add(s.store.getRange());
        s.store.removeAll();
        this.filterAvailable(a, s);
        a.store.sortStore();
    };

    t.msFilterAvailable = function(a, s) {
        if (a.store.getRange().length && s.store.getRange().length) {
            var recordsToRemove = [];

            a.store.each( function(ar) {
                var removeRecord = false;

                s.store.each( function(sr) {
                    if (sr.data.id === ar.data.id) {
                        removeRecord = true;
                    }
                });

                if (removeRecord) {
                    recordsToRemove.push(ar);
                }
            });

            a.store.remove(recordsToRemove);
        }
    };
};

UiManager.prototype.addViewport = function(viewport) {
    this.viewport = viewport;
};

UiManager.prototype.addMenuRegion = function(viewport) {
    this.viewport = viewport;
};

UiManager.prototype.applyTo = function(modules) {
    var t = this;

    arrayTo(modules).forEach(function(module) {
        module.uiManager = t;
    });
};

UiManager.prototype.getHeight = function() {
    return this.getUi().viewport.getHeight();
};
