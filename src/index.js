import {Record} from './api/Record.js';
import {Dimension} from './api/Dimension.js';
import {Axis} from './api/Axis.js';
import {Layout} from './api/Layout.js';
import {Request} from './api/Request.js';
import {ResponseHeader} from './api/ResponseHeader.js';
import {ResponseRow} from './api/ResponseRow.js';
import {ResponseRowIdCombination} from './api/ResponseRowIdCombination.js';
import {Response} from './api/Response.js';

import {TableAxis} from './pivot/TableAxis.js';
import {Table} from './pivot/Table.js';

import {AppManager} from './manager/AppManager.js';
import {DateManager} from './manager/DateManager.js';
import {CalendarManager} from './manager/CalendarManager.js';
import {I18nManager} from './manager/I18nManager.js';
import {RequestManager} from './manager/RequestManager.js';
import {ResponseManager} from './manager/ResponseManager.js';
import {SessionStorageManager} from './manager/SessionStorageManager.js';
import {UiManager} from './manager/UiManager.js';
import {InstanceManager} from './manager/InstanceManager.js';

import {DimensionConfig} from './config/DimensionConfig.js';
import {PeriodConfig} from './config/PeriodConfig.js';
import {OptionConfig} from './config/OptionConfig.js';
import {UiConfig} from './config/UiConfig.js';

import {Viewport} from './ui/Viewport.js';
import {CenterRegion} from './ui/CenterRegion.js';
import {WestRegion} from './ui/WestRegion.js';
import {MenuAccordion} from './ui/MenuAccordion.js';
import {IndicatorPanel} from './ui/IndicatorPanel.js';
import {DataElementPanel} from './ui/DataElementPanel.js';
import {DataTab} from './ui/DataTab.js';
import {PeriodTab} from './ui/PeriodTab.js';

import {i18nInit} from './init/i18nInit.js';
import {authViewUnapprovedDataInit} from './init/authViewUnapprovedDataInit.js';
import {rootNodesInit} from './init/rootNodesInit.js';
import {organisationUnitLevelsInit} from './init/organisationUnitLevelsInit.js';
import {legendSetsInit} from './init/legendSetsInit.js';
import {dimensionsInit} from './init/dimensionsInit.js';
import {dataApprovalLevelsInit} from './init/dataApprovalLevelsInit.js';

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

    TableAxis,
    Table,

    AppManager,
    DateManager,
    CalendarManager,
    I18nManager,
    RequestManager,
    ResponseManager,
    SessionStorageManager,
    UiManager,
    InstanceManager,

    DimensionConfig,
    PeriodConfig,
    OptionConfig,
    UiConfig,

    Viewport,
    CenterRegion,
    WestRegion,
    MenuAccordion,
    IndicatorPanel,
    DataElementPanel,
    DataTab,
    PeriodTab,

    i18nInit,
    authViewUnapprovedDataInit,
    rootNodesInit,
    organisationUnitLevelsInit,
    legendSetsInit,
    dimensionsInit,
    dataApprovalLevelsInit,
};

export const api = {
    Record: Record,
    Dimension: Dimension,
    Axis: Axis,
    Layout: Layout,
    Request: Request,
    ResponseHeader: ResponseHeader,
    ResponseRow: ResponseRow,
    ResponseRowIdCombination: ResponseRowIdCombination,
    Response: Response,
};

export const pivot = {
    TableAxis: TableAxis,
    Table: Table,
};

export const manager = {
    AppManager: AppManager,
    DateManager: DateManager,
    CalendarManager: CalendarManager,
    I18nManager: I18nManager,
    RequestManager: RequestManager,
    ResponseManager: ResponseManager,
    SessionStorageManager: SessionStorageManager,
    UiManager: UiManager,
    InstanceManager: InstanceManager
};

export const config = {
    DimensionConfig: DimensionConfig,
    PeriodConfig: PeriodConfig,
    OptionConfig: OptionConfig,
    UiConfig: UiConfig,
};

export const ui = {
    Viewport: Viewport,
    CenterRegion: CenterRegion,
    WestRegion: WestRegion,
    MenuAccordion: MenuAccordion,
    IndicatorPanel: IndicatorPanel,
    DataElementPanel: DataElementPanel,
    DataTab: DataTab,
    PeriodTab: PeriodTab,
};

export const init = {
    i18nInit: i18nInit,
    authViewUnapprovedDataInit: authViewUnapprovedDataInit,
    rootNodesInit: rootNodesInit,
    organisationUnitLevelsInit: organisationUnitLevelsInit,
    legendSetsInit: legendSetsInit,
    dimensionsInit: dimensionsInit,
    dataApprovalLevelsInit: dataApprovalLevelsInit,
};

