const INFORMATION = new Set(['dashboard', 'factorySalesToday', 'factorySalesMonth', 'factoryOpenOrders', 'factoryCostPerTon', 'factoryAvgPrice', 'factoryMargin', 'profitability', 'salesReports', 'materialPriceAnalysis', 'inventoryOverview', 'inventoryBalance', 'inventoryTransaction', 'materialBatch', 'factoryStockValue', 'factoryRunningOut', 'factoryStagnant', 'factoryReserved', 'inventoryReports', 'factoryPlanned', 'factoryActual', 'factoryExecution', 'factoryStoppages', 'productionLot', 'productionReports', 'supplierQuality', 'lotTrace', 'materialTrace', 'factoryWaste', 'factoryDeviation', 'varianceReport', 'account', 'accountingReports', 'vatReport', 'auditLog', 'report'])

export function pagePurpose(entityKey: string) {
  return INFORMATION.has(entityKey) ? 'information' : 'actions'
}
