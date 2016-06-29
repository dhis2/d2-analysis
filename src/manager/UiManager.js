import isString from 'd2-utilizr/lib/isString';
import isObject from 'd2-utilizr/lib/isObject';
import isArray from 'd2-utilizr/lib/isArray';
import arrayTo from 'd2-utilizr/lib/arrayTo';

import {ConfirmWindow} from '../ui/ConfirmWindow';

export var UiManager;

UiManager = function(c) {
    var t = this;

    c = isObject(c) ? c : {};

    t.instanceManager = c.instanceManager;

    var components = {};

    var componentTags = {
        onCurrent: [],
        onFavorite: []
    };

    var defaultUpdateComponentName = 'centerRegion';

    var theme = 'meringue';

    var introHtml = '';

    t.i18nManager;

    // managers
    t.setInstanceManager = function(instanceManager) {
        t.instanceManager = instanceManager;
    };

    t.setI18nManager = function(i18nManager) {
        t.i18nManager = i18nManager;
    };

    // components
    t.reg = function(cmp, name, tags, keep) {
        if (components.hasOwnProperty(name) && keep) {
            return;
        }

        if (isString(tags)) {
            tags.split(',').forEach(function(item) {
                if (isArray(componentTags[item])) {
                    componentTags[item].push(cmp);
                }
            });
        }

        return components[name] = cmp;
    };

    t.unreg = function(name) {
        components[name] = null;
    };

    t.get = function(name) {
        return components[name] || document.getElementById(name) || null;
    };

    t.getUpdateComponent = function() {
        return t.get(defaultUpdateComponentName);
    };

    t.setUpdateComponent = function(name) {
        defaultUpdateComponentName = name;
    };

    t.componentFrom = function(param) {
        return isString(param) ? t.get(param) : param;
    };

    t.update = function(html, elementId) {
        html = html || t.getIntroHtml();

        var el = document.getElementById(elementId);

        if (elementId && el) {
            el.innerHTML = html;
            return;
        }

        t.getUpdateComponent() && t.getUpdateComponent().update(html);
    };

    // state
    t.setState = function(currentState, favoriteState, isFavorite, skipSelect) {
        var north = t.get('northRegion'),
            west = t.get('westRegion');

        // app, not plugin
        if (!t.instanceManager.isPlugin) {

            // set url state
            t.setUrlState(favoriteState ? ('?id=' + favoriteState.id) : '.');

            // toolbar
            if (north) {
                north.setState(currentState, isFavorite);
            }

                // current
            componentTags.onCurrent.forEach(function(item) {
                item.setDisabled(!(currentState && item.enable));
            });

                // favorite
            componentTags.onFavorite.forEach(function(item) {
                item.setDisabled(!(currentState && item.enable && isFavorite));
            });

            // west
            if (west && !skipSelect) {
                if (!currentState || isFavorite) {
                    west.setState(currentState);
                }
            }
        }

        // center
        if (!currentState) {
            t.update();
        }
    };

    t.setUrlState = function(text) {
        global.history.pushState(null, null, text);
    };

    // theme
    t.getTheme = function() {
        return theme;
    };

    t.setTheme = function(newTheme) {
        theme = newTheme;
    };

    t.getIntroHtml = function() {
        return introHtml;
    };

    t.setIntroHtml = function(html) {
        introHtml = html;
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
            selected.forEach(function(item) {
                array.push(a.store.getAt(a.store.findExact('id', item)));
            });
            s.store.add(array);
        }
        t.msFilterAvailable(a, s);
    };

    t.msSelectAll = function(a, s, isReverse) {
        var array = a.store.getRange();
        if (isReverse) {
            array.reverse();
        }
        s.store.add(array);
        t.msFilterAvailable(a, s);
    };

    t.msUnselect = function(a, s) {
        var selected = s.getValue();
        if (selected.length) {
            selected.forEach(function(id) {
                a.store.add(s.store.getAt(s.store.findExact('id', id)));
                s.store.remove(s.store.getAt(s.store.findExact('id', id)));
            });
            t.msFilterAvailable(a, s);
            a.store.sortStore();
        }
    };

    t.msUnselectAll = function(a, s) {
        a.store.add(s.store.getRange());
        s.store.removeAll();
        t.msFilterAvailable(a, s);
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
        component = isObject(component) ? component : t.get(component) || t.getUpdateComponent();

        if (!isObject(component)) {
            //console.log('mask: no component', component, message);
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
        component = isObject(component) ? component : t.get(component) || t.getUpdateComponent();

        if (!isObject(component)) {
            //console.log('unmask: no component', component, message);
            return;
        }

        if (component.mask && component.mask.destroy) {
            component.mask.destroy();
            component.mask = null;
        }
    };

    // window
    t.setAnchorPosition = function(w, target) {
        target = t.componentFrom(target);

        var txy = target.getPosition ? target.getPosition() : (target.getXY ? target.getXY() : null),
            th = target.getHeight(),
            vpw = t.get('viewport').getWidth(),
            ww = w.getWidth();

        var tx = txy[0],
            ty = txy[1] + th + 4;

        if ((tx + ww) > vpw) {
            w.setPosition((vpw - ww - 2), ty);
        }
        else {
            w.setPosition(tx, ty);
        }
    };

    t.getBodyMask = function() {
        return Ext.getBody().child('.x-mask');
    };

    t.addHideOnBlurHandler = function(w) {
        t.getBodyMask().on('click', function() {
            if (w.hideOnBlur) {
                w.hide();
            }
        });

        w.hasHideOnBlurHandler = true;
    };

    t.addDestroyOnBlurHandler = function(w) {
        t.getBodyMask().on('click', function() {
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

    // context menu
    t.enableRightClick = function() {
        document.body.oncontextmenu = true;
    };

    t.disableRightClick = function() {
        document.body.oncontextmenu = function() {
            return false;
        };
    };

    // confirm
    t.confirmUnsaved = function(fn) {
        var i18n = t.i18nManager ? t.i18nManager.get() : {};

        ConfirmWindow(c, i18n.you_have_unsaved_changes_discard, 'Discard', fn).show();
    };

    t.confirmReplace = function(fn) {
        var i18n = t.i18nManager ? t.i18nManager.get() : {};

        ConfirmWindow(c, i18n.favorite_name_exists_replace, i18n.replace, fn).show();
    };

    t.confirmDelete = function(fn) {
        var i18n = t.i18nManager ? t.i18nManager.get() : {};

        ConfirmWindow(c, i18n.delete_this_favorite, i18n.delete_, fn).show();
    };

    // redirect
    t.redirectCtrl = function(url, e) {
        if (e.button === 0 && !e.ctrlKey) {
            window.location.href = url;
        }
        else if ((e.ctrlKey && arrayContains([0,1], e.button)) || (!e.ctrlKey && e.button === 1)) {
            window.open(url, '_blank');
        }
    };

    // plugin
    t.getTitleHtml = function(text) {
        return text ? '<div style="' +
            'height:19px;' +
            'line-height:14px;' +
            'width:100%;' +
            'font:bold 12px LiberationSans,arial,sans-serif;' +
            'color:#333;' +
            'text-align:center;' +
            'letter-spacing:-0.1px">' +
            text +
            '</div>' : '';
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

UiManager.prototype.enableConfirmUnload = function() {
    var t = this;

    window.onbeforeunload = function(event) {
        return t.instanceManager && t.instanceManager.isStateUnsaved() ? ((typeof event ? event : window.event).returnValue = 'You have unsaved changes.') : null;
    };
};

UiManager.prototype.disableConfirmUnload = function() {
    window.onbeforeunload = function(event) {
        return null;
    };
};
