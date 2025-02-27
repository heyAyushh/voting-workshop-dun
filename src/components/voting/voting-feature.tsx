'use client'

import { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui'
import { 
  Card, 
  CardContent, 
  Grid, 
  Typography, 
  Button, 
  Box,
  CircularProgress,
  Alert,
  Paper,
  Chip,
  IconButton,
  Fade,
  Grow,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack
} from '@mui/material'
import HowToVoteIcon from '@mui/icons-material/HowToVote'
import TimelineIcon from '@mui/icons-material/Timeline'
import PeopleIcon from '@mui/icons-material/People'
import AddIcon from '@mui/icons-material/Add'
import DeleteIcon from '@mui/icons-material/Delete'
import { motion } from 'framer-motion'
import { useAnchorProvider } from '../solana/solana-provider'
import { getVotingProgram } from '@project/anchor'
import { PublicKey } from '@solana/web3.js'
import BN from 'bn.js'
import { SystemProgram } from '@solana/web3.js';

interface CreatePollProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (pollData: {
    name: string;
    description: string;
    pollStart: string;
    pollEnd: string;
    candidates: string[];
  }) => void;
}

function CreatePoll({ open, onClose, onSubmit }: CreatePollProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [pollStart, setPollStart] = useState('');
  const [pollEnd, setPollEnd] = useState('');
  const [candidates, setCandidates] = useState<string[]>(['', '']);
  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
    pollStart?: string;
    pollEnd?: string;
    candidates?: string[];
  }>({});

  const validateForm = () => {
    const newErrors: typeof errors = {};
    
    // Name validation
    if (!name.trim()) {
      newErrors.name = 'Poll name is required';
    } else if (name.length < 3) {
      newErrors.name = 'Poll name must be at least 3 characters';
    } else if (name.length > 50) {
      newErrors.name = 'Poll name must be less than 50 characters';
    }

    // Description validation
    if (!description.trim()) {
      newErrors.description = 'Description is required';
    } else if (description.length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    } else if (description.length > 500) {
      newErrors.description = 'Description must be less than 500 characters';
    }

    // Date validations
    const startDate = new Date(pollStart);
    const endDate = new Date(pollEnd);
    const now = new Date();

    if (!pollStart) {
      newErrors.pollStart = 'Start date is required';
    } else if (startDate < now) {
      newErrors.pollStart = 'Start date cannot be in the past';
    }

    if (!pollEnd) {
      newErrors.pollEnd = 'End date is required';
    } else if (endDate <= startDate) {
      newErrors.pollEnd = 'End date must be after start date';
    }

    // Candidates validation
    const candidateErrors: string[] = [];
    const nonEmptyCandidates = candidates.filter(c => c.trim());
    
    if (nonEmptyCandidates.length < 2) {
      candidateErrors[0] = 'At least 2 candidates are required';
    }

    candidates.forEach((candidate, index) => {
      if (!candidate.trim() && index < 2) {
        candidateErrors[index] = 'Candidate name is required';
      } else if (candidate.trim().length < 2) {
        candidateErrors[index] = 'Name must be at least 2 characters';
      }
    });

    if (candidateErrors.length > 0) {
      newErrors.candidates = candidateErrors;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        name,
        description,
        pollStart,
        pollEnd,
        candidates: candidates.filter(c => c.trim() !== ''),
      });
      // Reset form
      setName('');
      setDescription('');
      setPollStart('');
      setPollEnd('');
      setCandidates(['', '']);
      setErrors({});
    }
  };

  const addCandidate = () => {
    setCandidates([...candidates, '']);
  };

  const removeCandidate = (index: number) => {
    if (candidates.length > 2) { // Maintain minimum 2 candidates
      const newCandidates = candidates.filter((_, i) => i !== index);
      setCandidates(newCandidates);
    }
  };

  return (
    <Dialog 
    open={open} 
    onClose={onClose} 
    maxWidth="sm" 
    fullWidth
    PaperProps={{
      sx: {
        background: '#2C2E35',  // Darker base for better contrast
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(162, 136, 166, 0.4)',
        borderRadius: '16px',
        boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.3)',
      }
    }}
  >
    <DialogTitle sx={{ 
      color: '#EAE0E0', // Softer white
      borderBottom: '1px solid rgba(162, 136, 166, 0.3)',
      pb: 2,
      fontSize: '1.5rem',
      fontWeight: 'bold',
    }}>
      Create New Poll
    </DialogTitle>
    <form onSubmit={handleSubmit}>
      <DialogContent sx={{ mt: 2 }}>
        <Stack spacing={3}>
          <TextField
            label="Poll Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={!!errors.name}
            helperText={errors.name}
            required
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#EAE0E0',
                '& fieldset': {
                  borderColor: 'rgba(162, 136, 166, 0.5)',
                },
                '&:hover fieldset': {
                  borderColor: '#BB9BB0',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#A288A6',
                }
              },
              '& .MuiInputLabel-root': {
                color: '#B5A9A9',
              },
              '& .MuiFormHelperText-root': {
                color: '#ff6b6b',
              }
            }}
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            error={!!errors.description}
            helperText={errors.description}
            required
            fullWidth
            multiline
            rows={3}
            sx={{
              '& .MuiOutlinedInput-root': {
                color: '#EAE0E0',
                '& fieldset': {
                  borderColor: 'rgba(162, 136, 166, 0.5)',
                },
                '&:hover fieldset': {
                  borderColor: '#BB9BB0',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#A288A6',
                }
              },
              '& .MuiInputLabel-root': {
                color: '#B5A9A9',
              },
              '& .MuiFormHelperText-root': {
                color: '#ff6b6b',
              }
            }}
          />
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="Start Date"
              type="datetime-local"
              value={pollStart}
              onChange={(e) => setPollStart(e.target.value)}
              error={!!errors.pollStart}
              helperText={errors.pollStart}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#EAE0E0',
                  '& fieldset': {
                    borderColor: 'rgba(162, 136, 166, 0.5)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#BB9BB0',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#A288A6',
                  }
                },
                '& .MuiInputLabel-root': {
                  color: '#B5A9A9',
                }
              }}
            />
            <TextField
              label="End Date"
              type="datetime-local"
              value={pollEnd}
              onChange={(e) => setPollEnd(e.target.value)}
              error={!!errors.pollEnd}
              helperText={errors.pollEnd}
              required
              fullWidth
              InputLabelProps={{ shrink: true }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  color: '#EAE0E0',
                  '& fieldset': {
                    borderColor: 'rgba(162, 136, 166, 0.5)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#BB9BB0',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#A288A6',
                  }
                },
                '& .MuiInputLabel-root': {
                  color: '#B5A9A9',
                }
              }}
            />
          </Box>
          
          <Box>
            <Typography variant="subtitle1" sx={{ color: '#EAE0E0', mb: 2 }}>
              Candidates
            </Typography>
            {candidates.map((candidate, index) => (
              <Box key={index} sx={{ display: 'flex', gap: 1, mb: 2 }}>
                <TextField
                  label={`Candidate ${index + 1}`}
                  value={candidate}
                  onChange={(e) => {
                    const newCandidates = [...candidates];
                    newCandidates[index] = e.target.value;
                    setCandidates(newCandidates);
                  }}
                  error={!!errors.candidates?.[index]}
                  helperText={errors.candidates?.[index]}
                  required={index < 2}
                  fullWidth
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#EAE0E0',
                      '& fieldset': {
                        borderColor: 'rgba(162, 136, 166, 0.5)',
                      },
                      '&:hover fieldset': {
                        borderColor: '#BB9BB0',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#A288A6',
                      }
                    },
                    '& .MuiInputLabel-root': {
                      color: '#B5A9A9',
                    }
                  }}
                />
                {candidates.length > 2 && (
                  <IconButton 
                    onClick={() => removeCandidate(index)}
                    sx={{ 
                      color: '#ff6b6b',
                      '&:hover': {
                        color: '#ff8787',
                        backgroundColor: 'rgba(255, 107, 107, 0.1)',
                      }
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                )}
              </Box>
            ))}
            <Button
              startIcon={<AddIcon />}
              onClick={addCandidate}
              variant="outlined"
              size="small"
              sx={{
                color: '#A288A6',
                borderColor: '#A288A6',
                '&:hover': {
                  borderColor: '#BB9BB0',
                  backgroundColor: 'rgba(162, 136, 166, 0.1)',
                }
              }}
            >
              Add Candidate
            </Button>
          </Box>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ 
        p: 3, 
        borderTop: '1px solid rgba(162, 136, 166, 0.3)',
        gap: 1
      }}>
        <Button 
          onClick={onClose}
          sx={{
            color: '#B5A9A9',
            '&:hover': {
              backgroundColor: 'rgba(204, 188, 188, 0.1)',
            }
          }}
        >
          Cancel
        </Button>
        <Button 
          type="submit" 
          variant="contained"
          sx={{
            backgroundColor: '#A288A6',
            color: '#1C1D21',
            '&:hover': {
              backgroundColor: '#BB9BB0',
            }
          }}
        >
          Create Poll
        </Button>
      </DialogActions>
    </form>
  </Dialog>
  
  );
}

