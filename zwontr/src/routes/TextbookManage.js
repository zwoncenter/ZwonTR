import "./TextbookManage.css";
import { Form, Table, Row, Col, Button, Badge, InputGroup, FormControl, Modal } from "react-bootstrap";
import { useHistory, useParams } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect } from "react";
import {FaCheck, FaSistrix, FaTrash} from "react-icons/fa"
import axios from "axios";

function TextbookManage() {
  // history
  const history = useHistory();

  // 날짜 관련 코드
  const now = new Date(); // 현재 시간
  const utcNow = now.getTime() + now.getTimezoneOffset() * 60 * 1000;
  const koreaTimeDiff = 9 * 60 * 60 * 1000;
  const koreaNow = new Date(utcNow + koreaTimeDiff);
  const today = koreaNow.toISOString().split("T")[0];

  // TextbookManage 관련 코드
  const [textbookList, settextbookList] = useState([]);
  const [lastRevise, setlastRevise] = useState("");
  const [subjectOn, setsubjectOn] = useState(false);
  const [ganadaOn, setganadaOn] = useState(false);

  // 교재 검색 관련 코드
  const [chosenSubject, setchosenSubject] = useState("");
  const [inputQuery, setinputQuery] = useState("");
  const [search, setsearch] = useState([]);
  function textbookSearch() {
    if (chosenSubject.length === 0 && inputQuery.length === 0) {
      window.alert("과목 또는 교재명을 입력해주세요");
      return;
    }
    setsearch(
      textbookList.filter((textbook) => {
        if (chosenSubject.length === 0 && inputQuery.length !== 0) {
          return textbook["교재"].includes(inputQuery);
        } else if (chosenSubject.length !== 0 && inputQuery.length === 0) {
          return textbook["과목"] === chosenSubject;
        } else {
          return textbook["과목"] === chosenSubject && textbook["교재"].includes(inputQuery);
        }
      })
    );
  }

  // 인증 Modal 관련 코드
  const [show, setShow] = useState(true);
  const [inputPW, setinputPW] = useState("");
  function checkPassword() {
    const result = inputPW == "ryworhksfl";
    if (result) {
      setShow(false);
    } else {
      window.alert("비밀번호가 일치하지 않습니다.");
    }
  }


  // Add, Delete, Change 함수 코드
  function addOne(newtextbook) {
    const newtextbookList = [...textbookList];
    newtextbookList.push(newtextbook);
    settextbookList(newtextbookList);
  }

  function deleteOne(index) {
    if (window.confirm("삭제하시겠습니까?")) {
      const newtextbookList = [...textbookList];
      newtextbookList.splice(index, 1);
      settextbookList(newtextbookList);
    }
  }

  function changeOne(index, category, input) {
    const newtextbookList = [...textbookList];
    newtextbookList[index][category] = input;
    settextbookList(newtextbookList);
  }

  useEffect(async () => {
    const existDocument = await axios
      .get(`/api/Textbook`)
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
    setlastRevise(existDocument["날짜"]);
    settextbookList(existDocument["textbookList"]);
  }, []);

  return (
    <div className="stuedit-background">
      <Modal show={show} onHide={checkPassword} size="lg" backdrop="static" aria-labelledby="contained-modal-title-vcenter" centered>
        <Modal.Header>
          <Modal.Title>비밀번호 입력</Modal.Title>
        </Modal.Header>
        <Modal.Body className="text-center align-middle">
          <input
            type="password"
            onChange={(e) => {
              setinputPW(e.target.value);
            }}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                checkPassword();
              }
            }}
          />
          <Button className="btn btn-enter" onClick={checkPassword}>
          <FaCheck></FaCheck>
          </Button>
        </Modal.Body>

      </Modal>

      <h2 className="fw-bold text-center">
        <strong> 교재 관리 페이지</strong>
      </h2>
      <p>최근 수정일 : {lastRevise}</p>



      <div className="stuDB-form">
        {/* 교재 검색  */}
      <div className="stuedit-cat-box">
          <h3 className="stuedit-cat-title mb-4">
            <strong>[ 교재 검색 ]</strong>
          </h3>
          <div className="row">
            <div className="col-sm-2">
              <Form.Select
                value={chosenSubject}
                onChange={(e) => {
                  setchosenSubject(e.target.value);
                }}
              >
                <option value="">선택</option>
                <option value="국어">국어</option>
                <option value="수학">수학</option>
                <option value="영어">영어</option>
                <option value="탐구">탐구</option>
                <option value="강의">강의</option>
              </Form.Select>
            </div>
            <div className="col-sm-9">
              <FormControl
                placeholder="교재명"
                onChange={(e) => {
                  setinputQuery(e.target.value);
                }}
                onKeyPress={(e) => {
                  if (e.key === "Enter") {
                    textbookSearch();
                  }
                }}
              />
            </div>

            <div className="col-sm-1">
              <Button className="btn-secondary program-add" onClick={textbookSearch} type="button">
                <strong>
                  {" "}
                  <FaSistrix />
                </strong>
              </Button>
            </div>
          </div>

          <Table striped hover className="mt-3">
            <thead>
              <tr>
                <th width="15%">과목</th>
                <th>교재명</th>
                <th width="20%">총교재량</th>
                <th width="20%">권장학습기간</th>
              </tr>
            </thead>
            <tbody>
              {search.map(function (a, i) {
                return (
                  <tr key={i}>
                    <td>
                      <p>{a.과목}</p>
                    </td>
                    <td>
                      <p>{a.교재}</p>
                    </td>
                    <td>
                      <p>{a.총교재량}</p>
                    </td>
                    <td>
                      <p>{a.권장학습기간} weeks</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </Table>
          <Button className="btn-del" variant="danger" onClick={() => {
            setsearch([]);
          }}>
             x
          </Button>
        </div>

        {/* 교재 목록 표 */}
        <div className="stuedit-cat-box">
          <h3 className="mb-4">
            <strong>[ 교재 ]</strong>
          </h3>
          <div className="text-end">
            <Button
              className="me-2"
              variant="success"
              onClick={() => {
                const newtextbookList = [...textbookList];
                newtextbookList.sort(function (a, b) {
                  return (+(a.과목 > b.과목) - 0.5) * (+!subjectOn - 0.5);
                });
                settextbookList(newtextbookList);
                setsubjectOn(!subjectOn);
                setganadaOn(false);
              }}
            >
              {" "}
              과목순 정렬
            </Button>
            <Button className="me-2" variant="success"
            onClick={() => {
                const newtextbookList = [...textbookList];
                newtextbookList.sort(function (a, b) {
                  return (+(a.교재 > b.교재) - 0.5) * (+!ganadaOn - 0.5);
                });
                settextbookList(newtextbookList);
                setsubjectOn(false);
                setganadaOn(!ganadaOn);
              }}>
              가나다순 정렬
            </Button>
          </div>
          
          {/* 교재 Table */}
          <Table striped hover className="mt-3">
            <thead>
              <tr>
                <th width="15%">과목</th>
                <th>교재명</th>
                <th width="20%">총교재량</th>
                <th width="18%">권장학습기간(week)</th>
                <th width="40px"></th>
              </tr>
            </thead>
            <tbody>
              {textbookList.map(function (a, i) {
                return (
                  <tr key={i}>
                    <td>
                      <Form.Select
                        size="sm"
                        value={a.과목}
                        onChange={(e) => {
                          changeOne(i, "과목", e.target.value);
                        }}
                      >
                        <option value="">선택</option>
                        <option value="국어">국어</option>
                        <option value="수학">수학</option>
                        <option value="영어">영어</option>
                        <option value="탐구">탐구</option>
                        <option value="강의">강의</option>
                      </Form.Select>
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="ex)독사, 기탄수학 등"
                        value={a.교재}
                        className="inputText"
                        onChange={(e) => {
                          changeOne(i, "교재", e.target.value);
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="ex)100p, 250문제"
                        value={a.총교재량}
                        className="inputText"
                        onChange={(e) => {
                          changeOne(i, "총교재량", e.target.value);
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        placeholder="주 단위로 입력"
                        value={a.권장학습기간}
                        className="inputText"
                        onChange={(e) => {
                          changeOne(i, "권장학습기간", e.target.value);
                        }}
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-delete"
                        type="button"
                        onClick={() => {
                          if (i > -1) {
                            deleteOne(i);
                          }
                        }}
                      >
                        <FaTrash></FaTrash>
                      </button>
                    </td>
                  </tr>
                );
              })}

              <tr>
                <td colSpan={5}>
                  {" "}
                  <button
                    className="btn btn-dark btn-add"
                    type="button"
                    onClick={() => {
                      addOne({
                        과목: "",
                        교재: "",
                        총교재량: "",
                        권장학습기간: "",
                      });
                    }}
                  >
                    <strong>+</strong>
                  </button>
                </td>
              </tr>
            </tbody>
          </Table>
        </div>

        <ul className="commit-btns">
          <Button
            variant="secondary"
            className="btn-DBcommit btn-edit"
            onClick={() => {
              if (window.confirm("저장하시겠습니까?")){
                axios
                    .put("/api/Textbook/edit", {날짜 : today, textbookList: textbookList})
                    .then(function (result) {
                        if (result.data === true) {
                        window.alert("저장되었습니다.");
                        history.push("/Textbook");
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
            <strong>저장</strong>
          </Button>
        </ul>
      </div>
    </div>
  );
}

export default TextbookManage;
