import {
  decodeFunctionResult,
  encodeFunctionResult,
  parseAbi,
  type Hex,
} from 'viem';

// Exact entries from Uniswap/permit2 IAllowanceTransfer.sol, MIT.
// Narrow ABI: only reads, discovery events and the supported revocation entrypoint.
export const permit2Abi = parseAbi([
  'function allowance(address user, address token, address spender) view returns (uint160 amount, uint48 expiration, uint48 nonce)',
  'function lockdown((address token, address spender)[] approvals)',
  'event Approval(address indexed owner, address indexed token, address indexed spender, uint160 amount, uint48 expiration)',
  'event Permit(address indexed owner, address indexed token, address indexed spender, uint160 amount, uint48 expiration, uint48 nonce)',
  'event Lockdown(address indexed owner, address token, address spender)',
  'event NonceInvalidation(address indexed owner, address indexed token, address indexed spender, uint48 newNonce, uint48 oldNonce)',
  'error AllowanceExpired(uint256 deadline)',
  'error InsufficientAllowance(uint256 amount)',
  'error ExcessiveInvalidation()',
]);

export function decodePermit2Allowance(data: Hex) {
  if (data.length !== 194)
    throw new Error('Noncanonical Permit2 allowance result');
  try {
    const result = decodeFunctionResult({
      abi: permit2Abi,
      functionName: 'allowance',
      data,
    });
    if (
      encodeFunctionResult({
        abi: permit2Abi,
        functionName: 'allowance',
        result,
      }).toLowerCase() !== data.toLowerCase()
    )
      throw new Error('Invalid ABI words');
    return result;
  } catch {
    throw new Error('Noncanonical Permit2 allowance result');
  }
}
