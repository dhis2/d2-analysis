export const isTargetDiv = elementId => !!document.getElementById(elementId);

export const validateTargetDiv = (elementId, msg) => {
    if (!isTargetDiv(elementId)) {
        if (msg) {
            console.log(msg);
        }

        return false;
    }

    return true;
};