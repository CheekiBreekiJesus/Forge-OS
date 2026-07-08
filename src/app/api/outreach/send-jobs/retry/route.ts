import { retryEligibleFailureThroughServer } from "@/application/send-job-server-mutations";
import { createSendJobRouteHandler } from "../_shared";

export const POST = createSendJobRouteHandler(retryEligibleFailureThroughServer);
