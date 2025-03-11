// Remove "use client" here
import "./globals.css";
import { ReactQueryProvider } from "./react-query-provider";
import { ClusterProvider } from "@/components/cluster/cluster-data-access";
import { SolanaProvider } from "@/components/solana/solana-provider";
import { UiLayout } from "@/components/ui/ui-layout";
import ClientLayout from "./layout.client"; // Import the client component

export const metadata = {
  title: "Voting DApp",
  description: "Solana-Based Voting DApp Powered by AI and Blockchain",
};

const links = [
  { label: "Account", path: "/account" },
  { label: "Clusters", path: "/clusters" },
  { label: "Voting Program", path: "/voting" },
  { label: "AI Chat", path: "/chat" },
];



export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-[#1a1a1f] text-white">
        <ReactQueryProvider>
          <ClusterProvider>
            <SolanaProvider>
              <UiLayout links={links}>
                <ClientLayout>{children}</ClientLayout>
              </UiLayout>
            </SolanaProvider>
          </ClusterProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
