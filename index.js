const express = require("express");
const app = express();
app.use(express.json());

const PORT = 3002 || process.env.PORT;
const cors = require("cors");
app.use(cors());

const router = express.Router();
app.use(router);
const pg = require("./database");
console.log(pg);

// configure AWS-S3
let AWS = require("aws-sdk");
AWS.config.update({
  accessKeyId: process.env.AWS_accessKeyId,
  secretAccessKey: process.env.AWS_secretAccessKey,
  region: process.env.region,
  signatureVersion: "v4",
  endpoint: "https://s3.ap-south-1.amazonaws.com",
});
let s3 = new AWS.S3();
const BUCKET = process.env.BUCKET;
console.log(BUCKET);
const multer = require("multer");
const multers3 = require("multer-s3");

const upload = multer({
  storage: multers3({
    s3: s3,
    bucket: BUCKET,
    acl: "public-read",
    metadata: (req, file, cb) => {
      cb(null, { fieldName: file.originalname });
    },
    key: (req, file, cb) => {
      cb(null, file.originalname);
    },
  }),
});

// Routes
// upload document to aws-s3 bucket
const upload_document = async (req, res) => {
  try {
    ("use-strict");
    const file = req.file;
    res.status(200).json({
      message: "document uploaded successfully",
      Location: req.file.location,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "uploading document failed" });
  }
};
router.post("/postdoc", upload.single("file"), upload_document);
const Docxtemplater = require("docxtemplater");
const PizZip = require("pizzip");
const fs = require("fs");
const JSZip = require("jszip");
const { log } = require("console");
const e = require("express");

// Get document
const get_document = async (req, res) => {
  try {
    const params = {
      Bucket: BUCKET,
      Key: req.params.filename,
    };
    let data = await s3.getObject(params).promise();
    document = data.Body;
    let zip = new PizZip(document);
    var doc = new Docxtemplater();
    const text = doc.loadZip(zip).getFullText();
    console.log(text);
    // Page break
    const numPages = doc
      .getZip()
      .folder("word")
      .file("document.xml")
      .asText()
      // .split('<w:br w:type="page"/>').length;
      .split("<w:lastRenderedPageBreak/>").length;
    // .split("w\\:t").length;

    console.log(numPages);
    // console.log(doc.getZip().folder("word").file("document.xml").asText());
    for (let i = 0; i < numPages; i++) {
      let pageContent = doc
        .getZip()
        .file("word/document.xml")
        .asText()
        .split("<w:lastRenderedPageBreak/>")[i];
      console.log(`Page ${i + 1} content: `, pageContent + "\n");

      var parseString = require("xml2js").parseString;
      var xml = "<w:r><w:t>Page 1</w:t></w:r>";
      parseString(xml, function (err, result) {
        console.dir(result);
      });
      // let doc2 = new Docxtemplater();
      // let zip2 = new PizZip(pageContent);
      // const buf = doc2.generate({
      //   type: "nodebuffer",
      //   compression: "DEFLATE",
      // });
      // let text2 = doc2.loadZip(buf).getFullText();
      // console.log(text2);

      // // MAMMOTH

      // var mammoth = require("mammoth");
      // mammoth
      //   .extractRawText({ path: "./testing/practice.docx" })
      //   .then((result) => {
      //     const docxText = result.value;
      //     const pageNumbers = docxText.match(/\d+/g);

      //     let splitted = docxText.split(pageNumbers[i]);
      //     console.log(splitted.toString().replaceAll(/\s/g, ""));
      //     // console.log(docxText.toString().replaceAll(/\s/g, ""));
      //   });
      // const pageNumbers = [];
      // doc.setOptions({ linebreaks: true });

      // // WORD Extractor
      // const WordExtractor = require("word-extractor");
      // const extractor = new WordExtractor();
      // const extracted = extractor.extract("./testing/practice.docx");
      // extracted.then(function (doc) {
      //   console.log(doc.getBody().toString().replaceAll(/\s/g, ""));
      //   let footnote = doc
      //     .getHeaders({ includeFooters: true })
      //     .toString()
      //     .replaceAll(/\s/g, "");
      //   console.log("Footer" + footnote);
      // });

      // // DOCX4JS
      // const docx4js = require("docx4js");
      // const filePath = "./testing/practice.docx";
      // let docxbuffer = fs.readFileSync(filePath);
      // docx4js.load(docxbuffer).then((docxx) => {
      //   let print = docxx.getObjectPart("word/footer1.xml").text();
      //   console.log("print" + print);
      // });
      // let pageContent = doc.getFullText().split(`Page`)[i];
      // let pageContent = doc
      //   .getZip()
      //   .folder("word")
      //   .file("document.xml")
      //   .asText()
      //   .split("w\\:br[w\\:type=page]");
      // pageContent = doc.asText();

      // Creating New docx file with the text
      const officegen = require("officegen");
      const docx = officegen("docx");
      const p = docx.createP();
      var footer = docx.getFooter();
      // console.log(footer);
      // footer.addText("This is the footer");
      p.addText(pageContent);
      const out = fs.createWriteStream(`page_${i}.docx`);
      docx.generate(out);
    }
    res.status(200).json(text);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};
router.get("/getdocument/:filename", get_document);

// Get document list
const getList = async (req, res) => {
  try {
    let documents_list = await s3.listObjectsV2({ Bucket: BUCKET }).promise();
    documents_list = documents_list.Contents.map((item) => {
      let allowed_format = ["docx"];
      const file_extension = item.Key.slice(
        ((item.Key.lastIndexOf(".") - 1) >>> 0) + 2
      );
      if (allowed_format.includes(file_extension)) {
        if (!item) {
          return;
        }
        return item.Key;
      }
      //   return file_extension;
    });
    res.status(200).send(documents_list);
    // check the uploaded file format
    // if (allowed_format.includes(file_extension)) {
    //   res.status(200).send(documents_list);
    // }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};
router.get("/list", getList);

app.listen(PORT, () => {
  console.log(`Web server started in ${PORT}`);
});
