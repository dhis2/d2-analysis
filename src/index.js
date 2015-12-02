import {Record} from './api/Record.js';
import {Dimension} from './api/Dimension.js';
import {Axis} from './api/Axis.js';
import {Layout} from './api/Layout.js';
import {Request} from './api/Request.js';
import {RequestManager} from './api/RequestManager.js';
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

import {DimensionConfig} from './config/DimensionConfig.js';
import {PeriodConfig} from './config/PeriodConfig.js';
import {OptionConfig} from './config/OptionConfig.js';
import {UiConfig} from './config/UiConfig.js';

export const api = {
    Record: Record,
    Dimension: Dimension,
    Axis: Axis,
    Layout: Layout,
    Request: Request,
    RequestManager: RequestManager,
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
};

export const config = {
    DimensionConfig: DimensionConfig,
    PeriodConfig: PeriodConfig,
    OptionConfig: OptionConfig,
    UiConfig: UiConfig,
};
