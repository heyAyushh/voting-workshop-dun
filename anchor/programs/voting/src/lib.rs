#![allow(clippy::result_large_err)]

use anchor_lang::prelude::*;
use anchor_lang::solana_program::hash::{hash, Hash};

declare_id!("41bobPsZM7w7R2ezj3oAU6phN6sowxeFtDiAX8DsyKxS");

#[program]
pub mod voting {
    use super::*;

    #[error_code]
    pub enum PollError {
        #[msg("Poll end time must be after start time")]
        InvalidPollEndTime,
        #[msg("Poll start time must be in the future")]
        PollStartTimeInPast,
        #[msg("Poll duration is too long. Maximum duration is 30 days")]
        PollDurationTooLong,
        #[msg("Poll has not started yet")]
        PollNotStarted,
        #[msg("Poll has already ended")]
        PollEnded,
        #[msg("Candidate can't be added once poll has started")]
        InvalidCandidate,
        #[msg("You have already voted in this poll")]
        AlreadyVoted,
    }

    pub fn initialize_poll(
      ctx: Context<InitializePoll>,
      description: String,
      poll_start: u64,
      poll_end: u64,
      name: String,
    )-> Result<()> 
    {
      let poll = &mut ctx.accounts.poll;
      let clock = Clock::get()?;
      let current_time = clock.unix_timestamp as u64;
      
      // Validate poll times
      require!(poll_end > poll_start, PollError::InvalidPollEndTime);
      require!(poll_start > current_time, PollError::PollStartTimeInPast);
      
      // Maximum poll duration of 30 days (in seconds)
      const MAX_POLL_DURATION: u64 = 30 * 24 * 60 * 60;
      require!(
          poll_end - poll_start <= MAX_POLL_DURATION,
          PollError::PollDurationTooLong
      );
      
      // Create a unique poll ID using timestamp and authority
      let signer = ctx.accounts.authority.key();
      let combined = format!("{}:{}", current_time, signer);
      let hash_result = hash(combined.as_bytes());
      let poll_id = u64::from_le_bytes(hash_result.to_bytes()[0..8].try_into().unwrap());
      
      poll.poll_id = poll_id;
      poll.description = description;
      poll.poll_start = poll_start;
      poll.poll_end = poll_end;
      poll.candidate_amount = 0;
      poll.name = name;
      poll.next_candidate_id = 0;

      Ok(())
    }

    pub fn initialize_candidate(
      ctx: Context<InitializeCandidate>,
      candidate_name: String,
    )-> Result<()>
    {
      let poll = &mut ctx.accounts.poll;
      let clock = Clock::get()?;
      let current_time = clock.unix_timestamp as u64;
      
      // Only allow adding candidates before the poll starts
      require!(current_time < poll.poll_start, PollError::InvalidCandidate);
      
      let candidate_id = poll.next_candidate_id;
      poll.next_candidate_id += 1;
      poll.candidate_amount += 1;

      let candidate = &mut ctx.accounts.candidate;
      candidate.poll_id = poll.poll_id;
      candidate.candidate_id = candidate_id;
      candidate.candidate_name = candidate_name;
      candidate.candidate_votes = 0;
      Ok(())
    }

    pub fn vote(ctx: Context<Vote>)-> Result<()>
    {
      let poll = &ctx.accounts.poll;
      let candidate = &mut ctx.accounts.candidate;
      let voter_record = &mut ctx.accounts.voter_record;
      let clock = Clock::get()?;
      let current_time = clock.unix_timestamp as u64;

      // Validate that voting is within the poll's time window
      require!(current_time >= poll.poll_start, PollError::PollNotStarted);
      require!(current_time <= poll.poll_end, PollError::PollEnded);

      // Check if voter has already voted
      require!(voter_record.poll_id == 0, PollError::AlreadyVoted);

      // Record the vote
      voter_record.poll_id = poll.poll_id;
      voter_record.voter = ctx.accounts.voter.key();
        
      candidate.candidate_votes += 1;
      Ok(())
    }
      
}

#[derive(Accounts)]
pub struct Vote<'info> {

  #[account(mut)]
  pub voter: Signer<'info>,

  #[account(mut)]
  pub poll: Account<'info, Poll>,

  #[account(mut)]
  pub candidate: Account<'info, Candidate>,

  #[account(
    init,
    payer = voter,
    space = 8 + VoterRecord::INIT_SPACE,
    seeds = [
        b"voter_record",
        poll.poll_id.to_le_bytes().as_ref(),
        voter.key().as_ref(),
    ],
    bump
  )]
  pub voter_record: Account<'info, VoterRecord>,

  pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(candidate_name: String)]
pub struct InitializeCandidate<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(mut)]
    pub poll: Account<'info, Poll>,

    #[account(
        init,
        payer = authority,
        space = 8 + Candidate::INIT_SPACE,
        seeds = [
            b"candidate",
            poll.key().as_ref(),
            poll.next_candidate_id.to_le_bytes().as_ref(),
        ],
        bump
    )]
    pub candidate: Account<'info, Candidate>,

    pub system_program: Program<'info, System>,
}

#[derive(Accounts)]
#[instruction(description: String, poll_start: u64, poll_end: u64, name: String)]
pub struct InitializePoll<'info> {
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = 8 + Poll::INIT_SPACE,
        seeds = [
            b"poll",
            authority.key().as_ref(),
            poll_start.to_le_bytes().as_ref()
        ],
        bump
    )]
    pub poll: Account<'info, Poll>,

    pub system_program: Program<'info, System>,
}

#[account]
#[derive(InitSpace)]
pub struct Poll {
  pub poll_id: u64,
  #[max_len(32)]
  pub name: String,
  #[max_len(280)]
  pub description: String,
  pub poll_start: u64,
  pub poll_end: u64,
  pub candidate_amount: u64,
  pub next_candidate_id: u64,
}

#[account]
#[derive(InitSpace)]
pub struct Candidate {
  pub poll_id: u64,
  pub candidate_id: u64,
  #[max_len(32)]
  pub candidate_name: String,
  pub candidate_votes: u64,
}

#[account]
#[derive(InitSpace)]
pub struct VoterRecord {
    pub poll_id: u64,
    pub voter: Pubkey,
}