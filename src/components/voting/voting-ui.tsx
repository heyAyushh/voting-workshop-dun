"use client";

import { PublicKey } from "@solana/web3.js";
import { ellipsify } from "../ui/ui-layout";
import { ExplorerLink } from "../cluster/cluster-ui";
import { useVotingProgram, useVotingProgramAccount } from "./voting-data-access";

export function VotingCreate() {
  const { initializePoll } = useVotingProgram();

  return (
    <div className="flex justify-center my-6">
      <button
        className="btn btn-primary px-6 py-3 text-lg font-semibold rounded-lg shadow-lg transition-all hover:scale-105 disabled:opacity-50"
        onClick={() =>
          initializePoll.mutateAsync({
            pollId: Date.now(),
            description: "New Poll",
            pollStart: Date.now(),
            pollEnd: Date.now() + 86400000,
          })
        }
        disabled={initializePoll.isPending}
      >
        {initializePoll.isPending ? "Creating..." : "Create Poll"}
      </button>
    </div>
  );
}

export function VotingList() {
  const { polls, getProgramAccount } = useVotingProgram();

  if (getProgramAccount.isLoading) {
    return <LoadingIndicator />;
  }
  if (!getProgramAccount.data?.value) {
    return (
      <Alert message="Program account not found. Ensure the program is deployed and you're on the correct cluster." />
    );
  }
  return (
    <div className="space-y-6">
      {polls.isLoading ? (
        <LoadingIndicator />
      ) : polls.data?.length ? (
        <div className="grid md:grid-cols-2 gap-6">
          {polls.data?.map((poll) => (
            <VotingCard key={poll.publicKey.toString()} account={poll.publicKey} />
          ))}
        </div>
      ) : (
        <EmptyState message="No polls found. Create one above to get started." />
      )}
    </div>
  );
}

function VotingCard({ account }: { account: PublicKey }) {
  const { pollQuery, vote } = useVotingProgramAccount({
    pollId: account.toBuffer()[0],
  });

  const poll = pollQuery.data;

  return pollQuery.isLoading ? (
    <LoadingIndicator />
  ) : (
    <div className="card bg-base-200 shadow-xl border border-gray-300 p-6 rounded-xl">
      <div className="card-body text-center space-y-4">
        <h2 className="text-2xl font-bold cursor-pointer hover:text-primary" onClick={() => pollQuery.refetch()}>
          {poll?.description || "Untitled Poll"}
        </h2>
        <div className="flex justify-center gap-4">
          <VoteButton label="Vote Option A" onClick={() => vote.mutateAsync({ candidateName: "Option A" })} isLoading={vote.isPending} />
          <VoteButton label="Vote Option B" onClick={() => vote.mutateAsync({ candidateName: "Option B" })} isLoading={vote.isPending} />
        </div>
        <ExplorerLink path={`account/${account}`} label={ellipsify(account.toString())} />
      </div>
    </div>
  );
}

function VoteButton({ label, onClick, isLoading }) {
  return (
    <button
      className="btn btn-outline px-4 py-2 font-medium transition-all hover:bg-primary hover:text-white disabled:opacity-50"
      onClick={onClick}
      disabled={isLoading}
    >
      {isLoading ? "Voting..." : label}
    </button>
  );
}

function LoadingIndicator() {
  return <span className="loading loading-spinner loading-lg flex justify-center" />;
}

function Alert({ message }) {
  return (
    <div className="alert alert-info flex justify-center p-4 rounded-lg shadow-md">{message}</div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="text-center text-lg text-gray-500 py-6">{message}</div>
  );
}