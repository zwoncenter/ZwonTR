import "../App.scss";
import { Form, Table, Row, Col, Button, Badge, InputGroup, FormControl } from "react-bootstrap";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect } from "react";
import axios from "axios";

function StudentAdd(props) {
  const history = useHistory();
  const [stuDB, setstuDB] = useState(props.existstuDB);
  const [inputProgram, setinputProgram] = useState("");

  return (
    <div className="">
      <h1 className="fw-bold">학생 DB 조회/변경 </h1>
      <Button
        type="button"
        onClick={() => {
          console.log(stuDB);
        }}
      >
        stuDB 체크
      </Button>
      <Form className="stuDB-form">
        <h3> 생활정보 </h3>
        <Form.Group as={Row} className="mb-3 mt-3 p-1">
          <Form.Label column sm="2">
            이름
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="text"
              defaultValue={stuDB ? stuDB.이름 : null}
              onChange={(e) => {
                const newstuDB = JSON.parse(JSON.stringify(stuDB));
                newstuDB.이름 = e.target.value;
                setstuDB(newstuDB);
              }}
            />
          </Col>
        </Form.Group>
        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">
            나이
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="number"
              defaultValue={stuDB ? stuDB.나이 : null}
              onChange={(e) => {
                const newstuDB = JSON.parse(JSON.stringify(stuDB));
                newstuDB.나이 = parseInt(e.target.value);
                setstuDB(newstuDB);
              }}
            />
          </Col>
        </Form.Group>
        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">
            목표취침
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="time"
              defaultValue={stuDB ? stuDB.생활학습목표.취침 : null}
              onChange={(e) => {
                const newstuDB = JSON.parse(JSON.stringify(stuDB));
                newstuDB.생활학습목표.취침 = e.target.value;
                setstuDB(newstuDB);
              }}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">
            목표기상
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="time"
              defaultValue={stuDB ? stuDB.생활학습목표.기상 : null}
              onChange={(e) => {
                const newstuDB = JSON.parse(JSON.stringify(stuDB));
                newstuDB.생활학습목표.기상 = e.target.value;
                setstuDB(newstuDB);
              }}
            />
          </Col>
        </Form.Group>
        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">
            목표등원
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="time"
              defaultValue={stuDB ? stuDB.생활학습목표.등원 : null}
              onChange={(e) => {
                const newstuDB = JSON.parse(JSON.stringify(stuDB));
                newstuDB.생활학습목표.등원 = e.target.value;
                setstuDB(newstuDB);
              }}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">
            목표귀가
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="time"
              defaultValue={stuDB ? stuDB.생활학습목표.귀가 : null}
              onChange={(e) => {
                const newstuDB = JSON.parse(JSON.stringify(stuDB));
                newstuDB.생활학습목표.귀가 = e.target.value;
                setstuDB(newstuDB);
              }}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">
            목표학습
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="number"
              defaultValue={stuDB ? stuDB.생활학습목표.학습 : null}
              step="0.1"
              min="0"
              onChange={(e) => {
                const newstuDB = JSON.parse(JSON.stringify(stuDB));
                newstuDB.생활학습목표.학습 = parseFloat(parseFloat(e.target.value).toFixed(1));
                setstuDB(newstuDB);
              }}
            />
          </Col>
        </Form.Group>
        <h3 className="mt-5">진행중교재 </h3>
        <Table striped bordered hover className="mt-3">
          <thead>
            <tr>
              <th width="15%">과목</th>
              <th>교재명</th>
              <th width="15%">총교재량</th>
              <th width="17%">총교재량숫자</th>
              <th width="15%">최근진도</th>
              <th width="60px"></th>
            </tr>
          </thead>
          <tbody>
            {stuDB
              ? stuDB.진행중교재.map(function (a, i) {
                  return (
                    <tr key={i}>
                      <td>
                        <Form.Select
                          size="sm"
                          onChange={(e) => {
                            var newstuDB = JSON.parse(JSON.stringify(stuDB));
                            newstuDB.진행중교재[i].과목 = e.target.value;
                            setstuDB(newstuDB);
                          }}
                        >
                          <option>{a.과목 ? a.과목 : "선택"}</option>
                          <option value="국어">국어</option>
                          <option value="수학">수학</option>
                          <option value="영어">영어</option>
                          <option value="탐구">탐구</option>
                        </Form.Select>
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="ex)독사, 기탄수학 등"
                          defaultValue={a.교재}
                          className="inputText"
                          onChange={(e) => {
                            var newstuDB = JSON.parse(JSON.stringify(stuDB));
                            newstuDB.진행중교재[i].교재 = e.target.value;
                            setstuDB(newstuDB);
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="ex)100p, 250문제"
                          defaultValue={a.총교재량}
                          className="inputText"
                          onChange={(e) => {
                            var newstuDB = JSON.parse(JSON.stringify(stuDB));
                            newstuDB.진행중교재[i].총교재량 = e.target.value;
                            setstuDB(newstuDB);
                          }}
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          placeholder="ex)100, 250"
                          defaultValue={a.총교재량숫자 !== 0 ? a.총교재량숫자 : null}
                          className="inputText"
                          onChange={(e) => {
                            var newstuDB = JSON.parse(JSON.stringify(stuDB));
                            newstuDB.진행중교재[i].총교재량숫자 = parseInt(e.target.value);
                            setstuDB(newstuDB);
                          }}
                        />
                      </td>

                      <td>
                        <input
                          type="number"
                          placeholder="ex)70, 100"
                          defaultValue={a.최근진도 !== 0 ? a.최근진도 : null}
                          className="inputText"
                          onChange={(e) => {
                            var newstuDB = JSON.parse(JSON.stringify(stuDB));
                            newstuDB.진행중교재[i].최근진도 = parseInt(e.target.value);
                            setstuDB(newstuDB);
                          }}
                        />
                      </td>
                      <td>
                        <button
                          className="btn btn-delete"
                          type="button"
                          onClick={() => {
                            if (i > -1) {
                              var newstuDB = JSON.parse(JSON.stringify(stuDB));
                              newstuDB.진행중교재.splice(i, 1);
                              setstuDB(newstuDB);
                            }
                          }}
                        >
                          x
                        </button>
                      </td>
                    </tr>
                  );
                })
              : null}

            <tr>
              <td colSpan={6}>
                {" "}
                <button
                  className="btn btn-dark"
                  type="button"
                  onClick={() => {
                    var newstuDB = JSON.parse(JSON.stringify(stuDB));
                    newstuDB.진행중교재.push({
                      과목: "",
                      교재: "",
                      총교재량: "",
                      총교재량숫자: 0,
                      최근진도: 0,
                    });
                    setstuDB(newstuDB);
                  }}
                >
                  +
                </button>
              </td>
            </tr>
          </tbody>
        </Table>

        <div>
          <h3 className="mt-5">프로그램 종류 </h3>
          <h4 className="mt-3">
            {stuDB
              ? stuDB.프로그램분류.map(function (a, i) {
                  return (
                    <Badge pill bg="success" className="me-1" key={i}>
                      {a}
                    </Badge>
                  );
                })
              : null}
          </h4>
          <InputGroup className="mt-3 mb-3" style={{ maxWidth: "500px", margin: "auto" }}>
            <FormControl
              id="inputProgram"
              placeholder="ex) 동기부여 등의 해당 학생의 프로그램"
              onChange={(e) => {
                setinputProgram(e.target.value);
              }}
            />
            <Button
              className="btn-secondary"
              onClick={() => {
                const newstuDB = JSON.parse(JSON.stringify(stuDB));
                newstuDB.프로그램분류.push(inputProgram);
                setstuDB(newstuDB);
                document.querySelector("#inputProgram").value = "";
              }}
            >
              +
            </Button>
          </InputGroup>
        </div>

        <Button
          className="mt-4 fs-4"
          onClick={() => {
            if (window.confirm(`${stuDB.이름} 학생의 DB를 수정하시겠습니까?`)) {
              axios
                .put("/api/StudentEdit", stuDB)
                .then(function (response) {
                  window.alert("수정되었습니다");
                })
                .catch(function (err) {
                  window.alert("저장에 실패했습니다 개발/데이터 팀에게 문의해주세요");
                })
                .then(function () {
                  history.push("/studentList");
                });
            }
          }}
        >
          {" "}
          학생 DB 수정
        </Button>
      </Form>
    </div>
  );
}

export default StudentAdd;
