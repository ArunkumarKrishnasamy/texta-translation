const Docxtemplater = require("docxtemplater");
const PizZip = require("pizzip");
const fs = require("fs");
const path = require("path");

var JSZip = require("jszip");
const { log, error } = require("console");
// const { async } = require("node-stream-zip");

let content = fs.readFileSync(__dirname + "/testing/demo.docx", "binary");

var zip = new JSZip(content);
var doc = new Docxtemplater().loadZip(zip);

const pageSplit = async (doc, outputPath) => {
  let pageCount = doc
    .getFullText()
    .split("split")
    .filter((para) => para.trim() !== "").length;
  console.log(pageCount);

  const officegen = require("officegen");
  const docx = officegen("docx");

  for (let i = 0; i < pageCount; i++) {
    let pageContent = doc.getFullText().split("split")[i];

    let new_doc = new Docxtemplater().loadZip(zip);

    console.log(pageContent + "\n");

    const officegen = require("officegen");
    const docx = officegen("docx");
    const p = docx.createP();
    var header = docx.getFooter().createP();
    header.addText("This is the footer");
    p.addText(pageContent);
    const out = fs.createWriteStream(`page_${i}.docx`);
    docx.generate(out, outputPath);
  }
};
// Provide the output directory for the split pages
const outputPath = "./testing/output";
pageSplit(doc, outputPath);
