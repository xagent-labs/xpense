const ENCODING = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

export function ulid(): string {
  let ts = Date.now();
  const timeChars = new Array<string>(10);
  for (let i = 9; i >= 0; i--) {
    timeChars[i] = ENCODING[ts % 32];
    ts = Math.floor(ts / 32);
  }
  let rand = "";
  for (let i = 0; i < 16; i++) {
    rand += ENCODING[Math.floor(Math.random() * 32)];
  }
  return timeChars.join("") + rand;
}

export function paymentIntentId(): string {
  return `pi_${ulid()}`;
}
