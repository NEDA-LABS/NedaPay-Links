import { Contract, EventFilter } from 'ethers';

/**
 * Paginated queryFilter utility for ethers.js contracts.
 * Fetches logs in chunks to avoid provider block range limits.
 *
 * @param contract ethers.Contract instance
 * @param filter EventFilter for contract.queryFilter
 * @param fromBlock Start block (inclusive)
 * @param toBlock End block (inclusive)
 * @param blockStep Max block range per query (default: 1000)
 * @returns Aggregated array of logs/events
 */
import { getLogCompatibleProvider } from './rpcProvider';

export async function paginatedQueryFilter(
  contract: Contract,
  filter: EventFilter,
  fromBlock: number,
  toBlock: number,
  blockStep: number = 1000
) {
  let logs: any[] = [];
  let start = fromBlock;
  // Always use a compatible provider for log/event queries
  const provider = await getLogCompatibleProvider();
  const contractWithProvider = contract.connect(provider);
  while (start <= toBlock) {
    const end = Math.min(start + blockStep - 1, toBlock);
    try {
      const chunk = await contractWithProvider.queryFilter(filter, start, end);
      logs = logs.concat(chunk);
    } catch (err) {
      throw new Error(`queryFilter failed for block range ${start}-${end}: ${err}`);
    }
    start = end + 1;
  }
  return logs;
}

