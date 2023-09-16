//SPDX-License-Identifier: MIT
pragma solidity ^0.8.10;

import {AggregatorV3Interface} from "./interfaces/AggregatorV3Interface.sol";
import {ERC4626, ERC20} from "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/interfaces/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract DiamondHands is ERC4626, Ownable {
    using SafeERC20 for IERC20;

    uint256 public constant REWARD_PER_BLOCK = 1;
    AggregatorV3Interface public immutable AGGREGATOR;
    IERC20 public immutable WETH;
    IERC20 public immutable USDC;

    uint256 private totalAsset;
    uint256 public balanceUSDC;

    event USDCAdded(uint256 amount, uint256 totalUSDC);

    struct UserInfo {
        uint256 amountDeposited;
        uint256 weightedPrice;
        uint256 lastRewardedBlock;
        uint256 rewardEarned;
    }

    mapping(address => UserInfo) public depositerDetails;

    constructor(
        IERC20 _WETH,
        IERC20 _USDC,
        AggregatorV3Interface _AGGREGATOR,
        string memory _name,
        string memory _symbol
    ) ERC4626(_WETH) ERC20(_name, _symbol) Ownable() {
        WETH = _WETH;
        USDC = _USDC;
        AGGREGATOR = _AGGREGATOR;
    }

    function addUSDC(uint256 amount) external onlyOwner {
        USDC.safeTransferFrom(msg.sender, address(this), amount);
        balanceUSDC += amount;
        emit USDCAdded(amount, balanceUSDC);
    }

    function _deposit(
        address _caller,
        address _receiver,
        uint256 _assets,
        uint256 _shares
    ) internal virtual override {
        uint256 currentPrice;
        totalAsset += _assets;
        UserInfo storage user = depositerDetails[_caller];
        uint256 reward = _calculateReward(
            user.amountDeposited,
            block.number - user.lastRewardedBlock
        );
        (, int256 answer, , , ) = AGGREGATOR.latestRoundData();
        if (answer > 0) currentPrice = uint256(answer);
        user.weightedPrice = _calculateWeightedPrice(
            user.amountDeposited,
            user.weightedPrice,
            _assets,
            currentPrice
        );
        user.amountDeposited += _assets;
        user.lastRewardedBlock = block.number;
        user.rewardEarned += reward;
        super._deposit(_caller, _receiver, _assets, _shares);
    }

    function _withdraw(
        address _caller,
        address _receiver,
        address _owner,
        uint256 _assets,
        uint256 _shares
    ) internal virtual override {
        uint256 currentPrice;
        UserInfo storage user = depositerDetails[_caller];
        (, int256 answer, , , ) = AGGREGATOR.latestRoundData();
        if (answer > 0) currentPrice = uint256(answer);
        require(
            user.weightedPrice >= currentPrice,
            "DiamondHands: ETH/USD price is lower"
        );
        uint256 reward = user.rewardEarned +
            _calculateReward(_assets, block.number - user.lastRewardedBlock);
        USDC.safeTransfer(_receiver, reward);
        user.amountDeposited -= _assets;
        user.lastRewardedBlock = block.number;
        user.rewardEarned = 0;

        super._withdraw(_caller, _receiver, _owner, _assets, _shares);
    }

    function _calculateWeightedPrice(
        uint256 _previousAssets,
        uint256 _previousWeightedPrice,
        uint256 _depositedAssets,
        uint256 _currentWeightedPrice
    ) internal pure returns (uint256 weightedPrice) {
        weightedPrice =
            (_previousAssets *
                _previousWeightedPrice +
                _depositedAssets *
                _currentWeightedPrice) /
            (_previousAssets + _depositedAssets);
    }

    function _calculateReward(
        uint256 _assets,
        uint256 _blockPassed
    ) internal view returns (uint256 reward) {
        reward = (REWARD_PER_BLOCK * _blockPassed * _assets) / totalAsset;
    }
}
