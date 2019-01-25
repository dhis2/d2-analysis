import convertCtrlKey from '@dhis2/d2-ui-rich-text/editor/convertCtrlKey';

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

export const onMarkdownEditorKeyDown = function(f, e) {
    convertCtrlKey(e.browserEvent, (newValue, newCursorPos) => {
        const textarea = e.target;
        textarea.value = newValue;
        textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
};
