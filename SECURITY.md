# Security

Concord is a static frontend connected to a public GenLayer Studionet contract. It does not require repository secrets for local or production use.

## Repository Rules

Never commit:

- private keys
- seed phrases or mnemonics
- vault files
- `.env` or `.env.local`
- faucet logs
- dashboard exports containing wallet metadata

The contract address, deployer address, explorer URLs, and smoke transaction hashes are public chain metadata.

## Runtime Boundary

The app is browser-only HTML, CSS, and JavaScript. It reads public Studionet state through `genlayer-lite.js`. Writes are only attempted after the visitor connects an injected EVM wallet and confirms the transaction.

No backend route stores wallet data. No Vercel secret is required.

## Production Headers

`vercel.json` applies HSTS, frame blocking, MIME sniffing protection, a strict referrer policy, and a restrictive permissions policy.

## Reporting

Use a private GitHub security advisory for sensitive findings. Do not publish exploit details in a public issue before there is a fix.
