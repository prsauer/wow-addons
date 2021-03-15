const console = require("console");
var fs = require("fs");
var data = require("./spelldiff.json");

function makeYellow(s) {
  return `|cFFFFFF00${s}|r`;
}

function makeGreen(s) {
  return `|cFFFFFF00${s}|r`;
}

function makeRed(s) {
  return `|cFFFF0000${s}|r`;
}

console.log(Object.keys(data));

const all_pve = data["all_pve"];
const all_pvp = data["all_pvp"];
const diff_pvp = data["diff_pvp"];
const diffed_pvp = {};

console.log(Object.keys(all_pve).length);
console.log(Object.keys(all_pvp).length);
console.log(Object.keys(diff_pvp).length);

var blanks = 0;

for (let k of Object.keys(diff_pvp)) {
  if (diff_pvp[k] === "") {
    blanks++;
    continue;
  }
  const pve_words = all_pve[k].split(" ");
  const pvp_words = all_pvp[k].split(" ");

  const new_words = [];
  const edits = [];

  for (let i = 0; i < pvp_words.length; i++) {
    if (pve_words.length < i - 1 || pve_words[i] !== pvp_words[i]) {
      try {
        let f1 = parseFloat(pve_words[i].replace(/,/g, ""));
        let f2 = parseFloat(pvp_words[i].replace(/,/g, ""));
        const loss = ((100 * (f2 - f1)) / f1).toFixed(1);
        if (loss > 0) {
          new_words.push(makeGreen(`(+${loss}%)`));
        } else {
          new_words.push(makeRed(`(${loss}%)`));
        }
        console.log(pve_words[i], pvp_words[i], f1, f2, loss);
        edits.push([i, ((100 * (f2 - f1)) / f1).toFixed(1)]);
      } catch (error) {
        console.log(error);
        new_words.push(pvp_words[i]);
      }
    } else {
      new_words.push(pvp_words[i]);
    }
  }
  diffed_pvp[k] = {
    edits: edits,
    new_words: new_words.join(" ").replace(/\n/g, "\\n").replace(/\r/g, "\\r"),
  };
}

console.log(blanks);

function printLuaAry(ary) {
  console.log("ar", ary);
  let rval = "";
  for (let i = 0; i < ary.length; i++) {
    console.log("ai", ary[i], ary[i].join(","));
    rval =
      rval + "{" + ary[i].join(",") + "}" + (i < ary.length - 1 ? "," : "");
  }
  return rval;
}

var fileData = "";
for (let k of Object.keys(diffed_pvp)) {
  console.log(diffed_pvp[k].edits);
  fileData += `[${k}] = {["edits"] = {${printLuaAry(
    diffed_pvp[k].edits
  )}}, ["text"] = "${diffed_pvp[k].new_words}"},  \n`;
}
fs.writeFile("pvp_data.lua", fileData, function (err) {
  console.log(err);
});
