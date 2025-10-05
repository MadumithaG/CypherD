from web3 import Web3

_w3 = Web3()

def eth_to_wei(eth: float) -> int:
    return int(_w3.to_wei(eth, "ether"))

def wei_to_eth(wei: int) -> float:
    return float(_w3.from_wei(wei, "ether"))

def usdc_units_to_usd(usdc_units: int) -> float:
    return usdc_units / 1_000_000

def usd_to_usdc_units(usd: float) -> int:
    return int(round(usd * 1_000_000))

def is_address(addr: str) -> bool:
    try:
        return _w3.is_address(addr)
    except Exception:
        return False
