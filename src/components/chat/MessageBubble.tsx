import markdownToHtml from "@/utils/markdownTohtml";
import type { Message } from "ai/react";
import { useMemo } from "react";
import { motion } from "framer-motion";

export function ChatMessageBubble({
  message,
  aiEmoji = "🤖",
  sources = [],
}: {
  message: Message;
  aiEmoji?: string;
  sources: any[];
}) {
  const isUser = message.role === "user";

  const colorClassName = isUser ? "bg-sky-600 text-white" : "bg-slate-50 text-black";
  const alignmentClassName = isUser ? "ml-auto" : "mr-auto";
  const postfix = isUser ? "🧑" : aiEmoji;

  const content = useMemo(() => markdownToHtml(message.content), [message.content]);

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 30 : -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`${alignmentClassName} ${colorClassName} rounded-lg px-4 py-3 max-w-[80%] mb-4 flex shadow-md`}
    >
      {isUser?"":`${postfix}`}
      <div className="flex flex-col">
        <div
          className="prose prose-lg max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        ></div>

        {sources.length > 0 && (
          <div className="mt-4">
            <h2 className="text-xs font-semibold text-gray-300">🔍 Sources:</h2>
            <div className="bg-slate-700 p-2 rounded-md text-xs text-gray-100">
              {sources.map((source, i) => (
                <div className="mt-2" key={`source-${i}`}>
                  <span className="font-semibold">{i + 1}. </span>
                  &quot;{source.pageContent}&quot;
                  {source.metadata?.loc?.lines && (
                    <div className="mt-1 text-gray-400">
                      Lines {source.metadata.loc.lines.from} to {source.metadata.loc.lines.to}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      {isUser?`${postfix}`:""}
    </motion.div>
  );
}
