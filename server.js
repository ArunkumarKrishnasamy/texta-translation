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
const { log, Console } = require("console");

// Get document
const get_document = async (req, res) => {
  try {
    let id = req.params.file_id;
    let DocInfo = await pool.query(`SELECT * FROM inbox WHERE file_id=${id}`);
    // DocInfo=DocInfo.rows[0];
    let key = DocInfo.rows[0].file_name;
    const params = {
      Bucket: BUCKET,
      Key: key,
    };

    let data = await s3.getObject(params).promise();
    document = data.Body;

    // let zip = new PizZip(document);
    // var doc = new Docxtemplater();
    // const text = doc.loadZip(zip).getFullText();
    const path = require("path");
    let filePath = path.join(__dirname, key);
    await fs.promises.writeFile(filePath, data.Body);
    // LIBRE OFFICE
    const libre = require("libreoffice-convert");
    libre.convertAsync = require("util").promisify(libre.convert);
    async function main() {
      const ext = ".pdf";
      const inputPath = path.join(filePath);

      // Read file
      const docxBuf = await fs.promises.readFile(inputPath);

      // Convert it to pdf format with undefined filter (see Libreoffice docs about filter)
      let pdfBuf = await libre.convertAsync(docxBuf, ext, undefined);
      const outputPath = path.join(
        __dirname,
        `./output/${key.split(".").slice(0, -1).join(".")}${ext}`
      );

      // Read pdf file
      // Here in done you have pdf file which you can save or transfer in another stream
      await fs.promises.writeFile(outputPath, pdfBuf);
      await fs.promises.unlink(filePath);
      let pdf_file_name = `${Date.now() + "_" + path.basename(outputPath)}`;
      await uploadToS3(pdf_file_name, pdfBuf);
      fs.promises.unlink(outputPath);
      // await getPdf()
    }
    let docBucket = process.env.SplitBucket;

    // Upload pdf into S3 Bucket
    const uploadToS3 = async (fileName, pdfBytes) => {
      let pdf_params = {
        Bucket: docBucket,
        Key: fileName,
        Body: pdfBytes,
      };
      await s3.upload(pdf_params).promise();
      let pdf_url = await getPdf(fileName);
    };
    main().catch(function (err) {
      console.log(`Error converting file: ${err}`);
    });

    async function getPdf(pdf_file_name) {
      let getpdf_params = {
        Bucket: docBucket,
        Key: pdf_file_name,
      };

      // let pdf_file = await s3.getObject(getpdf_params).promise();
      let pdf_url = await s3.getSignedUrl(
        "getObject",
        getpdf_params,
        async function (err, url) {
          if (err) {
            res.status(500).json({ message: "Error in generating pdf url" });
            console.error(err);
          } else {
            // Update the PostgreSQL database with the pdf URL
            let response = await pool.query(
              `UPDATE inbox SET pdf_url=$1 WHERE file_id=${id}`,
              [url]
            );
            res.status(200).json({ url: url, fileName: pdf_file_name });
          }
        }
      );
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error });
  }
};
router.get("/getdocument/:file_id", get_document);

// Get document list
const getList = async (req, res) => {
  try {
    let documents_list = await s3.listObjectsV2({ Bucket: BUCKET }).promise();
    let list = [];
    let result = [];
    documents_list = documents_list.Contents.map(async (item, index) => {
      let allowed_format = ["docx"];
      list.push(item.Key);
      const file_extension = item.Key.slice(
        ((item.Key.lastIndexOf(".") - 1) >>> 0) + 2
      );
      if (allowed_format.includes(file_extension)) {
        if (!item) {
          return;
        }
        await pool.query(
          "SELECT * FROM inbox where file_name=$1",
          [item.Key],
          async (err, res) => {
            if (err) {
              console.log(err);
            }
            if (res.rowCount == 0) {
              await pool.query(
                "INSERT INTO inbox (file_id, file_name, is_draft, completed_type, file_language, status, updated_by, updated_dt) VALUES ($1, $2,$3,$4, $5,$6, $7,$8)",
                [
                  index + Date.now(),
                  item.Key,
                  true,
                  false,
                  "English",
                  "In Progress",
                  item.Owner,
                  item.LastModified,
                ]
              );
            } else {
              // listDocx = await pool.query("SELECT * FROM inbox");
              // console.log(listDocx);
              // result.push(listDocx.rows);
            }
          }
        );
      }
    });
    res.status(200).send(list);
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

const getDocxList = async (req, res) => {
  try {
    let docs = await pool.query("SELECT * FROM inbox");
    console.log(docs);
    res.status(200).json(docs.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Getting List went wrong" });
  }
};
router.get("/listdocx", getDocxList);

let pool = require("./database");
const e = require("express");
// const { data } = require("cheerio/lib/api/attributes");

const postTranslatedText = async (req, res) => {
  const { file_id, page_id, ...data } = req.body;

  try {
    const { rowCount } = await pool.query(
      "SELECT * FROM text_translation WHERE file_id=$1 AND page_id=$2",
      [file_id, page_id]
    );
    if (rowCount > 0) {
      // If the record exists, update it with the PUT request
      const updateQuery = await pool.query(
        "UPDATE text_translation SET translated_text=$1, is_draft=$2, is_submitted=$3,last_updated_dt=$4, last_updated_by=$5 WHERE file_id=$6 AND page_id=$7 RETURNING *",
        [
          data.translated_text,
          data.is_draft,
          data.is_submitted,
          data.last_updated_dt,
          data.last_updated_by,
          file_id,
          page_id,
        ]
      );
      res.status(200).json({ updateQuery });
    } else {
      let addTransalation = await pool.query(
        "INSERT INTO text_translation (file_id, page_id,translated_text, is_draft,  is_submitted,last_updated_dt,  last_updated_by) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
        [
          file_id,
          page_id,
          data.translated_text,
          data.is_draft,
          data.is_submitted,
          data.last_updated_dt,
          data.last_updated_by,
        ]
      );
      res.status(201).send(addTransalation.rows[0]);
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Posting text went wrong" });
  }
};
router.post("/translation", postTranslatedText);

const GetTranslationText = async (req, res) => {
  try {
    const { file_id, page_id } = req.query;

    const TranslationText = await pool.query(
      "SELECT * FROM text_translation WHERE file_id=$1 AND page_id=$2 ",
      [file_id, page_id]
    );
    if (TranslationText.rows.length > 0) {
      res.status(200).send(TranslationText.rows[0]);
    } else {
      res.status(200).send("");
    }
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Something went wrong while getting data" });
  }
};
router.get("/translation", GetTranslationText);

// Get Invidual File Data from DB
const GetFileData = async (req, res) => {
  try {
    const { file_id } = req.query;
    // console.log(file_id);
    const FileData = await pool.query(
      // "SELECT * FROM text_translation INNER JOIN inbox ON text_translation.file_id=inbox.file_id  WHERE inbox.file_id=$1",
      "SELECT * FROM text_translation WHERE file_id=$1",
      [file_id]
    );
    if (FileData.rows.length > 0) {
      res.status(200).json(FileData);
    } else {
      res.status(200).send("");
    }
  } catch (error) {
    console.log(error);
    res
      .status(200)
      .json({ message: "Somthing went erong while getting File Data" });
  }
};
router.get("/getfiledata", GetFileData);

app.listen(PORT, () => {
  console.log(`Web server started in ${PORT}`);
});
