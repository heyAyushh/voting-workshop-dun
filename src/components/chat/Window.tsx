"use client";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { Message } from "ai";
import { useChat } from "ai/react";
import { useRef, useState, ReactElement } from "react";
import type { FormEvent } from "react";

import { ChatMessageBubble } from "@/components/chat/MessageBubble";
import { IntermediateStep } from "@/components/chat/IntermediateStep";
import { motion } from "framer-motion";

export function ChatWindow({
  endpoint,
  emptyStateComponent,
  placeholder,
  titleText = "An LLM",
  emoji,
  showIntermediateStepsToggle,
}: {
  endpoint: string;
  emptyStateComponent: ReactElement;
  placeholder?: string;
  titleText?: string;
  emoji?: string;
  showIntermediateStepsToggle?: boolean;
}) {
  const messageContainerRef = useRef<HTMLDivElement | null>(null);

  const [showIntermediateSteps, setShowIntermediateSteps] = useState(false);
  const [intermediateStepsLoading, setIntermediateStepsLoading] =
    useState(false);

  const [sourcesForMessages, setSourcesForMessages] = useState<
    Record<string, any>
  >({});

  const {
    messages,
    input,
    setInput,
    handleInputChange,
    handleSubmit,
    isLoading: chatEndpointIsLoading,
    setMessages,
  } = useChat({
    api: endpoint,
    onResponse(response) {
      const sourcesHeader = response.headers.get("x-sources");
      const sources = sourcesHeader
        ? JSON.parse(Buffer.from(sourcesHeader, "base64").toString("utf8"))
        : [];
      const messageIndexHeader = response.headers.get("x-message-index");
      if (sources.length && messageIndexHeader !== null) {
        setSourcesForMessages({
          ...sourcesForMessages,
          [messageIndexHeader]: sources,
        });
      }
    },
    streamProtocol: "text",
    onError: (e) => {
      toast(e.message, { theme: "dark" });
    },
  });

  async function sendMessage(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (messageContainerRef.current) {
      messageContainerRef.current.classList.add("grow");
    }
    if (!messages.length) {
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
    if (chatEndpointIsLoading || intermediateStepsLoading) {
      return;
    }
    if (!showIntermediateSteps) {
      handleSubmit(e);
    } else {
      setIntermediateStepsLoading(true);
      setInput("");
      const messagesWithUserReply = messages.concat({
        id: messages.length.toString(),
        content: input,
        role: "user",
      });
      setMessages(messagesWithUserReply);
      const response = await fetch(endpoint, {
        method: "POST",
        body: JSON.stringify({
          messages: messagesWithUserReply,
          show_intermediate_steps: true,
        }),
      });
      const json = await response.json();
      setIntermediateStepsLoading(false);
      if (response.status === 200) {
        const responseMessages: Message[] = json.messages;
        const toolCallMessages = responseMessages.filter(
          (responseMessage: Message) =>
            (responseMessage.role === "assistant" &&
              !!responseMessage.tool_calls?.length) ||
            responseMessage.role === "tool"
        );

        const intermediateStepMessages = [];
        for (let i = 0; i < toolCallMessages.length; i += 2) {
          const aiMessage = toolCallMessages[i];
          const toolMessage = toolCallMessages[i + 1];
          intermediateStepMessages.push({
            id: (messagesWithUserReply.length + i / 2).toString(),
            role: "system" as const,
            content: JSON.stringify({
              action: aiMessage.tool_calls?.[0],
              observation: toolMessage.content,
            }),
          });
        }

        const newMessages = [...messagesWithUserReply, ...intermediateStepMessages];

        for (const message of intermediateStepMessages) {
          setMessages([...newMessages]);
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 + Math.random() * 1000)
          );
        }

        setMessages([
          ...newMessages,
          {
            id: newMessages.length.toString(),
            content: responseMessages[responseMessages.length - 1].content,
            role: "assistant",
          },
        ]);
      } else {
        if (json.error) {
          toast(json.error, { theme: "dark" });
          throw new Error(json.error);
        }
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={`flex flex-col items-center p-4 md:p-8 rounded grow overflow-hidden ${
        messages.length > 0 ? "border" : ""
      }`}
    >
      <h2 className={`${messages.length > 0 ? "" : "hidden"} text-2xl`}>
        {emoji} {titleText}
      </h2>
      {messages.length === 0 ? emptyStateComponent : ""}
      <motion.div
        className="flex flex-col-reverse w-full mb-4 overflow-auto"
        ref={messageContainerRef}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        {messages.length > 0
          ? [...messages].reverse().map((m, i) => {
              const sourceKey = (messages.length - 1 - i).toString();
              return m.role === "system" ? (
                <IntermediateStep key={m.id} message={m} />
              ) : (
                <ChatMessageBubble
                  key={m.id}
                  message={m}
                  aiEmoji={emoji}
                  sources={sourcesForMessages[sourceKey]}
                />
              );
            })
          : ""}
      </motion.div>

      <form onSubmit={sendMessage} className="flex w-full flex-col">
        {showIntermediateStepsToggle && (
          <div>
            <input
              type="checkbox"
              id="show_intermediate_steps"
              checked={showIntermediateSteps}
              onChange={(e) => setShowIntermediateSteps(e.target.checked)}
            />
            <label htmlFor="show_intermediate_steps"> Show intermediate steps</label>
          </div>
        )}

        <div className="flex w-full mt-4">
          <input
            className="grow mr-4 p-3 rounded"
            value={input}
            placeholder={placeholder ?? "Type a message..."}
            onChange={handleInputChange}
          />
          <button
            type="submit"
            className="px-6 py-3 bg-sky-600 rounded text-white shadow-md"
            disabled={chatEndpointIsLoading || intermediateStepsLoading}
          >
            {chatEndpointIsLoading || intermediateStepsLoading ? "Sending..." : "Send"}
          </button>
        </div>
      </form>
      <ToastContainer />
    </motion.div>
  );
}
