const { Spinner } = require('clui');

const handle = async ({
  sourceQueueUrl,
  targetQueueUrl,
  sqs,
  prompt,
}) => {
  const count = await sqs.getCount(sourceQueueUrl);
  await sqs.getCount(targetQueueUrl);

  if (count === 0) {
    throw new Error(`The queue ${sourceQueueUrl} is empty!`);
  }

  const { move } = await prompt([
    {
      type: 'confirm',
      name: 'move',
      message: `You want to move ${count} entries?`,
      default: false,
    },
  ]);

  if (!move) {
    process.exit(0);
  }

  const spinner = new Spinner(`Move ${count} messages...`);
  spinner.start();

  const promises = [];

  for (let i = 0; i < count; i += 1) {
    promises.push(sqs.moveMessage(sourceQueueUrl, targetQueueUrl));
  }

  await Promise.all(promises).then(() => {
    spinner.stop();
  }).catch((e) => {
    spinner.stop();
    throw new Error(e.message);
  });

  return count;
};

module.exports = {
  handle,
};