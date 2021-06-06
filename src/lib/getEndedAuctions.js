import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();

export const getEndedAuctions = async () => {
	const now = new Date();

	//make query to dynamodb
	const params = {
		TableName: process.env.AUCTIONS_TABLE_NAME,
		IndexName: 'statusAndEndDate',
		KeyConditionExpression: '#status = :status AND endingAt <= :now',
		ExpressionAttributeValues: {
			':status': 'OPEN',
			':now': now.toISOString(),
		},
		//#status -> dynamodb reserver word
		ExpressionAttributeNames: {
			'#status': 'status',
		},
	};

	const result = await dynamodb.query(params).promise();
	return result.Items;
};
