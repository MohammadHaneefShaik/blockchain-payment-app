// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract BlockPay {
    
    event PaymentSent(
        address indexed from,
        address indexed to,
        uint256 amount,
        uint256 timestamp
    );

    event PaymentReceived(
        address indexed from,
        uint256 amount
    );

    mapping(address => uint256) public totalSent;
    mapping(address => uint256) public totalReceived;
    uint256 public transactionCount;

    function sendPayment(address payable receiver) public payable {
        require(msg.value > 0, "Amount must be greater than 0");
        require(receiver != address(0), "Invalid receiver address");
        require(receiver != msg.sender, "Cannot send to yourself");

        (bool success, ) = receiver.call{value: msg.value}("");
        require(success, "Transfer failed");

        totalSent[msg.sender] += msg.value;
        totalReceived[receiver] += msg.value;
        transactionCount++;

        emit PaymentSent(msg.sender, receiver, msg.value, block.timestamp);
    }

    receive() external payable {
        emit PaymentReceived(msg.sender, msg.value);
    }
}
