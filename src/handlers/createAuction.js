import { v4 as uuid } from 'uuid';
import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';

const dynamodb = new AWS.DynamoDB.DocumentClient();

const createAuction = async (event, context) => {
	const { title } = event.body;
	const now = new Date();

	const auction = {
		id: uuid(),
		title,
		status: 'OPEN',
		highsetBid: {
			amount: 0,
		},
		createdAt: now.toISOString(),
	};

	try {
		await dynamodb.put({
			TableName: process.env.AUCTIONS_TABLE_NAME,
			Item: auction,
		}).promise();
	} catch (err) {
		console.lo(err);
		throw new createError.InternalServerError(err);
	}

	return {
		statusCode: 201,
		body: JSON.stringify(auction),
	};
}

export const handler = commonMiddleware(createAuction);
