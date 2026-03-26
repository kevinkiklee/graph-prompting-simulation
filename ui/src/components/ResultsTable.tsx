import React, { useState, useMemo } from 'react';
import type { SimulationRun } from './Dashboard';

interface ResultsTableProps {
  data: SimulationRun[];
}

export function ResultsTable({ data }: ResultsTableProps) {
  const [expandedRow, setExpandedRow] = useState<string | null>(null);
  
  // Filtering state
  const [filterModel, setFilterModel] = useState<string>('');
  const [filterStrategy, setFilterStrategy] = useState<string>('');
  const [filterSuccess, setFilterSuccess] = useState<string>('');

  // Sorting state
  const [sortKey, setSortKey] = useState<keyof SimulationRun | null>(null);
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Derived options for filters
  const models = Array.from(new Set(data.map(d => d.model)));
  const strategies = Array.from(new Set(data.map(d => d.strategy)));

  // Apply filters, sort, and pagination
  const processedData = useMemo(() => {
    let result = [...data];

    // Filter
    if (filterModel) result = result.filter(d => d.model === filterModel);
    if (filterStrategy) result = result.filter(d => d.strategy === filterStrategy);
    if (filterSuccess) {
      const isSuccess = filterSuccess === 'true';
      result = result.filter(d => d.success === isSuccess);
    }

    // Sort
    if (sortKey) {
      result.sort((a, b) => {
        let valA = a[sortKey];
        let valB = b[sortKey];
        
        if (valA === undefined) valA = sortDir === 'asc' ? Infinity : -Infinity as any;
        if (valB === undefined) valB = sortDir === 'asc' ? Infinity : -Infinity as any;

        if (valA! < valB!) return sortDir === 'asc' ? -1 : 1;
        if (valA! > valB!) return sortDir === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data, filterModel, filterStrategy, filterSuccess, sortKey, sortDir]);

  const totalPages = Math.ceil(processedData.length / pageSize) || 1;
  // Ensure current page is valid after filtering
  const currentPage = Math.min(page, totalPages);
  
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedData.slice(start, start + pageSize);
  }, [processedData, currentPage, pageSize]);

  const handleSort = (key: keyof SimulationRun) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const renderSortIndicator = (key: keyof SimulationRun) => {
    if (sortKey !== key) return null;
    return <span className="ml-1">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  const renderHighlightedTrace = (run: SimulationRun) => {
    const text = run.rawAgentTrace || run.rawOutput || 'N/A';
    if (run.strategy === 'naive') return text;

    const errorStates = new Set<string>();
    if (run.errors) {
      run.errors.forEach(err => {
        if (err.startsWith('UnknownState:')) {
          errorStates.add(err.replace('UnknownState:', '').trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
        } else if (err.startsWith('InvalidTransition:')) {
          const parts = err.replace('InvalidTransition:', '').split('->');
          if (parts.length === 2) {
            errorStates.add(parts[1].trim().toLowerCase().replace(/[^a-z0-9]/g, ''));
          }
        } else if (err === 'InvalidInitialState' && run.stateTrace && run.stateTrace.length > 0) {
          errorStates.add(run.stateTrace[0].toLowerCase().replace(/[^a-z0-9]/g, ''));
        } else if (err === 'InvalidTerminalState' && run.stateTrace && run.stateTrace.length > 0) {
          errorStates.add(run.stateTrace[run.stateTrace.length - 1].toLowerCase().replace(/[^a-z0-9]/g, ''));
        }
      });
    }

    const stateRegex = /((?:\[|\()?STATE:\s*[^\]\)\n\r]+(?:\]|\))?)/gi;
    const parts = text.split(stateRegex);
    
    return parts.map((part, index) => {
      const match = part.match(/(?:\[|\()?STATE:\s*([^\]\)\n\r]+)(?:\]|\))?/i);
      if (match && part.toUpperCase().includes('STATE:')) {
        const stateName = match[1].trim().toLowerCase().replace(/[^a-z0-9]/g, '');
        const isError = errorStates.has(stateName);
        return (
          <span 
            key={index} 
            className={`font-bold px-1.5 py-0.5 rounded text-xs ${isError ? 'bg-red-800 text-red-50' : 'bg-green-800 text-green-50'}`}
          >
            {part}
          </span>
        );
      }
      return <React.Fragment key={index}>{part}</React.Fragment>;
    });
  };

  return (
    <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
      <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap gap-4 items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800">Raw Runs ({processedData.length})</h2>
        <div className="flex flex-wrap gap-3">
          <select 
            className="border rounded px-2 py-1 text-sm bg-white"
            value={filterModel}
            onChange={e => { setFilterModel(e.target.value); setPage(1); }}
          >
            <option value="">All Models</option>
            {models.map(m => <option key={m} value={m}>{m.replace('-preview', '')}</option>)}
          </select>
          <select 
            className="border rounded px-2 py-1 text-sm bg-white"
            value={filterStrategy}
            onChange={e => { setFilterStrategy(e.target.value); setPage(1); }}
          >
            <option value="">All Strategies</option>
            {strategies.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select 
            className="border rounded px-2 py-1 text-sm bg-white"
            value={filterSuccess}
            onChange={e => { setFilterSuccess(e.target.value); setPage(1); }}
          >
            <option value="">All Statuses</option>
            <option value="true">Success</option>
            <option value="false">Failure</option>
          </select>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="px-6 py-3 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('model')}>
                Model {renderSortIndicator('model')}
              </th>
              <th className="px-6 py-3 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('strategy')}>
                Strategy {renderSortIndicator('strategy')}
              </th>
              <th className="px-6 py-3 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('testCaseId')}>
                Test Case {renderSortIndicator('testCaseId')}
              </th>
              <th className="px-6 py-3 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('success')}>
                Status {renderSortIndicator('success')}
              </th>
              <th className="px-6 py-3 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('processAdherenceScore')}>
                Adherence {renderSortIndicator('processAdherenceScore')}
              </th>
              <th className="px-6 py-3 cursor-pointer hover:bg-gray-200" onClick={() => handleSort('tokensPerSecond')}>
                TPS / Latency {renderSortIndicator('tokensPerSecond')}
              </th>
              <th className="px-6 py-3">Log</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {paginatedData.map((run, i) => (
              <React.Fragment key={run.runId || i}>
                <tr 
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() => setExpandedRow(expandedRow === (run.runId || String(i)) ? null : (run.runId || String(i)))}
                >
                  <td className="px-6 py-4">{run.model.replace('-preview', '')}</td>
                  <td className="px-6 py-4">
                    <div>
                      {run.strategy}
                      {run.pathId && (
                        <div className="text-[10px] text-gray-400 uppercase tracking-wider">{run.pathId}</div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">{run.testCaseId}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold text-center ${run.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {run.success ? 'CORRECT' : 'WRONG'}
                      </span>
                      {run.syntaxValid === false && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold text-center bg-orange-100 text-orange-800">
                          BAD SYNTAX
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {run.strategy === 'naive' ? (
                      <span className="text-xs text-gray-400 italic">Not applicable</span>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className={`font-mono text-xs ${run.processAdherenceScore && run.processAdherenceScore > 0.8 ? 'text-green-600' : 'text-orange-600'}`}>
                          {Math.round((run.processAdherenceScore || 0) * 100)}%
                        </span>
                        <div className="w-16 bg-gray-200 rounded-full h-1.5">
                          <div 
                            className={`h-1.5 rounded-full ${run.processAdherenceScore && run.processAdherenceScore > 0.8 ? 'bg-green-500' : 'bg-orange-500'}`} 
                            style={{ width: `${Math.round((run.processAdherenceScore || 0) * 100)}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs">
                      <div>{Math.round(run.tokensPerSecond || 0)} TPS</div>
                      <div className="text-gray-400">{run.latencyMs}ms</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-blue-600 underline">View</td>
                </tr>
                {expandedRow === (run.runId || String(i)) && (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                      <div className="mb-4">
                        <h4 className="font-semibold text-gray-700 mb-1">Process Errors</h4>
                        <div className="flex flex-wrap gap-2">
                          {run.errors && run.errors.length > 0 ? (
                            run.errors.map((err, j) => (
                              <span key={j} className="px-2 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs">
                                {err}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-gray-500">None detected</span>
                          )}
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">Final Extracted Code</h4>
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-auto max-h-96 whitespace-pre-wrap">
                            {run.rawOutput || 'No output'}
                          </pre>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-2">Agent Trace / Thinking Process</h4>
                          <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-auto max-h-96 whitespace-pre-wrap border border-gray-700">
                            {renderHighlightedTrace(run)}
                          </pre>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </React.Fragment>
            ))}
            {paginatedData.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-8 text-center text-gray-500">
                  No runs match the selected filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Pagination Controls */}
      <div className="p-4 border-t border-gray-200 flex flex-wrap gap-4 items-center justify-between bg-gray-50">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Rows per page:</span>
          <select 
            className="border rounded px-2 py-1 text-sm bg-white"
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }}
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <div className="flex gap-1">
            <button 
              className="px-3 py-1 border rounded bg-white disabled:opacity-50"
              disabled={currentPage <= 1}
              onClick={() => setPage(p => p - 1)}
            >
              Previous
            </button>
            <button 
              className="px-3 py-1 border rounded bg-white disabled:opacity-50"
              disabled={currentPage >= totalPages}
              onClick={() => setPage(p => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
