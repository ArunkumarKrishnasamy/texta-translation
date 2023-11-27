const express = require("express");
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3001;
const cors = require("cors");
app.use(cors());

const dotenv = require("dotenv");
dotenv.config({ path: "./.env" });

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
const router = express.Router();
router.post("/postdoc", upload.single("file"), upload_document);

// Get document from aws-s3 bucket

// const PDFParser = require("pdf-parse");
const PdfParse = require("pdf-parse");
const e = require("express");
const remove_nullBytes = (uint8Array) => {
  const result = [];
  for (let i = 0; i < uint8Array.length; i++) {
    if (uint8Array[i] !== 0) {
      result.push(uint8Array[i]);
    }
  }
  return new Uint8Array(result);
};
const checkNullBytes = async (uint8Array) => {
  for (let i = 0; i < uint8Array.length; i++) {
    if (uint8Array[i] === 0) {
      remove_nullBytes(uint8Array);
    }
  }
  return false;
};

const Transform = require("stream").Transform;
const mammoth = require("mammoth");
const streamZip = require("node-stream-zip");
const get_document = async (req, res) => {
  try {
    const params = {
      Bucket: process.env.BUCKET,
      Key: req.params.filename,
    };
    let document = await s3.getObject(params).promise();
    document = document.Body;
    const jsonString = JSON.stringify(document);
    let buf = Buffer.from(document, "binary");
    mammoth
      .extractRawText({ buffer: buf })
      .then((result) => {
        const text = result.value;

        res.status(200).send(text);
      })
      .catch((error) => {
        console.error("Error extracting text:", error);
        res.send("error");
      });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "error occured" });
  }
};

// Get List of documents in Bucket
const getList = async (req, res) => {
  try {
    let result = await s3
      .listObjectsV2({ Bucket: process.env.BUCKET })
      .promise();
    const list = result.Contents.map((item) => item.Key);
    res.send(list);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "error occured" });
  }
};
router.get("/list", getList);

router.get("/getdoc/:filename", get_document);

// Configure groupdocs for Document Merging

const groupdocs_merger_cloud = require("groupdocs-merger-cloud");
const fs = require("fs");
const { log, error } = require("console");

const groupdocs_client_ID = process.env.GroupDocs_Client_Id;
const groupdocs_client_Secret = process.env.Group_Client_Secret;
const mystorage = "AmazonS3Storage";
const config = new groupdocs_merger_cloud.Configuration(
  groupdocs_client_ID,
  groupdocs_client_Secret
);
config.apiBaseUrl = "https://api.groupdocs.cloud";

// Open file from system
var resource_Folder = "./testing/sample.doc";
const path = require("path");

// read file
// fs.readFile(resource_Folder, (err, fileStream) => {
//   // construct file API
//   var fileApi = groupdocs_merger_cloud.FileApi.fromConfig(config);
//   // create uploadfile request
//   var request = new groupdocs_merger_cloud.UploadFileRequest(
//     "science.docx",
//     fileStream,
//     mystorage
//   );
//   // upload file
//   fileApi
//     .uploadFile(request)
//     .then(function (response) {
//       console.log(
//         "Expected response type is FilesUploadResult:" + response.uploaded
//       );
//     })
//     .catch(function (error) {
//       console.log("Error_upload:" + error.message);
//     });
//   if (err) {
//     throw err;
//   }
// });

// Split word document into separate pages
// const split = async () => {
//   let documentApi = groupdocs_merger_cloud.DocumentApi.fromKeys(
//     groupdocs_client_ID,
//     groupdocs_client_Secret
//   );
//   let options = new groupdocs_merger_cloud.SplitOptions();
//   options.fileInfo = new groupdocs_merger_cloud.FileInfo();
//   options.filePath = "./testing/sample.doc";
//   options.outputPath = "splitsample.doc";
//   options.pages = [1, 3];
//   options.mode = groupdocs_merger_cloud.SplitOptions.ModeEnum.Pages;

//   try {
//     // document split request
//     let splitRequest = new groupdocs_merger_cloud.SplitRequest(options);
//     let result = await documentApi.split(splitRequest);
//   } catch (error) {
//     console.error("Error_split", error);
//   }
// };
// split()
//   .then(() => {
//     console.log("Successfully doc splitted into pages");
//   })
//   .catch((error) => {
//     console.error("Error occurred", error);
//   });

// Download files from cloud
// Construct fileAPI to download merged file
// let fileAPI = groupdocs_merger_cloud.FileApi.fromConfig(config);
// // create download file request
// let request = new groupdocs_merger_cloud.DownloadFileRequest(
//   "./testing",
//   mystorage
// );
// // Download file and response type stream

// fileAPI
//   .downloadFile(request)
//   .then(function (response) {
//     // Save file in system directory
//     fs.writeFile("./testing", "binary", function (err) {
//       console.log(err);
//     });
//     console.log("Expected response type is Stream :" + response.length);
//   })
//   .catch(function (err) {
//     console.log("Error_download:", err.message);
//   });

//  CloudmersiveValidateApiClient
var CloudmersiveConvertApiClient = require("cloudmersive-convert-api-client");
var defaultClient = CloudmersiveConvertApiClient.ApiClient.instance;

// // Configure API key authorization: Apikey
var Apikey = defaultClient.authentications["Apikey"];
const apiKey = "3ce2cb32-fcb8-4bdd-ac54-f3ccc93a9bb2";
const superagent = require("superagent");
const { file } = require("jszip/lib/object");
// Function to split a DOCX file
// async function splitDocxFile() {
//   const apiUrl = "https://api.cloudmersive.com/convert/split/docx";
//   try {
//     const response = await superagent
//       .post(apiUrl)
//       .set("Apikey", apiKey)
//       .attach("file", "./testing/demo.docx"); // Replace with the path to your DOCX file

//     // The response will contain the split DOCX files
//     console.log(response.body);
//   } catch (error) {
//     console.error("Error:", error);
//   }
// }

app.use(router);
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
