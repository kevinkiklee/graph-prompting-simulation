# Results Table with Filtering, Sorting, and Pagination

## Overview
Extract the raw results table from `Dashboard.tsx` into a new `ResultsTable.tsx` component. The table will handle client-side filtering, sorting, and pagination for the `SimulationRun` dataset.

## Architecture & Components
- **Data Flow**: `Dashboard.tsx` fetches `results.jsonl`, parses it into `SimulationRun[]`, and passes it as a prop to `ResultsTable`.
- **Component**: `ResultsTable.tsx` will hold internal state for:
  - `filters`: { model?: string, strategy?: string, success?: boolean }
  - `sort`: { key: keyof SimulationRun, direction: 'asc' | 'desc' }
  - `pagination`: { page: number, pageSize: number }
  - `expandedRow`: string | null (moved from Dashboard)

## Interactions
- **Filtering**: Dropdowns above the table to filter by Model, Strategy, and Status (Success/Failure).
- **Sorting**: Clicking table column headers will toggle sorting for Model, Strategy, Test Case, Status, Adherence, TPS, and Latency.
- **Pagination**: A control row at the bottom with Previous/Next buttons and a page size selector (10, 20, 50, 100).

## Trade-offs
- Filtering and sorting are performed entirely on the client side. Since the file is read in its entirety in `Dashboard.tsx`, this is fast and avoids refetching, though it might become a bottleneck if `results.jsonl` grows extremely large (e.g. >100,000 rows). Currently acceptable based on architecture.