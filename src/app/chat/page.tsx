import { ChatWindow } from "@/components/chat/Window";

const InfoCard = () => (
  <div className="p-6 md:p-10 rounded-lg bg-[#25252d] w-full max-h-[85%] overflow-hidden shadow-lg">
    <h1 className="text-3xl md:text-4xl font-bold mb-5 text-white">
      Solana Voting Dapp
    </h1>
    
    <ul className="space-y-3 text-white">
      {[
        { emoji: "🤝", text: "Welcome to the Solana Voting Dapp powered by SolanaAgentKit, LangChain.js, and Next.js." },
        { emoji: "💻", text: "Interact with Solana blockchain voting functionality seamlessly.", hidden: true },
        { emoji: "🎨", text: "Ask questions about your wallet, voting options, or how to participate.", hidden: true },
        { emoji: "👇", text: "Try asking: What is my wallet address?", highlight: true }
      ].map((item, index) => (
        <li 
          key={index} 
          className={`text-lg flex items-center ${item.hidden ? "hidden md:flex" : ""}`}
        >
          {item.emoji} 
          <span className="ml-3">
            {item.highlight ? (
              <code className="bg-gray-800 px-2 py-1 rounded-md text-sm">{item.text}</code>
            ) : (
              item.text
            )}
          </span>
        </li>
      ))}
    </ul>
  </div>
);

export default function Home() {
  return (
    <ChatWindow
      endpoint="api/chat"
      emoji="🤖"
      titleText="Solana Voting Assistant"
      placeholder="Ask me anything about voting on Solana..."
      emptyStateComponent={<InfoCard />}
    />
  );
}
