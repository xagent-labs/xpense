import { runLogin, type AuthMode } from "../access/login.ts";
import { clearCredentials, loadCredentials, type SavedCredentials } from "../access/credentials.ts";
import { ensureAccessToken } from "../access/token.ts";
import { resolveConfig, type XpenseConfig } from "../config.ts";
import { OnchainosGateway } from "../settlement/onchainos.ts";
import { buildFromDraft } from "../intent/builder.ts";
import { submitPaymentIntent } from "../settlement/submit.ts";
import type {
  PaymentIntent,
  PaymentIntentDraft,
  SubmitResult,
  TaskOrigin
} from "../intent/types.ts";
import { BudgetExceededError, PolicyEngine, type BudgetSpec } from "../governance/policy.ts";
import { GovernanceGate } from "../governance/gate.ts";
import { PaymentSession, type SessionEntry } from "./ledger.ts";
import { MemoryDefaultStore } from "./default-store.ts";
import { capabilities, capabilityMap } from "./capabilities.ts";
import type { EmitResult, ToolContext, ToolDefinition, ToolResult } from "./tooling.ts";

export interface XpenseOptions extends Partial<XpenseConfig> {
  budget?: BudgetSpec;
  actor?: string;
}

export class Xpense {
  readonly config: XpenseConfig;
  private readonly gate: GovernanceGate;
  private readonly session: PaymentSession;
  private readonly defaults = new MemoryDefaultStore();
  private readonly actor: string;
  private creds: SavedCredentials | null = null;

  constructor(options: XpenseOptions = {}) {
    this.config = resolveConfig(options);
    this.gate = new GovernanceGate(new PolicyEngine(options.budget ?? {}));
    this.session = new PaymentSession(`sess_${Date.now().toString(36)}`);
    this.actor = options.actor ?? "xpense";
  }

  async login(authMode: AuthMode = "paste"): Promise<{ userId: string }> {
    this.creds = await runLogin({
      authMode,
      baseUrl: this.config.apiBaseUrl,
      frontendBase: this.config.frontendBase,
      version: this.config.version
    });
    return { userId: this.creds.userId };
  }

  async whoami(): Promise<SavedCredentials | null> {
    if (this.creds) {
      return this.creds;
    }
    this.creds = await loadCredentials();
    return this.creds;
  }

  async logout(): Promise<void> {
    this.creds = null;
    await clearCredentials();
  }

  /**
   * Typed client over the xerpaai-go /user/onchainos/* API (wallet, x402, mpp,
   * default-asset). This is the only settlement path — xpense calls xerpaai-go,
   * it never re-implements on-chain logic.
   */
  async gateway(): Promise<OnchainosGateway> {
    const creds = await ensureAccessToken(this.config.apiBaseUrl);
    this.creds = creds;
    return new OnchainosGateway({
      baseUrl: this.config.apiBaseUrl,
      accessToken: creds.accessToken
    });
  }

  createPaymentIntent(draft: PaymentIntentDraft): PaymentIntent {
    return buildFromDraft(draft, this.actor);
  }

  async submitPaymentIntent(pi: PaymentIntent): Promise<SubmitResult> {
    const decision = this.gate.authorize(pi);
    if (decision.outcome === "rejected") {
      throw new BudgetExceededError(decision.reason ?? "rejected by governance");
    }
    if (decision.outcome === "requires_approval") {
      throw new Error(`requires human approval: ${decision.reason ?? "governance"}`);
    }
    let result: SubmitResult;
    try {
      result = await submitPaymentIntent(pi, { mode: this.config.mode });
    } catch (error) {
      this.gate.revoke(pi);
      throw error;
    }
    this.session.record(pi);
    return result;
  }

  async emit(draft: PaymentIntentDraft): Promise<EmitResult> {
    const intent = this.createPaymentIntent(draft);
    const submit = await this.submitPaymentIntent(intent);
    return { intent, submit };
  }

  toolContext(origin: TaskOrigin = {}): ToolContext {
    return {
      userId: this.creds?.userId ?? "anonymous",
      mode: this.config.mode,
      origin,
      defaults: this.defaults,
      emit: (draft) => this.emit(draft)
    };
  }

  async invoke(capabilityName: string, input: unknown, origin?: TaskOrigin): Promise<ToolResult> {
    const cap = capabilityMap[capabilityName];
    if (!cap) {
      throw new Error(`unknown capability: ${capabilityName}`);
    }
    return cap.call(input, this.toolContext(origin));
  }

  listCapabilities(): ToolDefinition[] {
    return capabilities;
  }

  pendingSession(): SessionEntry[] {
    return this.session.pending();
  }
}
