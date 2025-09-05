// Single source + runtime guard (imported everywhere)
import { ADDRS } from "@rot-ritual/addresses"; // the Phase 1 package we made

const OLD_MAW = "0x32833358cc1f4eC6E05FF7014Abc1B6b09119625".toLowerCase();
const OLD_MAW_2 = "0x1F8fA66b4e91C844Db85b8FC95e1e78E4BF56b13".toLowerCase(); // Old env var address

export function getMawAddress(chainId: number) {
  const addr = ADDRS[chainId]?.MawSacrifice;
  if (!addr) throw new Error(`No MawSacrifice address for chain ${chainId}`);
  if (addr.toLowerCase() === OLD_MAW) throw new Error("🛑 OLD Maw address in use");
  if (addr.toLowerCase() === OLD_MAW_2) throw new Error("🛑 OLD Maw address from env vars in use");
  console.log("[MawSacrifice address]", addr, { chainId });
  return addr as `0x${string}`;
}

export function getRelicsAddress(chainId: number) {
  const addr = ADDRS[chainId]?.Relics;
  if (!addr) throw new Error(`No Relics address for chain ${chainId}`);
  return addr as `0x${string}`;
}

export function getCosmeticsAddress(chainId: number) {
  const addr = ADDRS[chainId]?.Cosmetics;
  if (!addr) throw new Error(`No Cosmetics address for chain ${chainId}`);
  return addr as `0x${string}`;
}

export function getRaccoonsAddress(chainId: number) {
  const addr = ADDRS[chainId]?.Raccoons;
  if (!addr) throw new Error(`No Raccoons address for chain ${chainId}`);
  return addr as `0x${string}`;
}

export function getDemonsAddress(chainId: number) {
  const addr = ADDRS[chainId]?.Demons;
  if (!addr) throw new Error(`No Demons address for chain ${chainId}`);
  return addr as `0x${string}`;
}

export function getCultistsAddress(chainId: number) {
  const addr = ADDRS[chainId]?.Cultists;
  if (!addr) throw new Error(`No Cultists address for chain ${chainId}`);
  return addr as `0x${string}`;
}

export function getKeyShopAddress(chainId: number) {
  const addr = ADDRS[chainId]?.KeyShop;
  if (!addr) throw new Error(`No KeyShop address for chain ${chainId}`);
  return addr as `0x${string}`;
}

export function getRaccoonRendererAddress(chainId: number) {
  const addr = ADDRS[chainId]?.RaccoonRenderer;
  if (!addr) throw new Error(`No RaccoonRenderer address for chain ${chainId}`);
  return addr as `0x${string}`;
}

export function getRitualReadAggregatorAddress(chainId: number) {
  const addr = ADDRS[chainId]?.RitualReadAggregator;
  if (!addr) throw new Error(`No RitualReadAggregator address for chain ${chainId}`);
  return addr as `0x${string}`;
}

export function getAllAddresses(chainId: number) {
  const addrs = ADDRS[chainId];
  if (!addrs) throw new Error(`No addresses for chain ${chainId}`);
  return addrs;
}