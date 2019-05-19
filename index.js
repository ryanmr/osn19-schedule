const _ = require("lodash");
const cheerio = require("cheerio");
const rp = require("request-promise");
const fs = require("fs");

const dest = "https://opensourcenorth.com/#Details";

async function captureContent(destination) {
  const content = await rp(destination);
  return cheerio.load(content);
}

function extractRoom($p) {
  try {
    const text = $p
      .find(".room")
      .text()
      .trim();
    let reg = /(room:\s*)(.*)/im;
    const matches = text.match(reg);
    if (matches && matches.length > 0) {
      return matches[2];
    }
  } catch (e) {
    console.error("error in extractRoom", e);
  }
  return "";
}

function extractEventDetails($p) {
  try {
    const details = $p
      .find(".talk-details")
      .children("p")
      .first()
      .text()
      .trim();
    return details;
  } catch (e) {
    console.error("error in extractEventDetails", e);
  }
  return "";
}

function extractEventSpeakers($, $p) {
  try {
    return $p
      .find(".event-speaker")
      .map((_, speaker) => $(speaker).text())
      .get();
  } catch (e) {
    console.error("error in extractEventSpeakers", e);
  }
  return [];
}

function parse($) {
  const presentations = $(".presentation");
  const structs = presentations.map((index, presentation) => {
    const $p = $(presentation);

    const eventTime = $p.find(".event-time").text();
    const track = $p.find(".event-room").text();
    const room = extractRoom($p);
    const eventTitle = $p.find(".event-title").text();
    const eventSpeakers = extractEventSpeakers($, $p);
    const eventDetails = extractEventDetails($p);

    const output = {
      eventTitle,
      eventTime,
      eventSpeakers,
      eventDetails,
      track,
      room
    };

    return output;
  });

  return structs.get();
}

function main() {
  captureContent(dest)
    .then($ => parse($))
    .then(data =>
      fs.writeFileSync("./osn19-schedule.json", JSON.stringify(data, null, 2))
    );
}

main();
