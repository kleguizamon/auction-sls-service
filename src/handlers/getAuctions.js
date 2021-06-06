import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import validator from '@middy/validator';
import createError from 'http-errors';
import getAuctionSchema from '../lib/schemas/getAuctionsSchema';

const dynamodb = new AWS.DynamoDB.DocumentClient();

const getAuctions = async (event, context) => {
	const { status } = event.queryStringParameters;
	let auctions;

	//make query to getAuction by status
	const params = {
		TableName: process.env.AUCTIONS_TABLE_NAME,
		IndexName: 'statusAndEndDate',
		KeyConditionExpression: '#status = :status',
		ExpressionAttributeValues: {
			':status': status,
		},
		ExpressionAttributeNames: {
			'#status': 'status',
		},
	};

	try {
		const result = await dynamodb.query(params).promise();
		auctions = result.Items;
	} catch (err) {
		console.log(err);
		throw new createError.InternalServerError(err);
	}

	return {
		statusCode: 200,
		body: JSON.stringify(auctions),
	};
};

export const handler = commonMiddleware(getAuctions)
	.use(validator({ inputSchema: getAuctionSchema, useDefaults: true }));
