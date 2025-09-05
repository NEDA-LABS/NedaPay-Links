// SPDX-License-Identifier: MIT
pragma solidity ^0.8.22;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts-upgradeable/utils/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";

/**
 * @title NedaPay Protocol Fee Contract (Upgradeable) — Scroll
 * @dev Collects dynamic fees on payments, invoices, and swaps
 *      Fee tiers are expressed in 6 decimals (USDC/USDT style).
 */
contract NedaPayProtocolUpgradeableScroll is
    Initializable,
    ReentrancyGuardUpgradeable,
    OwnableUpgradeable,
    PausableUpgradeable,
    UUPSUpgradeable
{
    // ===== Constants / Config =====
    address public constant FEE_RECIPIENT = 0x037Eb04AD9DDFf984F44Ce5941D14b8Ea3781459;
    uint256 public constant BASIS_POINTS = 10000; // 100%

    // Scroll mainnet stablecoins
    address public constant SCROLL_USDC = 0x06eFdBFf2a14a7c8E15944D1F4A48F9F95F663A4;
    address public constant SCROLL_USDT = 0xf55BEC9cafDbE8730f096Aa55dad6D22d44099Df;

    struct FeeTier {
        uint256 minAmount;  // USD (6 decimals)
        uint256 maxAmount;  // USD (6 decimals), type(uint256).max for "no cap"
        uint256 feeRate;    // basis points
    }

    FeeTier[] public feeTiers;

    // Token support & accounting
    mapping(address => bool) public supportedTokens;
    mapping(address => uint256) public totalFeesCollected;
    mapping(address => mapping(address => uint256)) public userFeeContributions;

    // ===== Events =====
    event PaymentProcessed(
        address indexed user,
        address indexed token,
        uint256 amount,
        uint256 fee,
        string paymentType
    );
    event SwapProcessed(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 fee
    );
    event TokenAdded(address indexed token);
    event TokenRemoved(address indexed token);
    event FeesWithdrawn(address indexed token, uint256 amount);
    event FeeTiersUpdated();

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize() public initializer {
        __ReentrancyGuard_init();
        __Ownable_init(msg.sender);
        __Pausable_init();
        __UUPSUpgradeable_init();

        // Supported tokens on Scroll
        supportedTokens[SCROLL_USDC] = true;
        supportedTokens[SCROLL_USDT] = true;

        _initializeFeeTiers();
    }

    // ===== Internal setup =====
    function _initializeFeeTiers() private {
        delete feeTiers;

        // $0–$100 → 1.0%
        feeTiers.push(FeeTier({
            minAmount: 0,
            maxAmount: 100 * 10**6,
            feeRate: 100
        }));
        // $101–$500 → 0.75%
        feeTiers.push(FeeTier({
            minAmount: 100 * 10**6 + 1,
            maxAmount: 500 * 10**6,
            feeRate: 75
        }));
        // $501–$2,000 → 0.5%
        feeTiers.push(FeeTier({
            minAmount: 500 * 10**6 + 1,
            maxAmount: 2000 * 10**6,
            feeRate: 50
        }));
        // $2,001–$5,000 → 0.3%
        feeTiers.push(FeeTier({
            minAmount: 2000 * 10**6 + 1,
            maxAmount: 5000 * 10**6,
            feeRate: 30
        }));
        // $5,001+ → 0.2%
        feeTiers.push(FeeTier({
            minAmount: 5000 * 10**6 + 1,
            maxAmount: type(uint256).max,
            feeRate: 20
        }));
    }

    // ===== Views =====
    function calculateDynamicFeeRate(uint256 usdAmount) public view returns (uint256) {
        for (uint256 i = 0; i < feeTiers.length; i++) {
            if (usdAmount >= feeTiers[i].minAmount && usdAmount <= feeTiers[i].maxAmount) {
                return feeTiers[i].feeRate;
            }
        }
        return 20; // fallback 0.2%
    }

    function calculateFee(address token, uint256 amount) public view returns (uint256) {
        uint256 usdAmount = _convertToUSD(token, amount);
        uint256 feeRate = calculateDynamicFeeRate(usdAmount);
        return (amount * feeRate) / BASIS_POINTS;
    }

    function _convertToUSD(address /*token*/, uint256 amount) private pure returns (uint256) {
        // On Scroll we treat USDC/USDT as $1 with 6 decimals; amount is already 6-dec aligned.
        // If you later add non-USD tokens, add price feed logic here.
        return amount;
    }

    function getNetAmount(address token, uint256 amount) external view returns (uint256) {
        uint256 fee = calculateFee(token, amount);
        return amount - fee;
    }

    function isTokenSupported(address token) external view returns (bool) {
        return supportedTokens[token];
    }

    function getTotalFeesCollected(address token) external view returns (uint256) {
        return totalFeesCollected[token];
    }

    function getUserFeeContribution(address user, address token) external view returns (uint256) {
        return userFeeContributions[user][token];
    }

    // ===== Core flows =====
    /**
     * @dev Process a payment where `amount` includes the fee. Net is sent to `recipient`.
     */
    function processPayment(
        address token,
        address recipient,
        uint256 amount,
        string memory paymentType
    ) external nonReentrant whenNotPaused {
        require(supportedTokens[token], "Token not supported");
        require(recipient != address(0), "Invalid recipient");
        require(amount > 0, "Amount must be greater than 0");

        IERC20 t = IERC20(token);

        uint256 fee = calculateFee(token, amount);
        uint256 net = amount - fee;

        require(t.transferFrom(msg.sender, address(this), amount), "Transfer failed");
        require(t.transfer(recipient, net), "Recipient transfer failed");
        require(t.transfer(FEE_RECIPIENT, fee), "Fee transfer failed");

        totalFeesCollected[token] += fee;
        userFeeContributions[msg.sender][token] += fee;

        emit PaymentProcessed(msg.sender, token, amount, fee, paymentType);
    }

    function processSwap(
        address tokenIn,
        address tokenOut,
        uint256 amountIn,
        uint256 /* amountOutMin */,
        bytes calldata /* swapData */
    ) external nonReentrant whenNotPaused {
        require(supportedTokens[tokenIn], "Input token not supported");
        require(supportedTokens[tokenOut], "Output token not supported");
        require(amountIn > 0, "Amount must be greater than 0");

        IERC20 tin = IERC20(tokenIn);

        uint256 fee = calculateFee(tokenIn, amountIn);
        uint256 netIn = amountIn - fee;

        require(tin.transferFrom(msg.sender, address(this), amountIn), "Transfer failed");
        require(tin.transfer(FEE_RECIPIENT, fee), "Fee transfer failed");
        // Placeholder: return netIn to user; real impl would perform a swap and deliver outputs.
        require(tin.transfer(msg.sender, netIn), "Swap return failed");

        totalFeesCollected[tokenIn] += fee;
        userFeeContributions[msg.sender][tokenIn] += fee;

        emit SwapProcessed(msg.sender, tokenIn, tokenOut, amountIn, fee);
    }

    // ===== Admin =====
    function updateFeeTiers(FeeTier[] calldata newTiers) external onlyOwner {
        require(newTiers.length > 0, "Must have at least one tier");
        delete feeTiers;
        for (uint256 i = 0; i < newTiers.length; i++) {
            require(newTiers[i].feeRate <= 1000, "Fee rate cannot exceed 10%");
            feeTiers.push(newTiers[i]);
        }
        emit FeeTiersUpdated();
    }

    function addSupportedToken(address token) external onlyOwner {
        require(token != address(0), "Invalid token address");
        require(!supportedTokens[token], "Token already supported");
        supportedTokens[token] = true;
        emit TokenAdded(token);
    }

    function removeSupportedToken(address token) external onlyOwner {
        require(supportedTokens[token], "Token not supported");
        supportedTokens[token] = false;
        emit TokenRemoved(token);
    }

    function emergencyWithdraw(address token, uint256 amount) external onlyOwner {
        IERC20 t = IERC20(token);
        require(t.transfer(owner(), amount), "Emergency withdrawal failed");
        emit FeesWithdrawn(token, amount);
    }

    function pause() external onlyOwner { _pause(); }
    function unpause() external onlyOwner { _unpause(); }

    function getFeeTiersLength() external view returns (uint256) {
        return feeTiers.length;
    }

    // For upgrades: re-run if you ever reset storage or migrate
    function initializeSupportedTokens() external onlyOwner {
        if (!supportedTokens[SCROLL_USDC]) {
            supportedTokens[SCROLL_USDC] = true;
            emit TokenAdded(SCROLL_USDC);
        }
        if (!supportedTokens[SCROLL_USDT]) {
            supportedTokens[SCROLL_USDT] = true;
            emit TokenAdded(SCROLL_USDT);
        }
    }

    // UUPS
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    function version() external pure returns (string memory) {
        return "1.0.0-scroll";
    }
}
