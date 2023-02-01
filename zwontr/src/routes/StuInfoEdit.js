import "./StuInfo.scss";
import "./StuListpage.scss";
import {
  Form,
  Table,
  Row,
  Col,
  Button,
  Card,
  ListGroup,
  Modal,
  Badge,
  InputGroup,
  FormControl,
  Accordion,
} from "react-bootstrap";
import { useParams } from "react-router-dom";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect } from "react";
import axios from "axios";
import stupic from "../student.png";

function StuInfoEdit() {
  // 공통 CODE
  let history = useHistory();
  const [managerList, setmanagerList] = useState([]);
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
    분류: "",

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

    히스토리: {
      "외부활동" : [],
      "진로" : [], 
      "학습" : [], 
      "자기인식" : [], 
      "상담" : [], 
      "문제사항" : [], 
      "기타" : []
    },

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
    프로그램분류: [
      "자기인식",
      "진로탐색",
      "헬스",
      "외부활동",
      "독서",
      "외국어",
    ],
    graduated:false, //센터 졸업 여부 플래그
    graduated_date:"", //센터 졸업일
  };
  const [stuInfo, setstuInfo] = useState(writeform);
  function phoneNumber(value) {
    value = value.replace(/[^0-9]/g, "");
    return value
      .replace(/[^0-9]/, "")
      .replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, `$1-$2-$3`);
  }
  const [contact, setContact] = useState("");
  const [dadcontact, setdadContact] = useState("");
  const [momcontact, setmomContact] = useState("");

  function change_depth_one(category, data) {
    const newstuInfo = JSON.parse(JSON.stringify(stuInfo));
    newstuInfo[category] = data;
    setstuInfo(newstuInfo);
  }

  function change_depth_three(category1, category2, category3, data) {
    const newstuInfo = JSON.parse(JSON.stringify(stuInfo));
    newstuInfo[category1][category2][category3] = data;
    setstuInfo(newstuInfo);
  }

  function change_depth_four(category1, category2, category3, category4, data) {
    const newstuInfo = JSON.parse(JSON.stringify(stuInfo));
    newstuInfo[category1][category2][category3][category4] = data;
    setstuInfo(newstuInfo);
  }

  function push_depth_one(category, content) {
    const newstuInfo = JSON.parse(JSON.stringify(stuInfo));
    newstuInfo[category].push(content);
    setstuInfo(newstuInfo);
  }

  function unshift_depth_one(category, content) {
    const newstuInfo = JSON.parse(JSON.stringify(stuInfo));
    newstuInfo[category].unshift(content);
    setstuInfo(newstuInfo);
  }

  function unshift_depth_two(category1, category2, content) {
    const newstuInfo = JSON.parse(JSON.stringify(stuInfo));
    newstuInfo[category1][category2].unshift(content);
    setstuInfo(newstuInfo);
  }

  function delete_depth_one(category, index) {
    if (window.confirm("삭제하시겠습니까?")) {
      const newstuInfo = JSON.parse(JSON.stringify(stuInfo));
      newstuInfo[category].splice(index, 1);
      setstuInfo(newstuInfo);
    }
  }

  function delete_depth_two(category1, category2, index) {
    if (window.confirm("삭제하시겠습니까?")) {
      const newstuInfo = JSON.parse(JSON.stringify(stuInfo));
      newstuInfo[category1][category2].splice(index, 1);
      setstuInfo(newstuInfo);
    }
  }

  useEffect(() => {
    change_depth_one("연락처", contact);
  }, [contact]);
  useEffect(() => {
    change_depth_one("부연락처", dadcontact);
  }, [dadcontact]);
  useEffect(() => {
    change_depth_one("모연락처", momcontact);
  }, [momcontact]);

  // 이름, 프로그램 시작일, 생년월일, 연락처, 연락처 (부) 와 연락처 (모) 중 하나
  function inputCheck() {
    const need_to_check = ["이름", "생년월일"];
    for (let i = 0; i < need_to_check.length; i++) {
      if (!stuInfo[need_to_check[i]]) {
        window.alert(`${need_to_check[i]}이(가) 입력되지 않았습니다.`);
        return false;
      }
    }
    if (stuInfo["연락처"].length !== 13) {
      window.alert(
        "학생 연락처가 입력되지 않았습니다. 휴대폰 번호 13자리를 입력해주세요."
      );
      return false;
    }
    if (!stuInfo["부연락처"] && !stuInfo["모연락처"]) {
      window.alert(
        "연락처 (부) 또는 연락처 (모) 중 하나는 반드시 기입되어야합니다."
      );
      return false;
    }
    return true;
  }

  // Edit CODE
  const [name, setname] = useState("");
  const [birth, setbirth] = useState("");
  const param = useParams();
  const paramID= param["ID"];
  useEffect(async () => {
    const tmp = await axios
      .get("/api/managerList")
      .then((result) => {
        return result["data"];
      })
      .catch((err) => {
        return err;
      });

    setmanagerList(tmp);

    const existstuInfo = await axios
      .get(`/api/StudentDB/${param["ID"]}`)
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

    if(!'분류' in existstuInfo){
      existstuInfo["분류"] = "";
    };
    setname(existstuInfo["이름"]);
    setbirth(existstuInfo["생년월일"]);
    setstuInfo(existstuInfo);
  }, []);

  return (
    <div className="stuInfo-background">
      <h1 className="fw-bold text-center">
        <strong>학생 정보</strong>
      </h1>
      <div className="row">
        <div className="col-12">
          <Card className="stuInfoCard mt-3">
            <h4 className="stuInfoCard-title mb-4">
              <strong>[ 신상정보 ]</strong>
            </h4>
            <div className="row">
              <div className="col-xl-3 mb-2">
                <img src={stupic} alt="stupic" className="studentImage" />
              </div>
              <div className="col-xl-9">
                <div className="row">
                  <Form.Group as={Row} className="col-xl-6">
                    <Form.Label column sm="4" className="fs-6">
                      <p>
                        <strong>이름</strong>
                      </p>
                    </Form.Label>
                    <Col>
                      <Form.Control type="text" defaultValue={name} readOnly />
                    </Col>
                  </Form.Group>

                  <Form.Group as={Row} className="col-xl-6">
                    <Form.Label column sm="4" className="fs-6">
                      <p>
                        <strong>생년월일</strong>
                      </p>
                    </Form.Label>
                    <Col>
                      <Form.Control type="date" defaultValue={birth} readOnly />
                    </Col>
                  </Form.Group>

                  <Form.Group as={Row} className="col-xl-6">
                    <Form.Label column sm="4" className="fs-6">
                      <p>
                        <strong>프로그램 시작일</strong>
                      </p>
                    </Form.Label>
                    <Col>
                      <Form.Control
                        type="date"
                        value={stuInfo["프로그램시작일"]}
                        onChange={(e) => {
                          change_depth_one("프로그램시작일", e.target.value);
                        }}
                      />
                    </Col>
                  </Form.Group>
                  <Form.Group as={Row} className="col-xl-6">
                    <Form.Label column sm="4" className="fs-6">
                      <p>
                        <strong>분류</strong>
                      </p>
                    </Form.Label>
                    <Col>
                    <Form.Select
                        type="text"
                        value={stuInfo["분류"]}
                        onChange={(e) => {
                          change_depth_one("분류", e.target.value);
                        }}
                      >
                        <option value="">선택</option>
                        <option value={'OT'}>OT</option>
                        <option value={'중1'}>중1</option>
                        <option value={'중2'}>중2</option>
                        <option value={'중3'}>중3</option>
                        <option value={'고1'}>고1</option>
                        <option value={'고2'}>고2</option>
                        <option value={'고3'}>고3</option>
                      </Form.Select>
                    </Col>
                  </Form.Group>

                  <Form.Group as={Row} className="col-xl-6">
                    <Form.Label column sm="4" className="fs-6">
                      <p>
                        <strong>연락처</strong>
                      </p>
                    </Form.Label>
                    <Col>
                      <Form.Control
                        type="text"
                        value={stuInfo["연락처"]}
                        onChange={(e) => {
                          setContact(phoneNumber(e.target.value));
                          change_depth_one("연락처", contact);
                        }}
                        maxLength="13"
                        placeholder="숫자만 입력해주세요"
                      />
                    </Col>
                  </Form.Group>

                  <Form.Group as={Row} className="col-xl-6">
                    <Form.Label column sm="4" className="fs-6">
                      <p>
                        <strong>연락처 (부)</strong>
                      </p>
                    </Form.Label>
                    <Col>
                      <Form.Control
                        type="text"
                        onChange={(e) => {
                          setdadContact(phoneNumber(e.target.value));
                          change_depth_one("부연락처", dadcontact);
                        }}
                        value={stuInfo["부연락처"]}
                        maxLength="13"
                        placeholder="숫자만 입력해주세요"
                      />
                    </Col>
                  </Form.Group>

                  <Form.Group as={Row} className="col-xl-6">
                    <Form.Label column sm="4" className="fs-6">
                      <p>
                        <strong>연락처 (모)</strong>
                      </p>
                    </Form.Label>
                    <Col>
                      <Form.Control
                        type="text"
                        onChange={(e) => {
                          setmomContact(phoneNumber(e.target.value));
                          change_depth_one("모연락처", momcontact);
                        }}
                        value={stuInfo["모연락처"]}
                        maxLength="13"
                        placeholder="숫자만 입력해주세요"
                      />
                    </Col>
                  </Form.Group>

                  <Form.Group as={Row} className="col-xl-6">
                    <Form.Label column sm="4" className="fs-6">
                      <p>
                        <strong>주소</strong>
                      </p>
                    </Form.Label>
                    <Col>
                      <Form.Control
                        type="text"
                        value={stuInfo["주소"]}
                        onChange={(e) => {
                          change_depth_one("주소", e.target.value);
                        }}
                      />
                    </Col>
                  </Form.Group>

                  <Form.Group as={Row} className="col-xl-6">
                    <Form.Label column sm="4" className="fs-6">
                      <p>
                        <strong>혈액형</strong>
                      </p>
                    </Form.Label>
                    <Col>
                      <Form.Select
                        type="text"
                        value={stuInfo["혈액형"]}
                        onChange={(e) => {
                          change_depth_one("혈액형", e.target.value);
                        }}
                      >
                        <option value="">선택</option>
                        <option value={4}>A</option>
                        <option value={3}>B</option>
                        <option value={2}>O</option>
                        <option value={1}>AB</option>
                      </Form.Select>
                    </Col>
                  </Form.Group>

                  <Form.Group as={Row} className="col-xl-6">
                    <Form.Label column sm="4" className="fs-6">
                      <p>
                        <strong>최종학력</strong>
                      </p>
                    </Form.Label>
                    <Col>
                      <Form.Control
                        type="text"
                        value={stuInfo["최종학력"]}
                        onChange={(e) => {
                          change_depth_one("최종학력", e.target.value);
                        }}
                      />
                    </Col>
                  </Form.Group>

                  <Form.Group as={Row} className="col-xl-6">
                    <Form.Label column sm="4" className="fs-6">
                      <p>
                        <strong>MBTI</strong>
                      </p>
                    </Form.Label>
                    <Col>
                      <Form.Control
                        type="text"
                        onChange={(e) => {
                          change_depth_one("MBTI", e.target.value);
                        }}
                      />
                    </Col>
                  </Form.Group>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <div className="col-12">
          <Card className="stuInfoCard mt-3">
            <h4 className="stuInfoCard-title mb-4">
              <strong>[ 가족관계 ]</strong>
            </h4>
            <Accordion>
              <Accordion.Item eventKey="0">
                <Accordion.Header>
                  <p>작성하려면 누르세요.</p>
                </Accordion.Header>
                <Accordion.Body>
                  <div className="row">
                    {[
                      "부 직업",
                      "모 직업",
                      "학생과 더 친한 분",
                      "학생과 사이가 더 나쁜 분",
                      "형제 자매 및 관계",
                      "조부모와의 관계",
                      "재산",
                    ].map(function (category, index) {
                      return (
                        <Form.Group as={Row} className="col-xl-6" key={index}>
                          <Form.Label column sm="4" className="fs-6">
                            <p>
                              <strong>{category}</strong>
                            </p>
                          </Form.Label>
                          <Col>
                            <textarea
                              className="textArea"
                              value={stuInfo[category.split(" ").join("")]}
                              onChange={(e) => {
                                change_depth_one(
                                  category.split(" ").join(""),
                                  e.target.value
                                );
                              }}
                            />
                          </Col>
                        </Form.Group>
                      );
                    })}

                    <Form.Group as={Row} className="col-xl-12">
                      <Form.Label column sm="2" className="fs-6">
                        <p>
                          <strong>부모 성향</strong>
                        </p>
                      </Form.Label>
                      <Col>
                        <Accordion>
                          <Accordion.Item eventKey="0">
                            <Accordion.Header>
                              <p>작성하려면 누르세요.</p>
                            </Accordion.Header>
                            <Accordion.Body>
                              <div>
                                <Form.Group as={Row}>
                                  <Form.Label
                                    column
                                    sm="4"
                                    className="fs-6 mb-3"
                                  ></Form.Label>
                                  <Col>
                                    <p>
                                      <strong>부</strong>
                                    </p>
                                  </Col>
                                  <Col>
                                    <p>
                                      <strong>모</strong>
                                    </p>
                                  </Col>
                                </Form.Group>
                                <Form.Group as={Row} className="mb-3">
                                  <Form.Label column sm="4" className="fs-6">
                                    <p>
                                      <strong>성향</strong>
                                    </p>
                                  </Form.Label>
                                  <Col>
                                    <textarea
                                      className="textArea"
                                      rows="2"
                                      value={stuInfo["부모성향_부"]}
                                      onChange={(e) => {
                                        change_depth_one(
                                          "부모성향_부",
                                          e.target.value
                                        );
                                      }}
                                    />
                                  </Col>
                                  <Col>
                                    <textarea
                                      className="textArea"
                                      rows="2"
                                      value={stuInfo["부모성향_모"]}
                                      onChange={(e) => {
                                        change_depth_one(
                                          "부모성향_모",
                                          e.target.value
                                        );
                                      }}
                                    />
                                  </Col>
                                </Form.Group>
                                <Form.Group as={Row} className="mb-3">
                                  <Form.Label column sm="4" className="fs-6">
                                    <p>
                                      <strong>감정</strong>
                                    </p>
                                  </Form.Label>
                                  <Col>
                                    <textarea
                                      className="textArea"
                                      rows="2"
                                      value={stuInfo["부모감정_부"]}
                                      onChange={(e) => {
                                        change_depth_one(
                                          "부모감정_부",
                                          e.target.value
                                        );
                                      }}
                                    />
                                  </Col>
                                  <Col>
                                    <textarea
                                      className="textArea"
                                      rows="2"
                                      value={stuInfo["부모감정_모"]}
                                      onChange={(e) => {
                                        change_depth_one(
                                          "부모감정_모",
                                          e.target.value
                                        );
                                      }}
                                    />
                                  </Col>
                                </Form.Group>
                                <Form.Group as={Row} className="mb-3">
                                  <Form.Label column sm="4" className="fs-6">
                                    <p>
                                      <strong>수용 수준</strong>
                                    </p>
                                  </Form.Label>
                                  <Col>
                                    <textarea
                                      className="textArea"
                                      rows="2"
                                      value={stuInfo["부모수용수준_부"]}
                                      onChange={(e) => {
                                        change_depth_one(
                                          "부모수용수준_부",
                                          e.target.value
                                        );
                                      }}
                                    />
                                  </Col>
                                  <Col>
                                    <textarea
                                      className="textArea"
                                      rows="2"
                                      value={stuInfo["부모수용수준_모"]}
                                      onChange={(e) => {
                                        change_depth_one(
                                          "부모수용수준_모",
                                          e.target.value
                                        );
                                      }}
                                    />
                                  </Col>
                                </Form.Group>
                              </div>
                            </Accordion.Body>
                          </Accordion.Item>
                        </Accordion>
                      </Col>
                    </Form.Group>

                    <Form.Group as={Row} className="col-xl-12">
                      <Form.Label column sm="2" className="fs-6">
                        <p>
                          <strong>부모님 고민</strong>
                        </p>
                      </Form.Label>
                      <Col>
                        <Accordion>
                          <Accordion.Item eventKey="0">
                            <Accordion.Header>
                              <p>작성하려면 누르세요.</p>
                            </Accordion.Header>
                            <Accordion.Body>
                              <div className="me-3">
                                {[
                                  "생활",
                                  "목표 및 동기",
                                  "학습",
                                  "인성",
                                  "현재 폰기종",
                                  "현재1주용돈",
                                  "불법행위여부",
                                ].map(function (category, index) {
                                  return (
                                    <Form.Group
                                      as={Row}
                                      className="mb-2"
                                      key={index}
                                    >
                                      <Form.Label
                                        column
                                        sm="4"
                                        className="fs-6"
                                      >
                                        <p>
                                          <strong>{category}</strong>
                                        </p>
                                      </Form.Label>
                                      <Col>
                                        <textarea
                                          className="textArea"
                                          rows="2"
                                          value={
                                            stuInfo[
                                              `부모님고민_${category
                                                .split(" ")
                                                .join("")}`
                                            ]
                                          }
                                          onChange={(e) => {
                                            change_depth_one(
                                              `부모님고민_${category
                                                .split(" ")
                                                .join("")}`,
                                              e.target.value
                                            );
                                          }}
                                        />
                                      </Col>
                                    </Form.Group>
                                  );
                                })}
                              </div>
                            </Accordion.Body>
                          </Accordion.Item>
                        </Accordion>
                      </Col>
                    </Form.Group>
                  </div>
                </Accordion.Body>
              </Accordion.Item>
            </Accordion>
          </Card>
        </div>
                {/* 건강상태 */}
        <div className="col-12">
          <Card className="stuInfoCard mt-3">
            <h4 className="stuInfoCard-title mb-4">
              <strong>[ 건강상태 ]</strong>
            </h4>
            <div className="row">
              {["키", "몸무게", "정신건강", "과거병력"].map(function (category, index) {
                return (
                  <Form.Group as={Row} className="col-xl-4" key={index}>
                    <Form.Label column sm="4" className="fs-6">
                      <p>
                        <strong>{category}</strong>
                      </p>
                    </Form.Label>
                    <Col>
                      <Form.Control
                        type="text"
                        value={stuInfo[category.split(" ").join("")]}
                        onChange={(e) => {
                          change_depth_one(
                            category.split(" ").join(""),
                            e.target.value
                          );
                        }}
                      />
                    </Col>
                  </Form.Group>
                );
              })}
            </div>
          </Card>
        </div>


        <div className="col-12">
          <Card className="stuInfoCard mt-3">
          <h5 className="mb-4">
              <strong>[ 히스토리 ]</strong>
            </h5>
            {["외부활동", "진로", "학습", "자기인식", "상담", "문제사항", "기타"].map((cat, index) => {
              return (
                <>
                  <Accordion key={index} className="mb-3">
                    <Accordion.Item eventKey="0">
                      <Accordion.Header>
                        <p>{cat}({stuInfo["히스토리"][cat].length})</p>
                      </Accordion.Header>
                      <Accordion.Body>
                        <div className="row m-2">
                          <Form.Group as={Row} className="col-xl-12">
                            <Form.Label column sm="2" className="fs-6">
                              <p>
                                <strong>날짜</strong>
                              </p>
                            </Form.Label>
                            <Form.Label column sm="2" className="fs-6">
                              <p>
                                <strong>작성매니저</strong>
                              </p>
                            </Form.Label>
                            <Form.Label column sm="8" className="fs-6">
                              <p>
                                <strong>내용</strong>
                              </p>
                            </Form.Label>
                          </Form.Group>
                        </div>
                        <button
                          className="btn btn-dark btn-add mb-3"
                          type="button"
                          onClick={() => {
                            unshift_depth_two("히스토리", cat, {
                              날짜: "",
                              작성매니저: "",
                              내용: "",
                            });
                          }}
                        >
                          <strong>+</strong>
                        </button>
                        <div className="historyCard">
                          {stuInfo["히스토리"][cat].map(function (a, i) {
                            return (
                              <div key={i} className="row m-2">
                                <Col className="col-2">
                                  <Form.Control
                                    type="date"
                                    value={a.날짜}
                                    onChange={(e) => {
                                      change_depth_four("히스토리", cat, i, "날짜", e.target.value);
                                    }}
                                  />
                                </Col>
                                <Col className="col-1">
                                  <Form.Select
                                    value={a.작성매니저}
                                    onChange={(e) => {
                                      change_depth_four("히스토리", cat, i, "작성매니저", e.target.value);
                                    }}
                                  >
                                    <option value="선택">선택</option>
                                    {managerList
                                      ? managerList.map((manager, index) => {
                                          return (
                                            <option value={manager} key={index}>
                                              {manager}
                                            </option>
                                          );
                                        })
                                      : null}
                                  </Form.Select>
                                </Col>
                                <Col className="col-8">
                                  <textarea
                                    className="textArea"
                                    id={i}
                                    rows="5"
                                    value={a.내용}
                                    onChange={(e) => {
                                      change_depth_four("히스토리", cat, i, "내용", e.target.value);
                                    }}
                                  />
                                </Col>
                                <Col className="col-1">
                                  <Button
                                    className="btn-delete"
                                    onClick={() => {
                                      if (i > -1) {
                                        delete_depth_two("히스토리", cat, i);
                                      }
                                    }}
                                  >
                                    <strong>x</strong>
                                  </Button>
                                </Col>
                              </div>
                            );
                          })}
                        </div>
                      </Accordion.Body>
                    </Accordion.Item>
                  </Accordion>
                </>
              );
            })}
          </Card>
        </div>
      </div>
      <Button
        variant="secondary"
        className="btn-Infocommit btn-edit"
        onClick={() => {
          if (inputCheck()) {
            if (
              window.confirm(
                `${stuInfo.이름}학생의 기본정보를 저장하시겠습니까?`
              )
            ) {
              axios
                .put("/api/StudentDB", stuInfo)
                .then(function (result) {
                  if (result.data === true) {
                    window.alert("저장되었습니다.");
                    history.push("/studentList");
                  } else if (result.data === "로그인필요") {
                    window.alert("로그인이 필요합니다.");
                    return history.push("/");
                  } else {
                    console.log(result.data);
                    // window.alert(result.data);
                  }
                })
                .catch(function (err) {
                  console.log("저장 실패 : ", err);
                  window.alert(err);
                });
            }
          }
        }}
      >
        <strong>학생정보 저장</strong>
      </Button>
      <Button
        variant="secondary"
        className="btn-Infocommit btn-cancel"
        onClick={async () => {
          if(!window.confirm(`${stuInfo["이름"]}학생을 졸업 처리 하시겠습니까?\n졸업 처리 이후에는 메인 화면에 학생이 표시되지 않습니다.`))
            return;
          const studentInfo={"studentLegacyID":paramID};
          await axios
            .post(`/api/DoGraduate/`,studentInfo)
            .then((result)=>{
              if(result.data === "로그인필요"){
                window.alert("로그인이 필요합니다.");
                return history.push("/");
              }
              else if(result.data["ret"] && result.data["success"]){
                window.alert("성공적으로 졸업 처리 되었습니다");
                return history.push("/studentList");
              }
              else{
                window.alert(`졸업처리 중 오류가 발생했습니다`);
                window.alert(`ret val: ${result.data["ret"]}`);
              }
            })
            .catch((err)=>{
              window.alert(`졸업처리 중 오류가 발생했습니다.\n${err}`);
            });
        }}
      >
        <strong>센터 졸업 처리</strong>
      </Button>
      <Button
        variant="secondary"
        className="btn-Infocommit btn-cancel"
        onClick={() => {
          if (
            window.confirm(
              `${stuInfo.이름} 학생의 정보를 정말 삭제하시겠습니까?`
            )
          ) {
            axios
              .delete(`/api/StudentDB/${stuInfo["ID"]}`)
              .then(function (result) {
                if (result.data === true) {
                  window.alert("삭제되었습니다.");
                  return history.push("/studentList");
                } else if (result.data === "로그인필요") {
                  window.alert("로그인이 필요합니다.");
                  return history.push("/");
                } else {
                  console.log(result.data);
                  window.alert(result.data);
                }
              })
              .catch(function (err) {
                window.alert(
                  "삭제에 실패했습니다 개발/데이터 팀에게 문의해주세요"
                );
              })
          }
        }}
      >
        <strong>학생정보 삭제</strong>
      </Button>
    </div>
  );
}

export default StuInfoEdit;
