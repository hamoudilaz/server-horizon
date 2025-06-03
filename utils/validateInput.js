export function validateBuyBody(body) {
    if (!body.mint) return 'mint is missing';
    if (typeof body.mint !== "string" || body.mint.length > 45 || body.mint.length < 42)
        return "Mint must be a string and between 43-44 characters";

    if (!body.buyAmount) return 'amount is missing';
    if (typeof body.buyAmount !== "number" || body.buyAmount > 10 || body.buyAmount < 0.0000001)
        return "Amount must be a number between 0.000001 - 10";

    if (body.slippage == null) body.slippage = 10;
    if (typeof body.slippage !== "number" || body.slippage > 100 || body.slippage < 0.01)
        return "Slippage must be a number between 0.01 - 100";

    if (body.fee == null || body.fee === 0) body.fee = 0.000001;
    if (typeof body.fee !== "number" || body.fee > 0.1)
        return "Fee must be a number between 0.000001 - 0.1";
    if (body.fee > 0.2) return "Too high fee!";

    if (body.jitoFee === 0 || body.jitoFee == null) body.jitoFee = 0.000001;
    if (typeof body.jitoFee !== "number") return "Invalid PrioFee type";
    if (body.jitoFee > 0.2) return "Too high PrioFee";


    if (typeof body.node !== "boolean" || body.node == null) body.node = false;
    if (body.node === true && body.jitoFee < 0.001) body.jitoFee = 0.001;

    body.buyAmount = body.buyAmount * 1e9;
    body.slippage = body.slippage * 100;
    body.jitoFee = body.jitoFee * 1e9;

    return null;
}



export function validateSellBody(body) {
    if (!body.outputMint) return 'mint is missing';
    if (typeof body.outputMint !== "string" || body.outputMint.length > 45 || body.outputMint.length < 42)
        return "Mint must be a string and between 43-44 characters";

    if (!body.amount) return 'amount is missing';
    if (typeof body.amount !== "number" || body.amount < 1 || body.amount > 100)
        return "Amount must be a number between 1 - 100";

    if (body.slippage == null) body.slippage = 10;
    if (typeof body.slippage !== "number" || body.slippage > 100 || body.slippage < 0.01)
        return "Slippage must be a number between 0.01 - 100";

    if (body.fee == null || body.fee === 0) body.fee = 0.000001;
    if (typeof body.fee !== "number" || body.fee > 0.1)
        return "Fee must be a number between 0.000001 - 0.1";
    if (body.fee > 0.2) return "Too high fee!";

    if (body.jitoFee === 0 || body.jitoFee == null) body.jitoFee = 0.000001;
    if (typeof body.jitoFee !== "number") return "Invalid PrioFee type";
    if (body.jitoFee > 0.2) return "Too high PrioFee";


    if (typeof body.node !== "boolean" || body.node == null) body.node = false;

    if (body.node === true && body.jitoFee < 0.001) body.jitoFee = 0.001;

    body.slippage = body.slippage * 100;
    body.jitoFee = body.jitoFee * 1e9;


    return null;
}
