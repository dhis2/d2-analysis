import {isObject, arrayTo} from 'd2-utilizr';

export var UiManager;

UiManager = function() {
    var t = this;

    var components = {};

    // components
    t.register = function(cmp, name, keep) {
        if (components.hasOwnProperty(name) && keep) {
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
        component = isObject(component) ? component : t.get(component || 'centerRegion');

        if (!isObject(component)) {
            console.log('mask: no component', component, message);
            return;
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
        component = isObject(component) ? component : t.get(component || 'centerRegion');

        if (!isObject(component)) {
            console.log('unmask: no component', component, message);
            return;
        }

        if (component.mask && component.mask.destroy) {
            component.mask.destroy();
            component.mask = null;
        }
    };

    // window
    t.setAnchorPosition = function(w, target) {
        //var vpw = app.getViewportWidth(),
        var vpw = this.getWidth(),
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

    // alert
    t.alert = function(obj) {
        var config = {},
            type,
            window;

        if (!obj || (isObject(obj) && !obj.message && !obj.responseText)) {
            return;
        }

        // if response object
        if (isObject(obj) && obj.responseText && !obj.message) {
            obj = JSON.parse(obj.responseText);
        }

        // if string
        if (isString(obj)) {
            obj = {
                status: 'ERROR',
                message: obj
            };
        }

        // web message
        type = (obj.status || 'INFO').toLowerCase();

        config.title = obj.status;
        config.iconCls = 'ns-window-title-messagebox ' + type;

        // html
        config.html = '';
        config.html += obj.httpStatusCode ? 'Code: ' + obj.httpStatusCode + '<br>' : '';
        config.html += obj.httpStatus ? 'Status: ' + obj.httpStatus + '<br><br>' : '';
        config.html += obj.message + (obj.message.substr(obj.message.length - 1) === '.' ? '' : '.');

        // bodyStyle
        config.bodyStyle = 'padding: 12px; background: #fff; max-width: 600px; max-height: ' + t.getHeight() / 2 + 'px';

        // destroy handler
        config.modal = true;
        config.destroyOnBlur = true;

        // listeners
        config.listeners = {
            show: function(w) {
                w.setPosition(w.getPosition()[0], w.getPosition()[1] / 2);

                if (!w.hasDestroyOnBlurHandler) {
                    t.addDestroyOnBlurHandler(w);
                }
            }
        };

        window = Ext.create('Ext.window.Window', config);

        window.show();
    };

    // right click
    t.enableRightClick = function() {
        document.body.oncontextmenu = true;
    };

    t.disableRightClick = function() {
        document.body.oncontextmenu = function() {
            return false;
        };
    };
};

UiManager.prototype.applyTo = function(modules) {
    var t = this;

    arrayTo(modules).forEach(function(module) {
        module.uiManager = t;
    });
};

UiManager.prototype.getWidth = function() {
    return this.get('viewport').getWidth();
};

UiManager.prototype.getHeight = function() {
    return this.get('viewport').getHeight();
};

UiManager.prototype.getUiState = function() {
    return this.get('viewport').getUiState();
};
