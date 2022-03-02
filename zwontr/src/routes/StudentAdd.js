import "./StudentAddEdit.scss";
import { Form, Table, Row, Col, Button, Badge, InputGroup, FormControl } from "react-bootstrap";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect } from "react";
import axios from "axios";

function StudentAdd(props) {
  const history = useHistory();
  const writeform = {
    작성매니저: "",
    작성일자: "",
    이름: "",
    생년월일: "",
    연락처: "",
    생활학습목표: {
      평일취침: "00:00",
      평일기상: "08:00",
      평일등원: "10:00",
      평일귀가: "19:00",
      평일학습: 0,
      일요일취침: "00:00",
      일요일기상: "08:00",
      일요일등원: "10:00",
      일요일귀가: "19:00",
      일요일학습: 0,
    },
    큐브책: [],
    진행중교재: [],
    완료된교재: [],
    프로그램분류: ["자기인식", "진로탐색", "헬스", "외부활동", "독서", "외국어"],
  };

  const [stuDB, setstuDB] = useState(writeform);
  const [inputProgram, setinputProgram] = useState("");

  const programAdd = () => {
    const newstuDB = JSON.parse(JSON.stringify(stuDB));
    newstuDB.프로그램분류.push(inputProgram);
    setstuDB(newstuDB);
    document.querySelector("#inputProgram").value = "";
  };

  function change_depth_one(category, data) {
    const newstuDB = JSON.parse(JSON.stringify(stuDB));
    newstuDB[category] = data;
    setstuDB(newstuDB);
  }

  function change_depth_two(category1, category2, data) {
    const newstuDB = JSON.parse(JSON.stringify(stuDB));
    newstuDB[category1][category2] = data;
    setstuDB(newstuDB);
  }

  function change_depth_three(category1, category2, category3, data) {
    const newstuDB = JSON.parse(JSON.stringify(stuDB));
    newstuDB[category1][category2][category3] = data;
    setstuDB(newstuDB);
  }

  function delete_depth_one(category, index) {
    const newstuDB = JSON.parse(JSON.stringify(stuDB));
    newstuDB[category].splice(index, 1);
    setstuDB(newstuDB);
  }

  function push_depth_one(category, content) {
    const newstuDB = JSON.parse(JSON.stringify(stuDB));
    newstuDB[category].push(content);
    setstuDB(newstuDB);
  }

  return (
    <div className="stuedit-background">
      <h2 className="fw-bold text-center"><strong>학생 DB 신규 작성</strong></h2>
      <Form
        className="stuDB-form"
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <div className="stuedit-cat-box">
        <h3 className="stuedit-cat-title mb-4"><strong>[ 작성매니저 / 작성일자 ]</strong></h3>

        <Form.Group as={Row} className="mb-3 me-3 ms-3">
          <Form.Label column sm="2">
            작성매니저
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="text"
              placeholder="본명입력 : ex)유재석"
              onChange={(e) => {
                change_depth_one("작성매니저", e.target.value);
              }}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3 me-3 ms-3">
          <Form.Label column sm="2">
            작성일자
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="date"
              onChange={(e) => {
                change_depth_one("작성일자", e.target.value);
              }}
            />
          </Col>
        </Form.Group></div>

        <div className="stuedit-cat-box">
        <h3 className="stuedit-cat-title mb-4"><strong>[ 기본정보 ]</strong></h3>

        <Form.Group as={Row} className="mb-3 me-3 ms-3">
          <Form.Label column sm="2">
            이름
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="text"
              placeholder="OOO"
              onChange={(e) => {
                change_depth_one("이름", e.target.value);
              }}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3 me-3 ms-3">
          <Form.Label column sm="2">
            생년월일
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="date"
              onChange={(e) => {
                change_depth_one("생년월일", e.target.value);
              }}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3 me-3 ms-3">
          <Form.Label column sm="2">
            연락처
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="text"
              placeholder="ex) 010-1234-1234"
              onChange={(e) => {
                change_depth_one("연락처", e.target.value);
              }}
            />
          </Col>
        </Form.Group></div>

        <div className="stuedit-cat-box">
        <h3 className="stuedit-cat-title mb-4"><strong>[ 생활정보 ]</strong></h3>

        <h5 className="mb-3 mt-5"><strong>주중 목표</strong></h5>

        <Form.Group as={Row} className="mb-3 me-3 ms-3">
          <Form.Label column sm="2">
            목표취침
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="time"
              defaultValue="00:00"
              onChange={(e) => {
                change_depth_two("생활학습목표", "평일취침", e.target.value);
              }}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3 me-3 ms-3">
          <Form.Label column sm="2">
            목표기상
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="time"
              defaultValue="08:00"
              onChange={(e) => {
                change_depth_two("생활학습목표", "평일기상", e.target.value);
              }}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3 me-3 ms-3">
          <Form.Label column sm="2">
            목표등원
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="time"
              defaultValue="13:00"
              onChange={(e) => {
                change_depth_two("생활학습목표", "평일등원", e.target.value);
              }}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3 me-3 ms-3">
          <Form.Label column sm="2">
            목표귀가
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="time"
              defaultValue="19:00"
              onChange={(e) => {
                change_depth_two("생활학습목표", "평일귀가", e.target.value);
              }}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3 me-3 ms-3">
          <Form.Label column sm="2">
            목표학습
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="number"
              placeholder="ex) 1.5"
              step="0.1"
              onChange={(e) => {
                change_depth_two("생활학습목표", "평일학습", e.target.value);
              }}
            />
          </Col>
        </Form.Group>

        <h5 className="mb-3 mt-5"><strong>일요일 목표</strong></h5>

        <Form.Group as={Row} className="mb-3 me-3 ms-3">
          <Form.Label column sm="2">
            일요일 목표취침
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="time"
              defaultValue="00:00"
              onChange={(e) => {
                change_depth_two("생활학습목표", "일요일취침", e.target.value);
              }}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3 me-3 ms-3">
          <Form.Label column sm="2">
            일요일 목표기상
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="time"
              defaultValue="08:00"
              onChange={(e) => {
                change_depth_two("생활학습목표", "일요일기상", e.target.value);
              }}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3 me-3 ms-3">
          <Form.Label column sm="2">
            일요일 목표등원
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="time"
              defaultValue="13:00"
              onChange={(e) => {
                change_depth_two("생활학습목표", "일요일등원", e.target.value);
              }}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3 me-3 ms-3">
          <Form.Label column sm="2">
            일요일 목표귀가
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="time"
              defaultValue="19:00"
              onChange={(e) => {
                change_depth_two("생활학습목표", "일요일귀가", e.target.value);
              }}
            />
          </Col>
        </Form.Group>

        <Form.Group as={Row} className="mb-3 me-3 ms-3">
          <Form.Label column sm="2">
            일요일 목표학습
          </Form.Label>
          <Col sm="10">
            <Form.Control
              type="number"
              placeholder="ex) 1.5"
              step="0.1"
              onChange={(e) => {
                change_depth_two("생활학습목표", "일요일학습", e.target.value);
              }}
            />
          </Col>
        </Form.Group></div>

        {/* 큐브책 입력란 */}
        <div className="stuedit-cat-box">
        <h3 className="stuedit-cat-title mb-4"><strong>[ 큐브책 체크리스트 ]</strong></h3>

        <div className="cube-box">
          {stuDB.큐브책.map(function (a, i) {
            return (
              <Form.Group as={Row} className="mb-3 me-3 ms-3" key={i}>
                <Col sm="11">
                  <Form.Control
                    className="mb-2"
                    type="text"
                    placeholder="큐브책 체크리스트 입력"
                    onChange={(e) => {
                      change_depth_two("큐브책", i, e.target.value);
                    }}
                  />
                </Col>
                <Col sm="1" className="p-1 ">
                  <button
                    className="btn btn-delete"
                    onClick={() => {
                      delete_depth_one("큐브책", i);
                    }}
                  >
                    x
                  </button>
                </Col>
              </Form.Group>
            );
          })}
          <Button className="btn-add"
            variant="dark"
            onClick={() => {
              push_depth_one("큐브책", "");
            }}
          >
            +
          </Button>
        </div></div>

        {/* 진행중 교재 */}

        <div className="stuedit-cat-box">
        <h3 className="stuedit-cat-title mb-4"><strong>[ 진행중교재 ]</strong></h3>

        <Table striped hover className="mt-3">
          <thead>
            <tr>
              <th width="15%">과목</th>
              <th>교재명</th>
              <th width="20%">총교재량</th>
              <th width="19%">교재 시작일</th>
              <th width="17%">최근진도</th>
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
                        change_depth_three("진행중교재", i, "과목", e.target.value);
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
                        change_depth_three("진행중교재", i, "교재", e.target.value);
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      placeholder="ex)100p, 250문제"
                      className="inputText"
                      onChange={async (e) => {
                        change_depth_three("진행중교재", i, "총교재량", e.target.value);
                        // const regex = /[^0-9]/g;
                        // change_depth_three("진행중교재", i, "총교재량숫자", parseInt(e.target.value.replace(regex, "")));
                      }}
                    />
                  </td>

                  <td>
                    <input
                      type="date"
                      className="inputText"
                      onChange={(e) => {
                        change_depth_three("진행중교재", i, "교재시작일", e.target.value);
                      }}
                    />
                  </td>

                  <td>
                    <input
                      type="number"
                      placeholder={a.최근진도}
                      className="inputText"
                      onChange={(e) => {
                        change_depth_three("진행중교재", i, "최근진도", parseInt(e.target.value));
                      }}
                    />
                  </td>
                  <td>
                    <button
                      className="btn btn-delete"
                      type="button"
                      onClick={() => {
                        if (i > -1) {
                          delete_depth_one("진행중교재", i);
                        }
                      }}
                    >
                     <strong>X</strong>
                    </button>
                  </td>
                </tr>
              );
            })}

            <tr>
              <td colSpan={6}>
                {" "}
                <button
                  className="btn btn-dark btn-add"
                  type="button"
                  onClick={() => {
                    push_depth_one("진행중교재", {
                      과목: "",
                      교재: "",
                      총교재량: "",
                      총교재량숫자: 0,
                      교재시작일: "",
                      최근진도: 0,
                    });
                  }}
                >
                <strong>+</strong>
                </button>
              </td>
            </tr>
          </tbody>
        </Table></div>

        {/* 완료된 교재 */}
        <div class="stuedit-cat-box">
        <h3 className="stuedit-cat-title mb-3"><strong>[ 완료된교재 ]</strong></h3>

        <Table striped hover className="mt-3">
          <thead>
            <tr>
              <th width="15%">과목</th>
              <th>교재명</th>
              <th width="20%">총교재량</th>
              <th width="19%">교재 시작일</th>
              <th width="19%">교재 종료일</th>
              <th width="60px"></th>
            </tr>
          </thead>
          <tbody>
            {stuDB.완료된교재.map(function (a, i) {
              return (
                <tr key={i}>
                  <td>
                    <Form.Select
                      size="sm"
                      onChange={(e) => {
                        change_depth_three("완료된교재", i, "과목", e.target.value);
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
                        change_depth_three("완료된교재", i, "교재", e.target.value);
                      }}
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      placeholder="ex)100p, 250문제"
                      className="inputText"
                      onChange={(e) => {
                        // const regex = /[^0-9]/g;
                        change_depth_three("완료된교재", i, "총교재량", e.target.value);
                        // change_depth_three("완료된교재", i, "총교재량숫자", parseInt(e.target.value.replace(regex, "")));
                      }}
                    />
                  </td>

                  <td>
                    <input
                      type="date"
                      className="inputText"
                      onChange={(e) => {
                        change_depth_three("완료된교재", i, "교재시작일", e.target.value);
                      }}
                    />
                  </td>

                  <td>
                    <input
                      type="date"
                      className="inputText"
                      onChange={(e) => {
                        change_depth_three("완료된교재", i, "교재종료일", e.target.value);
                      }}
                    />
                  </td>

                  <td>
                    <button
                      className="btn btn-delete"
                      type="button"
                      onClick={() => {
                        if (i > -1) {
                          delete_depth_one("완료된교재", i);
                        }
                      }}
                    >
                     <strong>X</strong>
                    </button>
                  </td>
                </tr>
              );
            })}

            <tr>
              <td colSpan={6}>
                {" "}
                <button
                  className="btn btn-dark btn-add"
                  type="button"
                  onClick={() => {
                    push_depth_one("완료된교재", {
                      과목: "",
                      교재: "",
                      총교재량: "",
                      총교재량숫자: 0,
                      교재시작일: "",
                      교재종료일: "",
                    });
                  }}
                >
                <strong>+</strong>
                </button>
              </td>
            </tr>
          </tbody>
        </Table></div>

        <div className="stuedit-cat-box">
          <h3 className="stuedit-cat-title mb-3"><strong>[ 프로그램 종류 ]</strong></h3>
          <h4 className="mt-3">
            {stuDB.프로그램분류.map(function (a, i) {
              return (
                <Badge pill bg="dark" className="me-2" key={i}>
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
              onKeyPress={(e) => {
                if (e.key == "Enter") {
                  programAdd();
                }
              }}
            />
            <Button className="btn-secondary program-add" onClick={programAdd}>
              +
            </Button>
          </InputGroup>
        </div>

        <ul className="commit-btns">
        <Button
          className="btn-DBcommit btn-edit"
          onClick={() => {
            if (stuDB.작성매니저 === "") {
              return window.alert("작성매니저가 입력되지 않았습니다.");
            }
            if (stuDB.작성일자 === "") {
              return window.alert("작성일자가 입력되지 않았습니다.");
            }
            if (window.confirm(`${stuDB.이름} 학생의 DB를 저장하시겠습니까?`)) {
              axios
                .post("/api/StudentAdd", stuDB)
                .then(function (response) {
                  window.alert("저장되었습니다");
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
          <strong>신규 DB 등록</strong>
        </Button></ul>
      </Form>
    </div>
  );
}

export default StudentAdd;
