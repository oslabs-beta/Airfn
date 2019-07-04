import querystring from 'querystring';
import fetch from 'node-fetch';

exports.handler = async (event, context) => {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // When the method is POST, the name will no longer be in the event's
  // queryStringParameters – it'll be in the event body encoded as a queryString
  const params = querystring.parse(event.body);
  const name = params.name || 'World';

  // Send greeting to Slack
  return fetch(
    'https://hooks.slack.com/services/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',
    {
      headers: {
        'content-type': 'application/json'
      },
      method: 'POST',
      body: JSON.stringify({
        text: `Baaa baa BAAAHHH, ${name}! (lambspeak for this was sent by AWS Lambda 🐑)`
      })
    }
  )
    .then(() => ({
      statusCode: 200,
      body: `${name} says hello!`
    }))
    .catch(error => ({
      statusCode: 422,
      body: `Oops! Something went wrong. ${error}`
    }));
};
