import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';
import { getAuctionById } from './getAuction';
import placeBidSchema from '../lib/schemas/placeBidSchema';
import validator from '@middy/validator';

const dynamodb = new AWS.DynamoDB.DocumentClient();

const placeBid = async (event, context) => {
	const { id } = event.pathParameters;
	const { amount } = event.body;
	const { email } = event.requestContext.authorizer;

	const auction = await getAuctionById(id);
	const { status } = auction;
	const { bidder } = auction.highestBid;

	//identity email validation
	if (email === auction.seller) {
		throw new createError.Forbidden('You cannot bid on your own auction');
	}

	//avoid double bidding
	if (email === bidder) {
		throw new createError.Forbidden('You are already the highest bidder');
	}

	//validate status auction
	if (status != 'OPEN') {
		throw new createError.Forbidden('You cannot bid on closed auctions');
	}

	//bid amount validation
	if (amount <= auction.highestBid.amount) {
		throw new createError.Forbidden(
			`Your bind must be higher than ${auction.highestBid.amount}`
		);
	}

	const params = {
		TableName: process.env.AUCTIONS_TABLE_NAME,
		Key: { id },
		UpdateExpression:
			'set highestBid.amount = :amount, highestBid.bidder = :bidder',
		ExpressionAttributeValues: {
			':amount': amount,
			':bidder': email,
		},
		ReturnValues: 'ALL_NEW',
	};
	let updateAuction;

	try {
		const result = await dynamodb.update(params).promise();
		updateAuction = result.Attributes;
	} catch (err) {
		console.log(err);
		throw new createError.InternalServerError(err);
	}

	return {
		statusCode: 200,
		body: JSON.stringify(updateAuction),
	};
};

export const handler = commonMiddleware(placeBid).use(
	validator({ inputSchema: placeBidSchema })
);
