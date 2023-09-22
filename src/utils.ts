import { encoder } from "./cmix/utils";

// Functions to interact with the XRPL via HTTP JSON-RPC

// Submit transaction
export const submitTx = async (url: string, txblob: string) => {
  try {
    const resp = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        method: "submit",
        params: [
          {
            tx_blob: txblob,
          },
        ],
      }),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Request-Method": "POST",
      },
    });
    const json = await resp.json();
    return json;
  } catch (e) {
    return undefined;
  }
};

export const buildSubmit = (txblob: string): Uint8Array => {
  const req = {
    method: "submit",
    params: [
      {
        tx_blob: txblob,
      },
    ],
  };
  const reqStr = JSON.stringify(req);
  const reqBytes = encoder.encode(reqStr);
  return reqBytes;
};

// Wait for transaction to be finalized
export const waitFinalizedTx = async (url: string, txid: string) => {
  let done = true;
  while (done) {
    await sleep(1);
    const res = await verifyTx(url, txid);
    if (res) {
      if (res.result.validated) {
        done = false;
      }
    }
  }
};

// Verify a transaction
const verifyTx = async (url: string, txid: string) => {
  try {
    const resp = await fetch(url, {
      method: "POST",
      body: JSON.stringify({
        method: "tx",
        params: [
          {
            transaction: txid,
          },
        ],
      }),
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Request-Method": "POST",
      },
    });
    const json = await resp.json();
    return json;
  } catch (e) {
    return undefined;
  }
};

export const buildVerify = (txid: string): Uint8Array => {
  const req = {
    method: "tx",
    params: [
      {
        transaction: txid,
      },
    ],
  };
  const reqStr = JSON.stringify(req);
  const reqBytes = encoder.encode(reqStr);
  return reqBytes;
};

// Sleep
const sleep = async (seconds: number) => {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, seconds * 1000);
  });
};
