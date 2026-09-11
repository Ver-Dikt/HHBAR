const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
global.location = { href: 'https://hhbar.ru/index.html' };
const data = require(path.resolve(__dirname,'../src/scripts/safe-data.js'));
test('localAsset accepts only intended same-origin directories', () => {
  assert.match(data.localAsset('img/events/ev-1.jpg','img/events/'), /^https:\/\/hhbar\.ru\/img\/events\//);
  for (const attack of ['https://evil.example/x.jpg','//evil.example/x.jpg','img/events/../../sw.js','javascript:alert(1)','img/events/x.jpg?q=1']) assert.equal(data.localAsset(attack,'img/events/'),null);
});
test('eventData validates, bounds and archives editable event content', () => {
  const event = data.eventData({ title:'Test',datetime:'2026-05-02',image:'img/events/ev-1.jpg',description:['a'] },'https://hhbar.ru/index.html','2026-09-11');
  assert.equal(event.archived,true); assert.equal(event.bookingUrl,'booking.html');
  assert.equal(data.eventData({title:'x',datetime:'bad',image:'img/events/ev-1.jpg'},location.href,'2026-09-11'),null);
});
