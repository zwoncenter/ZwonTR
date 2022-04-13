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

import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect } from "react";
import axios from "axios";
import stupic from "../student.png";

function StuInfo(props) {
  const [historyTextarea, setHistoryTextarea] = useState(false);
  let history = useHistory();
  const managerList = props.managerList;
  
  const writeform = {
    이름: "",
    생년월일: "",
    프로그램시작일: "",
    연락처: "",
    연락처_부: "",
    연락처_모: "",
    주소: "",
    혈액형: "",
    최종학력: "",

    직업_부: "",
    직업_모: "",
    학생과_더_친한분: "",
    학생과_사이가_더_나쁜분: "",
    형제자매_및_관계: "",
    조부모와의_관계: "",
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
  };

  function phoneNumber(value) {
    value = value.replace(/[^0-9]/g, "");
    return value
      .replace(/[^0-9]/, "")
      .replace(/^(\d{2,3})(\d{3,4})(\d{4})$/, `$1-$2-$3`);
  }
  const [contact, setContact] = useState("");
  const [dadcontact, setdadContact] = useState("");
  const [momcontact, setmomContact] = useState("");

  useEffect(() => {
    change_depth_one("연락처", contact);
  }, [contact]);
  useEffect(() => {
    change_depth_one("연락처_부", dadcontact);
  }, [dadcontact]);
  useEffect(() => {
    change_depth_one("연락처_모", momcontact);
  }, [momcontact]);

  const [stuInfo, setstuInfo] = useState(writeform);

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

  function push_depth_one(category, content) {
    const newstuInfo = JSON.parse(JSON.stringify(stuInfo));
    newstuInfo[category].push(content);
    setstuInfo(newstuInfo);
  }

  console.log(stuInfo);

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
                      <Form.Control
                        type="text"
                        onChange={(e) => {
                          change_depth_one("이름", e.target.value);
                        }}
                      />
                    </Col>
                  </Form.Group>

                  <Form.Group as={Row} className="col-xl-6">
                    <Form.Label column sm="4" className="fs-6">
                      <p>
                        <strong>생년월일</strong>
                      </p>
                    </Form.Label>
                    <Col>
                      <Form.Control
                        type="date"
                        onChange={(e) => {
                          change_depth_one("생년월일", e.target.value);
                        }}
                      />
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
                        onChange={(e) => {
                          change_depth_one("프로그램시작일", e.target.value);
                        }}
                      />
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
                        onChange={(e) => {
                          setContact(phoneNumber(e.target.value));
                          change_depth_one("연락처", contact);
                        }}
                        value={contact}
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
                          change_depth_one("연락처_부", dadcontact);
                        }}
                        value={dadcontact}
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
                          change_depth_one("연락처_모", momcontact);
                        }}
                        value={momcontact}
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
                        onChange={(e) => {
                          change_depth_one("최종학력", e.target.value);
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
            <div className="row">
              <Form.Group as={Row} className="col-xl-6">
                <Form.Label column sm="4" className="fs-6">
                  <p>
                    <strong>부 직업</strong>
                  </p>
                </Form.Label>
                <Col>
                  <Form.Control
                    type="text"
                    onChange={(e) => {
                      change_depth_one("직업_부", e.target.value);
                    }}
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="col-xl-6">
                <Form.Label column sm="4" className="fs-6">
                  <p>
                    <strong>모 직업</strong>
                  </p>
                </Form.Label>
                <Col>
                  <Form.Control
                    type="text"
                    onChange={(e) => {
                      change_depth_one("직업_모", e.target.value);
                    }}
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="col-xl-6">
                <Form.Label column sm="4" className="fs-6">
                  <p>
                    <strong>학생과 더 친한 분</strong>
                  </p>
                </Form.Label>
                <Col>
                  <Form.Control
                    type="text"
                    onChange={(e) => {
                      change_depth_one("학생과_더_친한분", e.target.value);
                    }}
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="col-xl-6">
                <Form.Label column sm="4" className="fs-6">
                  <p>
                    <strong>학생과 사이가 더 나쁜 분</strong>
                  </p>
                </Form.Label>
                <Col>
                  <Form.Control
                    type="text"
                    onChange={(e) => {
                      change_depth_one(
                        "학생과_사이가_더_나쁜분",
                        e.target.value
                      );
                    }}
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="col-xl-6">
                <Form.Label column sm="4" className="fs-6">
                  <p>
                    <strong>형제 자매 및 관계</strong>
                  </p>
                </Form.Label>
                <Col>
                  <Form.Control
                    type="text"
                    onChange={(e) => {
                      change_depth_one("형제자매_및_관계", e.target.value);
                    }}
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="col-xl-6">
                <Form.Label column sm="4" className="fs-6">
                  <p>
                    <strong>조부모와의 관계</strong>
                  </p>
                </Form.Label>
                <Col>
                  <Form.Control
                    type="text"
                    onChange={(e) => {
                      change_depth_one("조부모와의_관계", e.target.value);
                    }}
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="col-xl-6">
                <Form.Label column sm="4" className="fs-6">
                  <p>
                    <strong>재산</strong>
                  </p>
                </Form.Label>
                <Col>
                  <Form.Control
                    type="text"
                    onChange={(e) => {
                      change_depth_one("재산", e.target.value);
                    }}
                  />
                </Col>
              </Form.Group>

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
                              className="fs-6"
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
                          <Form.Group as={Row}>
                            <Form.Label column sm="4" className="fs-6">
                              <p>
                                <strong>성향</strong>
                              </p>
                            </Form.Label>
                            <Col>
                              <Form.Control
                                type="text"
                                onChange={(e) => {
                                  change_depth_one(
                                    "부모성향_부",
                                    e.target.value
                                  );
                                }}
                              />
                            </Col>
                            <Col>
                              <Form.Control
                                type="text"
                                onChange={(e) => {
                                  change_depth_one(
                                    "부모성향_모",
                                    e.target.value
                                  );
                                }}
                              />
                            </Col>
                          </Form.Group>
                          <Form.Group as={Row}>
                            <Form.Label column sm="4" className="fs-6">
                              <p>
                                <strong>감정</strong>
                              </p>
                            </Form.Label>
                            <Col>
                              <Form.Control
                                type="text"
                                onChange={(e) => {
                                  change_depth_one(
                                    "부모감정_부",
                                    e.target.value
                                  );
                                }}
                              />
                            </Col>
                            <Col>
                              <Form.Control
                                type="text"
                                onChange={(e) => {
                                  change_depth_one(
                                    "부모감정_모",
                                    e.target.value
                                  );
                                }}
                              />
                            </Col>
                          </Form.Group>
                          <Form.Group as={Row}>
                            <Form.Label column sm="4" className="fs-6">
                              <p>
                                <strong>수용 수준</strong>
                              </p>
                            </Form.Label>
                            <Col>
                              <Form.Control
                                type="text"
                                onChange={(e) => {
                                  change_depth_one(
                                    "부모수용수준_부",
                                    e.target.value
                                  );
                                }}
                              />
                            </Col>
                            <Col>
                              <Form.Control
                                type="text"
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
                          <Form.Group as={Row}>
                            <Form.Label column sm="4" className="fs-6">
                              <p>
                                <strong>생활</strong>
                              </p>
                            </Form.Label>
                            <Col>
                              <Form.Control
                                type="text"
                                onChange={(e) => {
                                  change_depth_one(
                                    "부모님고민_생활",
                                    e.target.value
                                  );
                                }}
                              />
                            </Col>
                          </Form.Group>
                          <Form.Group as={Row}>
                            <Form.Label column sm="4" className="fs-6">
                              <p>
                                <strong>목표 및 동기</strong>
                              </p>
                            </Form.Label>
                            <Col>
                              <Form.Control
                                type="text"
                                onChange={(e) => {
                                  change_depth_one(
                                    "부모님고민_목표및동기",
                                    e.target.value
                                  );
                                }}
                              />
                            </Col>
                          </Form.Group>
                          <Form.Group as={Row}>
                            <Form.Label column sm="4" className="fs-6">
                              <p>
                                <strong>학습</strong>
                              </p>
                            </Form.Label>
                            <Col>
                              <Form.Control
                                type="text"
                                onChange={(e) => {
                                  change_depth_one(
                                    "부모님고민_학습",
                                    e.target.value
                                  );
                                }}
                              />
                            </Col>
                          </Form.Group>
                          <Form.Group as={Row}>
                            <Form.Label column sm="4" className="fs-6">
                              <p>
                                <strong>인성</strong>
                              </p>
                            </Form.Label>
                            <Col>
                              <Form.Control
                                type="text"
                                onChange={(e) => {
                                  change_depth_one(
                                    "부모님고민_인성",
                                    e.target.value
                                  );
                                }}
                              />
                            </Col>
                          </Form.Group>
                          <Form.Group as={Row}>
                            <Form.Label column sm="4" className="fs-6">
                              <p>
                                <strong>현재 폰기종</strong>
                              </p>
                            </Form.Label>
                            <Col>
                              <Form.Control
                                type="text"
                                onChange={(e) => {
                                  change_depth_one(
                                    "부모님고민_현재폰기종",
                                    e.target.value
                                  );
                                }}
                              />
                            </Col>
                          </Form.Group>
                          <Form.Group as={Row}>
                            <Form.Label column sm="4" className="fs-6">
                              <p>
                                <strong>현재1주용돈</strong>
                              </p>
                            </Form.Label>
                            <Col>
                              <Form.Control
                                type="text"
                                onChange={(e) => {
                                  change_depth_one(
                                    "부모님고민_현재1주용돈",
                                    e.target.value
                                  );
                                }}
                              />
                            </Col>
                          </Form.Group>
                          <Form.Group as={Row}>
                            <Form.Label column sm="4" className="fs-6">
                              <p>
                                <strong>불법행위여부</strong>
                              </p>
                            </Form.Label>
                            <Col>
                              <Form.Control
                                type="text"
                                onChange={(e) => {
                                  change_depth_one(
                                    "부모님고민_불법행위여부",
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
            </div>
          </Card>
        </div>

        <div className="col-12">
          <Card className="stuInfoCard mt-3">
            <h4 className="stuInfoCard-title mb-4">
              <strong>[ 건강상태 ]</strong>
            </h4>
            <div className="row">
              <Form.Group as={Row} className="col-xl-4">
                <Form.Label column sm="4" className="fs-6">
                  <p>
                    <strong>키</strong>
                  </p>
                </Form.Label>
                <Col>
                  <Form.Control
                    type="text"
                    onChange={(e) => {
                      change_depth_one("키", e.target.value);
                    }}
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="col-xl-4">
                <Form.Label column sm="4" className="fs-6">
                  <p>
                    <strong>몸무게</strong>
                  </p>
                </Form.Label>
                <Col>
                  <Form.Control
                    type="text"
                    onChange={(e) => {
                      change_depth_one("몸무게", e.target.value);
                    }}
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="col-xl-4">
                <Form.Label column sm="4" className="fs-6">
                  <p>
                    <strong>체지방률</strong>
                  </p>
                </Form.Label>
                <Col>
                  <Form.Control
                    type="text"
                    onChange={(e) => {
                      change_depth_one("체지방률", e.target.value);
                    }}
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="col-xl-4">
                <Form.Label column sm="4" className="fs-6">
                  <p>
                    <strong>BMI</strong>
                  </p>
                </Form.Label>
                <Col>
                  <Form.Control
                    type="text"
                    onChange={(e) => {
                      change_depth_one("BMI", e.target.value);
                    }}
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="col-xl-4">
                <Form.Label column sm="4" className="fs-6">
                  <p>
                    <strong>운동량</strong>
                  </p>
                </Form.Label>
                <Col>
                  <Form.Control
                    type="text"
                    onChange={(e) => {
                      change_depth_one("운동량", e.target.value);
                    }}
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="col-xl-4">
                <Form.Label column sm="4" className="fs-6">
                  <p>
                    <strong>평균 수면시간</strong>
                  </p>
                </Form.Label>
                <Col>
                  <Form.Control
                    type="text"
                    onChange={(e) => {
                      change_depth_one("평균수면시간", e.target.value);
                    }}
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="col-xl-4">
                <Form.Label column sm="4" className="fs-6">
                  <p>
                    <strong>식습관</strong>
                  </p>
                </Form.Label>
                <Col>
                  <Form.Control
                    type="text"
                    onChange={(e) => {
                      change_depth_one("식습관", e.target.value);
                    }}
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="col-xl-4">
                <Form.Label column sm="4" className="fs-6">
                  <p>
                    <strong>정신건강</strong>
                  </p>
                </Form.Label>
                <Col>
                  <Form.Control
                    type="text"
                    onChange={(e) => {
                      change_depth_one("정신건강", e.target.value);
                    }}
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="col-xl-4">
                <Form.Label column sm="4" className="fs-6">
                  <p>
                    <strong>과거병력</strong>
                  </p>
                </Form.Label>
                <Col>
                  <Form.Control
                    type="text"
                    onChange={(e) => {
                      change_depth_one("과거병력", e.target.value);
                    }}
                  />
                </Col>
              </Form.Group>
            </div>
          </Card>
        </div>

        <div className="col-12">
          <Card className="stuInfoCard mt-3">
            <h4 className="stuInfoCard-title mb-4">
              <strong>[ 대인관계 ]</strong>
            </h4>
            <div className="row">
              <Form.Group as={Row} className="col-xl-6">
                <Form.Label column sm="4" className="fs-6">
                  <p>
                    <strong>연인</strong>
                  </p>
                </Form.Label>
                <Col>
                  <Form.Control
                    type="text"
                    onChange={(e) => {
                      change_depth_one("연인", e.target.value);
                    }}
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="col-xl-6">
                <Form.Label column sm="4" className="fs-6">
                  <p>
                    <strong>친구</strong>
                  </p>
                </Form.Label>
                <Col>
                  <Form.Control
                    type="text"
                    onChange={(e) => {
                      change_depth_one("친구", e.target.value);
                    }}
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="col-xl-6">
                <Form.Label column sm="4" className="fs-6">
                  <p>
                    <strong>친구들 성향</strong>
                  </p>
                </Form.Label>
                <Col>
                  <Form.Control
                    type="text"
                    onChange={(e) => {
                      change_depth_one("친구들_성향", e.target.value);
                    }}
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="col-xl-6">
                <Form.Label column sm="4" className="fs-6">
                  <p>
                    <strong>매니저와의 관계</strong>
                  </p>
                </Form.Label>
                <Col>
                  <Form.Control
                    type="text"
                    onChange={(e) => {
                      change_depth_one("매니저와의_관계", e.target.value);
                    }}
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="col-xl-6">
                <Form.Label column sm="4" className="fs-6">
                  <p>
                    <strong>가장 친한 매니저</strong>
                  </p>
                </Form.Label>
                <Col>
                  <Form.Control
                    type="text"
                    onChange={(e) => {
                      change_depth_one("가장_친한_매니저", e.target.value);
                    }}
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="col-xl-6">
                <Form.Label column sm="4" className="fs-6">
                  <p>
                    <strong>센터 내 가장 친한 학생</strong>
                  </p>
                </Form.Label>
                <Col>
                  <Form.Control
                    type="text"
                    onChange={(e) => {
                      change_depth_one("센터내_가장_친한_학생", e.target.value);
                    }}
                  />
                </Col>
              </Form.Group>
            </div>
          </Card>
        </div>

        <div className="col-12">
          <Card className="stuInfoCard mt-3">
            <h4 className="stuInfoCard-title mb-4">
              <strong>[ 유형검사 ]</strong>
            </h4>
            <div className="row">
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

              <Form.Group as={Row} className="col-xl-6">
                <Form.Label column sm="4" className="fs-6">
                  <p>
                    <strong>에니어그램</strong>
                  </p>
                </Form.Label>
                <Col>
                  <Form.Control
                    type="text"
                    onChange={(e) => {
                      change_depth_one("애니어그램", e.target.value);
                    }}
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="col-xl-6">
                <Form.Label column sm="4" className="fs-6">
                  <p>
                    <strong>별자리</strong>
                  </p>
                </Form.Label>
                <Col>
                  <Form.Control
                    type="text"
                    onChange={(e) => {
                      change_depth_one("별자리", e.target.value);
                    }}
                  />
                </Col>
              </Form.Group>

              <Form.Group as={Row} className="col-xl-6">
                <Form.Label column sm="4" className="fs-6">
                  <p>
                    <strong>IQ</strong>
                  </p>
                </Form.Label>
                <Col>
                  <Form.Control
                    type="text"
                    onChange={(e) => {
                      change_depth_one("IQ", e.target.value);
                    }}
                  />
                </Col>
              </Form.Group>
            </div>
          </Card>
        </div>

        <div className="col-12">
          <Card className="stuInfoCard mt-3">
            <h4 className="stuInfoCard-title mb-4">
              <strong>[ 히스토리 ]</strong>
            </h4>
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
                push_depth_one("히스토리", {
                  날짜: "",
                  작성매니저: "",
                  내용: "",
                });
              }}
            >
              <strong>+</strong>
            </button>
            <div className="historyCard">
            {stuInfo.히스토리.map(function (a, i) {
              return (
                  <div key={i} className="row m-2">
                    <Col className="col-2">
                      <Form.Control
                        type="date"
                        onChange={(e) => {
                          change_depth_three(
                            "히스토리",
                            i,
                            "날짜",
                            e.target.value
                          );
                        }}
                      />
                    </Col>
                    <Col className="col-2">
                      <Form.Select
                        value={a.매니저}
                        onChange={(e) => {
                          change_depth_three(
                            "히스토리",
                            i,
                            "작성매니저",
                            e.target.value
                          );
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
                          change_depth_three(
                            "히스토리",
                            i,
                            "내용",
                            e.target.value
                          );
                        }}
                      />
                    </Col>
                  </div>
              );
            })}
            </div>
          </Card>
        </div>
      </div>
      <Button
            variant="danger"
            className="btn-Infocommit btn-edit"
            // onClick={() => {
            //   console.log(writeform);
            //   if (입력확인()) {
            //     if (window.confirm(`${writeform.이름}학생의 기본정보를 저장하시겠습니까?`)) {
            //       axios
            //         .post("/api/TR/write", writeform)
            //         .then(function (result) {
            //           if (result.data === true) {
            //             window.alert("저장되었습니다.");
            //             history.push("/studentList");
            //           } else if (result.data === "로그인필요") {
            //             window.alert("로그인이 필요합니다.");
            //             return history.push("/");
            //           } else {
            //             console.log(result.data);
            //             window.alert(result.data);
            //           }
            //         })
            //         .catch(function (err) {
            //           console.log("저장 실패 : ", err);
            //           window.alert(err);
            //         });
            //     }
            //   }
            // }}
            >
            <strong>학생정보 저장</strong>
          </Button>
    </div>
  );
}

export default StuInfo;
