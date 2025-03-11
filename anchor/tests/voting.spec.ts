import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { BankrunProvider, startAnchor } from "anchor-bankrun";
import { Voting } from "../target/types/voting";

const IDL = require("../target/idl/voting.json");
const PROGRAM_ID = new PublicKey(IDL.address);

describe("Voting", () => {
  let context;
  let provider;
  let votingProgram: anchor.Program<Voting>;
  let pollAddress:PublicKey;

  beforeAll(async () => {
    context = await startAnchor("", [{ name: "voting", programId: PROGRAM_ID }], []);
    provider = new BankrunProvider(context);
    votingProgram = new anchor.Program(IDL, provider);
  });

  it("initializes a poll", async () => {
    await votingProgram.methods.initializePoll(
      new anchor.BN(1),
      "What is your favorite color?",
      new anchor.BN(100),
      new anchor.BN(1739370789)
    ).rpc();

    [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8)],
      votingProgram.programId
    );

    const poll = await votingProgram.account.poll.fetch(pollAddress);
    console.log("Poll Initialized:", poll);

    expect(poll.pollId.toNumber()).toBe(1);
    expect(poll.description).toBe("What is your favorite color?");
    expect(poll.pollStart.toNumber()).toBe(100);
    expect(poll.totalVotes.toNumber()).toBe(0);
  });

  it("initializes candidates", async () => {
    const candidates = ["Pink", "Blue"];
    for (const name of candidates) {
      await votingProgram.methods.initializeCandidate(name, new anchor.BN(1)).rpc();
    }

    for (const name of candidates) {
      const [candidateAddress] = PublicKey.findProgramAddressSync(
        [new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from(name)],
        votingProgram.programId
      );
      const candidate = await votingProgram.account.candidate.fetch(candidateAddress);
      console.log(`Candidate ${name} Initialized:`, candidate);
      expect(candidate.candidateVotes.toNumber()).toBe(0);
      expect(candidate.candidateName).toBe(name);
    }
  });

  it("votes for candidates and verifies total votes", async () => {
    const votes = ["Pink", "Blue", "Pink"];
    for (const name of votes) {
      await votingProgram.methods.vote(name, new anchor.BN(1)).rpc();
    }

    const results: Record<string, number> = {};
    for (const name of ["Pink", "Blue"]) {
      const [candidateAddress] = PublicKey.findProgramAddressSync(
        [new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from(name)],
        votingProgram.programId
      );
      const candidate = await votingProgram.account.candidate.fetch(candidateAddress);
      console.log(`Candidate ${name} Votes:`, candidate);

      results[name] = candidate.candidateVotes.toNumber();
    }

    expect(results["Pink"]).toBe(2);
    expect(results["Blue"]).toBe(1);

    const poll = await votingProgram.account.poll.fetch(pollAddress);
    console.log("Final Poll State:", poll);
    expect(poll.totalVotes.toNumber()).toBe(3);
  });
});
