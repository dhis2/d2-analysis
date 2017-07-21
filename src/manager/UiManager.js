import isArray from 'd2-utilizr/lib/isArray';
import isFunction from 'd2-utilizr/lib/isFunction';
import isObject from 'd2-utilizr/lib/isObject';
import isString from 'd2-utilizr/lib/isString';
import arrayTo from 'd2-utilizr/lib/arrayTo';

import { ConfirmWindow } from '../ui/ConfirmWindow';

export var UiManager;

UiManager = function(refs) {
    var t = this;

    refs = isObject(refs) ? refs : {};

    t.appManager = refs.appManager;
    t.instanceManager = refs.instanceManager;
    t.i18nManager;

    t.preventMask = false;
    t.introHtmlIsAsync = false;

    var components = {};

    var componentTags = {
        onCurrent: [],
        onFavorite: []
    };

    var componentGroups = {};

    var defaultUpdateComponentName = 'centerRegion';

    var theme = 'meringue';

    var introHtml = '';

    var introFn = Function.prototype;
    var updateIntroHtml = Function.prototype;

    var updateFn = function(content, elementId) {
        var el = document.getElementById(elementId);

        if (elementId && el) {
            el.innerHTML = content;
            return;
        }

        if (content) {
            t.getUpdateComponent().update(content);
            return;
        }

        t.getIntroHtml().then(html => {
            t.getUpdateComponent().renew(html);
        });
    };

    var updateInterpretationFn = function(interpretation, layout) {
        var layout = layout || t.instanceManager.getStateCurrent();

        if (layout) {
            layout.applyInterpretation(interpretation);

            t.instanceManager.getReport(layout, true);
        }
    };

    var resizeHandlers = t.appManager.getEventHandlerArray();

    // setters
    t.setInstanceManager = function(instanceManager) {
        t.instanceManager = instanceManager;
    };

    t.setI18nManager = function(i18nManager) {
        t.i18nManager = i18nManager;
    };

    t.setUpdateFn = function(fn) {
        updateFn = fn;
    };

    t.setUpdateInterpretationFn = function(fn) {
        updateInterpretationFn = fn;
    };

    // components
    t.reg = function(cmp, name, tags, groups, doNotOverwrite) {
        if (components.hasOwnProperty(name) && doNotOverwrite) {
            return;
        }

        // cmp
        components[name] = cmp;

        // tags
        if (isString(tags)) {
            tags.split(',').forEach(function(tag) {
                if (isArray(componentTags[tag])) {
                    componentTags[tag].push(cmp);
                }
            });
        }

        // groups
        if (isString(groups)) {
            groups.split(',').forEach(function(group) {
                componentGroups[group] = isArray(componentGroups[group]) ? componentGroups[group] : [];
                componentGroups[group].push(cmp);
            });
        }

        return cmp;
    };

    t.unreg = function(name) {
        delete components[name];
    };

    t.get = function(name) {
        return components[name] || document.getElementById(name) || null;
    };

    t.subscribe = function(component, fn) {
        t.get(component) && t.get(component).subscribe(fn);
    }

    t.setScrollFn = function(component, fn) {
        t.get(component) && t.get(component).setScroll(fn);
    }

    t.scrollTo = function(component, x, y) {
        t.get(component) && t.get(component).scrollTo(x, y);
    }

    t.getByGroup = function(groupName) {
        return componentGroups[groupName];
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

    t.update = function(content, elementId) {
        updateFn(content, elementId);
    };

    t.updateInterpretation = function(interpretation, layout) {
        updateInterpretationFn(interpretation, layout);
    };

    // state
    t.setState = function(currentState, favoriteState, isFavorite, skipStateWest, forceUiState, skipStateCenter) {
        var north = t.get('northRegion'),
            west = t.get('westRegion'),
            east = t.get('eastRegion');

        // app, not plugin
        if (!t.instanceManager.plugin) {

            // set url state
            if (favoriteState) {
                t.setUrlState(('?id=' + favoriteState.id) + (favoriteState.interpretationId ? '&interpretationid=' + favoriteState.interpretationId : ''));
            }
            else {
                t.setUrlState('.');
            }

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
            if (forceUiState || (west && !skipStateWest && (!currentState || isFavorite))) {
                west.setState(currentState);
            }

            // east
            if (east) {
                east.setState(currentState);
            }
        }

        // set init text
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

    // intro
    t.getIntroHtml = function() {
        if (t.introHtmlIsAsync) {
            return updateIntroHtml();
        }
        return introHtml;
    };

    t.setUpdateIntroHtmlFn = function(fn) {
        updateIntroHtml = fn;
    }

    t.setIntroHtml = function(html) {
        return introHtml = html;
    };

    t.setIntroFn = function(fn) {
        introFn = fn;
    };

    t.callIntroFn = function() {
        introFn();
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

        if (!isObject(component) || t.preventMask) {
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

    // dialogue
    t.confirmUnsaved = function(title, fn) {
        var i18n = t.i18nManager ? t.i18nManager.get() : {};

        ConfirmWindow(refs, title, i18n.all_unsaved_changes_will_be_discarded_continue, null, fn).show();
    };

    t.confirmReplace = function(title, fn) {
        var i18n = t.i18nManager ? t.i18nManager.get() : {};

        ConfirmWindow(refs, title, i18n.existing_favorite_will_be_replaced_continue, null, fn).show();
    };

    t.confirmDelete = function(title, fn) {
        var i18n = t.i18nManager ? t.i18nManager.get() : {};

        ConfirmWindow(refs, title, i18n.this_favorite_will_be_deleted_continue, null, fn).show();
    };

    t.confirmCustom = function(title, msg, btnText, fn, applyConfig) {
        ConfirmWindow(refs, title, msg, btnText, fn, applyConfig).show();
    };

    t.confirmInterpretationDelete = function(fn) {
        var i18n = t.i18nManager ? t.i18nManager.get() : {};
        ConfirmWindow(refs, i18n.are_you_sure,
            i18n.this_interpretation_will_be_deleted_continue, null, fn).show();
    };

    t.confirmCommentDelete = function(fn) {
        var i18n = t.i18nManager ? t.i18nManager.get() : {};
        ConfirmWindow(refs, i18n.are_you_sure,
            i18n.this_comment_will_be_deleted_continue, null, fn).show();
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

    t.getEmbedHtml = function() {
        var text = '',
            version = 'v' + parseFloat(t.appManager.systemInfo.version.split('.').join('')),
            resource = t.instanceManager.apiResource,
            divId = resource + '1',
            pluginName = resource + 'Plugin',
            pluginFileName = (resource || '').toLowerCase(),
            layout = t.instanceManager.getStateCurrent();

        text += '<html>\n<head>\n';
        text += '<script src="//code.jquery.com/jquery-2.2.4.min.js"></script>\n';
        text += '<script src="//dhis2-cdn.org/' + version + '/plugin/' + pluginFileName + '.js"></script>\n';
        text += '</head>\n\n<body>\n';
        text += '<div id="' + divId + '"></div>\n\n';
        text += '<script>\n\n';
        text += pluginName + '.url = "<url to server>";\n';
        text += pluginName + '.username = "<username>";\n';
        text += pluginName + '.password = "<password>";\n\n';
        text += resource + 'Plugin.load([' + JSON.stringify(layout.toPlugin(divId), null, 2) + ']);\n\n';
        text += '</script>\n\n';
        text += '</body>\n</html>';

        return text;
    };

    t.renderLoadingIndicator = function(el) {
        $('#' + el).append('<div class="spinner"></div>');
    };

    // resize
    t.onResize = function(fn) {
        resizeHandlers.push(fn);
    };

    t.resize = function(params) {
        resizeHandlers.run(params);
    };

    // redirect
    t.openTableLayoutTab = function(layout, type, isNewTab) {
        layout = layout || t.instanceManager.getStateCurrent();
        type = type || 'xls';

        var url = layout.req(null, type, false, true).url();
        var target = isNewTab ? '_blank' : '_top';

        window.open(url, target);
    };

    t.openPlainDataSource = function(url, extraParamString, isNewTab) {
        url = (isString(url) ? url : url.url()) + (extraParamString || '');
        var target = isNewTab ? '_blank' : '_top';

        window.open(url, target);
    };

    t.openDataDump = function(layout, format, scheme, isNewTab) {
        layout = layout || t.instanceManager.getLayout();

        var includeFilter = false;

        if (layout) {
            var extraParams = [];

            layout.toRows(includeFilter);

            format = format || 'csv';

            if (layout.showHierarchy) {
                extraParams.push('showHierarchy=true');
            }

            extraParams.push('rows=' + layout.getDimensionNames(includeFilter).join(';'));

            var url = layout.req(null, format).url(extraParams);
            var target = isNewTab ? '_blank' : '_top';

            window.open(url, target);
        }
    };

    // svg
    t.getSvg = function() {
        var svg = Ext.query('svg');

        if (!(isArray(svg) && svg.length)) {
            alert('Browser does not support SVG');
            return;
        }

        svg = Ext.get(svg[0]);
        svg = svg.parent().dom.innerHTML;

        return svg;
    };

    t.submitSvgForm = function(type, filename) {
        var form = Ext.query('#exportForm')[0];
        var chart = this.get('chart');

        var svg = chart && isFunction(chart.getSVGForExport) ? chart.getSVGForExport() : this.getSvg();

        if (!svg) {
            return;
        }

        Ext.query('#svgField')[0].value = svg;
        Ext.query('#filenameField')[0].value = filename || 'Untitled';

        form.action = t.appManager.getPath() + '/api/svg.' + type;
        form.submit();
    };

    // helpers
    t.hexToRgb = function(hex) {
        var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);

        return result ? [
            parseInt(result[1], 16),
            parseInt(result[2], 16),
            parseInt(result[3], 16)
        ] : null;
    };

    t.calculateColorBrightness = function(rgb) {
        return Math.round(((parseInt(rgb[0]) * 299) + (parseInt(rgb[1]) * 587) + (parseInt(rgb[2]) * 114)) / 1000);
    };

    t.isColorBright = function(rgbColor) {
        return t.calculateColorBrightness(rgbColor) > 125;
    }
};

UiManager.prototype.applyTo = function(modules) {
    var t = this;

    arrayTo(modules).forEach(function(module) {
        module.uiManager = t;
    });
};

UiManager.prototype.getWidth = function(cmpName) {
    var t = this;

    var cmp = cmpName ? t.componentFrom(cmpName) : t.getUpdateComponent();

    return cmp.getWidth();
};

UiManager.prototype.getHeight = function(cmpName) {
    var t = this;

    var cmp = cmpName ? t.componentFrom(cmpName) : t.getUpdateComponent();

    return cmp.getHeight();
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
