import jwt, { SignOptions } from "jsonwebtoken";
import CryptoJS from "crypto-js";

function gerarNonce(): string {
  return CryptoJS.lib.WordArray.random(16).toString();
}

export function gerarQRPessoal(
  userId: string,
  secret: string,
  expiresIn: string = "1h"
): string {
  const payload = {
    userId,
    type: "qr-pessoal",
    nonce: gerarNonce(),
    iat: Math.floor(Date.now() / 1000),
  };

  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as SignOptions["expiresIn"],
    algorithm: "HS256",
  });
}

export function gerarQRCodeData(token: string): string {
  return token;
}
