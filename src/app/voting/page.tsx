'use client';
import { VotingFeature } from '@/components/voting/voting-feature';
import { Container, Typography, Box } from '@mui/material';

export default function VotingPage() {
  return (
    <Box sx={{ 
      minHeight: '100vh',
      background: 'linear-gradient(135deg,rgb(0, 0, 0) 0%,rgb(0, 0, 0) 100%)',
      backgroundImage: `
        radial-gradient(at 40% 20%, rgba(0, 0, 0, 0.1) 0px, transparent 50%),
        radial-gradient(at 80% 0%, rgba(0, 0, 0, 0.1) 0px, transparent 50%),
        radial-gradient(at 0% 50%, rgba(3, 3, 3, 0.1) 0px, transparent 50%)
      `,
      py: 8 
    }}>
      <Container maxWidth="lg">
        <Typography 
          variant="h2" 
          component="h1" 
          sx={{ 
            color: '#F1E3E4',
            textAlign: 'center',
            mb: 6,
            fontWeight: 'bold',
            textShadow: '2px 2px 4px rgba(28, 29, 33, 0.5)',
            letterSpacing: '-0.02em',
          }}
        >
          Decentralized Voting Platform
        </Typography>
        <VotingFeature />
      </Container>
    </Box>
  );
}
