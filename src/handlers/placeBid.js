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

	const auction = await getAuctionById(id);
	const { status } = auction;

	//validate status auction
	if (status != 'OPEN') {
		throw new createError.Forbidden('You cannot bid on closed auctions')
	}

	// Bid amount validation
	if (amount <= auction.highsetBid.amount) {
		throw new createError.Forbidden(
			`Your bind must be higher than ${auction.highsetBid.amount}`
		);
	}

	const params = {
		TableName: process.env.AUCTIONS_TABLE_NAME,
		Key: { id },
		UpdateExpression: 'set highsetBid.amount = :amount',
		ExpressionAttributeValues: {
			':amount': amount,
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

export const handler = commonMiddleware(placeBid)
	.use(validator({ inputSchema: placeBidSchema }));
