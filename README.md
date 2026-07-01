# Concord

Conditional agreements with source-based settlement.

Concord is for agreements where completion depends on facts that can be checked. Parties draft terms, add clauses, attach evidence and ask GenLayer to review whether the condition was satisfied. The contract keeps the review and challenge history close to the agreement so the frontend can show the full settlement context.

## Live Instance

| Surface | Link |
| --- | --- |
| App | https://concord-github.vercel.app |
| GitHub | https://github.com/aspro45/concord |
| Contract | https://explorer-studio.genlayer.com/contracts/0x0946408990Be34450e9438BeEdB9cF5f3dFAd1e0 |

## Chain Record

- Network: GenLayer Studionet
- Chain ID: `61999`
- Contract: `0x0946408990Be34450e9438BeEdB9cF5f3dFAd1e0`
- Deploy tx: [`0xb370e96c7f764f30d2e1c54a14b6fad6e20e93ae43720f50b7dc6e2d42abe259`](https://explorer-studio.genlayer.com/tx/0xb370e96c7f764f30d2e1c54a14b6fad6e20e93ae43720f50b7dc6e2d42abe259)
- Deployed: `2026-06-23T17:58:23.231Z`
- Smoke writes: `15`

## Contract Notes

`contracts/concord_v2.py` is a 36,214 byte GenLayer contract. It stores agreement records, clauses, evidence, review state and party-indexed views. The important read methods include `get_agreement_count`, `get_agreement`, `get_agreement_record`, `get_recent_agreements`, `get_agreements_by_status`, `get_party_agreements`, `get_clauses` and `get_evidence`.

The settlement loop is:

```text
standard -> draft -> clauses -> evidence -> review -> challenge -> appeal -> archive
```

GenLayer is used for the review steps where web sources and prompt reasoning need validator agreement before state changes are accepted.

## Smoke Receipts

- `set_concord_standard`: [0xab738d55...2a521b](https://explorer-studio.genlayer.com/tx/0xab738d550bc4dda5992171e3551351a035ccc357c947ce05f44b6258a02a521b)
- `draft_agreement`: [0x08be9b7f...68abd9](https://explorer-studio.genlayer.com/tx/0x08be9b7f86da495f6a226f50f538d1fc491a92b9f0d5e1dca3527fce8a68abd9)
- `add_clause`: [0xf6d5c5d5...c6bfe5](https://explorer-studio.genlayer.com/tx/0xf6d5c5d50dda71d9b6e84b6f403ec698dcbdd7795ceb1434208122ab3ac6bfe5)
- `add_evidence_wiki`: [0x30ddea28...93f490](https://explorer-studio.genlayer.com/tx/0x30ddea2873004560981567c62f442a6b70ee4d9f28bc937377719d6ad193f490)
- `add_evidence_britannica`: [0xe865e0dd...6b8e7e](https://explorer-studio.genlayer.com/tx/0xe865e0dd0e41edca0a87457c73820b01f1aa3893cefcba52833eca43306b8e7e)
- `review`: [0x85ae8758...6d0a60](https://explorer-studio.genlayer.com/tx/0x85ae8758f1bf7e69766900ba682ee27ee31aea2d662698727c0b89f7766d0a60)

## Run

```bash
python -m http.server 8080
```

Open `http://localhost:8080`.

## What Should Not Be Published

Do not add wallet private keys, vault exports, local `.env` files, `.vercel/` metadata or dashboard state. This repo is safe when it only contains the frontend, contract source and public deployment references.
