import { NextResponse } from "next/server";
import {
  answerCopilotPrompt,
  copilotPrompts,
  type CopilotActionKey
} from "@/demo/copilot";

const copilotActionKeys = copilotPrompts.map((prompt) => prompt.key);

function isCopilotActionKey(action: string): action is CopilotActionKey {
  return copilotActionKeys.includes(action as CopilotActionKey);
}

export function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const requestedAction = searchParams.get("action") ?? "summarize-dashboard";
  const action: CopilotActionKey = isCopilotActionKey(requestedAction)
    ? requestedAction
    : "summarize-dashboard";

  return NextResponse.json({
    action,
    answer: answerCopilotPrompt(action),
    prompts: copilotPrompts
  });
}
