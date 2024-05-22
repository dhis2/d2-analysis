import isObject from 'd2-utilizr/lib/isObject';

export const toPatchData = properties => {
    if (!isObject(properties)) {
        throw `toPatchData: not an object: ${properties}`
    }

    return Object.entries(properties).reduce((arr, [key, value]) => {
        arr.push({
            op: 'add',
            path: `/${key}`,
            value
        })
        return arr
    }, [])
}
