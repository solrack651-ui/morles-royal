// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract GameStoreAutoNFTV2 is ERC1155, Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable paymentToken;
    address payable public recipient;

    struct Item {
        uint256 tokenPrice;
        uint256 nativePrice;
        uint256 maxSupply;
        uint256 totalSupply;
        uint8 rarity;
        uint256 maxPerWallet;
        bool active;
        string uri;
    }

    mapping(uint256 => Item) public items;
    mapping(uint256 => mapping(address => uint256)) public boughtPerWallet;

    event Purchase(
        address indexed buyer,
        address indexed token,
        uint256 amount,
        uint256 itemId,
        uint256 quantity,
        uint8 rarity,
        uint256 timestamp
    );

    constructor(
        address _paymentToken,
        address payable _recipient,
        string memory _baseUri
    ) ERC1155(_baseUri) {
        require(_paymentToken != address(0), "Token zero");
        require(_recipient != address(0), "Recipient zero");

        paymentToken = IERC20(_paymentToken);
        recipient = _recipient;
    }

    function setRecipient(address payable _recipient) external onlyOwner {
        require(_recipient != address(0), "Recipient zero");
        recipient = _recipient;
    }

    function setItem(
        uint256 itemId,
        uint256 tokenPrice,
        uint256 nativePrice,
        uint256 maxSupply,
        uint8 rarity,
        uint256 maxPerWallet,
        bool active,
        string calldata uri_
    ) external onlyOwner {
        Item storage it = items[itemId];
        it.tokenPrice = tokenPrice;
        it.nativePrice = nativePrice;
        it.maxSupply = maxSupply;
        it.rarity = rarity;
        it.maxPerWallet = maxPerWallet;
        it.active = active;
        it.uri = uri_;
    }

    function getItem(uint256 itemId)
        external
        view
        returns (
            uint256 tokenPrice,
            uint256 nativePrice,
            uint256 maxSupply,
            uint256 totalSupply,
            uint8 rarity,
            uint256 maxPerWallet,
            bool active,
            string memory uri_
        )
    {
        Item storage it = items[itemId];
        return (
            it.tokenPrice,
            it.nativePrice,
            it.maxSupply,
            it.totalSupply,
            it.rarity,
            it.maxPerWallet,
            it.active,
            it.uri
        );
    }

    function uri(uint256 id) public view override returns (string memory) {
        string memory u = items[id].uri;
        if (bytes(u).length > 0) {
            return u;
        }
        return super.uri(id);
    }

    function buyWithToken(uint256 amount, uint256 itemId, uint256 quantity) external nonReentrant {
        require(quantity > 0, "Quantity zero");

        Item storage it = items[itemId];
        require(it.active, "Item not active");
        require(it.tokenPrice > 0, "Item not for token");
        require(it.maxSupply == 0 || it.totalSupply + quantity <= it.maxSupply, "Exceeds max supply");
        require(it.maxPerWallet == 0 || boughtPerWallet[itemId][msg.sender] + quantity <= it.maxPerWallet, "Exceeds wallet limit");

        uint256 totalPrice = it.tokenPrice * quantity;
        require(amount >= totalPrice, "Insufficient token amount");

        paymentToken.safeTransferFrom(msg.sender, address(this), amount);
        paymentToken.safeTransfer(recipient, totalPrice);

        uint256 excess = amount - totalPrice;
        if (excess > 0) {
            paymentToken.safeTransfer(msg.sender, excess);
        }

        _mint(msg.sender, itemId, quantity, "");
        it.totalSupply += quantity;
        boughtPerWallet[itemId][msg.sender] += quantity;

        emit Purchase(msg.sender, address(paymentToken), totalPrice, itemId, quantity, it.rarity, block.timestamp);
    }

    function buyWithNative(uint256 itemId, uint256 quantity) external payable nonReentrant {
        require(quantity > 0, "Quantity zero");

        Item storage it = items[itemId];
        require(it.active, "Item not active");
        require(it.nativePrice > 0, "Item not for native");
        require(it.maxSupply == 0 || it.totalSupply + quantity <= it.maxSupply, "Exceeds max supply");
        require(it.maxPerWallet == 0 || boughtPerWallet[itemId][msg.sender] + quantity <= it.maxPerWallet, "Exceeds wallet limit");

        uint256 totalPrice = it.nativePrice * quantity;
        require(msg.value >= totalPrice, "Insufficient native payment");

        (bool sent, ) = recipient.call{value: totalPrice}("");
        require(sent, "Forward failed");

        if (msg.value > totalPrice) {
            (bool refunded, ) = msg.sender.call{value: msg.value - totalPrice}("");
            require(refunded, "Refund failed");
        }

        _mint(msg.sender, itemId, quantity, "");
        it.totalSupply += quantity;
        boughtPerWallet[itemId][msg.sender] += quantity;

        emit Purchase(msg.sender, address(0), totalPrice, itemId, quantity, it.rarity, block.timestamp);
    }

    function rescueToken(address token, address to) external onlyOwner {
        uint256 bal = IERC20(token).balanceOf(address(this));
        require(bal > 0, "No balance");
        IERC20(token).safeTransfer(to, bal);
    }

    receive() external payable {}
}
