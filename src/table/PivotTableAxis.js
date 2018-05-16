import isArray from 'd2-utilizr/lib/isArray';
import arrayContains from 'd2-utilizr/lib/arrayContains';
import arrayPluck from 'd2-utilizr/lib/arrayPluck';
import arraySort from 'd2-utilizr/lib/arraySort';
import arrayUnique from 'd2-utilizr/lib/arrayUnique';
import arrayRepeat from 'd2-utilizr/lib/arrayRepeat';
import uuid from 'd2-utilizr/lib/uuid';

export const PivotTableAxis = function(refs, layout, response, type) {

    const ignoreKeys = [
        'dy', 'longitude', 'latitude'
    ];

    let spanType,
        aDimensions = [],
        nAxisWidth = 1,
        nAxisHeight,
        aUniqueFloorWidth = [],
        aAccFloorWidth = [],
        aFloorSpan = [],
        aCondoId = [],
        uuidObjectMap = {};

    if (type === 'col') {
        aDimensions = (layout.columns || []).filter(dim => !arrayContains(ignoreKeys, dim.dimension));
        spanType = 'colSpan';
    }
    else if (type === 'row') {
        aDimensions = (layout.rows || []).filter(dim => !arrayContains(ignoreKeys, dim.dimension));
        spanType = 'rowSpan';
    }

    if (!(isArray(aDimensions) && aDimensions.length)) {
        return;
    }

    const dimensionIdsFilterFn = ids => ids.filter(id => !id.includes('EMPTY_UID'));

    const dimensionNameIdsMap = layout.getDimensionNameIdsMap(response, layout.hideNaData ? dimensionIdsFilterFn : null);

    const tableSize = Object.keys(dimensionNameIdsMap).reduce((sum, id) => {
            return sum * dimensionNameIdsMap[id].length;
        }, 1);

    const aaUniqueFloorIds = function() {
        let dims;

        return aDimensions.map((dimension, index) => {
            if (dimension.sorted) dims = arrayPluck(dimension.items, 'id');
            else                  dims = dimensionNameIdsMap[dimension.dimension];

            nAxisWidth *= dims.length;
            aUniqueFloorWidth.push(dims.length);
            aAccFloorWidth.push(nAxisWidth);

            return dims;
        });
    }();

    nAxisHeight = aaUniqueFloorIds.length;

    for (let i=0; i < nAxisHeight; i++) {
        aFloorSpan.push(nAxisWidth / aAccFloorWidth[i]);
    }

    const aaGuiFloorIds = aaUniqueFloorIds.map((ids, index) => {
        return arrayRepeat(ids, aAccFloorWidth[index - 1]);
    });

    const aaAllFloorIds = aaGuiFloorIds.map((id, index) => {
        return arrayRepeat(id, aFloorSpan[index], true);
    });

    const aaAllFloorObjects = aaAllFloorIds.map((ids, i) => {

        let siblingPosition = 0,
            oldestObj;

        return ids.map((id, j) => {

            let obj = {
                id: aaAllFloorIds[i][j],
                uuid: uuid(),
                dim: i,
                leaf: i === aaAllFloorIds.length - 1,
                axis: type,
                isOrganisationUnit: response.hasIdByDimensionName(aaAllFloorIds[i][j], 'ou'),
            };

            uuidObjectMap[obj.uuid] = obj;

            if (j % aFloorSpan[i] === 0) {
                obj[spanType] = aFloorSpan[i];
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
    if (nAxisHeight > 1) {
        for (let i = 1, aAllFloor; i < nAxisHeight; i++) {
            aAllFloor = aaAllFloorObjects[i];

            //for (let j = 0, obj, doorCount = 0, span = aFloorSpan[i - 1], parentObj = aaAllFloorObjects[i - 1][0]; j < aAllFloor.length; j++) {
            for (let j = 0, doorCount = 0, span = aFloorSpan[i - 1]; j < aAllFloor.length; j++) {
                aAllFloor[j].parent = aaAllFloorObjects[i - 1][j];
            }
        }
    }

    for (let i = 0, ids; i < nAxisWidth; i++) {
        ids = aaAllFloorIds.map((id) => id[i]);

        if (ids.length) {
            aCondoId.push(ids.join('-'));
        }
    }

    // add uuids array to leaves
    if (aaAllFloorObjects.length) {

        // set span to second lowest span number: if aFloorSpan == [15,3,15,1], set span to 3
        let nSpan = nAxisHeight > 1 ? arraySort(aFloorSpan.slice())[1] : nAxisWidth,
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

    return {
        type: type,
        items: aDimensions,
        xItems: {
            unique: aaUniqueFloorIds,
            gui: aaGuiFloorIds,
            all: aaAllFloorIds
        },
        objects: {
            all: aaAllFloorObjects
        },
        ids: aCondoId,
        span: aFloorSpan,
        dims: nAxisHeight,
        size: nAxisWidth,
        uuidObjectMap: uuidObjectMap
    };
};