export interface BadgeTxQuerier {
    getTxId(tokenCategory: string, commitment: string): Promise<string>
}

export class ChaingrapBadgeTxQuerier implements BadgeTxQuerier {
    static defaultChaingraphUrl = "https://demo.chaingraph.cash/v1/graphql"

    async getTxId(tokenCategory: string, commitment: string) {
        const data = await fetch("https://demo.chaingraph.cash/v1/graphql", {
            "body": `{\"operationName\":\"SearchOutputs\",\"variables\":{},\"query\":\"query SearchOutputs {\\n  output(where: {_and: {token_category: {_eq: \\\"\\\\\\\\x${tokenCategory}\\\"}, nonfungible_token_commitment: {_eq: \\\"\\\\\\\\x${commitment}\\\"}}, _not: {spent_by: {}}}, limit: 1) {\\n    locking_bytecode\\n    output_index\\n    transaction_hash\\n    value_satoshis\\n    token_category\\n    nonfungible_token_capability\\n    nonfungible_token_commitment\\n    spent_by {\\n      input_index\\n      transaction {\\n        hash\\n      }\\n    }\\n  }\\n}\\n\"}`,
            "method": "POST",
        }).then(res => res.json());
        if (data.data.output.length > 1) {
            throw new Error("BadgeTxQuerier Error")
        }
        return data.data.output[0]?.transaction_hash.replace("\\x", "")
    }
}

export const mainnetChaingrapBadgeTxQuerier = new ChaingrapBadgeTxQuerier()

export default { ChaingrapBadgeTxQuerier, mainnetChaingrapBadgeTxQuerier }