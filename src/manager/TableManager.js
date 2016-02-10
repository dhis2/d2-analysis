export var TableManager;

TableManager = function(c) {
    var t = this,

        appManager = c.appManager,
        instanceManager = c.instanceManager,
        uiManager = c.uiManager;

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
console.log("layout to be run after sort click", layout);
        instanceManager.getReport(layout);
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
};
