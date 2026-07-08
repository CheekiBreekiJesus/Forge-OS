import * as Sentry from "@sentry/nextjs";
import { buildSentryInitOptions } from "@/instrumentation/sentry-options";

Sentry.init(buildSentryInitOptions());
