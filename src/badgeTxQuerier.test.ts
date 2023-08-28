import { mainnetChaingrapBadgeTxQuerier } from "./index";
import { describe, it, expect } from 'vitest'

it('mainnetChaingrapBadgeTxQuerier', async () => {
    const data = await mainnetChaingrapBadgeTxQuerier.getTxId("07275f68d14780c737279898e730cec3a7b189a761caf43b4197b60a7c891a97", "1003")
    console.log(data)
}, 10 * 1000);