import isString from 'd2-utilizr/lib/isString';
import isArray from 'd2-utilizr/lib/isArray';

export var TableManager;

TableManager = function(c) {
    var t = this;

    var appManager = c.appManager,
        instanceManager = c.instanceManager,
        uiManager = c.uiManager,
        sessionStorageManager = c.sessionStorageManager;

    var toggleDirection = function(direction) {
        return direction.toUpperCase() === 'ASC' ? 'DESC' : 'ASC';
    };

    var onColumnHeaderMouseClick = function(layout, id) {
        if (layout.sorting && layout.sorting.id === id) {
            layout.sorting.direction = toggleDirection(layout.sorting.direction);
        }
        else {
            layout.sorting = {
                id: id,
                direction: 'DESC'
            };
        }

        uiManager.mask();

        instanceManager.getReport(layout, false, true);
    };

    var onColumnHeaderMouseOver = function(el) {
        var elObject = Ext.get(el);

        if (elObject) {
            elObject.addCls('pointer highlighted');
        }
    };

    var onColumnHeaderMouseOut = function(el) {
        var elObject = Ext.get(el);

        if (elObject) {
            elObject.removeCls('pointer highlighted');
        }
    };

    t.setColumnHeaderMouseHandlers = function(layout, table) {
        var elObjects = table.sortableIdObjects,
            idValueMap = table.idValueMap,
            el;

        elObjects.forEach(function(item) {
            el = Ext.get(item.uuid);

            el.dom.layout = layout;
            el.dom.metaDataId = item.id;
            el.dom.onColumnHeaderMouseClick = onColumnHeaderMouseClick;
            el.dom.onColumnHeaderMouseOver = onColumnHeaderMouseOver;
            el.dom.onColumnHeaderMouseOut = onColumnHeaderMouseOut;

            el.dom.setAttribute('onclick', 'this.onColumnHeaderMouseClick(this.layout, this.metaDataId)');
            el.dom.setAttribute('onmouseover', 'this.onColumnHeaderMouseOver(this)');
            el.dom.setAttribute('onmouseout', 'this.onColumnHeaderMouseOut(this)');
        });
    };

    var onValueMouseClick = function(layout, table, uuid) {
        var uuidObjectMap = table.getUuidObjectMap(),
            response = layout.getResponse(),
            parentGraphMap = {},
            objects = [],
            path = appManager.getPath(),
            menu;

        var uuids = table.uuidDimUuidsMap[uuid];

        // modify layout dimension items based on uuid objects

        // get objects
        for (var i = 0; i < uuids.length; i++) {
            objects.push(uuidObjectMap[uuids[i]]);
        }

        // clear layoutConfig dimension items
        layout.removeDimensionItems();

        // add new items
        for (var i = 0, obj, axis, dimension; i < objects.length; i++) {
            obj = objects[i];

            axis = obj.axis === 'col' ? layout.columns || [] : layout.rows || [];

            if (axis.length) {
                dimension = axis[obj.dim];

                dimension.add({
                    id: obj.id,
                    name: response.metaData.names[obj.id]
                });
            }
        }

        // parent graph map
        for (var i = 0, id; i < objects.length; i++) {
            id = objects[i].id;

            if (layout.parentGraphMap.hasOwnProperty(id)) {
                parentGraphMap[id] = layout.parentGraphMap[id];
            }
        }

        layout.parentGraphMap = parentGraphMap;

        // menu
        menu = Ext.create('Ext.menu.Menu', {
            shadow: true,
            showSeparator: false,
            items: [
                {
                    text: 'Open selection as chart' + '&nbsp;&nbsp;', //i18n
                    iconCls: 'ns-button-icon-chart',
                    param: 'chart',
                    handler: function() {
                        sessionStorageManager.set(layout, 'analytical', path + '/dhis-web-visualizer/index.html?s=analytical');
                    },
                    listeners: {
                        render: function() { //TODO
                            this.getEl().on('mouseover', function() {
                                onValueMenuMouseHover(table, uuid, 'mouseover', 'chart');
                            });

                            this.getEl().on('mouseout', function() {
                                onValueMenuMouseHover(table, uuid, 'mouseout', 'chart');
                            });
                        }
                    }
                },
                {
                    text: 'Open selection as map' + '&nbsp;&nbsp;', //i18n
                    iconCls: 'ns-button-icon-map',
                    param: 'map',
                    disabled: true,
                    handler: function() {
                        sessionStorageManager.set(layout, 'analytical', path + '/dhis-web-mapping/index.html?s=analytical');
                    },
                    listeners: {
                        render: function() {
                            this.getEl().on('mouseover', function() {
                                onValueMenuMouseHover(table, uuid, 'mouseover', 'map');
                            });

                            this.getEl().on('mouseout', function() {
                                onValueMenuMouseHover(table, uuid, 'mouseout', 'map');
                            });
                        }
                    }
                }
            ]
        });

        menu.showAt(function() {
            var el = Ext.get(uuid),
                xy = el.getXY();

            xy[0] += el.getWidth() - 5;
            xy[1] += el.getHeight() - 5;

            return xy;
        }());
    };

    var onValueMouseOver = function(uuid) {
        Ext.get(uuid).addCls('highlighted');
    };

    var onValueMouseOut = function(uuid) {
        Ext.get(uuid).removeCls('highlighted');
    };

    var onValueMenuMouseHover = function(table, uuid, event, param) {
        var uuidDimUuidsMap = table.uuidDimUuidsMap,
            dimUuids;

        // dimension elements
        if (param === 'chart') {
            if (isString(uuid) && isArray(uuidDimUuidsMap[uuid])) {
                dimUuids = uuidDimUuidsMap[uuid];

                for (var i = 0, el; i < dimUuids.length; i++) {
                    el = Ext.get(dimUuids[i]);

                    if (el) {
                        if (event === 'mouseover') {
                            el.addCls('highlighted');
                        }
                        else if (event === 'mouseout') {
                            el.removeCls('highlighted');
                        }
                    }
                }
            }
        }
    };

    t.setValueMouseHandlers = function(layout, table) {
        var uuidDimUuidsMap = table.uuidDimUuidsMap,
            valueEl;

        for (var key in uuidDimUuidsMap) {
            if (uuidDimUuidsMap.hasOwnProperty(key)) {
                valueEl = Ext.get(key);

                if (valueEl && parseFloat(valueEl.dom.textContent)) {
                    valueEl.dom.onValueMouseClick = onValueMouseClick;
                    valueEl.dom.onValueMouseOver = onValueMouseOver;
                    valueEl.dom.onValueMouseOut = onValueMouseOut;
                    valueEl.dom.layout = layout;
                    valueEl.dom.table = table;
                    valueEl.dom.setAttribute('onclick', 'this.onValueMouseClick(this.layout, this.table, this.id);');
                    valueEl.dom.setAttribute('onmouseover', 'this.onValueMouseOver(this);');
                    valueEl.dom.setAttribute('onmouseout', 'this.onValueMouseOut(this);');
                }
            }
        }
    };
};
