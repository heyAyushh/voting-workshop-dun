import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import type { Message } from "ai/react";
import clsx from "clsx";

export function IntermediateStep({ message }: { message: Message }) {
	const { action, observation } = useMemo(() => JSON.parse(message.content), [message.content]);
	const [expanded, setExpanded] = useState(false);

	return (
		<motion.div
			className="ml-auto bg-green-600 rounded-lg p-4 max-w-[80%] mb-8 whitespace-pre-wrap flex flex-col cursor-pointer shadow-lg"
			initial={{ opacity: 0, scale: 0.9 }}
			animate={{ opacity: 1, scale: 1 }}
			transition={{ duration: 0.2 }}
		>
			<div className="flex justify-between items-center" onClick={() => setExpanded(!expanded)}>
				<motion.code
					className="bg-slate-600 px-3 py-1 rounded hover:text-blue-400 cursor-pointer"
					whileHover={{ scale: 1.05 }}
				>
					🛠 <b>{action.name}</b>
				</motion.code>
				<motion.span animate={{ rotate: expanded ? 180 : 0 }}>🔽</motion.span>
			</div>

			<motion.div
				className={clsx("overflow-hidden", expanded ? "max-h-[360px]" : "max-h-0")}
				animate={{ height: expanded ? "auto" : 0 }}
				transition={{ duration: 0.3, ease: "easeInOut" }}
			>
				<div className="bg-slate-600 rounded p-4 mt-1 text-sm text-gray-200">
					<b>Tool Input:</b>
					<pre className="overflow-auto">{JSON.stringify(action.args, null, 2)}</pre>
				</div>
				<div className="bg-slate-600 rounded p-4 mt-1 text-sm text-gray-200">
					<b>Observation:</b>
					<pre className="overflow-auto">{observation}</pre>
				</div>
			</motion.div>
		</motion.div>
	);
}
