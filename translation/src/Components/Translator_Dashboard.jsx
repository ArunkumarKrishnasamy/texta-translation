import axios from "axios";
import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.css";
import { Link } from "react-router-dom";

function Translator_Dashboard() {
  const [Docxlist, setDocxlist] = useState([]);
  const GetDocxList = async () => {
    let list = await axios.get("http://localhost:3002/listdocx");
    setDocxlist(list.data);
    console.log(list);
  };

  useEffect(() => {
    GetDocxList();
  }, []);
  return (
    <div className="text-center">
      <h1>Translator_Dashboard</h1>
      <table className="table table-striped">
        <thead>
          <th>S.No</th>
          <th>Name</th>
          <th>Language</th>
          <th> Action</th>
        </thead>
        <tbody>
          {Docxlist.map((item, index) => {
            return (
              <tr key={item.file_id}>
                <td>{index + 1}</td>
                <td>{item.file_name}</td>
                <td>{item.file_language}</td>
                <td>
                  <Link to={`/translation/${item.file_id}`}>
                    <button className="btn btn-primary">Start</button>
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default Translator_Dashboard;
