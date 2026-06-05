import { apiPost } from "../http.ts";

export interface OnchainosOptions {
  baseUrl: string;
  accessToken: string;
}

export interface OnchainosAddress {
  chainIndex?: string;
  address?: string;
}

export interface WalletStatus {
  loggedIn: boolean;
  selectedAccountId?: string;
  addresses?: OnchainosAddress[];
}

export interface WalletLoginReq {
  email?: string;
  locale?: string;
}

export interface WalletLoginResult {
  flowId?: string;
  email?: string;
  walletAddress?: string;
}

export interface WalletVerifyResult {
  email?: string;
  walletAddress?: string;
}

export interface WalletBalanceReq {
  all?: boolean;
  chain?: string;
  tokenAddress?: string;
  force?: boolean;
}

export interface X402SignReq {
  accepts: unknown;
  from?: string;
  resource?: string;
}

export interface X402SignResult {
  headerName: string;
  authorizationHeader: string;
  payment?: Record<string, unknown>;
  resolvedRequirement?: Record<string, unknown>;
}

export interface MppChargeReq {
  challenge: string;
  from?: string;
  txHash?: string;
}

export interface MppChargeResult {
  protocol: string;
  method: string;
  intent: string;
  mode: string;
  authorizationHeader: string;
  wallet: string;
  challenge?: Record<string, unknown>;
}

export interface DefaultAsset {
  asset?: string;
  chain?: string;
  name?: string;
}

const PREFIX = "/user/onchainos";

export class OnchainosGateway {
  constructor(private readonly opts: OnchainosOptions) {}

  private post<T>(path: string, payload: unknown): Promise<T> {
    return apiPost<T>(`${PREFIX}${path}`, payload, {
      baseUrl: this.opts.baseUrl,
      accessToken: this.opts.accessToken
    });
  }

  walletStatus(): Promise<WalletStatus> {
    return this.post<WalletStatus>("/wallet/status", {});
  }

  walletLogin(req: WalletLoginReq = {}): Promise<WalletLoginResult> {
    return this.post<WalletLoginResult>("/wallet/login", req);
  }

  walletVerify(otp: string): Promise<WalletVerifyResult> {
    return this.post<WalletVerifyResult>("/wallet/verify", { otp });
  }

  walletAddresses(chain?: string): Promise<{ addresses?: OnchainosAddress[] }> {
    return this.post("/wallet/addresses", chain ? { chain } : {});
  }

  walletBalance(req: WalletBalanceReq = {}): Promise<unknown> {
    return this.post("/wallet/balance", req);
  }

  walletLogout(): Promise<{ loggedOut: boolean }> {
    return this.post("/wallet/logout", {});
  }

  x402Sign(req: X402SignReq): Promise<X402SignResult> {
    return this.post<X402SignResult>("/x402/sign", req);
  }

  mppCharge(req: MppChargeReq): Promise<MppChargeResult> {
    return this.post<MppChargeResult>("/mpp/charge", req);
  }

  defaultAssetGet(): Promise<DefaultAsset> {
    return this.post<DefaultAsset>("/default-asset/get", {});
  }

  defaultAssetSet(asset: DefaultAsset & { tier?: string }): Promise<DefaultAsset> {
    return this.post<DefaultAsset>("/default-asset/set", asset);
  }

  defaultAssetUnset(): Promise<{ unset: boolean }> {
    return this.post("/default-asset/unset", {});
  }
}
