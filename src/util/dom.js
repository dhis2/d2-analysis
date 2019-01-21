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
    convertCtrlKey(e.browserEvent, newValue => {
        const textarea = e.target;
        const prevCursorPos = textarea.selectionEnd;
        textarea.value = newValue;
        if (prevCursorPos) {
            textarea.setSelectionRange(prevCursorPos + 1, prevCursorPos + 1);
        }
    });
};
