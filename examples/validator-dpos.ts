import {
  createPublicClient,
  createWalletClient,
  http,
  privateKeyToAccount,
  tosTestnet,
} from '../src/index.js'
import type {
  Address,
  EpochInfo,
  Snapshot,
  ValidatorInfo,
} from '../src/index.js'

/**
 * Demonstrates DPoS validator queries using the public client,
 * and validator maintenance operations using the wallet client.
 */
export async function buildValidatorDposExample() {
  // --- Public client: read-only validator and epoch queries ---

  const publicClient = createPublicClient({
    chain: tosTestnet,
    transport: http('http://127.0.0.1:8545'),
  })

  // List all active validators at the latest block.
  const validators: readonly Address[] = await publicClient.getValidators()
  console.log('Validator count:', validators.length)
  for (const addr of validators) {
    console.log('  Validator:', addr)
  }

  // Get detailed info for a specific validator address.
  if (validators.length > 0) {
    const validatorAddress = validators[0]
    const validatorInfo: ValidatorInfo = await publicClient.getValidator({
      address: validatorAddress,
    })
    console.log('Validator active:', validatorInfo.active)
    console.log('Validator index:', validatorInfo.index)
    console.log('Snapshot block:', validatorInfo.snapshotBlock)
  }

  // Query validators at a specific block tag.
  const validatorsAtFinalized: readonly Address[] =
    await publicClient.getValidators({ blockTag: 'finalized' })
  console.log(
    'Validators at finalized block:',
    validatorsAtFinalized.length,
  )

  // Retrieve the current DPoS snapshot.
  const snapshot: Snapshot = await publicClient.getSnapshot()
  console.log('Snapshot number:', snapshot.number)
  console.log('Snapshot hash:', snapshot.hash)
  console.log('Snapshot validators:', snapshot.validators.length)

  // Retrieve epoch information describing the current consensus round.
  const epochInfo: EpochInfo = await publicClient.getEpochInfo()
  console.log('Epoch index:', epochInfo.epochIndex)
  console.log('Epoch length:', epochInfo.epochLength)
  console.log('Blocks until next epoch:', epochInfo.blocksUntilEpoch)
  console.log('Validator count:', epochInfo.validatorCount)
  console.log('Max validators:', epochInfo.maxValidators)

  // --- Wallet client: validator maintenance operations ---

  const account = privateKeyToAccount(
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  )

  const walletClient = createWalletClient({
    account,
    chain: tosTestnet,
    transport: http('http://127.0.0.1:8545'),
  })

  // Enter maintenance mode (validator temporarily stops producing blocks).
  const enterTxHash = await walletClient.enterMaintenance({
    from: account.address,
    gas: 100_000n,
  })
  console.log('Enter maintenance tx:', enterTxHash)

  // Exit maintenance mode (validator resumes block production).
  const exitTxHash = await walletClient.exitMaintenance({
    from: account.address,
    gas: 100_000n,
  })
  console.log('Exit maintenance tx:', exitTxHash)

  return {
    validators,
    snapshot,
    epochInfo,
    enterTxHash,
    exitTxHash,
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log(
    JSON.stringify(
      {
        example: 'validator-dpos',
        description:
          'Validator listing, snapshot, epoch info, and maintenance operations',
      },
      null,
      2,
    ),
  )
}
