const fs = require("fs");
const p =
  "C:/Users/shiva/.cursor/projects/c-Users-shiva-Desktop-INDMoney-Weekly-Review-Pulse/agent-transcripts/7234d4c5-254a-4a09-a00c-db3be7ced536/7234d4c5-254a-4a09-a00c-db3be7ced536.jsonl";
const line = fs.readFileSync(p, "utf8").split(/\n/)[0];
const obj = JSON.parse(line);
const text = obj.message.content[0].text;
fs.writeFileSync("_brief_extract.txt", text);
console.log("len", text.length);
const markers = [
  "## 12",
  "## 13",
  "## 14",
  "SCREEN 01",
  "SCREEN 02",
  "SCREEN 03",
  "SCREEN 04",
  "PII check",
  "fingerprint",
];
for (const m of markers) {
  console.log(m, text.indexOf(m));
}
