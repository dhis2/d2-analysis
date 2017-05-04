import { Record } from './api/Record.js';
import { Dimension } from './api/Dimension.js';
import { Axis } from './api/Axis.js';
import { Layout } from './api/Layout.js';
import { Request } from './api/Request.js';
import { ResponseHeader } from './api/ResponseHeader.js';
import { ResponseRow } from './api/ResponseRow.js';
import { ResponseRowIdCombination } from './api/ResponseRowIdCombination.js';
import { Response } from './api/Response.js';
import { Sorting } from './api/Sorting.js';

import { TableAxis } from './pivot/TableAxis.js';
import { Table } from './pivot/Table.js';

import { AppManager } from './manager/AppManager.js';
import { DateManager } from './manager/DateManager.js';
import { CalendarManager } from './manager/CalendarManager.js';
import { I18nManager } from './manager/I18nManager.js';
import { RequestManager } from './manager/RequestManager.js';
import { SessionStorageManager } from './manager/SessionStorageManager.js';
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
import { ChartTypeToolbar } from './ui/ChartTypeToolbar.js';
import { IntegrationButton } from './ui/IntegrationButton.js';

import { i18nInit } from './init/i18nInit.js';
import { authViewUnapprovedDataInit } from './init/authViewUnapprovedDataInit.js';
import { isAdminInit } from './init/isAdminInit.js';
import { rootNodesInit } from './init/rootNodesInit.js';
import { organisationUnitLevelsInit } from './init/organisationUnitLevelsInit.js';
import { legendSetsInit } from './init/legendSetsInit.js';
import { dimensionsInit } from './init/dimensionsInit.js';
import { dataApprovalLevelsInit } from './init/dataApprovalLevelsInit.js';

import { SimpleRegression } from './util/SimpleRegression.js';
import { Plugin } from './util/Plugin.js';

import { extOverrides } from './override/extOverrides.js';
import { extChartOverrides } from './override/extChartOverrides.js';

export {
    Record,
    Dimension,
    Axis,
    Layout,
    Request,
    ResponseHeader,
    ResponseRow,
    ResponseRowIdCombination,
    Response,
    Sorting,

    TableAxis,
    Table,

    AppManager,
    DateManager,
    CalendarManager,
    I18nManager,
    RequestManager,
    SessionStorageManager,
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
    ChartTypeToolbar,
    IntegrationButton,

    i18nInit,
    authViewUnapprovedDataInit,
    isAdminInit,
    rootNodesInit,
    organisationUnitLevelsInit,
    legendSetsInit,
    dimensionsInit,
    dataApprovalLevelsInit,

    SimpleRegression,
    Plugin,

    extOverrides,
    extChartOverrides,
};

export const api = {
    Record,
    Dimension,
    Axis,
    Layout,
    Request,
    ResponseHeader,
    ResponseRow,
    ResponseRowIdCombination,
    Response,
    Sorting,
};

export const pivot = {
    TableAxis,
    Table,
};

export const manager = {
    AppManager,
    DateManager,
    CalendarManager,
    I18nManager,
    RequestManager,
    SessionStorageManager,
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
    ChartTypeToolbar,
    IntegrationButton,
};

export const init = {
    i18nInit,
    authViewUnapprovedDataInit,
    isAdminInit,
    rootNodesInit,
    organisationUnitLevelsInit,
    legendSetsInit,
    dimensionsInit,
    dataApprovalLevelsInit,
};

export const util = {
    SimpleRegression,
    Plugin,
};

export const override = {
    extOverrides,
    extChartOverrides,
};
