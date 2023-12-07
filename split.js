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

// Get document
const get_document = async (req, res) => {
  try {
    let key = req.params.filename;
    const params = {
      Bucket: BUCKET,
      Key: key,
    };
    let data = await s3.getObject(params).promise();
    document = data.Body;

    let zip = new PizZip(document);
    var doc = new Docxtemplater();
    const text = doc.loadZip(zip).getFullText();
    const path = require("path");
    let filePath = path.join(__dirname, key);
    await fs.promises.writeFile(filePath, data.Body);
    // LIBRE OFFICE
    const libre = require("libreoffice-convert");
    libre.convertAsync = require("util").promisify(libre.convert);
    async function main() {
      const ext = ".pdf";
      const inputPath = path.join(filePath);

      const outputPath = path.join(__dirname, `./output/example${ext}`);

      // Read file
      const docxBuf = await fs.promises.readFile(inputPath);

      // Convert it to pdf format with undefined filter (see Libreoffice docs about filter)
      let pdfBuf = await libre.convertAsync(docxBuf, ext, undefined);

      // Here in done you have pdf file which you can save or transfer in another stream
      await fs.promises.writeFile(outputPath, pdfBuf);
      await fs.promises.unlink(filePath);
      (async () => {
        await splitPdf(outputPath);
      })();
    }
    main().catch(function (err) {
      console.log(`Error converting file: ${err}`);
    });
    let docBucket = process.env.SplitBucket;
    // PDF lib
    const { PDFDocument } = require("pdf-lib");
    async function splitPdf(pathToPdf) {
      const documentAsBytes = await fs.promises.readFile(pathToPdf);
      const pdfDoc = await PDFDocument.load(documentAsBytes);
      const numberOfPages = pdfDoc.getPages().length;
      const uploadToS3 = (fileName, pdfBytes) => {
        let params = {
          Bucket: docBucket,
          Key: fileName,
          Body: pdfBytes,
        };
        return s3.upload(params).promise();
      };
      let Array = [];
      async function getPdf(splittedDocParams) {
        let files = await s3.getObject(splittedDocParams).promise();
        Array.push(files);
      }

      for (let i = 0; i < numberOfPages; i++) {
        const subDocument = await PDFDocument.create();
        const [copiedPage] = await subDocument.copyPages(pdfDoc, [i]);
        subDocument.addPage(copiedPage);
        const pdfBytes = await subDocument.save();
        let uploadedFileName = `${key}-file-${i + 1}.pdf`;
        await fs.promises.writeFile(uploadedFileName, pdfBytes);

        await uploadToS3(uploadedFileName, pdfBytes);
        let splittedDocParams = {
          Bucket: docBucket,
          Key: uploadedFileName,
        };
        await getPdf(splittedDocParams);
      }
      res.status(200).send(Array);
    }
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
