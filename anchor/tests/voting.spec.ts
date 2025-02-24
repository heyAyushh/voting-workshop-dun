import * as anchor from "@coral-xyz/anchor";
import { Keypair, PublicKey } from "@solana/web3.js";
import { BankrunProvider, startAnchor } from "anchor-bankrun";
import { Voting } from "../target/types/voting";

const IDL = require("../target/idl/voting.json");
const PROGRAM_ID = new PublicKey(IDL.address);

jest.setTimeout(40000); // Increase timeout for tests

describe("Voting", () => {
  let context;
  let provider:BankrunProvider;
  let votingProgram: anchor.Program<Voting>;
  let now: number;

  beforeAll(async () => {
    context = await startAnchor("", [{ name: "voting", programId: PROGRAM_ID }], []);
    provider = new BankrunProvider(context);
    votingProgram = new anchor.Program<Voting>(IDL, provider);
    now = Math.floor(Date.now() / 1000);
    
  });

  it("initializes a poll", async () => {
    const pollStart = new anchor.BN(now ); // Start in 5s
    const pollEnd = new anchor.BN(now + 15); // End in 15s

    console.log(`⏳ Poll starts at: ${pollStart.toNumber()} | Poll ends at: ${pollEnd.toNumber()}`);

   const tx =  await votingProgram.methods.initializePoll(
      new anchor.BN(1),
      "What is your favorite color?",
      pollStart,
      pollEnd
    ).rpc();

    console.log(tx)

    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8)],
      votingProgram.programId
    );

    const poll = await votingProgram.account.poll.fetch(pollAddress);
    console.log(`📌 On-Chain Poll Start: ${poll.pollStart.toNumber()}`);
    console.log(`📌 On-Chain Poll End: ${poll.pollEnd.toNumber()}`);

    expect(poll.pollId.toNumber()).toBe(1);
    expect(poll.description).toBe("What is your favorite color?");
    expect(poll.pollStart.toNumber()).toBe(pollStart.toNumber());
    expect(poll.pollEnd.toNumber()).toBe(pollEnd.toNumber());
  });

  async function getOnChainTime(): Promise<number> {
    const slot = await provider.connection.getSlot("finalized");
    const blockTime = await provider.connection.getBlockTime(slot);
    return blockTime ?? Math.floor(Date.now() / 1000);
  }


  it("initializes candidates", async () => {
    await votingProgram.methods.initializeCandidate("Pink", new anchor.BN(1)).rpc();
    await votingProgram.methods.initializeCandidate("Blue", new anchor.BN(1)).rpc();

    const [pinkAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("Pink")],
      votingProgram.programId
    );
    const pinkCandidate = await votingProgram.account.candidate.fetch(pinkAddress);
    expect(pinkCandidate.candidateVotes.toNumber()).toBe(0);
    expect(pinkCandidate.candidateName).toBe("Pink");

    const [blueAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("Blue")],
      votingProgram.programId
    );
    const blueCandidate = await votingProgram.account.candidate.fetch(blueAddress);
    expect(blueCandidate.candidateVotes.toNumber()).toBe(0);
    expect(blueCandidate.candidateName).toBe("Blue");
  });

  it("fails to vote before poll start time", async () => {
    try {
      await votingProgram.methods.vote("Pink", new anchor.BN(1)).rpc();
      throw new Error("Voting should not be allowed before poll starts.");
    } catch (error: any) {
      expect(error.message).toContain("Voting has not started yet.");
    }
  });
  it("votes successfully within the allowed time", async () => {
    // Fetch poll details from the blockchain
    const [pollAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8)],
      votingProgram.programId
    );
  
    const poll = await votingProgram.account.poll.fetch(pollAddress);
  
    console.log("📌 On-Chain Poll Start:", poll.pollStart.toNumber());
    console.log("📌 On-Chain Poll End:", poll.pollEnd.toNumber());
  
    const currentTimestamp = Math.floor(Date.now() / 1000);
    console.log("⏳ Current Local Time:", currentTimestamp);
  
    // Ensure we wait until the poll starts
    if (currentTimestamp < poll.pollStart.toNumber()) {
      const waitTime = poll.pollStart.toNumber() - currentTimestamp;
      console.log(`⏳ Waiting ${waitTime} seconds for poll to start...`);
      await new Promise((resolve) => setTimeout(resolve, waitTime * 1000));
    }
  
    console.log("✅ Poll has started. Proceeding with voting...");
  
    await votingProgram.methods.vote("Pink", new anchor.BN(1)).rpc();
    await votingProgram.methods.vote("Blue", new anchor.BN(1)).rpc();
    await votingProgram.methods.vote("Pink", new anchor.BN(1)).rpc();
  
    const [pinkAddress] = PublicKey.findProgramAddressSync(
      [new anchor.BN(1).toArrayLike(Buffer, "le", 8), Buffer.from("Pink")],
      votingProgram.programId
    );
  
    const pinkCandidate = await votingProgram.account.candidate.fetch(pinkAddress);
    console.log("🗳 Votes for Pink:", pinkCandidate.candidateVotes.toNumber());
    expect(pinkCandidate.candidateVotes.toNumber()).toBe(3);
  });
  
  it("fails to vote after poll end time", async () => {
    console.log(`⏳ Waiting for poll to end...`);
    await new Promise((resolve) => setTimeout(resolve, 16000)); // NEW


    console.log(`✅ Poll ended at ${Math.floor(Date.now() / 1000)}`);

    try {
      await votingProgram.methods.vote("Pink", new anchor.BN(1)).rpc();
      throw new Error("Voting should not be allowed after poll ends.");
    } catch (error: any) {
      expect(error.message).toContain("Voting has ended.");
    }
  });
});