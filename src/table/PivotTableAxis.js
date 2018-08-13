import isArray from 'd2-utilizr/lib/isArray';
import arrayContains from 'd2-utilizr/lib/arrayContains';
import arrayPluck from 'd2-utilizr/lib/arrayPluck';
import arraySort from 'd2-utilizr/lib/arraySort';
import arrayRepeat from 'd2-utilizr/lib/arrayRepeat';
import uuid from 'd2-utilizr/lib/uuid';

import { COLUMN_AXIS, ROW_AXIS } from './PivotTableConstants';

import { defaultProxyGenerator } from './PivotTableUtils';

const spanTypes = {
    [COLUMN_AXIS]: 'colSpan',
    [ROW_AXIS]: 'rowSpan',
}

const ignoreKeys = [
    'dy', 'longitude', 'latitude',
];

export const PivotTableAxis = function(refs, layout, response, type) {

    this.type = type;
    this.spanType = spanTypes[type];
    this.size = 1;

    this.uuidObjectMap = {};
    this.items = [];
    this.span = [];
    this.ids = [];
    this.dimensionNames = [];

    if (type === COLUMN_AXIS) {
        this.items = (layout.columns || []).filter(dim => !arrayContains(ignoreKeys, dim.dimension));
        this.dimensionNames = layout.columns ? layout.columns.getDimensionNames() : [];
    }
    else if (type === ROW_AXIS) {
        this.items = (layout.rows || []).filter(dim => !arrayContains(ignoreKeys, dim.dimension));
        this.dimensionNames = layout.rows ? layout.rows.getDimensionNames() : [];
    }

    if (!(isArray(this.items) && this.items.length)) {
        return;
    }
    
    let aAccFloorWidth = [];

    const dimensionIdsFilterFn = ids => ids.filter(id => !id.includes('EMPTY_UID'));

    const dimensionNameIdsMap = layout.getDimensionNameIdsMap(response, layout.hideNaData ? dimensionIdsFilterFn : null);

    const aaUniqueFloorIds = (() => {
        let dims;

        return this.items.map(dimension => {
            if (dimension.sorted) dims = arrayPluck(dimension.items, 'id');
            else                  dims = dimensionNameIdsMap[dimension.dimension];

            this.size *= dims.length;
            aAccFloorWidth.push(this.size);

            return dims;
        });
    })();

    this.dims = aaUniqueFloorIds.length

    const aaGuiFloorIds = aaUniqueFloorIds.map((ids, dimensionIndex) => {
        this.span.push(this.size / aAccFloorWidth[dimensionIndex]);
        return arrayRepeat(ids, aAccFloorWidth[dimensionIndex - 1]);
    });

    const aaAllFloorIds = aaGuiFloorIds.map((id, dimensionIndex) => {
        return arrayRepeat(id, this.span[dimensionIndex], true);
    });
    
    let aaAllFloorObjects = new Array(this.dims);

    for (let dimensionIndex = 0; dimensionIndex < this.dims; dimensionIndex++) {

        let siblingPosition = 0;
        let oldestObj;

        let ids = aaAllFloorIds[dimensionIndex];

        aaAllFloorObjects[dimensionIndex] = ids.map((id, positionIndex) => {

            let dimensionObject = {
                id: id,
                uuid: uuid(),
                dim: dimensionIndex,
                leaf: dimensionIndex === this.dims - 1,
                axis: type,
                isOrganisationUnit: response.hasIdByDimensionName(id, 'ou'),
            };

            this.uuidObjectMap[dimensionObject.uuid] = dimensionObject;

            if (dimensionIndex !== 0) {
                dimensionObject.parent = aaAllFloorObjects[dimensionIndex - 1][positionIndex];
            }

            if (positionIndex % this.span[dimensionIndex] === 0) {
                dimensionObject[this.spanType] = this.span[dimensionIndex];
                dimensionObject.children = dimensionObject.leaf ? 0 : null;
                dimensionObject.oldest = true;
                dimensionObject.root = dimensionIndex === 0;
                oldestObj = dimensionObject;
                siblingPosition = 0;
            }

            if ((aaUniqueFloorIds.length - 1) > dimensionIndex) {
                dimensionObject.children = aaUniqueFloorIds[dimensionIndex + 1].length;
            }

            dimensionObject.oldestSibling = oldestObj;
            dimensionObject.siblingPosition = siblingPosition++;

            return dimensionObject;
        });
    }

    for (let positionIndex = 0, ids; positionIndex < this.size; positionIndex++) {
        ids = aaAllFloorIds.map(id => id[positionIndex]);

        if (ids.length) {
            this.ids.push(ids.join('-'));
        }
    }

    // add uuids array to leaves
    if (aaAllFloorObjects.length) {

        // set span to second lowest span number: if aFloorSpan == [15,3,15,1], set span to 3
        let nSpan = this.dims > 1 ? arraySort(this.span.slice())[1] : this.size;
            
        let aAllFloorObjectsLast = aaAllFloorObjects[aaAllFloorObjects.length - 1];

        for (let positionIndex = 0, leaf, parentUuids, obj, leafUuids = []; positionIndex < aAllFloorObjectsLast.length; positionIndex++) {
            
            leaf = aAllFloorObjectsLast[positionIndex];
            leafUuids.push(leaf.uuid);
            obj = leaf;
            parentUuids = [];

            // get the uuid of the oldest sibling
            while (obj = obj.parent) {
                parentUuids.push(!obj.root && obj.oldestSibling ?
                    obj.oldestSibling.uuid : obj.uuid);
            }

            // add parent uuids to leaf
            leaf.uuids = parentUuids;

            // add uuid for all leaves
            if (leafUuids.length === nSpan) {
                for (let j = (positionIndex - nSpan) + 1, leaf; j <= positionIndex; j++) {
                    leaf = aAllFloorObjectsLast[j];
                    leaf.uuids.push(...leafUuids);
                }

                leafUuids = [];
            }
        }
    }

    this.dims = this.dims ? this.dims : 1;
    
    this.xItems = {
        unique: aaUniqueFloorIds,
        gui: aaGuiFloorIds,
        all: aaAllFloorIds,
    };

    this.objects = {
        all: aaAllFloorObjects
    };

    this.uniqueFactor = this.getUniqueFactor();
    this.spanMap = this.getSpanMap();
};

PivotTableAxis.prototype.getSpanMap = function() {

    if (!this.span) {
        this.span = [];
    }

    return Array.from(this.span, value => defaultProxyGenerator(value));
}

PivotTableAxis.prototype.getSize = function(withSubTotals=false, withTotals=false) {

    let size = this.size;

    if (!size) {
        return 1;
    }

    if (withSubTotals)  {
        size += this.size / this.uniqueFactor;
    }
    
    if (withTotals) {
        size += 1;    
    }
    
    return size;
}

PivotTableAxis.prototype.getUniqueFactor = function() {
    
    if (this.xItems && this.xItems.unique) {
        return this.xItems.unique.length < 2 ? 
            1 : (this.size / this.xItems.unique[0].length);
    }
    
    return null;
};