import Record from './src/api/Record.js';
import Dimension from './src/api/Dimension.js';
import Axis from './src/api/Axis.js';
import Layout from './src/api/Layout.js';
import Request from './src/api/Request.js';
import RequestManager from './src/api/RequestManager.js';
import ResponseHeader from './src/api/ResponseHeader.js';
import ResponseRow from './src/api/ResponseRow.js';
import ResponseRowIdCombination from './src/api/ResponseRowIdCombination.js';
import Response from './src/api/Response.js';

import TableAxis from './src/pivot/TableAxis.js';
import Table from './src/pivot/Table.js';

import AppManager from './src/manager/AppManager.js';
import DateManager from './src/manager/DateManager.js';
import CalendarManager from './src/manager/CalendarManager.js';
import I18nManager from './src/manager/I18nManager.js';

import DimensionConfig from './src/config/DimensionConfig.js';
import PeriodConfig from './src/config/PeriodConfig.js';
import OptionConfig from './src/config/OptionConfig.js';
import UiConfig from './src/config/UiConfig.js';

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
    
