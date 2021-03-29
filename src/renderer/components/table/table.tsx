import "./table.scss";

import React from "react";
import { orderBy, throttle } from "lodash";
import { observer } from "mobx-react";
import { observable } from "mobx";
import { autobind, cssNames, noop } from "../../utils";
import { TableRow, TableRowElem, TableRowProps } from "./table-row";
import { TableHead, TableHeadElem, TableHeadProps } from "./table-head";
import { TableCellElem } from "./table-cell";
import { VirtualList } from "../virtual-list";
import { createPageParam } from "../../navigation";
import { ItemObject } from "../../item.store";

export type TableSortBy = string;
export type TableOrderBy = "asc" | "desc" | string;
export type TableSortParams = { sortBy: TableSortBy; orderBy: TableOrderBy };
export type TableSortCallback<D = any> = (data: D) => string | number | (string | number)[];
export type TableSortCallbacks = { [columnId: string]: TableSortCallback };

export interface TableProps extends React.DOMAttributes<HTMLDivElement> {
  items?: ItemObject[];  // Raw items data
  className?: string;
  autoSize?: boolean;   // Setup auto-sizing for all columns (flex: 1 0)
  selectable?: boolean; // Highlight rows on hover
  scrollable?: boolean; // Use scrollbar if content is bigger than parent's height
  /**
   * Unique key for the storage to keep table' user settings and restore on page reload
   */
  storageKey?: string;
  /**
   * Define sortable callbacks for every column in <TableHead><TableCell sortBy="someCol"><TableHead>
   * @sortItem argument in the callback is an object, provided in <TableRow sortItem={someColDataItem}/>
   */
  sortable?: TableSortCallbacks;
  sortSyncWithUrl?: boolean; // sorting state is managed globally from url params
  sortByDefault?: Partial<TableSortParams>; // default sorting params
  onSort?: (params: TableSortParams) => void; // callback on sort change, default: global sync with url
  noItems?: React.ReactNode; // Show no items state table list is empty
  selectedItemId?: string;  // Allows to scroll list to selected item
  virtual?: boolean; // Use virtual list component to render only visible rows
  rowPadding?: string;
  rowLineHeight?: string;
  customRowHeights?: (item: object, lineHeight: number, paddings: number) => number;
  getTableRow?: (uid: string) => React.ReactElement<TableRowProps>;
}

export const sortByUrlParam = createPageParam({
  name: "sort",
  isSystem: true,
});

export const orderByUrlParam = createPageParam({
  name: "order",
  isSystem: true,
});

@observer
export class Table extends React.Component<TableProps> {
  @observable.ref elemRef = React.createRef<HTMLDivElement>();

  static defaultProps: TableProps = {
    scrollable: true,
    autoSize: true,
    rowPadding: "8px",
    rowLineHeight: "17px",
    sortSyncWithUrl: true,
  };

  @observable sortParams: Partial<TableSortParams> = Object.assign(
    this.props.sortSyncWithUrl ? {
      sortBy: sortByUrlParam.get(),
      orderBy: orderByUrlParam.get(),
    } : {},
    this.props.sortByDefault,
  );

  componentDidMount() {
    window.addEventListener("resize", this.refreshDimensions);
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.refreshDimensions);
  }

  renderHead() {
    const { sortable, children } = this.props;
    const content = React.Children.toArray(children) as (TableRowElem | TableHeadElem)[];
    const headElem: React.ReactElement<TableHeadProps> = content.find(elem => elem.type === TableHead);

    if (headElem) {
      if (sortable) {
        const columns = React.Children.toArray(headElem.props.children) as TableCellElem[];

        return React.cloneElement(headElem, {
          style: {
            ...(headElem.props.style ?? {}),
            width: this.contentWidth,
          },
          children: columns.map(elem => {
            if (elem.props.checkbox) {
              return elem;
            }
            const title = elem.props.title || (
              // copy cell content to title if it's a string
              // usable if part of TableCell's content is hidden when there is not enough space
              typeof elem.props.children === "string" ? elem.props.children : undefined
            );

            return React.cloneElement(elem, {
              title,
              _sort: this.sort,
              _sorting: this.sortParams,
              _nowrap: headElem.props.nowrap,
              onResizeEnd: () => {
                elem.props.onResizeEnd?.();
                this.refreshDimensions();
              }
            });
          })
        });
      }

      return headElem;
    }
  }

  getSorted(items: any[]) {
    const { sortBy, orderBy: order } = this.sortParams;
    const sortingCallback = this.props.sortable[sortBy] || noop;

    return orderBy(items, sortingCallback, order as any);
  }

  @autobind()
  protected onSort({ sortBy, orderBy }: TableSortParams) {
    this.sortParams = { sortBy, orderBy };
    const { sortSyncWithUrl, onSort } = this.props;

    if (sortSyncWithUrl) {
      sortByUrlParam.set(sortBy);
      orderByUrlParam.set(orderBy);
    }

    if (onSort) {
      onSort({ sortBy, orderBy });
    }
  }

  @autobind()
  sort(colName: TableSortBy) {
    const { sortBy, orderBy } = this.sortParams;
    const sameColumn = sortBy == colName;
    const newSortBy: TableSortBy = colName;
    const newOrderBy: TableOrderBy = (!orderBy || !sameColumn || orderBy === "desc") ? "asc" : "desc";

    this.onSort({
      sortBy: String(newSortBy),
      orderBy: newOrderBy,
    });
  }

  renderRows() {
    const { sortable, noItems, children, virtual, customRowHeights, rowLineHeight, rowPadding, items, getTableRow, selectedItemId, className } = this.props;
    const content = React.Children.toArray(children) as (TableRowElem | TableHeadElem)[];
    let rows: React.ReactElement<TableRowProps>[] = content.filter(elem => elem.type === TableRow);
    let sortedItems = rows.length ? rows.map(row => row.props.sortItem) : [...items];

    if (sortable) {
      sortedItems = this.getSorted(sortedItems);

      if (rows.length) {
        rows = sortedItems.map(item => rows.find(row => {
          return item == row.props.sortItem;
        }));
      }
    }

    if (!rows.length && !items.length && noItems) {
      return noItems;
    }

    if (virtual) {
      const lineHeight = parseFloat(rowLineHeight);
      const padding = parseFloat(rowPadding);
      let rowHeights: number[] = Array(items.length).fill(lineHeight + padding * 2);

      if (customRowHeights) {
        rowHeights = sortedItems.map(item => {
          return customRowHeights(item, lineHeight, padding * 2);
        });
      }

      return (
        <VirtualList
          items={sortedItems}
          rowHeights={rowHeights}
          getRow={getTableRow}
          selectedItemId={selectedItemId}
          className={className}
          // must match to table's content width for proper scrolling header and virtual-list items.
          // required if some column(s) are resized and overall content-area more than 100%.
          // why: table & virtual-list has own scrolling areas and table-head is sticky..
          width={this.contentWidth}
        />
      );
    }

    return rows;
  }

  @observable refreshKey: number;

  get contentWidth() {
    return this.elemRef.current?.scrollWidth;
  }

  refreshDimensions = throttle(() => {
    // using "full refresh" with changing "key" as this.forceUpdate() don't update some internals
    this.refreshKey = Math.random();
  }, 250);

  render() {
    const { selectable, scrollable, sortable, autoSize, virtual, className } = this.props;
    const classNames = cssNames("Table flex column", className, {
      selectable, scrollable, sortable, autoSize, virtual,
    });

    return (
      <div key={this.refreshKey} className={classNames} ref={this.elemRef}>
        {this.renderHead()}
        {this.renderRows()}
      </div>
    );
  }
}
