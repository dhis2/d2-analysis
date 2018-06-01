import 'core-js/fn/array/fill';
import 'core-js/fn/array/find';

import { Record } from './api/Record.js';
import { Dimension } from './api/Dimension.js';
import { Axis } from './api/Axis.js';
import { Layout } from './api/Layout.js';
import { Period } from './api/Period';
import { Request } from './api/Request.js';
import { ResponseHeader } from './api/ResponseHeader.js';
import { ResponseRow } from './api/ResponseRow.js';
import { ResponseRowIdCombination } from './api/ResponseRowIdCombination.js';
import { Response } from './api/Response.js';
import { Sorting } from './api/Sorting.js';

import { PivotTableAxis } from './table/PivotTableAxis.js';
import { PivotTable } from './table/PivotTable.js';
import { EventDataTable } from './table/EventDataTable.js';

import { AppManager } from './manager/AppManager.js';
import { DateManager } from './manager/DateManager.js';
import { CalendarManager } from './manager/CalendarManager.js';
import { I18nManager } from './manager/I18nManager.js';
import { RequestManager } from './manager/RequestManager.js';
import { SessionStorageManager } from './manager/SessionStorageManager.js';
import { IndexedDbManager } from './manager/IndexedDbManager.js';
import { UiManager } from './manager/UiManager.js';
import { InstanceManager } from './manager/InstanceManager.js';
import { TableManager } from './manager/TableManager.js';

import { DimensionConfig } from './config/DimensionConfig.js';
import { PeriodConfig } from './config/PeriodConfig.js';
import { OptionConfig } from './config/OptionConfig.js';
import { UiConfig } from './config/UiConfig.js';
import { ChartConfig } from './config/ChartConfig.js';

import { Viewport } from './ui/Viewport.js';
import { NorthRegion } from './ui/NorthRegion.js';
import { EastRegion } from './ui/EastRegion.js';
import { FavoriteWindow } from './ui/FavoriteWindow.js';
import { FavoriteButton } from './ui/FavoriteButton.js';
import { InterpretationWindow } from './ui/InterpretationWindow.js';
import { InterpretationItem } from './ui/InterpretationItem.js';
import { PluginItem } from './ui/PluginItem.js';
import { AboutWindow } from './ui/AboutWindow.js';
import { GridHeaders } from './ui/GridHeaders.js';
import { ChartDownloadButtonItems } from './ui/ChartDownloadButtonItems.js';
import { ChartTypeToolbar } from './ui/ChartTypeToolbar.js';
import { IntegrationButton } from './ui/IntegrationButton.js';
import { WestRegionAggregateItems } from './ui/WestRegionAggregateItems.js';
import { WestRegionTrackerItems } from './ui/WestRegionTrackerItems.js';

import { i18nInit } from './init/i18nInit.js';
import { authViewUnapprovedDataInit } from './init/authViewUnapprovedDataInit.js';
import { isAdminInit } from './init/isAdminInit.js';
import { rootNodesInit } from './init/rootNodesInit.js';
import { organisationUnitLevelsInit } from './init/organisationUnitLevelsInit.js';
import { legendSetsInit } from './init/legendSetsInit.js';
import { optionSetsInit } from './init/optionSetsInit.js';
import { dimensionsInit } from './init/dimensionsInit.js';
import { dataApprovalLevelsInit } from './init/dataApprovalLevelsInit.js';
import { userFavoritesInit } from './init/userFavoritesInit.js';
import { categoryOptionGroupSetsInit } from './init/categoryOptionGroupSetsInit.js';

import { SimpleRegression } from './util/SimpleRegression.js';
import { Plugin } from './util/Plugin.js';

import { extOverrides } from './override/extOverrides.js';
import { extChartOverrides } from './override/extChartOverrides.js';

import { DataElementBooleanContainer } from './ux/DataElementBooleanContainer.js';
import { DataElementDateContainer } from './ux/DataElementDateContainer.js';
import { DataElementIntegerContainer } from './ux/DataElementIntegerContainer.js';
import { DataElementStringContainer } from './ux/DataElementStringContainer.js';
import { GroupSetContainer } from './ux/GroupSetContainer.js';
import { LimitContainer } from './ux/LimitContainer.js';
import { StatusBar } from './ux/StatusBar.js';

export {
    Record,
    Dimension,
    Axis,
    Layout,
    Period,
    Request,
    ResponseHeader,
    ResponseRow,
    ResponseRowIdCombination,
    Response,
    Sorting,

    PivotTableAxis,
    PivotTable,
    EventDataTable,

    AppManager,
    DateManager,
    CalendarManager,
    I18nManager,
    RequestManager,
    SessionStorageManager,
    IndexedDbManager,
    UiManager,
    InstanceManager,
    TableManager,

    DimensionConfig,
    PeriodConfig,
    OptionConfig,
    UiConfig,
    ChartConfig,

    Viewport,
    NorthRegion,
    EastRegion,
    FavoriteWindow,
    FavoriteButton,
    InterpretationWindow,
    InterpretationItem,
    PluginItem,
    AboutWindow,
    GridHeaders,
    ChartDownloadButtonItems,
    ChartTypeToolbar,
    IntegrationButton,
    WestRegionAggregateItems,
    WestRegionTrackerItems,

    i18nInit,
    authViewUnapprovedDataInit,
    isAdminInit,
    rootNodesInit,
    organisationUnitLevelsInit,
    legendSetsInit,
    optionSetsInit,
    dimensionsInit,
    dataApprovalLevelsInit,
    userFavoritesInit,
    categoryOptionGroupSetsInit,

    SimpleRegression,
    Plugin,

    extOverrides,
    extChartOverrides,

    DataElementBooleanContainer,
    DataElementDateContainer,
    DataElementIntegerContainer,
    DataElementStringContainer,
    GroupSetContainer,
    LimitContainer,
    StatusBar,
};

export const api = {
    Record,
    Dimension,
    Axis,
    Layout,
    Period,
    Request,
    ResponseHeader,
    ResponseRow,
    ResponseRowIdCombination,
    Response,
    Sorting,
};

export const table = {
    PivotTableAxis,
    PivotTable,
    EventDataTable,
};

export const manager = {
    AppManager,
    DateManager,
    CalendarManager,
    I18nManager,
    RequestManager,
    SessionStorageManager,
    IndexedDbManager,
    UiManager,
    InstanceManager,
    TableManager,
};

export const config = {
    DimensionConfig,
    PeriodConfig,
    OptionConfig,
    UiConfig,
    ChartConfig,
};

export const ui = {
    Viewport,
    NorthRegion,
    EastRegion,
    FavoriteWindow,
    FavoriteButton,
    InterpretationWindow,
    InterpretationItem,
    PluginItem,
    AboutWindow,
    GridHeaders,
    ChartDownloadButtonItems,
    ChartTypeToolbar,
    IntegrationButton,
    WestRegionAggregateItems,
    WestRegionTrackerItems,
};

export const init = {
    i18nInit,
    authViewUnapprovedDataInit,
    isAdminInit,
    rootNodesInit,
    organisationUnitLevelsInit,
    legendSetsInit,
    optionSetsInit,
    dimensionsInit,
    dataApprovalLevelsInit,
    userFavoritesInit,
    categoryOptionGroupSetsInit,
};

export const util = {
    SimpleRegression,
    Plugin,
};

export const override = {
    extOverrides,
    extChartOverrides,
};

export const ux = {
    DataElementBooleanContainer,
    DataElementDateContainer,
    DataElementIntegerContainer,
    DataElementStringContainer,
    GroupSetContainer,
    LimitContainer,
    StatusBar,
};
