import "../App.scss";
import { Form, Table, Row, Col, Button, Badge, InputGroup, FormControl } from "react-bootstrap";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect } from "react";
import axios from "axios";

function StudentAdd(props) {
  const writeform = {
    이름: "",
    나이: 0,
    생활학습목표: {
      취침: "00:00",
      기상: "08:00",
      등원: "10:00",
      귀가: "19:00",
      학습: 0,
    },
    진행중교재: [],
    프로그램분류: ["자기인식", "진로탐색", "헬스", "외부활동"],
  };

  const [stuDB, setstuDB] = useState(writeform);
  const [inputProgram, setinputProgram] = useState("");

  return (
    <div className="">
      <h1 className="fw-bold">학생 DB 신규 작성 </h1>
      <Button
        type="button"
        onClick={() => {
          console.log(stuDB);
        }}
      >
        stuDB 체크
      </Button>
      <Form className="stuDB-form">
        <h3>생활정보 </h3>
        <Form.Group as={Row} className="mb-3 mt-3 p-1">
          <Form.Label column sm="2">
            이름
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="text"
              placeholder="OOO"
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
              placeholder="17"
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
              defaultValue="00:00"
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
              defaultValue="08:00"
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
              defaultValue="12:00"
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
              defaultValue="19:00"
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
              placeholder="ex) 1.5"
              step="0.1"
              onChange={(e) => {
                const newstuDB = JSON.parse(JSON.stringify(stuDB));
                newstuDB.생활학습목표.학습 = parseFloat(e.target.value);
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
            {stuDB.진행중교재.map(function (a, i) {
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
                      <option>선택</option>
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
                      placeholder={a.최근진도}
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
            })}

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
            {stuDB.프로그램분류.map(function (a, i) {
              return (
                <Badge pill bg="success" className="me-1" key={i}>
                  {a}
                </Badge>
              );
            })}
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
      </Form>
    </div>
  );
}

export default StudentAdd;
