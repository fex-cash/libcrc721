import { badgeNameToAddress, addressToBadgeName } from "./index";
import { describe, it, expect } from 'vitest'

import 'dotenv/config'
const { Badge_Owner, Badge_Name } = process.env

it('addressToBadgeName', async () => {
    const data = await addressToBadgeName(Badge_Owner)
    console.log(data)
}, 10 * 1000);

it('badgeNameToAddress', async () => {
    const data = await badgeNameToAddress(Badge_Name)
    console.log(data)
}, 10 * 1000);


