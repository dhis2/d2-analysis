import isString from 'd2-utilizr/lib/isString';
import isArray from 'd2-utilizr/lib/isArray';
import arrayContains from 'd2-utilizr/lib/arrayContains';
import { Period } from '../api/Period';
import { Dimension } from '../api/Dimension';
import { OrganisationUnit } from '../api/OrganisationUnit';

export var TableManager;

TableManager = function(c) {
    var t = this;

    var appManager = c.appManager,
        instanceManager = c.instanceManager,
        uiManager = c.uiManager,
        sessionStorageManager = c.sessionStorageManager,
        dimensionConfig = c.dimensionConfig;

    // Metadata item types to provide details about
    var METADATA_DETAILED_TYPES = [
        'CATEGORY_OPTION',
        'DATA_ELEMENT',
        'PROGRAM_INDICATOR',
        'INDICATOR'
    ];

    var toggleDirection = function(direction) {
        return direction.toUpperCase() === 'ASC' ? 'DESC' : 'ASC';
    };

    var sortIdMap = {
        'pe': 'eventdate',
        'ou': 'ouname'
    };

    var getSortId = function(id, type) {
        if (type === dimensionConfig.dataType['aggregated_values']) {
            return id;
        }

        return sortIdMap[id] || id;
    };

    var onColumnHeaderMouseClick = function(layout, id) {
        var sortId = getSortId(id);

        if (layout.sorting && layout.sorting.id === sortId) {
            layout.sorting.direction = toggleDirection(layout.sorting.direction);
        }
        else {
            layout.sorting = {
                id: getSortId(id, layout.dataType),
                direction: 'DESC'
            };
        }

        instanceManager.getReport(layout);
    };

    var onColumnHeaderMouseOver = function(el) {
        var elObject = $(el);

        if (elObject) {
            elObject.addClass('pointer highlighted');
        }
    };

    var onColumnHeaderMouseOut = function(el) {
        var elObject = $(el);

        if (elObject) {
            elObject.removeClass('pointer highlighted');
        }
    };

    t.setColumnHeaderMouseHandlers = function(layout, table) {
        var elObjects = table.sortableIdObjects,
            dom;

        elObjects.forEach(function(item) {
            dom = document.getElementById(item.uuid);

            if (dom) {
                dom.layout = layout;
                dom.metaDataId = item.id;
                dom.onColumnHeaderMouseClick = onColumnHeaderMouseClick;
                dom.onColumnHeaderMouseOver = onColumnHeaderMouseOver;
                dom.onColumnHeaderMouseOut = onColumnHeaderMouseOut;

                dom.setAttribute('onclick', 'this.onColumnHeaderMouseClick(this.layout, this.metaDataId)');
                dom.setAttribute('onmouseover', 'this.onColumnHeaderMouseOver(this)');
                dom.setAttribute('onmouseout', 'this.onColumnHeaderMouseOut(this)');
            }
        });
    };

    var onValueMouseClick = function(layout, table, uuid) {
        var uuidObjectMap = table.getUuidObjectMap(),
            response = layout.getResponse(),
            parentGraphMap = {},
            objects = [],
            path = appManager.getPath(),
            dom = document.getElementById(uuid),
            periodId = dom.getAttribute('data-period-id'),
            ouId = dom.getAttribute('data-ou-id'),
            i18n = layout.getRefs().i18nManager.get(),
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

            axis = obj.axis === 'column' ? 
                layout.columns || [] : layout.rows || [];

            if (axis.length) {
                dimension = axis[obj.dim];

                dimension.add({
                    id: obj.id,
                    name: response.getNameById(obj.id)
                });
            }
        }

        // parent graph map
        for (var i = 0, id; i < objects.length; i++) {
            id = objects[i].id;

            if (layout.parentGraphMap && layout.parentGraphMap.hasOwnProperty(id)) {
                parentGraphMap[id] = layout.parentGraphMap[id];
            }
        }

        layout.parentGraphMap = parentGraphMap;

        layout.toSession();

        const menuItems = [
            {
                text: i18n.open_selection_as,
                iconCls: 'ns-menu-item-datasource',
                menu: [
                    {
                        text: i18n.open_selection_as_chart,
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
                        text: i18n.open_selection_as_map,
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
            }
        ];

        if (periodId) {
            const periodMenuItems = [];
            const period = new Period({
                id: periodId,
                name: response.getNameById(periodId)
            }, layout.getRefs());

            period.generateDisplayProperties();

            const periods = period.getContextMenuItemsConfig();

            for (let i = 0, periodItem; i < periods.length; ++i) {
                periodItem = periods[i];

                if (periodItem.isSubtitle) {
                    periodMenuItems.push({
                        xtype: 'label',
                        html: periodItem.text,
                        style: periodItem.style
                    });

                    continue;
                }

                periodMenuItems.push({
                    text: periodItem.text,
                    iconCls: periodItem.iconCls,
                    peReqItems: periodItem.items,
                    handler: function() {
                        const layout = instanceManager.getStateCurrent();
                        const peDimension = new Dimension(layout.getRefs(), { dimension: 'pe', items: this.peReqItems });

                        layout.replaceDimensionByName(peDimension);

                        layout.setResponse(null);

                        instanceManager.getReport(layout, false, false, true);
                    }
                });
            }

            menuItems.push({
                text: i18n.period_drill_down_up,
                iconCls: 'ns-menu-item-datasource',
                menu: periodMenuItems
            });
        }

        // menu
        menu = Ext.create('Ext.menu.Menu', {
            shadow: true,
            showSeparator: false,
            items: menuItems
        });

        if (ouId) {
            menu.add({
                uid: 'OU_MENU',
                text: i18n.organisation_units_drill_down || 'Org unit drill down/up',
                iconCls: 'ns-menu-item-datasource',
                menu: {
                    items: [
                        { html: '<div class="spinner"></div>' }
                    ]
                }
            });

            const ouMenu = menu.items.findBy(submenu => submenu.uid === 'OU_MENU');
            const organisationUnit = new OrganisationUnit(layout.getRefs(), { id: ouId });

            uiManager.mask();

            organisationUnit.getAncestorsRequest(true).done(function(data) {
                organisationUnit.setAncestors(data.ancestors);
                organisationUnit.setLevel(data.level);

                const organisationUnitMenuItems = organisationUnit.getContextMenuItemsConfig();

                // setting click handler
                for (var i = 0; i < organisationUnitMenuItems.length; ++i) {
                    const ou = organisationUnitMenuItems[i];

                    if (ou.isSubtitle) {
                        continue;
                    }

                    ou.handler = function() {
                        const layout = instanceManager.getStateCurrent();
                        const ouDimension = new Dimension(layout.getRefs(), { dimension: 'ou', items: this.items });

                        layout.replaceDimensionByName(ouDimension);

                        layout.setResponse(null);

                        instanceManager.getReport(layout, false, false, true);
                    };
                }

                ouMenu.menu.removeAll();
                ouMenu.menu.add(organisationUnitMenuItems);
                uiManager.unmask();
            });
        }

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
        var uuids = table.valueUuids,
            valueEl;

        for (var uuid in uuids) {
            valueEl = Ext.get(uuids[uuid]);

            if (valueEl && !isNaN(parseFloat(valueEl.dom.textContent))) {
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
    };

    t.setDimensionMouseHandlers = function(layout, table) {
        const response = layout.getResponse();

        const setMouseHandler = (obj) => {
            const item = response.metaData.items[obj.id];

            if (item && arrayContains(METADATA_DETAILED_TYPES, item.dimensionItemType)) {
                let html = `<p>Type: ${item.dimensionItemType}</p>`;

                if (item.description) {
                    html += `<p>Description: ${item.description}</p>`;
                }

                if (item.code) {
                    html += `<p>Code: ${item.code}</p>`
                }

                const tip = Ext.create('Ext.tip.ToolTip', {
                    target: Ext.get(obj.uuid),
                    bodyStyle: 'font-size: 110%',
                    html: html
                });

                Ext.get(obj.uuid).on({
                    mouseover: function() {
                        Ext.Function.createBuffered(tip.show, 1000, tip);
                    }
                })
            }
        };

        if (table.colAxis && table.colAxis.uuidObjectMap) {
            for (const key in table.colAxis.uuidObjectMap) {
                if (table.colAxis.uuidObjectMap.hasOwnProperty(key)) {
                    setMouseHandler(table.colAxis.uuidObjectMap[key]);
                }
            }
        }

        if (table.rowAxis && table.rowAxis.uuidObjectMap) {
            for (const key in table.rowAxis.uuidObjectMap) {
                if (table.rowAxis.uuidObjectMap.hasOwnProperty(key)) {
                    setMouseHandler(table.rowAxis.uuidObjectMap[key]);
                }
            }
        }
    }
};
