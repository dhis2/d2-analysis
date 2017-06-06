var scrollbarWidth = /\bchrome\b/.test(navigator.userAgent.toLowerCase()) ? 8 : 17;

export default {
    nameCmpWidth: 440 - scrollbarWidth,
    buttonCmpWidth: 20,
    operatorCmpWidth: 70,
    searchCmpWidth: 70,
    triggerCmpWidth: 17,
    valueCmpWidth: 235,
    rangeSetWidth: 135,
    namePadding: '3px 3px',
    margin: '3px 0 1px',
    removeCmpStyle: 'padding: 0; margin-left: 3px',
    defaultRangeSetId: 'default'
};
