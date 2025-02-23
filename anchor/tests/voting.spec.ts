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
  let voterKeypair: Keypair;
  let now: number;

  beforeAll(async () => {
    context = await startAnchor('', [{ name: "voting", programId: PROGRAM_ID }], []);
    provider = new BankrunProvider(context);
    votingProgram = new anchor.Program<Voting>(
      IDL,
      provider,
    );
    voterKeypair = Keypair.generate();
    now = Math.floor(Date.now() / 1000);
  });

  it("fails to initialize a poll with past poll_start", async () => {
    try {
      await votingProgram.methods.initializePoll(
        new anchor.BN(1),
        "Invalid Poll Start",
        new anchor.BN(now - 100), 
        new anchor.BN(now + 500),
      ).rpc();
      throw new Error("Should not allow initializing a poll with a past start time.");
    } catch (error: any) {
      expect(error.message).toContain("Poll start time must be in the future");
    }
  });

  it("fails to initialize a poll with past poll_end", async () => {
    try {
      await votingProgram.methods.initializePoll(
        new anchor.BN(2),
        "Invalid Poll End",
        new anchor.BN(now + 100),
        new anchor.BN(now - 100), // Past time
      ).rpc();
      throw new Error("Should not allow initializing a poll with a past end time.");
    } catch (error: any) {
      expect(error.message).toContain("Poll end time must be in the future");
    }
  });

  it("fails to initialize a poll with poll_end before poll_start", async () => {
    try {
      await votingProgram.methods.initializePoll(
        new anchor.BN(3),
        "End before Start",
        new anchor.BN(now + 300),
        new anchor.BN(now + 200), 
      ).rpc();
      throw new Error("Should not allow initializing a poll with an end time before start time.");
    } catch (error: any) {
      expect(error.message).toContain("Poll end time must be in the future and after the poll start");
    }
  });

  it("fails to initialize a poll if poll_start is not a valid Unix timestamp", async () => {
    try {
      await votingProgram.methods.initializePoll(
        new anchor.BN(4),
        "Invalid Start Timestamp",
        new anchor.BN(999999999), 
        new anchor.BN(now + 1000),
      ).rpc();

      fail("Should not allow poll_start to be an invalid Unix timestamp.");
    } catch (error: any) {
      expect(error.message).toMatch(/(Provided value is not a valid Unix timestamp|Poll start time must be in the future.)/);

    }
  });

  it("fails to initialize a poll if poll_end is not a valid Unix timestamp", async () => {
    try {
      await votingProgram.methods.initializePoll(
        new anchor.BN(5),
        "Invalid End Timestamp",
        new anchor.BN(now + 100),
        new anchor.BN(4_000_000_001), 
      ).rpc();

      fail("Should not allow poll_end to be an invalid Unix timestamp.");
    } catch (error: any) {
      expect(error.message).toContain("Provided value is not a valid Unix timestamp.");
    }
  });



  it("successfully initializes a poll", async () => {
    let start = new anchor.BN(now + 100);
    let end =  new anchor.BN(now + 1000);
    await votingProgram.methods.initializePoll(
      new anchor.BN(1),
      "What is your favorite color?",
      start,
      end,
    ).rpc();

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8)],
      votingProgram.programId,
    );

    const poll = await votingProgram.account.poll.fetch(pollAddress);

    console.log(poll);

    expect(poll.pollId.toNumber()).toBe(1);
    expect(poll.description).toBe("What is your favorite color?");
    expect(poll.pollStart.toNumber()).toBe(start.toNumber());

  });

  it("initializes candidates", async () => {
    await votingProgram.methods.initializeCandidate(
      "Pink",
      new anchor.BN(1),
    ).rpc();
    await votingProgram.methods.initializeCandidate(
      "Blue",
      new anchor.BN(1),
    ).rpc();

    const [pinkAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("Pink")],
      votingProgram.programId,
    );
    const pinkCandidate = await votingProgram.account.candidate.fetch(pinkAddress);
    console.log(pinkCandidate);
    expect(pinkCandidate.candidateVotes.toNumber()).toBe(0);
    expect(pinkCandidate.candidateName).toBe("Pink");

    const [blueAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("Blue")],
      votingProgram.programId,
    );
    const blueCandidate = await votingProgram.account.candidate.fetch(blueAddress);
    console.log(blueCandidate);
    expect(blueCandidate.candidateVotes.toNumber()).toBe(0);
    expect(blueCandidate.candidateName).toBe("Blue");
  });

  it("vote candidates", async () => {
    await votingProgram.methods.vote(
      "Pink",
      new anchor.BN(1),
    ).rpc();
    await votingProgram.methods.vote(
      "Blue",
      new anchor.BN(1),
    ).rpc();
    await votingProgram.methods.vote(
      "Pink",
      new anchor.BN(1),
    ).rpc();

    const [pinkAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("Pink")],
      votingProgram.programId,
    );
    const pinkCandidate = await votingProgram.account.candidate.fetch(pinkAddress);
    console.log(pinkCandidate);
    expect(pinkCandidate.candidateVotes.toNumber()).toBe(2);
    expect(pinkCandidate.candidateName).toBe("Pink");

    const [blueAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("Blue")],
      votingProgram.programId,
    );
    const blueCandidate = await votingProgram.account.candidate.fetch(blueAddress);
    console.log(blueCandidate);
    expect(blueCandidate.candidateVotes.toNumber()).toBe(1);
    expect(blueCandidate.candidateName).toBe("Blue");
  });
});