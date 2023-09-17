# DiamondHand Vault

This project contains implementation of DiamondHands Vault which is an extension of ERC4626, Tokenized Vault Standard. This vault is specifically designed in a way that prevents users from
paper-handing (withdrawing WETH when the price goes down). This allows user to deposit WETH and earn USDC.

## Features

- Users can `mint` vault tokens by depositing WETH in the ratio of 1:1.
- Users can `withdraw` tokens when weighted average price of deposited WETH is lower than current WETH price.
- Users can call both `mint` and `deposit` to deposit WETH to the contract.
- Users are able to deposit multiple times.
- Users can redeam rewards by calling `redeem` or `withdraw` functions.

## Working

### Minimal Code Changes

Have made minimal changes to the existing Vault codebase to integrate these features seamlessly except current internal methods for `_withdraw`, `_deposit` and some internal methods used to calculate rewards.

### Rewards Calculation

- Rewards are calculated as `RewardsPerBlock` which allow users to earn USDC based on the block difference.
- When depositing user's previous reward is calculated and stored, which could be used when user is withdrawing tokens. We also calculate weighted price at the same time.
- To get the price of WETH, Chainlink's PriceFeed Aggregator contract is used.

## Improvements

There are several ways how this code can be improved, some of them are:
- Implement rewards calculation as per share with reference to Sushiswap Masterchef V2.
- Move most code to library.
- Imrove gas efficiency.
- Update tests according to new deployment costs and gas usage and add unit tests.
- Create more owner accessible functions like to extract extra reward tokens etc.

## Run tests

npx hardhat test - This will run fork tests on Base Goerli (as currently configured)
Before running above command make sure to create a .env file, according to .env.example
