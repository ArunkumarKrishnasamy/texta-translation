import axios from "axios";
import React, { useEffect, useState } from "react";

// import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import Mydocument from "./Mydocument";
import { Document, Page } from "react-pdf";
import pdffile from "./sample.pdf";
import { pdfjs } from "react-pdf";
import ReactQuill from "react-quill";
import { Quill } from "react-quill";
import "react-quill/dist/quill.snow.css";

function Main() {
  const [pdfURL, setpdfURL] = useState("");
  const [doctitle, setDocTitle] = useState("Translate.docx");
  const [value, setValue] = useState("");

  pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.js",
    import.meta.url
  ).toString();
  const [numPages, setNumPages] = useState();
  const [pageNumber, setPageNumber] = useState(1);
  function onDocumentLoadSuccess({ numPages }) {
    setNumPages(numPages);
  }
  var toolbarOptions = [
    ["bold", "italic", "underline", "strike"], // toggled buttons
    [{ list: "ordered" }, { list: "bullet" }],
    [{ script: "sub" }, { script: "super" }], // superscript/subscript
    // [{ indent: "-1" }, { indent: "+1" }], // outdent/indent
    // [{ direction: "rtl" }], // text direction

    // [{ size: ["small", false, "large", "huge"] }], // custom dropdown
    [{ header: [1, 2, 3, 4, 5, 6, false] }],

    [{ color: [] }, { background: [] }], // dropdown with defaults from theme
    [{ font: [] }],
    [{ align: [] }],

    ["clean"], // remove formatting button
  ];
  var editor = new Quill('#editor', options);
  var modules = {
    toolbar: toolbarOptions,
  };

  const getDoc = async () => {
    try {
      let textdoc = await axios.get(
        "http://localhost:3002/getdocument/test_file.docx"
      );
      setpdfURL(textdoc.data.url);
      setDocTitle(textdoc.data.fileName);
    } catch (error) {
      alert("error");
      console.error(error);
    }
  };

  useEffect(() => {
    getDoc();
  }, []);
  const MoveToPrevPage = (pageNumber) => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1);
    } else {
      setPageNumber(1);
    }
  };
  const MoveToNextPage = (pageNumber) => {
    if (numPages > pageNumber) {
      setPageNumber(pageNumber + 1);
    } else {
      setPageNumber(numPages);
    }
  };
  const SavetoDb = () => {
    // setValue(editor.getHTML());
    console.log(value);
  };
  const OnTextChange = (content, delta, source, editor) => {
    setValue(editor.getHTML());
    let deltaText = editor.getContents();
    // let jsonDelta = JSON.stringify(deltaText);
    console.log(deltaText);
  };

  return (
    <div className="trans_main">
      <div className="title_bar">
        <div className="document_title">
          <span class="arrowback material-symbols-outlined">arrow_back</span>
          <span className="body_text"> {doctitle}</span>
        </div>
        <div className="right_title">
          <div className="draft_btn">
            <span class="material-symbols-outlined">draft</span>
            <span className="body_text"> SAVE DRAFT </span>
          </div>
          <div className="save_btn">
            <span class="material-symbols-outlined">save</span>
            <span className="body_text" onClick={SavetoDb}>
              SUBMIT
            </span>
          </div>
        </div>
      </div>
      <div className="TransMainDashboard">
        <Document
          file={pdfURL}
          className="transdoc"
          onLoadSuccess={onDocumentLoadSuccess}
          style={{ width: "100%", height: "100vh", overflow: "auto" }}
        >
          <Page
            pageNumber={pageNumber}
            renderAnnotationLayer={false}
            renderTextLayer={false}
          />
        </Document>

        {/* {pdffile && <iframe src={pdffile} className="transdoc" />} */}
        {/* <object
          data={pdffile}
          type="application/pdf"
          width="100%"
          height="100%"
          className="transdoc"
        ></object> */}
        {/* <Document file={pdffile} /> */}
        {/* <textarea ></textarea> */}
        <ReactQuill
          theme="snow"
          value={value}
          onChange={OnTextChange}
          className="sourcedoc"
          modules={modules}
          id="editor"
          placeholder={"Write something here..."}
        />
      </div>
      <div className="trans_footer">
        <div className="left_footer">
          <button
            className="docbtn"
            onClick={() => {
              MoveToPrevPage(pageNumber);
            }}
          >
            {"<<"} PREV{" "}
          </button>
          <button
            className="docbtn"
            onClick={() => {
              MoveToNextPage(pageNumber);
            }}
          >
            NEXT {">>"}
          </button>
          <span className="page">
            <button className="pagebtn">{pageNumber}</button> of
            <button className="pagebtn" style={{ backgroundColor: "#f2f2f2" }}>
              {numPages}
            </button>
          </span>
        </div>

        <div className="right_footer">
          <div className="fileStatus">Pending :{numPages - 1}</div>
          <div className="fileStatus">In progress: 1</div>
          <div className="fileStatus">Ready for Review:0</div>
          <div className="fileStatus">Approved:0</div>
        </div>
      </div>
    </div>
  );
}

export default Main;
