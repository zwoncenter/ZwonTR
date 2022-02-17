import "../App.scss";
import { Form, Table, Row, Col, Button, Badge, InputGroup, FormControl } from "react-bootstrap";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect } from "react";
import axios from "axios";

function StudentAdd(props) {
  const history = useHistory();
  const [stuDB, setstuDB] = useState(props.existstuDB);
  const [inputProgram, setinputProgram] = useState("");

  useEffect(() => {
    const newstuDB = JSON.parse(JSON.stringify(stuDB));
    newstuDB.작성매니저 = "";
    newstuDB.작성일자 = new Date().toISOString().split("T")[0];
    setstuDB(newstuDB);
  }, []);

  return (
    <div className="">
      <h1 className="fw-bold">학생 DB 조회/변경 </h1>
      {/* <Button
        type="button"
        onClick={() => {
          console.log(stuDB);
        }}
      >
        stuDB 체크
      </Button> */}

      <Form className="stuDB-form">
        <h3 className="mb-3"> 작성매니저 / 작성일자 </h3>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">
            작성매니저
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="text"
              placeholder={`최근작성매니저 : ${props.existstuDB.작성매니저}`}
              onChange={(e) => {
                const newstuDB = JSON.parse(JSON.stringify(stuDB));
                newstuDB.작성매니저 = e.target.value;
                setstuDB(newstuDB);
              }}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">
            작성일자
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="date"
              defaultValue={stuDB.작성일자}
              onChange={(e) => {
                const newstuDB = JSON.parse(JSON.stringify(stuDB));
                newstuDB.작성일자 = e.target.value;
                setstuDB(newstuDB);
              }}
            />
          </Col>
        </Form.Group>

        <h3 className="mb-3">기본정보 </h3>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">
            이름
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="text"
              placeholder="OOO"
              defaultValue={stuDB.이름}
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
            생년월일
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="date"
              defaultValue={stuDB.생년월일}
              onChange={(e) => {
                const newstuDB = JSON.parse(JSON.stringify(stuDB));
                newstuDB.생년월일 = e.target.value;
                setstuDB(newstuDB);
              }}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">
            연락처
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="text"
              placeholder="ex) 010-1234-1234"
              defaultValue={stuDB.연락처}
              onChange={(e) => {
                const newstuDB = JSON.parse(JSON.stringify(stuDB));
                newstuDB.연락처 = e.target.value;
                setstuDB(newstuDB);
              }}
            />
          </Col>
        </Form.Group>

        <h3 className="mb-3">생활정보 </h3>

        <h5 className="mb-3">주중 목표</h5>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">
            목표취침
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="time"
              defaultValue={stuDB ? stuDB.생활학습목표.평일취침 : null}
              onChange={(e) => {
                const newstuDB = JSON.parse(JSON.stringify(stuDB));
                newstuDB.생활학습목표.평일취침 = e.target.value;
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
              defaultValue={stuDB.생활학습목표.평일기상}
              onChange={(e) => {
                const newstuDB = JSON.parse(JSON.stringify(stuDB));
                newstuDB.생활학습목표.평일기상 = e.target.value;
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
              defaultValue={stuDB.생활학습목표.평일등원}
              onChange={(e) => {
                const newstuDB = JSON.parse(JSON.stringify(stuDB));
                newstuDB.생활학습목표.평일등원 = e.target.value;
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
              defaultValue={stuDB.생활학습목표.평일귀가}
              onChange={(e) => {
                const newstuDB = JSON.parse(JSON.stringify(stuDB));
                newstuDB.생활학습목표.평일귀가 = e.target.value;
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
              defaultValue={stuDB.생활학습목표.평일학습}
              step="0.1"
              onChange={(e) => {
                const newstuDB = JSON.parse(JSON.stringify(stuDB));
                newstuDB.생활학습목표.평일학습 = parseFloat(e.target.value);
                setstuDB(newstuDB);
              }}
            />
          </Col>
        </Form.Group>

        <h5 className="mb-3">일요일 목표</h5>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">
            일요일 목표취침
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="time"
              defaultValue={stuDB.생활학습목표.일요일취침}
              onChange={(e) => {
                const newstuDB = JSON.parse(JSON.stringify(stuDB));
                newstuDB.생활학습목표.일요일취침 = e.target.value;
                setstuDB(newstuDB);
              }}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">
            일요일 목표기상
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="time"
              defaultValue={stuDB.생활학습목표.일요일기상}
              onChange={(e) => {
                const newstuDB = JSON.parse(JSON.stringify(stuDB));
                newstuDB.생활학습목표.일요일기상 = e.target.value;
                setstuDB(newstuDB);
              }}
            />
          </Col>
        </Form.Group>
        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">
            일요일 목표등원
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="time"
              defaultValue={stuDB.생활학습목표.일요일등원}
              onChange={(e) => {
                const newstuDB = JSON.parse(JSON.stringify(stuDB));
                newstuDB.생활학습목표.일요일등원 = e.target.value;
                setstuDB(newstuDB);
              }}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">
            일요일 목표귀가
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="time"
              defaultValue={stuDB.생활학습목표.일요일귀가}
              onChange={(e) => {
                const newstuDB = JSON.parse(JSON.stringify(stuDB));
                newstuDB.생활학습목표.일요일귀가 = e.target.value;
                setstuDB(newstuDB);
              }}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3">
          <Form.Label column sm="2">
            일요일 목표학습
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="number"
              defaultValue={stuDB.생활학습목표.일요일학습}
              step="0.1"
              onChange={(e) => {
                const newstuDB = JSON.parse(JSON.stringify(stuDB));
                newstuDB.생활학습목표.일요일학습 = parseFloat(e.target.value);
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
              <th width="17%">교재 시작일</th>
              <th width="17%">최근진도</th>
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
                            const regex = /[^0-9]/g;
                            newstuDB.진행중교재[i].총교재량숫자 = parseInt(e.target.value.replace(regex, ""));
                            setstuDB(newstuDB);
                          }}
                        />
                      </td>

                      <td>
                        <input
                          type="date"
                          className="inputText"
                          defaultValue={a.교재시작일}
                          onChange={(e) => {
                            var newstuDB = JSON.parse(JSON.stringify(stuDB));
                            newstuDB.진행중교재[i].교재시작일 = e.target.value;
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
                      교재시작일: "",
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

        {/* 완료된 교재 */}

        <h3 className="mt-5">완료된교재 </h3>

        <Table striped bordered hover className="mt-3">
          <thead>
            <tr>
              <th width="15%">과목</th>
              <th>교재명</th>
              <th width="15%">총교재량</th>
              <th width="17%">교재 시작일</th>
              <th width="17%">교재 종료일</th>
              <th width="60px"></th>
            </tr>
          </thead>

          <tbody>
            {stuDB.완료된교재
              ? stuDB.완료된교재.map(function (a, i) {
                  return (
                    <tr key={i}>
                      <td>
                        <Form.Select
                          size="sm"
                          onChange={(e) => {
                            var newstuDB = JSON.parse(JSON.stringify(stuDB));
                            newstuDB.완료된교재[i].과목 = e.target.value;
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
                          defaultValue={a.교재 ? a.교재 : null}
                          className="inputText"
                          onChange={(e) => {
                            var newstuDB = JSON.parse(JSON.stringify(stuDB));
                            newstuDB.완료된교재[i].교재 = e.target.value;
                            setstuDB(newstuDB);
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="ex)100p, 250문제"
                          defaultValue={a.총교재량 ? a.총교재량 : null}
                          className="inputText"
                          onChange={(e) => {
                            var newstuDB = JSON.parse(JSON.stringify(stuDB));
                            newstuDB.완료된교재[i].총교재량 = e.target.value;
                            const regex = /[^0-9]/g;
                            newstuDB.완료된교재[i].총교재량숫자 = parseInt(e.target.value.replace(regex, ""));
                            setstuDB(newstuDB);
                          }}
                        />
                      </td>

                      <td>
                        <input
                          type="date"
                          className="inputText"
                          defaultValue={a.교재시작일 ? a.교재시작일 : null}
                          onChange={(e) => {
                            var newstuDB = JSON.parse(JSON.stringify(stuDB));
                            newstuDB.완료된교재[i].교재시작일 = e.target.value;
                            setstuDB(newstuDB);
                          }}
                        />
                      </td>

                      <td>
                        <input
                          type="date"
                          className="inputText"
                          defaultValue={a.교재종료일 ? a.교재종료일 : null}
                          onChange={(e) => {
                            var newstuDB = JSON.parse(JSON.stringify(stuDB));
                            newstuDB.완료된교재[i].교재종료일 = e.target.value;
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
                              newstuDB.완료된교재.splice(i, 1);
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
                    newstuDB.완료된교재.push({
                      과목: "",
                      교재: "",
                      총교재량: "",
                      총교재량숫자: 0,
                      교재시작일: "",
                      교재종료일: "",
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
            if (stuDB.작성매니저 === "") {
              return window.alert("작성매니저가 입력되지 않았습니다.");
            } else if (stuDB.작성일자 === "") {
              return window.alert("작성일자가 입력되지 않았습니다.");
            } else if (window.confirm(`${stuDB.이름} 학생의 DB를 수정하시겠습니까?`)) {
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

        <Button
          variant="danger"
          className="ms-4   mt-4 fs-6"
          onClick={() => {
            if (window.confirm(`${stuDB.이름} 학생의 DB를 정말 삭제하시겠습니까?`)) {
              axios
                .delete(`/api/StudentDelete/${stuDB.이름}`)
                .then(function (response) {
                  window.alert("삭제되었습니다");
                })
                .catch(function (err) {
                  window.alert("삭제에 실패했습니다 개발/데이터 팀에게 문의해주세요");
                })
                .then(function () {
                  history.push("/studentList");
                });
            }
          }}
        >
          DB 삭제
        </Button>
      </Form>
    </div>
  );
}

export default StudentAdd;
