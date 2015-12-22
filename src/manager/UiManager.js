import {isObject, arrayTo} from 'd2-utilizr';

export var UiManager;

UiManager = function() {
    var t = this;

    var components = {};

    // components
    t.register = function(cmp, name, force) {
        if (components.hasOwnProperty(name) && !force) {
            return;
        }

        return components[name] = cmp;
    };

    t.get = function(name) {
        return components[name];
    };

    // browser
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

    // multiselect
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

    // mask
    t.mask = function(component, message) {
        if (!isObject(component)) {
            console.log('mask: component not an object', component, message);
            return null;
        }

        message = message || 'Loading..';

        if (component.mask && component.mask.destroy) {
            component.mask.destroy();
            component.mask = null;
        }

        component.mask = new Ext.create('Ext.LoadMask', component, {
            shadow: false,
            msg: message,
            style: 'box-shadow:0',
            bodyStyle: 'box-shadow:0'
        });

        component.mask.show();
    };

    t.unmask = function(component) {
        if (!isObject(component)) {
            console.log('mask: component not an object', component, message);
            return null;
        }

        if (component.mask && component.mask.destroy) {
            component.mask.destroy();
            component.mask = null;
        }
    };

    // window
    t.setAnchorPosition = function(w, target) {
        var vpw = app.getViewportWidth(),
            targetx = target ? target.getPosition()[0] : 4,
            winw = w.getWidth(),
            y = target ? target.getPosition()[1] + target.getHeight() + 4 : 33;

        if ((targetx + winw) > vpw) {
            w.setPosition((vpw - winw - 2), y);
        }
        else {
            w.setPosition(targetx, y);
        }
    };

    t.addHideOnBlurHandler = function(w) {
        var el = Ext.get(Ext.query('.x-mask')[0]);

        el.on('click', function() {
            if (w.hideOnBlur) {
                w.hide();
            }
        });

        w.hasHideOnBlurHandler = true;
    };

    t.addDestroyOnBlurHandler = function(w) {
        var maskElements = Ext.query('.x-mask'),
            el = Ext.get(maskElements[0]);

        el.on('click', function() {
            if (w.destroyOnBlur) {
                w.destroy();
            }
        });

        w.hasDestroyOnBlurHandler = true;
    };
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
