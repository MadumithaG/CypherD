import { HDNodeWallet, Mnemonic, Wallet } from 'ethers'

export function createWallet() {
  const w = HDNodeWallet.createRandom()
  return { address: w.address, privateKey: w.privateKey, mnemonic: w.mnemonic!.phrase }
}

export function importFromMnemonic(mnemonic: string, index=0) {
  const m = Mnemonic.fromPhrase(mnemonic.trim())
  const path = `m/44'/60'/0'/0/${index}`
  const w = HDNodeWallet.fromMnemonic(m, path)
  return { address: w.address, privateKey: w.privateKey, mnemonic: m.phrase }
}

export async function signMessage(privateKey: string, message: string) {
  const w = new Wallet(privateKey)
  return await w.signMessage(message)
}
