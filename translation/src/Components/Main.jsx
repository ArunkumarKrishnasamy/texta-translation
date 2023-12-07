import axios from "axios";
import { Dropdown } from "bootstrap";
import React, { useEffect, useState, useRef } from "react";
import { Document, Page, usePageContext } from "react-pdf";
import { pdfjs } from "react-pdf";
import ReactQuill, { Quill } from "react-quill";
// import { Quill, Delta as DeltaType } from "quill";
import "react-quill/dist/quill.snow.css";
import { Link, useParams } from "react-router-dom";

function Main() {
  const [pdfData, setpdfData] = useState();
  const [pdfURL, setpdfURL] = useState("");
  const [doctitle, setDocTitle] = useState("Translation.pdf");
  const params = useParams();
  let file_id = parseInt(params.file_id);
  var Translation = "";

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

  var modules = {
    toolbar: toolbarOptions,
  };

  const getDoc = async () => {
    try {
      let textdoc = await axios.get(
        `http://localhost:3002/getdocument/${params.file_id}`
      );
      setpdfData(textdoc.data);
      setpdfURL(textdoc.data.url);
      setDocTitle(textdoc.data.fileName);
    } catch (error) {
      alert("error");
      console.error(error);
    }
  };

  const [TranslationText, setTranslationText] = useState("");
  const [triggerRerender, setTriggerRerender] = useState(false);
  const [disableButton, setDisableButton] = useState(false);
  const [file_data, setFileData] = useState();
  const [Inprogress, setInprogress] = useState();
  const [Reviewlist, setReviewlist] = useState();
  const [pendingValue, setPendingValue] = useState();

  const getFileData = async () => {
    try {
      let Arrayfile_data = await axios.get(
        `http://localhost:3002/getfiledata?file_id=${file_id}`
      );
      await setFileData(Arrayfile_data);
    } catch (error) {
      console.error(error);
      alert("Error in getting file Data");
    }
  };
  const GetStatusBar = (file_data) => {
    // console.log(file_data.data.rows);
    if (file_data.data.rows.length > 0) {
      var FilterData = file_data.data.rows;
      console.log(FilterData);
      var Inprogresslist = FilterData.filter(
        (obj) => obj.is_draft == true && obj.is_submitted == false
      );
      console.log(Inprogresslist.length);
      setInprogress(Inprogresslist.length);
      var pendinglist = FilterData.filter(
        (obj) => obj.is_draft == false && obj.is_submitted == false
      );
      setPendingValue(pendinglist.length);
      var ReadyForReviewList = FilterData.filter(
        (obj) => obj.is_submitted == true && obj.is_draft == false
      );
      setReviewlist(ReadyForReviewList.length);

      console.log(pendinglist.length);
      console.log(ReadyForReviewList.length);
    } else {
      FilterData = file_data.data.rows;
      console.log(FilterData);
    }
    // else {
    //   setInprogress(Inprogresslist.length);
    //   setPendingValue(pendinglist.length);
    //   setReviewlist(ReadyForReviewList.length);
    // }
  };
  const [isReadOnly, setIsReadOnly] = useState(false);
  const getTranslationText = async (pageid) => {
    // var file = fileid;
    var page = `${file_id}${pageid}`;

    let translation_text = await axios.get(
      `http://localhost:3002/translation?file_id=${file_id}&&page_id=${page}`
    );
    // console.log(translation_text);
    if (translation_text.data.translated_text) {
      let EditorDatafromDB = JSON.parse(translation_text.data.translated_text);
      // let Editordata = translation_text.data.translated_text;
      // console.log(translation_text.data);
      setTranslationText(EditorDatafromDB);
      setIsReadOnly(translation_text.data.is_submitted);
    } else {
      setTranslationText("");
    }
  };
  useEffect(() => {
    async function getData() {
      await getDoc();
      await getTranslationText(pageNumber);
      // await getFileData();
      const getFileData = await axios.get(
        `http://localhost:3002/getfiledata?file_id=${file_id}`
      );
      console.log(getFileData);
      setFileData(getFileData);
      GetStatusBar(getFileData);
    }
    getData();
  }, [triggerRerender]);
  const MoveToPrevPage = async (pageNumber) => {
    if (pageNumber > 1) {
      setPageNumber(pageNumber - 1);
      await getTranslationText(pageNumber - 1);
      // setTriggerRerender(!triggerRerender);
      // setIsReadOnly(false);
    } else {
      setPageNumber(1);
      await getTranslationText(pageNumber);
    }
  };
  const MoveToNextPage = async (pageNumber) => {
    if (numPages > pageNumber) {
      setPageNumber(pageNumber + 1);
      await getTranslationText(pageNumber + 1);
      // setTriggerRerender(!triggerRerender);
    } else {
      setPageNumber(numPages);
      await getTranslationText(pageNumber);
    }
  };

  const EditedText = useRef(""); // initial value
  // const [isDraft, setIsDraft] = useState(false);
  // const [isSubmitted, setIsSubmitted] = useState(false);

  // const [EditorText, setEditorText] = useState();
  const setEditedData = async () => {
    setTranslationText(Translation);
    EditedText.current = Translation;
    // setIsDraft(true);
    // setIsSubmitted(false);
    // console.log(Translation);
    console.log(EditedText.current);
  };

  const HandleSaveDraft = async (content, delta, source, editor) => {
    await setEditedData();
    try {
      console.log(Translation);

      const response = await axios.post("http://localhost:3002/translation", {
        file_id: file_id,
        page_id: `${file_id}${pageNumber}`,
        translated_text: EditedText.current,
        is_draft: true,
        is_submitted: false,
        last_updated_dt: new Date(),
        last_updated_by: "User",
      });
      if (response.status == 200 || 201) {
        // setIsDraft(true);
        // setIsSubmitted(false);
        setTranslationText(EditedText.current);
        setIsReadOnly(false);
        setDisableButton(false);
        setTriggerRerender(!triggerRerender);
      }
    } catch (error) {
      console.error(error);
      // alert("Error happened while posting translation text");
    }
  };

  const HandleTextSubmit = async (content, delta, source, editor) => {
    await setEditedData();
    try {
      console.log(Translation);
      const response = await axios.post("http://localhost:3002/translation", {
        file_id: file_id,
        page_id: `${file_id}${pageNumber}`,
        translated_text: TranslationText,
        is_draft: false,
        is_submitted: true,
        last_updated_dt: new Date(),
        last_updated_by: "User",
      });
      if (response.status == 200 || 201) {
        // setIsDraft(false);
        // setIsSubmitted(true);
        setIsReadOnly(true);
        setDisableButton(true);
        setTriggerRerender(!triggerRerender);
      }
    } catch (error) {
      console.error(error);
      // alert("Error happened while posting translation text");
    }
  };

  const OnTextChange = async (content, delta, source, editor) => {
    // setEditorText(Editordata);
    let deltaText = editor.getContents();
    let jsonDelta = JSON.stringify(deltaText);
    Translation = jsonDelta;
    console.log(Translation);
    // setTranslationText(jsonDelta);
    // console.log(jsonDelta);
    // setEditorText(jsonDelta);
  };

  // let filterData = file_data.filter((obj) => obj.is_draft === true);
  return (
    <div className="trans_main">
      <div className="title_bar">
        <Link to={"/"}>
          <div className="document_title">
            <span class="arrowback material-symbols-outlined">arrow_back</span>
            <span className="body_text">
              {" "}
              {doctitle.substring(0, doctitle.lastIndexOf("."))}
            </span>
          </div>
        </Link>
        <div className="right_title">
          <div className="draft_btn">
            <span class="material-symbols-outlined">draft</span>
            <button
              className="body_text"
              onClick={HandleSaveDraft}
              disabled={disableButton}
            >
              SAVE DRAFT{" "}
            </button>
          </div>
          <div className="save_btn">
            <span class="material-symbols-outlined">save</span>
            <button
              className="body_text"
              onClick={HandleTextSubmit}
              // disabled={disableButton}
            >
              SUBMIT
            </button>
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
        <ReactQuill
          theme="snow"
          value={TranslationText}
          onChange={OnTextChange}
          className="sourcedoc"
          modules={modules}
          id="editor"
          placeholder={"Write something here..."}
          readOnly={isReadOnly}
        />
        {/* <ReactQuill
          theme="snow"
          // value={TranslationText}
          id="editor"
          className="sourcedoc"
          // modules={quill}
          // onChange={OnTextChange}
        /> */}
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

        {/* {console.log(file_data.rows)} */}
        {/* {console.log(filterData)} */}
        {/* {let DraftCount = file_data.rows.map(()=>{})
        } */}
        {/* {let  RowCount= file_data.map((obj) => {
          obj.is_draft == true
        })} */}
        <div className="right_footer">
          <div className="fileStatus">{`Pending :${pendingValue}`}</div>
          <div className="fileStatus">{`In progress: ${Inprogress}`}</div>
          <div className="fileStatus">{`Ready for Review: ${Reviewlist}`}</div>
          <div className="fileStatus">{`Approved :0`}</div>
        </div>
      </div>
    </div>
  );
}

export default Main;
