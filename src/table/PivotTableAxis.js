import isArray from 'd2-utilizr/lib/isArray';
import arrayContains from 'd2-utilizr/lib/arrayContains';
import arrayPluck from 'd2-utilizr/lib/arrayPluck';
import arraySort from 'd2-utilizr/lib/arraySort';
import arrayRepeat from 'd2-utilizr/lib/arrayRepeat';
import uuid from 'd2-utilizr/lib/uuid';

import { defaultProxyGenerator } from './PivotTableUtils';

const axisTypes = [
    'col', 'row',
];

const spanTypes = {
    'col': 'colSpan',
    'row': 'rowSpan',
}

const ignoreKeys = [
    'dy', 'longitude', 'latitude',
];

export const PivotTableAxis = function(refs, layout, response, type) {
    
    if (!axisTypes.includes(type)) {
        throw TypeError();
    }

    this.type = type;
    this.spanType = spanTypes[type];
    this.size = 1;

    this.uuidObjectMap = {};
    this.items = [];
    this.span = [];
    this.ids = [];

    let aUniqueFloorWidth = [],
        aAccFloorWidth = [];

    if (type === 'col') {
        this.items = (layout.columns || []).filter(dim => !arrayContains(ignoreKeys, dim.dimension));
    }
    else if (type === 'row') {
        this.items = (layout.rows || []).filter(dim => !arrayContains(ignoreKeys, dim.dimension));
    }

    if (!(isArray(this.items) && this.items.length)) {
        return;
    }

    const dimensionIdsFilterFn = ids => ids.filter(id => !id.includes('EMPTY_UID'));

    const dimensionNameIdsMap = layout.getDimensionNameIdsMap(response, layout.hideNaData ? dimensionIdsFilterFn : null);

    const aaUniqueFloorIds = (() => {
        let dims;

        return this.items.map((dimension, index) => {
            if (dimension.sorted) dims = arrayPluck(dimension.items, 'id');
            else                  dims = dimensionNameIdsMap[dimension.dimension];

            this.size *= dims.length;
            aUniqueFloorWidth.push(dims.length);
            aAccFloorWidth.push(this.size);

            return dims;
        });
    })();


    this.dims = aaUniqueFloorIds.length;

    for (let i = 0; i < this.dims; i++) {
        this.span.push(this.size / aAccFloorWidth[i]);
    }

    const aaGuiFloorIds = aaUniqueFloorIds.map((ids, index) => {
        return arrayRepeat(ids, aAccFloorWidth[index - 1]);
    });

    const aaAllFloorIds = aaGuiFloorIds.map((id, index) => {
        return arrayRepeat(id, this.span[index], true);
    });

    const aaAllFloorObjects = aaAllFloorIds.map((ids, i) => {

        let siblingPosition = 0;
        let oldestObj;

        return ids.map((id, j) => {

            let obj = {
                id: id,
                uuid: uuid(),
                dim: i,
                leaf: i === aaAllFloorIds.length - 1,
                axis: type,
                isOrganisationUnit: response.hasIdByDimensionName(id, 'ou'),
            };

            this.uuidObjectMap[obj.uuid] = obj;

            if (j % this.span[i] === 0) {
                obj[this.spanType] = this.span[i];
                obj.children = obj.leaf ? 0 : null;
                obj.oldest = true;
                obj.root = i === 0;
                oldestObj = obj;
                siblingPosition = 0;
            }

            obj.oldestSibling = oldestObj;
            obj.siblingPosition = siblingPosition++;

            if ((aaUniqueFloorIds.length - 1) > i) {
                obj.children = aaUniqueFloorIds[i + 1].length;
            }

            return obj;
        });
    });

    // add parents if more than 1 floor
    if (this.dims > 1) {
        for (let i = 1, aAllFloor; i < this.dims; i++) {
            aAllFloor = aaAllFloorObjects[i];

            for (let j = 0; j < aAllFloor.length; j++) {
                aAllFloor[j].parent = aaAllFloorObjects[i - 1][j];
            }
        }
    }

    for (let i = 0, ids; i < this.size; i++) {
        ids = aaAllFloorIds.map((id) => id[i]);

        if (ids.length) {
            this.ids.push(ids.join('-'));
        }
    }

    // add uuids array to leaves
    if (aaAllFloorObjects.length) {

        // set span to second lowest span number: if aFloorSpan == [15,3,15,1], set span to 3
        let nSpan = this.dims > 1 ? arraySort(this.span.slice())[1] : this.size,
            aAllFloorObjectsLast = aaAllFloorObjects[aaAllFloorObjects.length - 1];

        for (let i = 0, leaf, parentUuids, obj, leafUuids = []; i < aAllFloorObjectsLast.length; i++) {
            leaf = aAllFloorObjectsLast[i];
            leafUuids.push(leaf.uuid);
            obj = leaf;
            parentUuids = [];

            // get the uuid of the oldest sibling
            while (obj = obj.parent) {
                parentUuids.push(!obj.root && obj.oldestSibling ?
                    obj.oldestSibling.uuid : obj.uuid);
            }

            // add parent uuids to leaf
            leaf.uuids = parentUuids.slice();

            // add uuid for all leaves
            if (leafUuids.length === nSpan) {
                for (let j = (i - nSpan) + 1, leaf; j <= i; j++) {
                    leaf = aAllFloorObjectsLast[j];
                    leaf.uuids.push(...leafUuids);
                }

                leafUuids = [];
            }
        }
    }
    
    this.xItems = {
        unique: aaUniqueFloorIds,
        gui: aaGuiFloorIds,
        all: aaAllFloorIds,
    };

    this.objects = {
        all: aaAllFloorObjects
    };

    this.uniqueFactor = this.getUniqueFactor();
};

PivotTableAxis.prototype.getSpanMap = function() {

    if (!this.span) {
        this.span = [];
    }

    return Array.from(this.span, value => defaultProxyGenerator(value));
}

// PivotTableAxis.prototype.getSize = function() {

//     let size = this.size;

//     if (!size) {
//         size = 1;
//         return size;
//     }

//     if (this.doColSubTotals())  {
//         size += this.size / this.uniqueFactor;
//     }
    
//     if (this.doColTotals()) {
//         size += 1;    
//     }
    
//     return size;
// }

PivotTableAxis.prototype.getUniqueFactor = function() {
    if (this.xItems && this.xItems.unique) {
        return this.xItems.unique.length < 2 ? 1 : 
            (this.size / this.xItems.unique[0].length);
    }
    return null;
};