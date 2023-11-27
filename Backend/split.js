const fs = require("fs");
const JSZip = require("jszip");
const Docxtemplater = require("docxtemplater");

const readDocxFile = (filePath) => {
  const content = fs.readFileSync(filePath, "binary");
  const zip = new JSZip(content);
  const doc = new Docxtemplater();
  doc.loadZip(zip);
  const numPages = doc
    .getZip()
    .folder("word")
    .file("document.xml")
    .asText()
    // .split('<w:br w:type="page"/>').length;
    .split("<w:r><w:lastRenderedPageBreak/><w:t>").length;
  console.log(numPages);

  for (let i = 0; i < numPages; i++) {
    const pageContent = doc
      .getZip()
      .file("word/document.xml")
      .asText()
      .split("<w:r><w:lastRenderedPageBreak/><w:t>")[i];
    console.log(`Page ${i + 1} content: `, pageContent);
    // You can handle the page content as needed
    // console.log(pageContent);
  }
};

const filePath = "./testing/demo.docx"; // Update with the path to your file
readDocxFile(filePath);
