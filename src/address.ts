import { checkBadgeName, getBadge, getBadgesByAddress } from "./badge"

export async function addressToBadgeName(address: string): Promise<string> {
    const badges = await getBadgesByAddress(address)
    const badgeName = badges[0]?.badgeName
    if (!badgeName) {
        throw new Error(`No badge is set`)
    }
    return badgeName
}

export async function badgeNameToAddress(badgeName: string): Promise<string> {
    checkBadgeName(badgeName)
    const badge = await getBadge(badgeName)
    const cashAddr = badge?.owner
    if (!cashAddr) {
        throw new Error(`Cannot find ${badgeName}`)
    }
    return cashAddr
}