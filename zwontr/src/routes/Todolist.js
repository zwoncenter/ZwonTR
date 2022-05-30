import "./Todolist.css";
import { Form, Button, Card, ListGroup, Table, Modal, Row, Col } from "react-bootstrap";
import { useHistory, useParams } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import TimePicker from "react-time-picker";
import menuarrow from "../next.png";

function Todolist() {
  let history = useHistory();
  const today = new Date().toISOString().split("T")[0];
  const [date, setdate] = useState(new Date().toISOString().split("T")[0]);
  const [initiallist, setinitiallist] = useState([]);
  const [todoList, settodoList] = useState([]);
  const [managerList, setmanagerList] = useState([]);

  useEffect(async () => {
    const newtodoList = await axios
      .get(`/api/Todolist`)
      .then((result) => {
        if (result.data === "로그인필요") {
          window.alert("로그인이 필요합니다");
          return history.push("/");
        }
        return result.data;
      })
      .catch((err) => {
        return err;
      });
    console.log(newtodoList);
    setinitiallist(newtodoList);
    settodoList(newtodoList);
    const newmanagerList = await axios
      .get("/api/managerList")
      .then((result) => {
        return result["data"];
      })
      .catch((err) => {
        return err;
      });
    setmanagerList(newmanagerList);
  }, []);

  return (
    <div>
      <div className="trEdit-background">
        <h3>To-Do list</h3>
        <Button
          className="btn-commit btn-save"
          onClick={() => {
              if (window.confirm("저장하시겠습니까?")){
                axios
                    .put("/api/Todolist/edit", todoList)
                    .then(function (result) {
                        if (result.data === true) {
                        window.alert("저장되었습니다.");
                        history.push("/Todolist");
                        } else if (result.data === "로그인필요") {
                        window.alert("로그인이 필요합니다.");
                        return history.push("/");
                        } else {
                        console.log(result.data);
                        window.alert(result.data);
                        }
                    })
                    .catch(function (err) {
                        console.log("저장 실패 : ", err);
                        window.alert(err);
                    });
              }  
                }}
        >
          TO-DO 저장
        </Button>

        <Table striped hover size="sm" className="mt-3">
          <thead>
            <tr>
              <th width="7%">작성자</th>
              <th width="7%">작성일자</th>
              <th width="7%">마감일자</th>
              <th width="20%">업무내용</th>
              <th width="7%">담당매니저</th>
              <th width="20%">진행상황</th>
              <th>피드백</th>
              <th width="2%">완료</th>
              <th width="2%"></th>
            </tr>
          </thead>
          <tbody>
            {todoList.map(function (a, i) {
              return (
                <tr key={i}>
                  <td>
                    <Form.Select
                      size="sm"
                      value={a.작성자}
                      onChange={(e) => {
                        const newtodoList = [...todoList];
                        newtodoList[i]["작성자"] = e.target.value;
                        settodoList(newtodoList);
                      }}
                    >
                      <option value="선택">선택</option>
                      {managerList.map(function (b, j) {
                        return (
                          <option value={b} key={j}>
                            {b}
                          </option>
                        );
                      })}
                    </Form.Select>
                  </td>
                  <td>
                  <input
                  type="date"
                  value={a.작성일자}
                  className="w-100"
                  onChange={(e) => {
                    const newtodoList = [...todoList];
                      newtodoList[i]["작성일자"] = e.target.value;
                      settodoList(newtodoList);
                  }}
                />
                  </td>
                  <td>
                  <input
                  type="date"
                  value={a.마감일자}
                  className="w-100"
                  onChange={(e) => {
                    const newtodoList = [...todoList];
                      newtodoList[i]["마감일자"] = e.target.value;
                      settodoList(newtodoList);
                  }}
                />
                  </td>
                  <td>
                    <textarea
                      className="textArea"
                      rows="3"
                      value={a.업무내용}
                      onChange={(e) => {
                        const newtodoList = [...todoList];
                        newtodoList[i]["업무내용"] = e.target.value;
                        settodoList(newtodoList);
                      }}
                    ></textarea>
                  </td>
                  <td>
                    <Form.Select
                      size="sm"
                      value={a.담당매니저}
                      onChange={(e) => {
                        const newtodoList = [...todoList];
                        newtodoList[i]["담당매니저"] = e.target.value;
                        settodoList(newtodoList);
                      }}
                    >
                      <option value="선택">선택</option>
                      {managerList.map(function (b, j) {
                        return (
                          <option value={b} key={j}>
                            {b}
                          </option>
                        );
                      })}
                    </Form.Select>
                  </td>
                  <td>
                    <textarea
                      className="textArea"
                      rows="3"
                      value={a.진행상황}
                      onChange={(e) => {
                        const newtodoList = [...todoList];
                        newtodoList[i]["진행상황"] = e.target.value;
                        settodoList(newtodoList);
                      }}
                    ></textarea>
                  </td>

                  <td>
                    <textarea
                      className="textArea"
                      rows="3"
                      value={a.피드백}
                      onChange={(e) => {
                        const newtodoList = [...todoList];
                        newtodoList[i]["피드백"] = e.target.value;
                        settodoList(newtodoList);
                      }}
                    ></textarea>
                  </td>
                  <td>
                    <Form.Check
                      checked={a.완료}
                      className="border-bottom"
                      type="checkbox"
                      onChange={(e) => {
                        const newtodoList = [...todoList];
                        newtodoList[i]["완료"] = e.target.checked;
                        settodoList(newtodoList);
                      }}
                    />
                  </td>
                  <td>
                    <button
                      className="btn btn-delete"
                      onClick={() => {
                        if (i > -1) {
                          if (window.confirm("삭제하시겠습니까?")) {
                            const newtodoList = [...todoList];
                            newtodoList.splice(i, 1);
                            settodoList(newtodoList);
                          }
                        }
                      }}
                    >
                      <strong>x</strong>
                    </button>
                  </td>
                </tr>
              );
            })}
            <tr>
              <td colSpan={7}>
                {" "}
                <button
                  className="btn btn-add program-add"
                  onClick={() => {
                    const newtodoList = [...todoList];
                    newtodoList.push({
                      작성자: "선택",
                      작성일자: today,
                      마감일자: today ,
                      업무내용: "",
                      담당매니저: "선택",
                      진행상황: "",
                      완료: false,
                      피드백: "",
                    });
                    settodoList(newtodoList);
                  }}
                >
                  <strong>+</strong>
                </button>
              </td>
            </tr>
          </tbody>
        </Table>
      </div>
    </div>
  );
}

export default Todolist;