// Common TextField styles
const textFieldStyle = {
  '& .MuiOutlinedInput-root': {
    color: '#F1E3E4',
    '& fieldset': {
      borderColor: 'rgba(162, 136, 166, 0.3)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(162, 136, 166, 0.5)',
    },
  },
  '& .MuiInputLabel-root': {
    color: '#CCBCBC',
  },
  '& .MuiFormHelperText-root': {
    color: '#ff6b6b',
  }
};

// Add this helper function at the top level
const getPollStatus = (startTime: number, endTime: number) => {
  const now = Date.now();
  const start = startTime * 1000;
  const end = endTime * 1000;

  if (now < start) {
    const timeLeft = Math.floor((start - now) / 1000);
    const days = Math.floor(timeLeft / 86400);
    const hours = Math.floor((timeLeft % 86400) / 3600);
    const minutes = Math.floor((timeLeft % 3600) / 60);
    return {
      status: 'upcoming',
      message: `Starts in ${days}d ${hours}h ${minutes}m`,
      color: '#ffd43b'
    };
  } else if (now > end) {
    return {
      status: 'ended',
      message: 'Poll has ended',
      color: '#ff6b6b'
    };
  }
  return {
    status: 'active',
    message: 'Poll is active',
    color: '#69db7c'
  };
};

