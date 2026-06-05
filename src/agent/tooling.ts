import type {
  PaymentIntent,
  PaymentIntentDraft,
  PaymentIntentMode,
  SubmitResult,
  TaskOrigin
} from "../intent/types.ts";

export interface PaymentDefault {
  defaultAsset: string;
  caip2: string;
  address: string;
}

export interface PaymentDefaultStore {
  get(): PaymentDefault | null;
  set(value: PaymentDefault): void;
  unset(): void;
}

export interface EmitResult {
  intent: PaymentIntent;
  submit: SubmitResult;
}

export interface ToolContext {
  userId: string;
  mode: PaymentIntentMode;
  origin: TaskOrigin;
  defaults: PaymentDefaultStore;
  emit: (draft: PaymentIntentDraft) => Promise<EmitResult>;
}

export interface ToolResult<T = unknown> {
  data: T;
  paymentIntent?: PaymentIntent;
  submit?: SubmitResult;
}

export interface ToolDefinition<TInput = unknown, TOutput = unknown> {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  isReadOnly: boolean;
  call(input: TInput, ctx: ToolContext): Promise<ToolResult<TOutput>>;
}
