import { v4 as uuid } from 'uuid';
import AWS from 'aws-sdk';
import createError from 'http-errors';

const dynamodb = new AWS.DynamoDB.DocumentClient();

async function createAuction(event, context) {
	const { title } = JSON.parse(event.body);
	const now = new Date();

	const auction = {
		id: uuid(),
		title,
		status: 'OPEN',
		createdAt: now.toISOString(),
	};

	try {
		await dynamodb
			.put({
				TableName: process.env.AUCTIONS_TABLE_NAME,
				Item: auction,
			})
			.promise();
	} catch (err) {
		console.lo(err);
		throw new createError.InternalServerError(err);
	}

	return {
		statusCode: 201,
		body: JSON.stringify(auction),
	};
}

export const handler = createAuction;