export function VotingFeature() {
  const { connected, publicKey } = useWallet()
  const [polls, setPolls] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedPoll, setSelectedPoll] = useState<number | null>(null)
  const [createPollOpen, setCreatePollOpen] = useState(false)
  const [isCreatingPoll, setIsCreatingPoll] = useState(false)
  const [transactionStatus, setTransactionStatus] = useState<{
    status: 'idle' | 'signing' | 'confirming' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });
  const [isVoting, setIsVoting] = useState(false);
  const [voteStatus, setVoteStatus] = useState<{
    status: 'idle' | 'signing' | 'confirming' | 'success' | 'error';
    message: string;
  }>({ status: 'idle', message: '' });
  const provider = useAnchorProvider();

  const fetchPolls = async () => {
    try {
      setLoading(true);
      const program = getVotingProgram(provider);
      
      // Fetch all polls and candidates in parallel to reduce RPC calls
      const [allPolls, allCandidates] = await Promise.all([
        program.account.poll.all(),
        program.account.candidate.all()
      ]);
      
      // Create a map of pollId to candidates for efficient lookup
      const candidatesByPollId = allCandidates.reduce((acc, candidate) => {
        const pollId = candidate.account.pollId.toString('hex');
        if (!acc[pollId]) {
          acc[pollId] = [];
        }
        acc[pollId].push({
          ...candidate.account,
          publicKey: candidate.publicKey
        });
        return acc;
      }, {} as Record<string, any[]>);

      // Combine polls with their candidates
      const pollsWithCandidates = allPolls.map(poll => ({
        ...poll,
        candidates: candidatesByPollId[poll.account.pollId.toString('hex')] || []
      }));

      const filteredPolls = pollsWithCandidates.filter(poll => {
        return poll.candidates.length >= 2
      })

      console.log("Filtered polls", filteredPolls);
      
      // Sort polls by start time, most recent first
      const sortedPolls = filteredPolls.sort((a, b) => 
        b.account.pollStart.toNumber() - a.account.pollStart.toNumber()
      );

      setPolls(sortedPolls);
      console.log("Polls with candidates:", sortedPolls);
    } catch (err) {
      console.error('Error fetching polls:', err);
      setError('Failed to fetch polls: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch polls on component mount and when a new poll is created
  useEffect(() => {
    if (provider) {
      fetchPolls();
    }
  }, []);

  const handleCreatePoll = async (pollData: {
    name: string;
    description: string;
    pollStart: string;
    pollEnd: string;
    candidates: string[];
  }) => {
    try {
      if (pollData.candidates.length < 2) {
        setError('At least 2 candidates are required to create a poll');
        return;
      }

      setIsCreatingPoll(true);
      setCreatePollOpen(false);
      
      const program = getVotingProgram(provider);
      console.log(program)
      if (!publicKey) throw new Error('Wallet not connected');

      const pollId = new BN(Date.now());
      const startTime = new BN(Math.floor(new Date(pollData.pollStart).getTime() / 1000));
      const endTime = new BN(Math.floor(new Date(pollData.pollEnd).getTime() / 1000));

      setTransactionStatus({
        status: 'signing',
        message: 'Please sign the transaction to create your poll...'
      });

      // Create poll account
      const [pollPda] = PublicKey.findProgramAddressSync(
        [Buffer.from("poll"), publicKey.toBuffer(), startTime.toArrayLike(Buffer, 'le', 8)],
        program.programId
      );

      try {
        const pollTx = await program.methods
          .initializePoll(
            pollData.description,
            startTime,
            endTime,
            pollData.name
          )
          // @ts-ignore
          .accounts({
            authority: publicKey,
            poll: pollPda as unknown as any,
            systemProgram: SystemProgram.programId,
          })
          .rpc();
      } catch (err) {
        console.log(err)
        throw new Error('Failed to create poll. Please try again.');
      }

      setTransactionStatus({
        status: 'confirming',
        message: 'Creating poll...'
      });

      let pollAccount = await program.account.poll.fetch(pollPda);

      // Create candidate accounts
      for (let i = 0; i < pollData.candidates.length; i++) {
        setTransactionStatus({
          status: 'signing',
          message: `Please sign transaction for candidate ${i + 1} of ${pollData.candidates.length}...`
        });

        try {
          const candidateId = new BN(i + 1);
          const [candidatePda] = PublicKey.findProgramAddressSync(
            [
              Buffer.from('candidate'),
              pollPda.toBuffer(),
              pollAccount.nextCandidateId.toArrayLike(Buffer, 'le', 8),
            ],
            program.programId
          );

          await program.methods
            .initializeCandidate(pollData.candidates[i])
            .accounts({
              authority: publicKey,
              poll: pollPda,
              candidate: candidatePda,
              systemProgram: SystemProgram.programId,
            })
            .rpc();

          pollAccount = await program.account.poll.fetch(pollPda);
        } catch (err) {
          throw new Error('Failed to add candidates. A minimum of 2 candidates is required.');
        }
      }

      setTransactionStatus({
        status: 'success',
        message: 'Poll created successfully!'
      });

      await fetchPolls();
      
    } catch (err) {
      console.error('Error creating poll:', err);
      setTransactionStatus({
        status: 'error',
        message: (err as Error).message || 'Failed to create poll'
      });
      setError((err as Error).message || 'Failed to create poll');
    } finally {
      setTimeout(() => {
        setIsCreatingPoll(false);
        setTransactionStatus({ status: 'idle', message: '' });
      }, 2000);
    }
  };

  const handleVote = async (pollId: BN, candidateId: BN) => {
    try {
      setIsVoting(true);
      setVoteStatus({
        status: 'signing',
        message: 'Please sign the transaction to cast your vote...'
      });

      const program = getVotingProgram(provider);
      if (!publicKey) throw new Error('Wallet not connected');

      // Find the poll and candidate accounts
      const allPolls = await program.account.poll.all();
      const targetPoll = allPolls.find(p => p.account.pollId.eq(pollId));
      const allCandidates = await program.account.candidate.all();
      const targetCandidate = allCandidates.find(c => c.account.pollId.eq(pollId) && c.account.candidateId.eq(candidateId));

      if(!targetPoll || !targetCandidate) {
        console.error("Poll or candidate not found" );
        console.log("Target poll", targetPoll);
        console.log("Target candidate", targetCandidate);
        console.log("All polls", allPolls);
        console.log("All candidates", allCandidates);
        throw new Error('Poll or candidate not found');
      }

      // Get poll details
      const pollAuthority = targetPoll.publicKey;
      const candidatePda = targetCandidate.publicKey;

      console.log("PDAs - poll:", pollAuthority.toString(), "candidate:", candidatePda.toString());

      const [voterRecordPda] = PublicKey.findProgramAddressSync(
        [
          Buffer.from("voter_record"),
          pollId.toArrayLike(Buffer, 'le', 8),
          publicKey.toBuffer(),
        ],
        program.programId
      );

      // Submit vote transaction
      await program.methods
        .vote()
        .accounts({
          voter: publicKey,
          poll: pollAuthority as any,
          candidate: candidatePda,
          voterRecord: voterRecordPda ,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

        let candidateAccount = await program.account.candidate.fetch(candidatePda);

        console.log("Candidate votes for :"+candidateAccount.candidateName+" "+ candidateAccount.candidateVotes);

      // Refresh the polls to show updated vote count
      await fetchPolls();
      
    } catch (err) {
      console.error('Error voting:', err);
      
      // Check if the error is due to account already in use (duplicate vote)
      const errorMessage = (err as any)?.toString() || '';
      if (errorMessage.includes('already in use')) {
        setVoteStatus({
          status: 'error',
          message: 'You have already voted in this poll'
        });
        setError('You have already voted in this poll');
      } else {
        setVoteStatus({
          status: 'error',
          message: (err as Error).message
        });
        setError((err as Error).message);
      }
    } finally {
      setTimeout(() => {
        setIsVoting(false);
        setVoteStatus({ status: 'idle', message: '' });
      }, 2000);
    }
  };

  return (
    <Box>
      {!connected ? (
        <Fade in timeout={1000}>
          <Paper 
            elevation={6} 
            sx={{ 
              p: 6, 
              textAlign: 'center',
              background: 'rgba(44, 46, 53, 0.95)',
              borderRadius: 4,
              backdropFilter: 'blur(10px)',
              maxWidth: 600,
              margin: 'auto',
              border: '1px solid rgba(162, 136, 166, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            }}
          >
            <motion.div
              initial={{ scale: 0.5 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <HowToVoteIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            </motion.div>
            <Typography variant="h4" gutterBottom fontWeight="bold" sx={{ color: '#F1E3E4' }}>
              Welcome to Decentralized Voting
            </Typography>
            <Typography variant="body1" sx={{ color: '#CCBCBC', mb: 4 }} paragraph>
              Connect your wallet to participate in secure and transparent voting
            </Typography>
            <WalletMultiButton />
          </Paper>
        </Fade>
      ) : (
        <Box>
          <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
  variant="contained"
  startIcon={<AddIcon />}
  onClick={() => setCreatePollOpen(true)}
  sx={(theme) => ({
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    px: 4,
    py: 1.5,
    borderRadius: 2,
    fontSize: "1rem",
    fontWeight: 600,
    boxShadow: theme.shadows[4],
    transition: "all 0.2s ease-in-out",
    "&:hover": {
      backgroundColor: theme.palette.primary.dark,
      transform: "translateY(-2px)",
      boxShadow: theme.shadows[6],
    },
  })}
>
  Create Poll
</Button>

          </Box>
         <Grid container spacing={3} sx={{ mb: 4 }}>
  <Grid item xs={12}>
    <Paper
      elevation={3}
      sx={{
        p: 3,
        display: "flex",
        justifyContent: "space-around",
        alignItems: "center",
        gap: 3,
        background: "#000000", // Black Background
        borderRadius: 2,
        transition: "all 0.3s ease",
        border: "1px solid #007BFF", // Blue Border
        boxShadow: "0 4px 20px rgba(0, 123, 255, 0.3)", // Blue Shadow
        "&:hover": {
          transform: "translateY(-5px)",
          boxShadow: "0 8px 25px rgba(0, 123, 255, 0.5)", // Hover Effect
          background: "#1E1E1E", // Darker Black on Hover
        },
      }}
    >
      {/* Active Polls */}
      <Box textAlign="center">
        <HowToVoteIcon sx={{ fontSize: 40, color: "#007BFF" }} />
        <Typography variant="body2" sx={{ color: "#FFFFFF", mb: 1 }}>
          Active Polls
        </Typography>
        <Typography variant="h6" sx={{ color: "#FFFFFF", fontWeight: "bold" }}>
          {polls.length.toString()}
        </Typography>
      </Box>

      {/* Total Votes */}
      <Box textAlign="center">
        <TimelineIcon sx={{ fontSize: 40, color: "#007BFF" }} />
        <Typography variant="body2" sx={{ color: "#FFFFFF", mb: 1 }}>
          Total Votes
        </Typography>
        <Typography variant="h6" sx={{ color: "#FFFFFF", fontWeight: "bold" }}>
          {polls.reduce((acc, poll) => acc + poll.account.candidateAmount.toNumber(), 0)}
        </Typography>
      </Box>

      {/* Participants */}
      <Box textAlign="center">
        <PeopleIcon sx={{ fontSize: 40, color: "#007BFF" }} />
        <Typography variant="body2" sx={{ color: "#FFFFFF", mb: 1 }}>
          Participants
        </Typography>
        <Typography variant="h6" sx={{ color: "#FFFFFF", fontWeight: "bold" }}>
          {polls.reduce((acc, poll) => acc + poll.account.candidateAmount.toNumber(), 0)}
        </Typography>
      </Box>
    </Paper>
  </Grid>
</Grid>


<Grid container spacing={4}>
  {polls.length > 0 &&
    polls
      .filter((poll) => poll.candidates?.length >= 2)
      .map((poll) => {
        const pollStatus = getPollStatus(
          poll.account.pollStart.toNumber(),
          poll.account.pollEnd.toNumber()
        );

        return (
          <Grid item xs={12} key={poll.publicKey.toString()}>
            <Grow in timeout={1000}>
              <Card
                elevation={5}
                sx={{
                  background: "#000000", // Black Background
                  borderRadius: 4,
                  overflow: "hidden",
                  transition: "all 0.3s ease",
                  border: "1px solid #007BFF", // Blue Border
                  boxShadow: "0 8px 32px rgba(0, 123, 255, 0.3)", // Blue Shadow
                  "&:hover": {
                    transform: "translateY(-5px)",
                    boxShadow: "0 12px 40px rgba(0, 123, 255, 0.5)", // Hover Effect
                    background: "#1E1E1E", // Darker Black on Hover
                  },
                }}
              >
                <CardContent sx={{ p: 4 }}>
                  <Typography
                    variant="h4"
                    gutterBottom
                    sx={{
                      color: "#FFFFFF", // White Text
                      fontWeight: "bold",
                      mb: 3,
                      textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                    }}
                  >
                    {poll.account.name}
                  </Typography>

                  <Box
                    sx={{
                      mb: 4,
                      display: "flex",
                      gap: 2,
                      flexWrap: "wrap",
                    }}
                  >
                    <Chip
                      label={pollStatus.message}
                      sx={{
                        borderRadius: 2,
                        px: 2,
                        backgroundColor: `${pollStatus.color}20`,
                        color: pollStatus.color,
                        fontWeight: 600,
                        border: `1px solid ${pollStatus.color}40`,
                      }}
                    />
                    <Chip
                      label={`Starts: ${new Date(
                        poll.account.pollStart.toNumber() * 1000
                      ).toLocaleDateString()}`}
                      sx={{
                        borderRadius: 2,
                        px: 2,
                        backgroundColor: "#007BFF20", // Light Blue Background
                        color: "#FFFFFF",
                        fontWeight: 500,
                        border: "1px solid #007BFF40",
                      }}
                    />
                    <Chip
                      label={`Ends: ${new Date(
                        poll.account.pollEnd.toNumber() * 1000
                      ).toLocaleDateString()}`}
                      sx={{
                        borderRadius: 2,
                        px: 2,
                        backgroundColor: "#007BFF20",
                        color: "#FFFFFF",
                        fontWeight: 500,
                        border: "1px solid #007BFF40",
                      }}
                    />
                    <Chip
                      label={`Total Votes: ${poll?.candidates?.reduce(
                        (acc, candidate) =>
                          acc + candidate?.candidateVotes?.toNumber() || 0,
                        0
                      )}`}
                      sx={{
                        borderRadius: 2,
                        px: 2,
                        backgroundColor: "#007BFF20",
                        color: "#FFFFFF",
                        fontWeight: 500,
                        border: "1px solid #007BFF40",
                      }}
                    />
                  </Box>

                  <Grid container spacing={3}>
                    {poll.candidates?.map((candidate) => (
                      <Grid
                        item
                        xs={12}
                        sm={6}
                        key={candidate.publicKey.toString()}
                      >
                        <Paper
                          elevation={3}
                          sx={{
                            p: 3,
                            height: "100%",
                            background: "#111111", // Slightly Lighter Black
                            borderRadius: 3,
                            transition: "all 0.3s ease",
                            border: "1px solid #007BFF",
                            boxShadow: "0 4px 20px rgba(0, 123, 255, 0.3)",
                            "&:hover": {
                              transform: "scale(1.02)",
                              boxShadow: "0 8px 30px rgba(0, 123, 255, 0.5)",
                            },
                          }}
                        >
                          <Typography
                            variant="h5"
                            gutterBottom
                            sx={{
                              color: "#FFFFFF",
                              fontWeight: "bold",
                              mb: 2,
                              textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                            }}
                          >
                            {candidate.candidateName}
                          </Typography>
                          <Typography
                            variant="body1"
                            sx={{
                              color: "#CCCCCC",
                              mb: 3,
                              lineHeight: 1.6,
                            }}
                          >
                            {candidate.candidateDescription}
                          </Typography>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              mt: "auto",
                            }}
                          >
                            <Typography
                              variant="h6"
                              sx={{
                                color: "#007BFF",
                                fontWeight: 600,
                                textShadow: "0 2px 4px rgba(0, 0, 0, 0.2)",
                              }}
                            >
                              {candidate.candidateVotes.toString()} votes
                            </Typography>
                            <Button
                              variant="contained"
                              size="large"
                              onClick={() =>
                                handleVote(
                                  poll.account.pollId,
                                  candidate.candidateId
                                )
                              }
                              disabled={pollStatus.status !== "active" || !publicKey}
                              title={
                                pollStatus.status !== "active"
                                  ? pollStatus.message
                                  : "Cast your vote"
                              }
                              sx={{
                                borderRadius: 2,
                                px: 4,
                                py: 1.5,
                                textTransform: "none",
                                fontSize: "1.1rem",
                                fontWeight: "bold",
                                backgroundColor: "#007BFF",
                                color: "#FFFFFF",
                                boxShadow: "0 4px 15px rgba(0, 123, 255, 0.3)",
                                "&:hover": {
                                  backgroundColor: "#0056b3",
                                  transform: "translateY(-2px)",
                                  boxShadow:
                                    "0 6px 20px rgba(0, 123, 255, 0.4)",
                                },
                                "&:disabled": {
                                  backgroundColor: "rgba(204, 188, 188, 0.2)",
                                  color: "#CCCCCC",
                                },
                              }}
                            >
                              {pollStatus.status === "active"
                                ? "Vote"
                                : pollStatus.message}
                            </Button>
                          </Box>
                        </Paper>
                      </Grid>
                    ))}
                  </Grid>
                </CardContent>
              </Card>
            </Grow>
          </Grid>
        );
      })}
</Grid>


          {(!polls.length || !polls.some(poll => poll.candidates?.length >= 2)) && (
            <Box sx={{ 
              textAlign: 'center', 
              py: 8,
              color: '#CCBCBC'
            }}>
              <Typography variant="h6">
                No active polls found.
              </Typography>
            </Box>
          )}
        </Box>
      )}
      
      {error && (
        <Alert 
          severity="error" 
          sx={{ 
            mt: 2,
            borderRadius: 2,
            animation: 'slideIn 0.5s ease-out'
          }}
          onClose={() => setError(null)}
        >
          {error}
        </Alert>
      )}

      {/* Vote Status Overlay */}
      {isVoting && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <Box
            sx={{
              background: 'rgba(44, 46, 53, 0.95)',
              p: 4,
              borderRadius: 2,
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              border: '1px solid rgba(162, 136, 166, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            }}
          >
            <CircularProgress 
              sx={{ 
                color: voteStatus.status === 'error' ? '#ff6b6b' : '#A288A6',
                mb: 3 
              }} 
            />
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#F1E3E4',
                mb: 1,
                fontWeight: 'bold'
              }}
            >
              {voteStatus.status === 'signing' ? 'Waiting for Signature' :
               voteStatus.status === 'confirming' ? 'Confirming Vote' :
               voteStatus.status === 'success' ? 'Success!' :
               voteStatus.status === 'error' ? 'Error' : 'Processing...'}
            </Typography>
            <Typography sx={{ color: '#CCBCBC' }}>
              {voteStatus.message}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Transaction Status Overlay (for creating poll) */}
      {isCreatingPoll && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
          }}
        >
          <Box
            sx={{
              background: 'rgba(44, 46, 53, 0.95)',
              p: 4,
              borderRadius: 2,
              maxWidth: '400px',
              width: '90%',
              textAlign: 'center',
              border: '1px solid rgba(162, 136, 166, 0.3)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)',
            }}
          >
            <CircularProgress 
              sx={{ 
                color: transactionStatus.status === 'error' ? '#ff6b6b' : '#A288A6',
                mb: 3 
              }} 
            />
            <Typography 
              variant="h6" 
              sx={{ 
                color: '#F1E3E4',
                mb: 1,
                fontWeight: 'bold'
              }}
            >
              {transactionStatus.status === 'signing' ? 'Waiting for Signature' :
               transactionStatus.status === 'confirming' ? 'Confirming Transaction' :
               transactionStatus.status === 'success' ? 'Success!' :
               transactionStatus.status === 'error' ? 'Error' : 'Processing...'}
            </Typography>
            <Typography sx={{ color: '#CCBCBC' }}>
              {transactionStatus.message}
            </Typography>
          </Box>
        </Box>
      )}

      <CreatePoll
        open={createPollOpen}
        onClose={() => !isCreatingPoll && setCreatePollOpen(false)}
        onSubmit={handleCreatePoll}
      />

      <style jsx global>{`
        @keyframes slideIn {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </Box>
  )
}
