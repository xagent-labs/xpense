export interface PayFetchOptions {
  onPaymentRequired: (challenge: unknown, request: { url: string }) => Promise<void>;
}

export function createPayFetch(opts: PayFetchOptions): typeof fetch {
  const wrapped = async (
    input: Parameters<typeof fetch>[0],
    init?: Parameters<typeof fetch>[1]
  ): Promise<Response> => {
    const response = await fetch(input, init);
    if (response.status === 402) {
      const challenge = await response
        .clone()
        .json()
        .catch(() => ({}));
      const url =
        typeof input === "string"
          ? input
          : input instanceof URL
            ? input.toString()
            : (input as Request).url;
      await opts.onPaymentRequired(challenge, { url });
    }
    return response;
  };
  return wrapped as typeof fetch;
}
