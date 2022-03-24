/* eslint-disable no-await-in-loop */
const { Spinner } = require('clui');

function sleep(time) {
  return new Promise(resolve => setTimeout(resolve, time));
}

const handle = async ({
  sourceQueueUrl,
  targetQueueUrl,
  sqs,
  prompt,
  skipPrompt,
}) => {
  const count = await sqs.getCount(sourceQueueUrl);
  await sqs.getCount(targetQueueUrl);

  if (count === 0) {
    throw new Error(`The queue ${sourceQueueUrl} is empty!`);
  }

  if (!skipPrompt) {
    const { move } = await prompt([
      {
        type: 'confirm',
        name: 'move',
        message: `Do you want to move ${count} messages?`,
        default: false,
      },
    ]);

    if (!move) {
      process.exit(0);
    }
  }

  const spinner = new Spinner(`Moving ${count} messages...`);
  spinner.start();

  const promises = [];

  for (let i = 0; i < count; i += 1) {
    promises.push(sqs.moveMessage(sourceQueueUrl, targetQueueUrl, i));
  }
  const chunkSize = 300;
  for (let i = 0; i < promises.length; i += chunkSize) {
    console.error(`${i} Sent`);

    const chunk = promises.slice(i, i + chunkSize);
    await Promise.all(chunk);
    await sleep(900);
  }
  spinner.stop();
  return count;
};

module.exports = {
  handle,
};
