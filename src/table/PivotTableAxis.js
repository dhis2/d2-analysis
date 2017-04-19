import isArray from 'd2-utilizr/lib/isArray';
import arrayContains from 'd2-utilizr/lib/arrayContains';
import arrayPluck from 'd2-utilizr/lib/arrayPluck';
import arraySort from 'd2-utilizr/lib/arraySort';
import arrayUnique from 'd2-utilizr/lib/arrayUnique';
import uuid from 'd2-utilizr/lib/uuid';

export var PivotTableAxis;

PivotTableAxis = function(refs, layout, response, type) {
    var spanType,
        aDimensions = [],
        nAxisWidth = 1,
        nAxisHeight,
        aaUniqueFloorIds,
        aUniqueFloorWidth = [],
        aAccFloorWidth = [],
        aFloorSpan = [],
        aaGuiFloorIds = [],
        aaAllFloorIds = [],
        aCondoId = [],
        aaAllFloorObjects = [],
        uuidObjectMap = {},
        ignoreKeys = ['dy', 'longitude', 'latitude'];

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

    // aaUniqueFloorIds: array of arrays with unique ids for each dimension floor
    aaUniqueFloorIds = function() {
        var a = [],
            dimensionNameIdsMap = layout.getDimensionNameIdsMap(response);

        aDimensions.forEach(function(dimension) {
            if (dimension.sorted) {
                a.push(arrayPluck(dimension.items, 'id'));
            }
            else {
                a.push(dimensionNameIdsMap[dimension.dimension]);
            }
        });

        return a;
    }();
//aaUniqueFloorIds  = [ [de-id1, de-id2, de-id3],
//                      [pe-id1],
//                      [ou-id1, ou-id2, ou-id3, ou-id4] ]

    // nAxisHeight
    nAxisHeight = aaUniqueFloorIds.length;
//nAxisHeight = 3


    // aUniqueFloorWidth, nAxisWidth, aAccFloorWidth
    for (var i = 0, nUniqueFloorWidth; i < nAxisHeight; i++) {
        nUniqueFloorWidth = aaUniqueFloorIds[i].length;

        aUniqueFloorWidth.push(nUniqueFloorWidth);
        nAxisWidth = nAxisWidth * nUniqueFloorWidth;
        aAccFloorWidth.push(nAxisWidth);
    }
//aUniqueFloorWidth = [3, 1, 4]
//nAxisWidth        = 12 (3 * 1 * 4)
//aAccFloorWidth    = [3, 3, 12]

    // aFloorSpan
    for (var i = 0; i < nAxisHeight; i++) {
        if (aUniqueFloorWidth[i] === 1) {
            if (i === 0) { // if top floor, set maximum span
                aFloorSpan.push(nAxisWidth);
            }
            else {
                if (layout.hideEmptyRows && type === 'row') {
                    aFloorSpan.push(nAxisWidth / aAccFloorWidth[i]);
                }
                else { //if just one item and not top level, use same span as top level
                    aFloorSpan.push(aFloorSpan[0]);
                }
            }
        }
        else {
            aFloorSpan.push(nAxisWidth / aAccFloorWidth[i]);
        }
    }
//aFloorSpan = [4, 12, 1]


    // aaGuiFloorIds
    aaGuiFloorIds.push(aaUniqueFloorIds[0]);

    if (nAxisHeight.length > 1) {
        for (var i = 1, a, n; i < nAxisHeight; i++) {
            a = [];
            n = aUniqueFloorWidth[i] === 1 ? aUniqueFloorWidth[0] : aAccFloorWidth[i-1];

            for (var j = 0; j < n; j++) {
                a = a.concat(aaUniqueFloorIds[i]);
            }

            aaGuiFloorIds.push(a);
        }
    }
//aaGuiFloorIds = [ [d1, d2, d3], (3)
//                  [p1, p2, p3, p4, p5, p1, p2, p3, p4, p5, p1, p2, p3, p4, p5], (15)
//                  [o1, o2, o1, o2, o1, o2, o1, o2, o1, o2, o1, o2, o1, o2, o1, o2, o1, o2...] (30)
//                ]

    // aaAllFloorIds
    for (var i = 0, aAllFloorIds, aUniqueFloorIds, span, factor; i < nAxisHeight; i++) {
        aAllFloorIds = [];
        aUniqueFloorIds = aaUniqueFloorIds[i];
        span = aFloorSpan[i];
        factor = nAxisWidth / (span * aUniqueFloorIds.length);

        for (var j = 0; j < factor; j++) {
            for (var k = 0; k < aUniqueFloorIds.length; k++) {
                for (var l = 0; l < span; l++) {
                    aAllFloorIds.push(aUniqueFloorIds[k]);
                }
            }
        }

        aaAllFloorIds.push(aAllFloorIds);
    }
//aaAllFloorIds = [ [d1, d1, d1, d1, d1, d1, d1, d1, d1, d1, d2, d2, d2, d2, d2, d2, d2, d2, d2, d2, d3, d3, d3, d3, d3, d3, d3, d3, d3, d3], (30)
//                  [p1, p2, p3, p4, p5, p1, p2, p3, p4, p5, p1, p2, p3, p4, p5, p1, p2, p3, p4, p5, p1, p2, p3, p4, p5, p1, p2, p3, p4, p5], (30)
//                  [o1, o2, o1, o2, o1, o2, o1, o2, o1, o2, o1, o2, o1, o2, o1, o2, o1, o2, o1, o2, o1, o2, o1, o2, o1, o2, o1, o2, o1, o2] (30)
//                ]

    // aCondoId
    for (var i = 0, ids; i < nAxisWidth; i++) {
        ids = [];

        for (var j = 0; j < nAxisHeight; j++) {
            ids.push(aaAllFloorIds[j][i]);
        }

        if (ids.length) {
            aCondoId.push(ids.join('-'));
        }
    }
//aCondoId = [ id11+id21+id31, id12+id22+id32, ... ]


    // allObjects
    for (var i = 0, allFloor; i < aaAllFloorIds.length; i++) {
        allFloor = [];

        for (var j = 0, obj; j < aaAllFloorIds[i].length; j++) {
            obj = {
                id: aaAllFloorIds[i][j],
                uuid: uuid(),
                dim: i,
                axis: type,
                isOrganisationUnit: response.getOrganisationUnitsIds().find(ou => ou === aaAllFloorIds[i][j]) !== undefined
            };

            // leaf?
            if (i === aaAllFloorIds.length - 1) {
                obj.leaf = true;
            }

            allFloor.push(obj);
        }

        aaAllFloorObjects.push(allFloor);
    }

    // add span and children
    for (var i = 0, aAboveFloorObjects, doorIds, uniqueDoorIds; i < aaAllFloorObjects.length; i++) {
        doorIds = [];

        for (var j = 0, obj, doorCount = 0, oldestObj; j < aaAllFloorObjects[i].length; j++) {

            obj = aaAllFloorObjects[i][j];
            doorIds.push(obj.id);

            if (doorCount === 0) {

                // span
                obj[spanType] = aFloorSpan[i];

                // children
                if (obj.leaf) {
                    obj.children = 0;
                }

                // first sibling
                obj.oldest = true;

                // root?
                if (i === 0) {
                    obj.root = true;
                }

                // tmp oldest uuid
                oldestObj = obj;
            }

            obj.oldestSibling = oldestObj;

            if (++doorCount === aFloorSpan[i]) {
                doorCount = 0;
            }
        }

        // set above floor door children to number of unique door ids on this floor
        if (i > 0) {
            aAboveFloorObjects = aaAllFloorObjects[i-1];
            uniqueDoorIds = arrayUnique(doorIds);

            for (var j = 0; j < aAboveFloorObjects.length; j++) {
                aAboveFloorObjects[j].children = uniqueDoorIds.length;
            }
        }
    }

    // add parents if more than 1 floor
    if (nAxisHeight > 1) {
        for (var i = 1, aAllFloor; i < nAxisHeight; i++) {
            aAllFloor = aaAllFloorObjects[i];

            //for (var j = 0, obj, doorCount = 0, span = aFloorSpan[i - 1], parentObj = aaAllFloorObjects[i - 1][0]; j < aAllFloor.length; j++) {
            for (var j = 0, doorCount = 0, span = aFloorSpan[i - 1]; j < aAllFloor.length; j++) {
                aAllFloor[j].parent = aaAllFloorObjects[i - 1][j];

                //doorCount++;

                //if (doorCount === span) {
                    //parentObj = aaAllFloorObjects[i - 1][j + 1];
                    //doorCount = 0;
                //}
            }
        }
    }

    // add uuids array to leaves
    if (aaAllFloorObjects.length) {

        // set span to second lowest span number: if aFloorSpan == [15,3,15,1], set span to 3
        var nSpan = nAxisHeight > 1 ? arraySort(aFloorSpan.slice())[1] : nAxisWidth,
            aAllFloorObjectsLast = aaAllFloorObjects[aaAllFloorObjects.length - 1];

        for (var i = 0, leaf, parentUuids, obj, leafUuids = []; i < aAllFloorObjectsLast.length; i++) {
            leaf = aAllFloorObjectsLast[i];
            leafUuids.push(leaf.uuid);
            parentUuids = [];
            obj = leaf;

            // get the uuid of the oldest sibling
            while (obj.parent) {
                obj = obj.parent;
                parentUuids.push(obj.oldestSibling.uuid);
            }

            // add parent uuids to leaf
            leaf.uuids = parentUuids.slice();

            // add uuid for all leaves
            if (leafUuids.length === nSpan) {
                for (var j = (i - nSpan) + 1, leaf; j <= i; j++) {
                    leaf = aAllFloorObjectsLast[j];
                    leaf.uuids = leaf.uuids.concat(leafUuids);
                }

                leafUuids = [];
            }
        }
    }

    // populate uuidObject map
    for (var i = 0; i < aaAllFloorObjects.length; i++) {
        for (var j = 0, object; j < aaAllFloorObjects[i].length; j++) {
            object = aaAllFloorObjects[i][j];

            uuidObjectMap[object.uuid] = object;
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
