import { v4 as uuid } from 'uuid';
import AWS from 'aws-sdk';
import commonMiddleware from '../lib/commonMiddleware';
import createError from 'http-errors';
import createAuctionSchema from '../lib/schemas/createAuctionSchema';
import validator from '@middy/validator';

const dynamodb = new AWS.DynamoDB.DocumentClient();

const createAuction = async (event, context) => {
	const { title } = event.body;
	//get email seller(claim token)
	const { email } = event.requestContext.authorizer;
	const now = new Date();
	//set +1hs(finish auctions)
	const endDate = new Date();
	endDate.setHours(now.getHours() + 1);

	const auction = {
		id: uuid(),
		title,
		status: 'OPEN',
		createdAt: now.toISOString(),
		endingAt: endDate.toISOString(),
		highestBid: {
			amount: 0,
		},
		seller: email,
	};

	try {
		await dynamodb
			.put({TableName: process.env.AUCTIONS_TABLE_NAME,
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
};

export const handler = commonMiddleware(createAuction)
	.use(validator( { inputSchema: createAuctionSchema}));
