# Pivot Table Documentation
This document provides a short summary of the logic behind the new pivot table rendering engine. Firstly, we give a short description of why a new engine was needed, and what advantages it brings. We then give a high level overview of how each pivot table is rendering using this new engine. Lastly, we give a short description of how the code is structured to make it a little bit easier for developers wanting to work within this codebase.

## Why a New Rendering Engine?
The motivation behind the development of a new pivot table rendering engine was the lack of performance when rendering large pivot tables (tables containing millions of cells). When rendering large tables, the browser would either "hang" for multiple minutes or crash altogether. In an effort to resolve this issue, we began development on a rendering engine which only displays parts of the table which are visible through the browsers viewport. By doing this, we limit the amount of RAM used by the browser, and reduce the amount of parsed HTML. This method of rendering the pivot table is called table clipping.

## Pivot Table Clipping
As discussed earlier, the new pivot table rendering engine procedurally renders the parts of the table visible within the browsers viewport. Inspired by the common technique used in computer graphics, we decided to call this table clipping. By default, table clipping will only be enabled when the requested table exceeds a certain size. This limit is set on the initialization of the table and may be changed by modifying the "renderLimit" property of PivotTable object.

The reason table clipping is not enabled by default (despite size) is that there are currently some limitations of this mode which makes the user experience inferior to that of a fully rendered table. First of all, in order to determine when to render a new row/column of the table, we have set the width and height of each cell to be a constant size. The result is that 

## The Code
The primary logic behind the pivot table rendering engine is located in the "PivotTable.js" source file (located in the "table" directory). This file defines a class (PivotTable), which handles the procedural building of the pivot table.