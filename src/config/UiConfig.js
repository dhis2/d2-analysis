import arrayTo from 'd2-utilizr/lib/arrayTo';

export var UiConfig;

UiConfig = function(branch = 'aggregate') {
    var t = this;

    var layout = {
        'aggregate': {
            west_width: 424,
            west_fieldset_width: 420,
            west_width_padding: 2,
            west_fill: 2,
            west_fill_accordion_indicator: 81,
            west_fill_accordion_dataelement: 81,
            west_fill_accordion_dataset: 81,
            west_fill_accordion_eventdataitem: 81,
            west_fill_accordion_programindicator: 81,
            west_fill_accordion_period: 350,
            west_fill_accordion_organisationunit: 58,
            west_fill_accordion_group: 31,
            west_maxheight_accordion_indicator: 400,
            west_maxheight_accordion_dataelement: 400,
            west_maxheight_accordion_dataset: 400,
            west_maxheight_accordion_period: 503,
            west_maxheight_accordion_organisationunit: 900,
            west_maxheight_accordion_group: 340,
            west_maxheight_accordion_options: 449,
            west_scrollbarheight_accordion_indicator: 300,
            west_scrollbarheight_accordion_dataelement: 300,
            west_scrollbarheight_accordion_dataset: 300,
            west_scrollbarheight_accordion_period: 440,
            west_scrollbarheight_accordion_organisationunit: 450,
            west_scrollbarheight_accordion_group: 300,
            east_tbar_height: 31,
            east_gridcolumn_height: 30,
            form_label_width: 55,
            window_favorite_ypos: 100,
            window_confirm_width: 250,
            window_share_width: 500,
            grid_favorite_width: 420,
            grid_row_height: 27,
            treepanel_minheight: 135,
            treepanel_maxheight: 400,
            treepanel_fill_default: 310,
            treepanel_toolbar_menu_width_group: 140,
            treepanel_toolbar_menu_width_level: 120,
            multiselect_minheight: 100,
            multiselect_maxheight: 250,
            multiselect_fill_default: 345,
            multiselect_fill_reportingrates: 315
        },
        'tracker': {
            west_width: 452,
            west_fill: 2,
            west_fill_accordion_indicator: 56,
            west_fill_accordion_dataelement: 59,
            west_fill_accordion_dataset: 31,
            west_fill_accordion_period: 445,
            west_fill_accordion_organisationunit: 58,
            west_fill_accordion_group: 31,
            west_maxheight_accordion_indicator: 451,
            west_maxheight_accordion_dataset: 350,
            west_maxheight_accordion_period: 600,
            west_maxheight_accordion_organisationunit: 500,
            west_maxheight_accordion_group: 340,
            west_scrollbarheight_accordion_indicator: 451,
            west_scrollbarheight_accordion_dataset: 250,
            west_scrollbarheight_accordion_period: 600,
            west_scrollbarheight_accordion_organisationunit: 500,
            west_scrollbarheight_accordion_group: 300,
            east_tbar_height: 31,
            east_gridcolumn_height: 30,
            form_label_width: 55,
            window_favorite_ypos: 100,
            window_confirm_width: 250,
            window_share_width: 500,
            grid_favorite_width: 420,
            grid_row_height: 27,
            treepanel_minheight: 135,
            treepanel_maxheight: 400,
            treepanel_fill_default: 310,
            treepanel_toolbar_menu_width_group: 140,
            treepanel_toolbar_menu_width_level: 120,
            multiselect_minheight: 100,
            multiselect_maxheight: 250,
            multiselect_fill_default: 345,
            multiselect_fill_reportingrates: 315
        }
    };

    t.checkout = function(branch = branch) {
        $.extend(t, layout[branch]);
    };

    (function() {
        t.checkout();
    })();
};

UiConfig.prototype.applyTo = function(modules) {
    var t = this;

    arrayTo(modules).forEach(function(module) {
        module.uiConfig = t;
    });
};
