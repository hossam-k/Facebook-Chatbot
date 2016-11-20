'use strict';

const WIT_TOKEN = process.env.WIT_TOKEN
if (!WIT_TOKEN) {
  throw new Error('Missing WIT_TOKEN. Go to https://wit.ai/docs/quickstart to get one.')
}


var FB_PAGE_TOKEN = process.env.FB_PAGE_TOKEN || 'EAAZAzPkUjcNEBAOZARPnJlk6sOl94OZAwv8C7yGuvT8RqiwiNKlIH99146IyBPzmdQAQOZCZAbS3mnqZABtQDMqiQh2CgKPttr4R3Dy4cK9d99YQzPkNlZCIdVbNbUyClhRWnR1fIRZBXBBlTsyjdD8pAyUxSLVM5jNWRmxNSc45fQZDZD';
if (!FB_PAGE_TOKEN) {
	throw new Error('Missing FB_PAGE_TOKEN. Go to https://developers.facebook.com/docs/pages/access-tokens to get one.')
}

var FB_VERIFY_TOKEN = process.env.FB_VERIFY_TOKEN || 'just_do_it'

module.exports = {
  WIT_TOKEN: WIT_TOKEN,
  FB_PAGE_TOKEN: FB_PAGE_TOKEN,
  FB_VERIFY_TOKEN: FB_VERIFY_TOKEN,
}
