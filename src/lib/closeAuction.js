import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();

export const closeAuction = async (auction) => {
	const { id } = auction;
	//make query to dynamodb
	const params = {
		TableName: process.env.AUCTIONS_TABLE_NAME,
		Key: { id: id },
		UpdateExpression: 'set #status = :status',
		ExpressionAttributeValues: {
			':status': 'CLOSED',
		},
		//#status -> dynamodb reserver word
		ExpressionAttributeNames: {
			'#status': 'status',
		},
	};

	const result = await dynamodb.update(params).promise();
	return result;
};
