'use client'

import { getVotingProgram, getVotingProgramId } from '@project/anchor'
import { useConnection } from '@solana/wallet-adapter-react'
import { Cluster, Keypair, PublicKey } from '@solana/web3.js'
import { useMutation, useQuery } from '@tanstack/react-query'
import { useMemo } from 'react'
import toast from 'react-hot-toast'
import { useCluster } from '../cluster/cluster-data-access'
import { useAnchorProvider } from '../solana/solana-provider'
import { useTransactionToast } from '../ui/ui-layout'

export function useVotingProgram() {
  const { connection } = useConnection()
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const provider = useAnchorProvider()
  const programId = useMemo(() => getVotingProgramId(cluster.network as Cluster), [cluster])
  const program = useMemo(() => getVotingProgram(provider, programId), [provider, programId])

  const accounts = useQuery({
    queryKey: ['voting', 'all', { cluster }],
    queryFn: () => (program.account as any).voting.all(),
  })

  const getProgramAccount = useQuery({
    queryKey: ['get-program-account', { cluster }],
    queryFn: () => connection.getParsedAccountInfo(programId),
  })

  const initialize = useMutation({
    mutationKey: ['voting', 'initialize', { cluster }],
    mutationFn: (keypair: Keypair) =>
      (program.methods as any).initialize().accounts({ voting: keypair.publicKey }).signers([keypair]).rpc(),
    onSuccess: (signature: string) => {
      transactionToast(signature)
      return accounts.refetch()
    },
    onError: () => toast.error('Failed to initialize account'),
  })

  return {
    program,
    programId,
    accounts,
    getProgramAccount,
    initialize,
  }
}

export function useVotingProgramAccount({ account }: { account: PublicKey }) {
  const { cluster } = useCluster()
  const transactionToast = useTransactionToast()
  const { program, accounts } = useVotingProgram()

  const accountQuery = useQuery({
    queryKey: ['voting', 'fetch', { cluster, account }],
    queryFn: () => (program.account as any).voting.fetch(account),
  })

  const closeMutation = useMutation({
    mutationKey: ['voting', 'close', { cluster, account }],
    mutationFn: () => (program.methods as any).close().accounts({ voting: account }).rpc(),
    onSuccess: (tx: string) => {
      transactionToast(tx)
      return accounts.refetch()
    },
  })

  const decrementMutation = useMutation({
    mutationKey: ['voting', 'decrement', { cluster, account }],
    mutationFn: () => (program.methods as any).decrement().accounts({ voting: account }).rpc(),
    onSuccess: (tx: string) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const incrementMutation = useMutation({
    mutationKey: ['voting', 'increment', { cluster, account }],
    mutationFn: () => (program.methods as any).increment().accounts({ voting: account }).rpc(),
    onSuccess: (tx: string) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  const setMutation = useMutation({
    mutationKey: ['voting', 'set', { cluster, account }],
    mutationFn: (value: number) => (program.methods as any).set(value).accounts({ voting: account }).rpc(),
    onSuccess: (tx: string) => {
      transactionToast(tx)
      return accountQuery.refetch()
    },
  })

  return {
    accountQuery,
    closeMutation,
    decrementMutation,
    incrementMutation,
    setMutation,
  }
}
