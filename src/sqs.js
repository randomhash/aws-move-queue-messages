const createClient = (sqs) => {
  const sendMessage = (QueueUrl, MessageBody, MessageDeduplicationId, MessageGroupId) => new Promise((resolve, reject) => {
    sqs.sendMessage(
      { QueueUrl, MessageBody, MessageDeduplicationId, MessageGroupId },
      (error, data) => (error ? reject(error) : resolve(data)),
    );
  });

  const receiveMessage = QueueUrl => new Promise((resolve, reject) => {
    sqs.receiveMessage(
      { QueueUrl, AttributeNames: ['MessageDeduplicationId', 'MessageGroupId']},
      (error, data) => (error ? reject(error) : resolve(data.Messages[0])),
    );
  });

  const deleteMessage = (QueueUrl, ReceiptHandle) => new Promise((resolve, reject) => {
    sqs.deleteMessage(
      { QueueUrl, ReceiptHandle },
      (error, data) => (error ? reject(error) : resolve(data)),
    );
  });

  const getCount = QueueUrl => new Promise((resolve, reject) => {
    sqs.getQueueAttributes(
      {
        QueueUrl,
        AttributeNames: [
          'ApproximateNumberOfMessages',
        ],
      },
      (error, data) => (
        error
          ? reject(error)
          : resolve(data.Attributes.ApproximateNumberOfMessages)
      ),
    );
  });

  const moveMessage = (sourceQueueUrl, targetQueueUrl) => (
    new Promise(async (resolve, reject) => {
      try {
        const receivedMessage = await receiveMessage(sourceQueueUrl);
        console.log(receivedMessage)

        if (!receivedMessage.Body || !receivedMessage.ReceiptHandle || !receivedMessage.Attributes) {
          throw 'Queue is empty'; // eslint-disable-line
        } 
        
        
        const { Body, ReceiptHandle, Attributes} = receivedMessage;
        const {MessageDeduplicationId, MessageGroupId} = Attributes;
        if (!MessageDeduplicationId || !MessageGroupId) {
          throw 'Failure'
        }
        await sendMessage(targetQueueUrl, Body, MessageDeduplicationId, MessageGroupId);
        await deleteMessage(sourceQueueUrl, ReceiptHandle);

        resolve(ReceiptHandle);
      } catch (error) {
        reject(error);
      }
    })
  );

  return {
    getCount,
    moveMessage,
  };
};

module.exports = {
  createClient,
};
