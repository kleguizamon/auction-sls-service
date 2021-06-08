import AWS from 'aws-sdk';

const dynamodb = new AWS.DynamoDB.DocumentClient();
const sqs = new AWS.SQS();

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

	await dynamodb.update(params).promise();


	//Notification queue-email
	const { title, seller, highestBid } = auction;
	const { amount, bidder } = highestBid;

	//Make email when didn't bids
	if (amount === 0) {
		await sqs.sendMessage({
			QueueUrl: process.env.MAIL_QUEUE_URL,
			MessageBody: JSON.stringify({
				subject: 'No bids on your auction item :(',
				recipient: seller,
				body: `Yout item ${title} didn't get any bids`
			}),
 		}).promise();
		return;
	}

	//Make email seller
	const notifySeller = sqs.sendMessage({
		QueueUrl: process.env.MAIL_QUEUE_URL,
		MessageBody: JSON.stringify({
			subject: 'Your item has been sold!',
			recipient: seller,
			body: `Yeah! Your item "${title}" has been sold for $${amount}!`,
		})
	}).promise()

	//Make email bidder
	const notifyBidder = sqs.sendMessage({
		QueueUrl: process.env.MAIL_QUEUE_URL,
		MessageBody: JSON.stringify({
			subject: 'You won an auction!',
			recipient: bidder,
			body: `You got yourself a "${title}" for $${amount}`,
		})
	}).promise()

	return Promise.all([notifyBidder, notifySeller]);

};
