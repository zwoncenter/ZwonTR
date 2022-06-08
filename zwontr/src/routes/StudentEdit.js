import "./StudentAddEdit.scss";
import { Form, Table, Row, Col, Button, Badge, InputGroup, FormControl } from "react-bootstrap";
import { useHistory, useParams } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect } from "react";
import axios from "axios";

function StudentEdit() {
  const history = useHistory();
  const now = new Date(); // 현재 시간
  const utcNow = now.getTime() + (now.getTimezoneOffset() * 60 * 1000);
  const koreaTimeDiff = 9 * 60 * 60 * 1000;
  const koreaNow = new Date(utcNow + koreaTimeDiff);
  const today = koreaNow.toISOString().split("T")[0];
  const writeform = {
    ID: "",
    이름: "",
    생년월일: "",
    연락처: "",
    프로그램시작일: "",
    부연락처: "",
    모연락처: "",
    주소: "",
    혈액형: "",
    최종학력: "",

    부직업: "",
    모직업: "",
    학생과더친한분: "",
    학생과사이가더나쁜분: "",
    형제자매및관계: "",
    조부모와의관계: "",
    재산: "",
    부모성향_부: "",
    부모성향_모: "",
    부모감정_부: "",
    부모감정_모: "",
    부모수용수준_부: "",
    부모수용수준_모: "",
    부모님고민_생활: "",
    부모님고민_목표및동기: "",
    부모님고민_학습: "",
    부모님고민_인성: "",
    부모님고민_현재폰기종: "",
    부모님고민_현재1주용돈: "",
    부모님고민_불법행위여부: "",

    키: "",
    몸무게: "",
    체지방률: "",
    BMI: "",
    운동량: "",
    평균수면시간: "",
    식습관: "",
    정신건강: "",
    과거병력: "",

    연인: "",
    친구: "",
    친구들_성향: "",
    매니저와의_관계: "",
    가장_친한_매니저: "",
    센터내_가장_친한_학생: "",

    MBTI: "",
    애니어그램: "",
    별자리: "",
    IQ: "",

    히스토리: [],

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

    매니징목표: [],
    약속구조: [],
    용돈구조: [],
    매니징방법: [],

    진행중교재: [],
    완료된교재: [],
    프로그램분류: ["자기인식", "진로탐색", "헬스", "외부활동", "독서", "외국어"],
  };
  const [stuDB, setstuDB] = useState(writeform);
  const [managerList, setmanagerList] = useState([]);
  const [manager, setmanager] = useState("");
  const [date, setdate] = useState("");
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
    if (window.confirm("삭제하시겠습니까?")) {
      const newstuDB = JSON.parse(JSON.stringify(stuDB));
      newstuDB[category].splice(index, 1);
      setstuDB(newstuDB);
    }
  }

  function push_depth_one(category, content) {
    const newstuDB = JSON.parse(JSON.stringify(stuDB));
    newstuDB[category].push(content);
    setstuDB(newstuDB);
  }

  const param = useParams();
  useEffect(async () => {
    const newstuDB = await axios
      .get(`/api/StudentDB/find/${param["ID"]}`)
      .then((result) => {
        if (result.data === "로그인필요") {
          window.alert("로그인이 필요합니다.");
          return history.push("/");
        }
        return result["data"];
      })
      .catch((err) => {
        return err;
      });
    setmanager(newstuDB["작성매니저"]);
    setdate(newstuDB["작성일자"]);
    newstuDB.작성매니저 = "";
    newstuDB.작성일자 = new Date().toISOString().split("T")[0];
    const tmp = await axios
      .get("/api/managerList")
      .then((result) => {
        return result["data"];
      })
      .catch((err) => {
        return err;
      });
    setmanagerList(tmp);

    setstuDB(newstuDB);
  }, []);

  return (
    <div className="stuedit-background">
      <h2 className="fw-bold text-center">
        <strong>{stuDB["이름"]} 학생 DB 조회/변경</strong>
      </h2>
      <p>최근 작성매니저 : {manager}</p>
      <p>최근 수정일 : {date}</p>

      <div className="stuDB-form">
        <div className="stuedit-cat-box">
          <h3 className="stuedit-cat-title mb-4">
            <strong>[ 작성매니저 / 작성일자 ]</strong>
          </h3>

          <Form.Group as={Row} className="mb-3 me-3 ms-3">
            <Form.Label column sm="2">
              작성매니저
            </Form.Label>
            <Col sm="10">
              <Form.Select
                value={stuDB.작성매니저}
                onChange={(e) => {
                  change_depth_one("작성매니저", e.target.value);
                }}
              >
                <option value="">선택</option>
                {managerList.length > 0
                  ? managerList.map((manager, i) => {
                      return (
                        <option value={manager} key={i}>
                          {manager}
                        </option>
                      );
                    })
                  : null}
              </Form.Select>
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3 me-3 ms-3">
            <Form.Label column sm="2">
              작성일자
            </Form.Label>
            <Col sm="10">
              <Form.Control
                type="date"
                value={stuDB.작성일자}
                onChange={(e) => {
                  change_depth_one("작성일자", e.target.value);
                }}
              />
            </Col>
          </Form.Group>
        </div>

        {/* 매니징목표 */}
        <div className="stuedit-cat-box">
          <h3 className="stuedit-cat-title mb-4">
            <strong>[ 학생 매니징 목표 ]</strong>
          </h3>

          <Table striped hover className="mt-3">
            <thead>
              <tr>
                <th>매니징 목표</th>
                <th width="13%">설정 매니저</th>
                <th width="19%">설정일</th>
                <th width="60px"></th>
              </tr>
            </thead>
            <tbody>
              {stuDB.매니징목표.map(function (goal, index) {
                return (
                  <tr key={index}>
                    <td>
                      <textarea
                        className="textArea"
                        name=""
                        id=""
                        rows="2"
                        placeholder="ex) 다른 학생들에 대한 배려를 기르는 것"
                        value={goal.목표}
                        onChange={(e) => {
                          change_depth_three("매니징목표", index, "목표", e.target.value);
                        }}
                      ></textarea>
                    </td>
                    <td>
                      <Form.Select
                        size="sm"
                        value={goal.설정매니저}
                        onChange={(e) => {
                          change_depth_three("매니징목표", index, "설정매니저", e.target.value);
                        }}
                      >
                        <option value="선택">선택</option>
                        {managerList.length > 0
                          ? managerList.map((manager, i) => {
                              return (
                                <option value={manager} key={i}>
                                  {manager}
                                </option>
                              );
                            })
                          : null}
                      </Form.Select>
                    </td>

                    <td>
                      <input
                        type="date"
                        className="inputText"
                        value={goal.설정일}
                        onChange={(e) => {
                          change_depth_three("매니징목표", index, "설정일", e.target.value);
                        }}
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-delete"
                        type="button"
                        onClick={() => {
                          if (index > -1) {
                            delete_depth_one("매니징목표", index);
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
                <td colSpan={4}>
                  {" "}
                  <button
                    className="btn btn-dark btn-add"
                    type="button"
                    onClick={() => {
                      push_depth_one("매니징목표", {
                        목표: "",
                        설정매니저: "선택",
                        설정일: today,
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

        {/* 약속 구조 */}
        <div className="stuedit-cat-box">
          <h3 className="stuedit-cat-title mb-4">
            <strong>[ 약속 구조 ]</strong>
          </h3>

          <Table striped hover className="mt-3">
            <thead>
              <tr>
                <th>약속 구조 </th>
                <th width="13%">설정 매니저</th>
                <th width="19%">설정일</th>
                <th width="60px"></th>
              </tr>
            </thead>
            <tbody>
              {stuDB.약속구조.map(function (promise, index) {
                return (
                  <tr key={index}>
                    <td>
                      <textarea
                        className="textArea"
                        name=""
                        id=""
                        rows="2"
                        placeholder="ex) 학교 등원 시에도 최소 3시간 / 일, 비등원시 최소 4시간 ~ 최대 8시간 / 일 자기계발 시간을 갖습니다"
                        value={promise.약속}
                        onChange={(e) => {
                          change_depth_three("약속구조", index, "약속", e.target.value);
                        }}
                      ></textarea>
                    </td>
                    <td>
                      <Form.Select
                        size="sm"
                        value={promise.설정매니저}
                        onChange={(e) => {
                          change_depth_three("약속구조", index, "설정매니저", e.target.value);
                        }}
                      >
                        <option value="선택">선택</option>
                        {managerList.length > 0
                          ? managerList.map((manager, i) => {
                              return (
                                <option value={manager} key={i}>
                                  {manager}
                                </option>
                              );
                            })
                          : null}
                      </Form.Select>
                    </td>

                    <td>
                      <input
                        type="date"
                        className="inputText"
                        value={promise.설정일}
                        onChange={(e) => {
                          change_depth_three("약속구조", index, "설정일", e.target.value);
                        }}
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-delete"
                        type="button"
                        onClick={() => {
                          if (index > -1) {
                            delete_depth_one("약속구조", index);
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
                <td colSpan={4}>
                  {" "}
                  <button
                    className="btn btn-dark btn-add"
                    type="button"
                    onClick={() => {
                      push_depth_one("약속구조", {
                        약속: "",
                        설정매니저: "선택",
                        설정일: today,
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

        {/* 용돈 구조 */}
        <div className="stuedit-cat-box">
          <h3 className="stuedit-cat-title mb-4">
            <strong>[ 용돈 구조 ]</strong>
          </h3>

          <Table striped hover className="mt-3">
            <thead>
              <tr>
                <th width="13%">금액</th>
                <th>용돈 구조</th>
                <th width="13%">설정 매니저</th>
                <th width="19%">설정일</th>
                <th width="60px"></th>
              </tr>
            </thead>
            <tbody>
              {stuDB.용돈구조.map(function (pocketmoney, index) {
                return (
                  <tr key={index}>
                    <td>
                      <input
                        type="number"
                        placeholder="ex) 2000"
                        value={pocketmoney.금액}
                        className="inputText"
                        onChange={(e) => {
                          change_depth_three("용돈구조", index, "금액", e.target.value);
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        placeholder="ex) 학습 1시간당 2,000 지급"
                        value={pocketmoney.구조}
                        className="inputText"
                        onChange={(e) => {
                          change_depth_three("용돈구조", index, "구조", e.target.value);
                        }}
                      />
                    </td>
                    <td>
                      <Form.Select
                        size="sm"
                        value={pocketmoney.설정매니저}
                        onChange={(e) => {
                          change_depth_three("용돈구조", index, "설정매니저", e.target.value);
                        }}
                      >
                        <option value="선택">선택</option>
                        {managerList.length > 0
                          ? managerList.map((manager, i) => {
                              return (
                                <option value={manager} key={i}>
                                  {manager}
                                </option>
                              );
                            })
                          : null}
                      </Form.Select>
                    </td>

                    <td>
                      <input
                        type="date"
                        className="inputText"
                        value={pocketmoney.설정일}
                        onChange={(e) => {
                          change_depth_three("용돈구조", index, "설정일", e.target.value);
                        }}
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-delete"
                        type="button"
                        onClick={() => {
                          if (index > -1) {
                            delete_depth_one("용돈구조", index);
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
                <td colSpan={5}>
                  {" "}
                  <button
                    className="btn btn-dark btn-add"
                    type="button"
                    onClick={() => {
                      push_depth_one("용돈구조", {
                        금액: "",
                        구조: "",
                        설정매니저: "선택",
                        설정일: today,
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

        {/* 매니징 방법 */}
        <div className="stuedit-cat-box">
          <h3 className="stuedit-cat-title mb-4">
            <strong>[ 매니징 방법 ]</strong>
          </h3>

          <Table striped hover className="mt-3">
            <thead>
              <tr>
                <th>매니징 방법</th>
                <th width="13%">작성 매니저</th>
                <th width="19%">작성일</th>
                <th width="60px"></th>
              </tr>
            </thead>
            <tbody>
              {stuDB.매니징방법.map(function (method, index) {
                return (
                  <tr key={index}>
                    <td>
                      <textarea
                        className="textArea"
                        name=""
                        id=""
                        rows="2"
                        placeholder="ex) 논리적인 근거에 따라 설득을 하면 잘 따라옵니다."
                        value={method.방법}
                        onChange={(e) => {
                          change_depth_three("매니징방법", index, "방법", e.target.value);
                        }}
                      ></textarea>
                    </td>
                    <td>
                      <Form.Select
                        size="sm"
                        value={method.설정매니저}
                        onChange={(e) => {
                          change_depth_three("매니징방법", index, "설정매니저", e.target.value);
                        }}
                      >
                        <option value="선택">선택</option>
                        {managerList.length > 0
                          ? managerList.map((manager, i) => {
                              return (
                                <option value={manager} key={i}>
                                  {manager}
                                </option>
                              );
                            })
                          : null}
                      </Form.Select>
                    </td>

                    <td>
                      <input
                        type="date"
                        className="inputText"
                        value={method.설정일}
                        onChange={(e) => {
                          change_depth_three("매니징방법", index, "설정일", e.target.value);
                        }}
                      />
                    </td>
                    <td>
                      <button
                        className="btn btn-delete"
                        type="button"
                        onClick={() => {
                          if (index > -1) {
                            delete_depth_one("매니징방법", index);
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
                <td colSpan={4}>
                  {" "}
                  <button
                    className="btn btn-dark btn-add"
                    type="button"
                    onClick={() => {
                      push_depth_one("매니징방법", {
                        방법: "",
                        설정매니저: "선택",
                        설정일: today,
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

        <div className="stuedit-cat-box">
          <h3 className="stuedit-cat-title mb-4">
            <strong>[ 생활정보 ]</strong>
          </h3>

          <h5 className="mb-3 mt-5">
            <strong>주중 목표</strong>
          </h5>

          <Form.Group as={Row} className="mb-3 me-3 ms-3">
            <Form.Label column sm="2">
              목표취침
            </Form.Label>
            <Col sm="10">
              <Form.Control
                type="time"
                value={stuDB.생활학습목표.평일취침}
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
                value={stuDB.생활학습목표.평일기상}
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
                value={stuDB.생활학습목표.평일등원}
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
                value={stuDB.생활학습목표.평일귀가}
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
                value={stuDB.생활학습목표.평일학습}
                step="0.1"
                onChange={(e) => {
                  change_depth_two("생활학습목표", "평일학습", e.target.value);
                }}
              />
            </Col>
          </Form.Group>

          <h5 className="mb-3 mt-5">
            <strong>일요일 목표</strong>
          </h5>

          <Form.Group as={Row} className="mb-3 me-3 ms-3">
            <Form.Label column sm="2">
              일요일 목표취침
            </Form.Label>
            <Col sm="10">
              <Form.Control
                type="time"
                value={stuDB.생활학습목표.일요일취침}
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
                value={stuDB.생활학습목표.일요일기상}
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
                value={stuDB.생활학습목표.일요일등원}
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
                value={stuDB.생활학습목표.일요일귀가}
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
                value={stuDB.생활학습목표.일요일학습}
                step="0.1"
                onChange={(e) => {
                  change_depth_two("생활학습목표", "일요일학습", e.target.value);
                }}
              />
            </Col>
          </Form.Group>
        </div>

        {/* 큐브책 입력란 */}
        <div className="stuedit-cat-box">
          <h3 className="stuedit-cat-title mb-4">
            <strong>[ 큐브책 체크리스트 ]</strong>
          </h3>

          <div className="cube-box">
            {stuDB.큐브책.map(function (a, i) {
              return (
                <Form.Group as={Row} className="mb-3 me-3 ms-3" key={i}>
                  <Col sm="3">
                    <Form.Control
                      className="mb-2"
                      type="text"
                      placeholder="큐브책 구분 입력"
                      value={a.구분}
                      onChange={(e) => {
                        change_depth_three("큐브책", i, "구분", e.target.value);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                        }
                      }}
                    />
                  </Col>

                  <Col sm="8">
                    <Form.Control
                      className="mb-2"
                      type="text"
                      placeholder="큐브책 체크리스트 입력"
                      value={a.내용}
                      onChange={(e) => {
                        change_depth_three("큐브책", i, "내용", e.target.value);
                      }}
                      onKeyPress={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                        }
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
                      <strong>X</strong>
                    </button>
                  </Col>
                </Form.Group>
              );
            })}

            <Button
              className="btn-add"
              variant="dark"
              onClick={() => {
                push_depth_one("큐브책", { 구분: "", 내용: "" });
              }}
            >
              <strong>+</strong>
            </Button>
          </div>
        </div>

        {/* 진행중 교재 */}
        <div className="stuedit-cat-box">
          <h3 className="stuedit-cat-title mb-4">
            <strong>[ 진행중교재 ]</strong>
          </h3>
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
                        value={a.과목}
                        onChange={(e) => {
                          change_depth_three("진행중교재", i, "과목", e.target.value);
                        }}
                      >
                        <option value="선택">선택</option>
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
                        value={a.교재}
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
                        value={a.총교재량}
                        className="inputText"
                        onChange={(e) => {
                          change_depth_three("진행중교재", i, "총교재량", e.target.value);
                          // const regex = /[^0-9]/g;
                          // newstuDB.진행중교재[i].총교재량숫자 = parseInt(e.target.value.replace(regex, ""));
                        }}
                      />
                    </td>

                    <td>
                      <input
                        type="date"
                        className="inputText"
                        value={a.교재시작일}
                        onChange={(e) => {
                          change_depth_three("진행중교재", i, "교재시작일", e.target.value);
                        }}
                      />
                    </td>

                    <td>
                      <input
                        type="number"
                        placeholder="ex)70, 100"
                        value={a.최근진도}
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
                        과목: "선택",
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
          </Table>
        </div>

        {/* 완료된 교재 */}
        <div className="stuedit-cat-box">
          <h3 className="stuedit-cat-title mb-3">
            <strong>[ 완료된교재 ]</strong>
          </h3>
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
                        value={a.과목}
                        onChange={(e) => {
                          change_depth_three("완료된교재", i, "과목", e.target.value);
                        }}
                      >
                        <option value="선택">선택</option>
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
                        value={a.교재}
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
                        value={a.총교재량}
                        className="inputText"
                        onChange={(e) => {
                          change_depth_three("완료된교재", i, "총교재량", e.target.value);
                          // const regex = /[^0-9]/g;
                          // newstuDB.완료된교재[i].총교재량숫자 = parseInt(e.target.value.replace(regex, ""));
                          // setstuDB(newstuDB);
                        }}
                      />
                    </td>

                    <td>
                      <input
                        type="date"
                        className="inputText"
                        value={a.교재시작일 ? a.교재시작일 : null}
                        onChange={(e) => {
                          change_depth_three("완료된교재", i, "교재시작일", e.target.value);
                        }}
                      />
                    </td>

                    <td>
                      <input
                        type="date"
                        className="inputText"
                        value={a.교재종료일 ? a.교재종료일 : null}
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
                        과목: "선택",
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
          </Table>
        </div>

        <div className="stuedit-cat-box">
          <h3 className="stuedit-cat-title mb-3">
            <strong>[ 프로그램 종류 ]</strong>
          </h3>
          <h4 className="mt-3">
            {stuDB
              ? stuDB.프로그램분류.map(function (a, i) {
                  return (
                    <Badge pill bg="dark" className="me-2 mt-2" key={i}>
                      {a}
                      <span
                        className="program-delete"
                        onClick={() => {
                          if (i > -1) {
                            delete_depth_one("프로그램분류", i);
                          }
                        }}
                      >
                        {" "}
                        x
                      </span>
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
              onKeyPress={(e) => {
                if (e.key === "Enter") {
                  programAdd();
                }
              }}
            />
            <Button className="btn-secondary program-add" onClick={programAdd} type="button">
              <strong>+</strong>
            </Button>
          </InputGroup>
        </div>

        <ul className="commit-btns">
          <Button
            variant="secondary"
            className="btn-DBcommit btn-edit"
            onClick={() => {
              const tmp = ["작성매니저", "작성일자", "이름"];
              for (let j = 0; j < tmp.length; j++) {
                if (stuDB[tmp[j]] === "") {
                  return window.alert(`${tmp[j]}가 입력되지 않았습니다.`);
                }
              }

              const tmp2 = ["매니징목표", "약속구조", "용돈구조", "매니징방법"];
              for (let j = 0; j < tmp2.length; j++) {
                if (stuDB[tmp2[j]]) {
                  for (let i = 0; i < stuDB[tmp2[j]].length; i++) {
                    if (stuDB[tmp2[j]][i].설정매니저 == "선택") {
                      return window.alert(`${i + 1}번째 ${tmp2[j]}의 설정 매니저가 선택되지 않았습니다.`);
                    }
                  }
                }
              }
              if (window.confirm(`${stuDB.이름} 학생의 DB를 수정하시겠습니까?`)) {
                axios
                  .put("/api/StudentDB/edit", stuDB)
                  .then(function (result) {
                    if (result.data === "로그인필요") {
                      window.alert("로그인이 필요합니다.");
                      return history.push("/");
                    }
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
            <strong>DB 수정</strong>
          </Button>
        </ul>
      </div>
    </div>
  );
}

export default StudentEdit;
