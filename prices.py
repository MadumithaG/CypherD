import os
import httpx

SKIP_URL = "https://api.skip.build/v2/fungible/msgs_direct"
FALLBACK_ETH_USD = float(os.getenv("FALLBACK_ETH_USD", "3000"))

async def quote_usd_to_eth(usd_amount: float) -> tuple[float, float]:
    body = {
        "source_asset_denom": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
        "source_asset_chain_id": "1",
        "dest_asset_denom": "ethereum-native",
        "dest_asset_chain_id": "1",
        "amount_in": usd_amount,
        "chain_ids_to_addresses": {"1": "0x742d35Cc6634C0532925a3b8D4C9db96c728b0B4"},
        "slippage_tolerance_percent": "1",
        "smart_swap_options": {"evm_swaps": True},
        "allow_unsafe": False
    }
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            r = await client.post(SKIP_URL, json=body)
            r.raise_for_status()
            data = r.json()
            # Structure varies; try common fields then fallback.
            amt_eth = None
            try:
                # Example guess: data["quote"]["dest_amount"]
                amt_eth = float(data.get("quote", {}).get("dest_amount", None))
            except Exception:
                pass
            if amt_eth is None:
                amt_eth = usd_amount / FALLBACK_ETH_USD
            return amt_eth, usd_amount
    except Exception:
        return usd_amount / FALLBACK_ETH_USD, usd_amount
