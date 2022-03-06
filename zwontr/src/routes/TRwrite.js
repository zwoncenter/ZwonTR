import "./TRWriteEdit.scss";
import { Form, Button, Card, ListGroup, Table, Modal, Row, Col } from "react-bootstrap";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import TimePicker from "react-time-picker";

function TRwrite(props) {
  let history = useHistory();
  var managerList = props.managerList;
  const [stuDB, setstuDB] = useState(props.stuDB);
  const [TR, TR변경] = useState({
    이름: stuDB.이름,
    날짜: new Date().toISOString().split("T")[0],
    작성매니저: "",

    결석여부: false,
    결석사유: "",
    결석상세내용: "",

    신체컨디션: "",
    정서컨디션: "",

    목표취침: "",
    실제취침: "",
    목표기상: "",
    실제기상: "",
    목표등원: "",
    실제등원: "",
    목표귀가: "",
    실제귀가: "",
    목표학습: "",
    실제학습: 0,

    취침차이: 0,
    기상차이: 0,
    등원차이: 0,
    귀가차이: 0,
    학습차이: 0,

    학습: [],
    학습태도: [
      { 분류: "글씨 불량", 문제여부: false },
      { 분류: "채점 안함", 문제여부: false },
      { 분류: "틀린문제만 채점함", 문제여부: false },
      { 분류: "계산 실수", 문제여부: false },
      { 분류: "오답분석 안함", 문제여부: false },
      { 분류: "학습량 부족", 문제여부: false },
      { 분류: "테스트 X", 문제여부: false },
      { 분류: "국어,영어 : 선지분석 안함", 문제여부: false },
      { 분류: "수학 : 풀이 부정확", 문제여부: false },
      { 분류: "이해 못해도 맞으면 넘김", 문제여부: false },
      { 분류: "노트 풀이 정돈 X", 문제여부: false },
    ],
    문제행동: [
      { 분류: "자해", 문제여부: false },
      { 분류: "자기비하", 문제여부: false },
      { 분류: "감정기복", 문제여부: false },
      { 분류: "메타인지 부족", 문제여부: false },
      { 분류: "중도포기 / 탈주", 문제여부: false },
      { 분류: "TR작성 미흡", 문제여부: false },
      { 분류: "불법행위", 문제여부: false },
      { 분류: "거짓말/핑계/변명", 문제여부: false },
      { 분류: "위생문제", 문제여부: false },
      { 분류: "지각", 문제여부: false },
      { 분류: "괴롭힘/싸움", 문제여부: false },
      { 분류: "부모님께 무례", 문제여부: false },
      { 분류: "연락무시/잠수", 문제여부: false },
      { 분류: "자리정리 안함", 문제여부: false },
    ],

    프로그램시간: 0,

    프로그램: [],
    매니저피드백: "",
    큐브책: [],
  });

  function 입력확인() {
    if (!TR.날짜) {
      window.alert("일간하루 날짜가 입력되지 않았습니다.");
      return false;
    }
    if (!TR.작성매니저) {
      window.alert("일간하루 작성매니저가 선택되지 않았습니다.");
      return false;
    }
    if (TR.결석여부) {
      if (!TR.결석사유) {
        window.alert("결석사유가 선택되지 않았습니다.");
        return false;
      }
      return true;
    }
    if (!TR.신체컨디션) {
      window.alert("신체컨디션이 선택되지 않았습니다.");
      return false;
    }

    if (!TR.정서컨디션) {
      window.alert("정서컨디션이 선택되지 않았습니다.");
      return false;
    }
    if (TR.학습) {
      for (let i = 0; i < TR.학습.length; i++) {
        if (TR.학습[i].과목 == "선택") {
          window.alert(`${i + 1}번째 학습의 과목이 선택되지 않았습니다.`);
          return false;
        }
        if (TR.학습[i].교재 == "선택") {
          window.alert(`${i + 1}번째 학습의 교재가 선택되지 않았습니다.`);
          return false;
        }
        if (TR.학습[i].최근진도 < 0) {
          window.alert(`${i + 1}번째 학습의 최근진도가 입력되지 않았습니다.`);
          return false;
        }
        if (!TR.학습[i].학습시간) {
          window.alert(`${i + 1}번째 학습의 학습시간이 입력되지 않았습니다.`);
          return false;
        }
      }
    }
    if (isNaN(TR.실제학습)) {
      window.alert("학습 시간의 값이 NaN입니다. 수정 후 다시시도해 주세요.");
      return false;
    }

    if (isNaN(TR.프로그램시간)) {
      window.alert("프로그램 시간의 값이 NaN입니다. 수정 후 다시시도해 주세요.");
      return false;
    }
    return true;
  }

  function 차이계산(목표, 실제) {
    if (!목표 || !실제) {
      return NaN;
    }
    let [목표시간, 목표분] = 목표.split(":");
    let [실제시간, 실제분] = 실제.split(":");
    let diff = parseInt(목표시간) - parseInt(실제시간) + (parseInt(목표분) - parseInt(실제분)) / 60;
    if (diff < -12) {
      diff += 24;
    } else if (diff > 12) {
      diff -= 24;
    }

    return parseFloat(diff.toFixed(1));
  }

  function 차이출력(diff, 종류) {
    if (diff < 0) {
      diff = -diff;
      return diff.toFixed(1) + "시간 늦게 " + 종류;
    } else if (diff > 0) {
      return diff.toFixed(1) + "시간 일찍 " + 종류;
    } else {
      return "정시 " + 종류;
    }
  }

  function change_depth_one(category, data) {
    const newTR = JSON.parse(JSON.stringify(TR));
    newTR[category] = data;
    TR변경(newTR);
  }

  function change_depth_two(category1, category2, data) {
    const newTR = JSON.parse(JSON.stringify(TR));
    newTR[category1][category2] = data;
    TR변경(newTR);
  }

  function change_depth_three(category1, category2, category3, data) {
    const newTR = JSON.parse(JSON.stringify(TR));
    newTR[category1][category2][category3] = data;
    TR변경(newTR);
  }

  function delete_depth_one(category, index) {
    const newTR = JSON.parse(JSON.stringify(TR));
    newTR[category].splice(index, 1);
    TR변경(newTR);
  }

  function push_depth_one(category, content) {
    const newTR = JSON.parse(JSON.stringify(TR));
    newTR[category].push(content);
    TR변경(newTR);
  }

  // 학생DB에 있는 생활학습목표 및 진행중교재 추가
  const isInitialMount = useRef(true);

  useEffect(async () => {
    const newTR = JSON.parse(JSON.stringify(TR));
    stuDB.진행중교재.map(function (a, i) {
      newTR.학습.push({
        과목: a.과목,
        교재: a.교재,
        총교재량: a.총교재량,
        최근진도: -1,
        학습시간: "",
      });
    });
    stuDB.큐브책.map(function (a, i) {
      newTR.큐브책.push({
        할일: a,
        완료여부: false,
      });
    });

    const tmp = new Date(TR.날짜);

    if (tmp.getDay() === 0) {
      newTR["목표취침"] = stuDB.생활학습목표.일요일취침;
      newTR["실제취침"] = stuDB.생활학습목표.일요일취침;
      newTR["목표기상"] = stuDB.생활학습목표.일요일기상;
      newTR["실제기상"] = stuDB.생활학습목표.일요일기상;
      newTR["목표등원"] = stuDB.생활학습목표.일요일등원;
      newTR["실제등원"] = stuDB.생활학습목표.일요일등원;
      newTR["목표귀가"] = stuDB.생활학습목표.일요일귀가;
      newTR["실제귀가"] = stuDB.생활학습목표.일요일귀가;
      newTR["목표학습"] = stuDB.생활학습목표.일요일학습;
    } else {
      newTR["목표취침"] = stuDB.생활학습목표.평일취침;
      newTR["실제취침"] = stuDB.생활학습목표.평일취침;
      newTR["목표기상"] = stuDB.생활학습목표.평일기상;
      newTR["실제기상"] = stuDB.생활학습목표.평일기상;
      newTR["목표등원"] = stuDB.생활학습목표.평일등원;
      newTR["실제등원"] = stuDB.생활학습목표.평일등원;
      newTR["목표귀가"] = stuDB.생활학습목표.평일귀가;
      newTR["실제귀가"] = stuDB.생활학습목표.평일귀가;
      newTR["목표학습"] = stuDB.생활학습목표.평일학습;
    }

    ["취침", "기상", "등원", "귀가"].forEach((a) => {
      newTR[`${a}차이`] = 차이계산(newTR[`목표${a}`], newTR[`실제${a}`]);
    });

    await TR변경(newTR);

    isInitialMount.current = false;
  }, []);

  useEffect(() => {
    if (!isInitialMount.current) {
      const newTR = JSON.parse(JSON.stringify(TR));
      const tmp = new Date(TR.날짜);

      if (tmp.getDay() === 0) {
        newTR["목표취침"] = stuDB.생활학습목표.일요일취침;
        newTR["실제취침"] = stuDB.생활학습목표.일요일취침;
        newTR["목표기상"] = stuDB.생활학습목표.일요일기상;
        newTR["실제기상"] = stuDB.생활학습목표.일요일기상;
        newTR["목표등원"] = stuDB.생활학습목표.일요일등원;
        newTR["실제등원"] = stuDB.생활학습목표.일요일등원;
        newTR["목표귀가"] = stuDB.생활학습목표.일요일귀가;
        newTR["실제귀가"] = stuDB.생활학습목표.일요일귀가;
        newTR["목표학습"] = stuDB.생활학습목표.일요일학습;
      } else {
        newTR["목표취침"] = stuDB.생활학습목표.평일취침;
        newTR["실제취침"] = stuDB.생활학습목표.평일취침;
        newTR["목표기상"] = stuDB.생활학습목표.평일기상;
        newTR["실제기상"] = stuDB.생활학습목표.평일기상;
        newTR["목표등원"] = stuDB.생활학습목표.평일등원;
        newTR["실제등원"] = stuDB.생활학습목표.평일등원;
        newTR["목표귀가"] = stuDB.생활학습목표.평일귀가;
        newTR["실제귀가"] = stuDB.생활학습목표.평일귀가;
        newTR["목표학습"] = stuDB.생활학습목표.평일학습;
      }
      TR변경(newTR);
    }
  }, [TR.날짜]);

  useEffect(() => {
    if (!isInitialMount.current) {
      const newTR = JSON.parse(JSON.stringify(TR));
      ["취침", "기상", "등원", "귀가"].forEach((a) => {
        newTR[`${a}차이`] = 차이계산(newTR[`목표${a}`], newTR[`실제${a}`]);
      });
      TR변경(newTR);
    }
  }, [TR.목표취침, TR.실제취침, TR.목표기상, TR.실제기상, TR.목표등원, TR.실제등원, TR.목표귀가, TR.실제귀가, TR.목표학습, TR.실제학습]);

  return (
    <div className="trEdit-background">
      <div className="row">
        <div className="col-xl-6 trCol">
          <div>
            <div className="row m-0 trCard">
              <div className="col-2">
                <p className="fw-bold">[ 이름 ]</p>
                <p>{TR.이름}</p>
              </div>
              <div className="col-3">
                <p className="fw-bold">[ 날짜 ]</p>
                <input
                  type="date"
                  defaultValue={TR.날짜}
                  className="w-100"
                  onChange={(e) => {
                    change_depth_one("날짜", e.target.value);
                  }}
                />
              </div>
              <div className="col-3">
                <p className="fw-bold">[ 작성매니저 ]</p>
                <Form.Select
                  size="sm"
                  onChange={(e) => {
                    change_depth_one("작성매니저", e.target.value);
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
              </div>
              <div className="col-2 p-0">
                <button
                  className="btn btn-TRcommit btn-attend"
                  onClick={() => {
                    console.log(TR);
                    change_depth_one("결석여부", false);
                  }}
                >
                  <strong>등원</strong>
                </button>
              </div>
              <div className="col-2 p-0">
                <button
                  className="btn btn-TRcommit btn-absent"
                  onClick={() => {
                    if (window.confirm("입력된 생활 및 학습 등이 삭제됩니다. 결석으로 전환하시겠습니까?")) {
                      console.log(TR);
                      change_depth_one("결석여부", true);
                    }
                  }}
                >
                  <strong>결석</strong>
                </button>
              </div>
            </div>

            {TR.결석여부 === false ? (
              <div className="mt-3">
                <div className="trCard">
                  <Form.Group as={Row}>
                    <Form.Label column sm="2">
                      <strong>[ 신체 컨디션 ]</strong>
                    </Form.Label>
                    <Col sm="10">
                      <Form.Select
                        size="sm"
                        onChange={(e) => {
                          change_depth_one("신체컨디션", parseInt(e.target.value));
                        }}
                      >
                        <option value="선택">선택</option>
                        <option value={5}>매우 좋음</option>
                        <option value={4}> 좋음</option>
                        <option value={3}>보통</option>
                        <option value={2}> 안좋음</option>
                        <option value={1}>매우 안좋음</option>
                      </Form.Select>
                    </Col>
                  </Form.Group>
                  <Form.Group as={Row} className="mb-3">
                    <Form.Label column sm="2">
                      <strong>[ 정서 컨디션 ]</strong>
                    </Form.Label>
                    <Col sm="10">
                      <Form.Select
                        size="sm"
                        onChange={(e) => {
                          change_depth_one("정서컨디션", parseInt(e.target.value));
                        }}
                      >
                        <option value="선택">선택</option>
                        <option value={5}>매우 좋음</option>
                        <option value={4}> 좋음</option>
                        <option value={3}>보통</option>
                        <option value={2}> 안좋음</option>
                        <option value={1}>매우 안좋음</option>
                      </Form.Select>
                    </Col>
                  </Form.Group>
                  <Table striped hover size="sm" className="mt-0">
                    <thead>
                      <tr>
                        <th width="15%">생활</th>
                        <th width="25%">목표</th>
                        <th width="25%">실제</th>
                        <th>차이</th>
                      </tr>
                    </thead>
                    <tbody>
                      {["취침", "기상", "등원", "귀가"].map(function (a, i) {
                        return (
                          <tr key={i}>
                            <td>{a}</td>
                            <td>
                              <TimePicker
                                locale="sv-sv"
                                value={TR[`목표${a}`]}
                                openClockOnFocus={false}
                                clearIcon={null}
                                clockIcon={null}
                                onChange={(value) => {
                                  const newTR = JSON.parse(JSON.stringify(TR));
                                  newTR[`목표${a}`] = value;
                                  TR변경(newTR);
                                }}
                              ></TimePicker>
                            </td>

                            <td>
                              <TimePicker
                                className="timepicker"
                                locale="sv-sv"
                                value={TR[`실제${a}`]}
                                openClockOnFocus={false}
                                clearIcon={null}
                                clockIcon={null}
                                onChange={(value) => {
                                  const newTR = JSON.parse(JSON.stringify(TR));
                                  newTR[`실제${a}`] = value;
                                  TR변경(newTR);
                                }}
                              ></TimePicker>
                            </td>
                            <td>{차이출력(TR[`${a}차이`], a)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>
                </div>

                <div className="trCard">
                  <Table striped hover size="sm">
                    <thead>
                      <tr>
                        <th width="15%">학습</th>
                        <th>교재</th>
                        <th width="15%">총교재량</th>
                        <th width="15%">최근진도</th>
                        <th width="15%">학습시간</th>
                        <th width="10%"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {TR.학습.map(function (a, i) {
                        return (
                          <tr key={i}>
                            <td>
                              <Form.Select
                                size="sm"
                                onChange={(e) => {
                                  change_depth_three("학습", i, "과목", e.target.value);
                                }}
                              >
                                <option>{a.과목}</option>
                                <option value="선택">선택</option>
                                <option value="국어">국어</option>
                                <option value="수학">수학</option>
                                <option value="영어">영어</option>
                                <option value="탐구">탐구</option>
                                <option value="기타">기타</option>
                              </Form.Select>
                            </td>
                            <td>
                              <Form.Select
                                size="sm"
                                onChange={(e) => {
                                  change_depth_three("학습", i, "교재", e.target.value);
                                }}
                              >
                                <option>{a.교재}</option>
                                <option value="선택">선택</option>
                                <option value="모의고사">모의고사</option>
                                <option value="테스트">테스트</option>q<option value="기타">기타</option>
                              </Form.Select>
                            </td>
                            <td>
                              <p className="fs-13px">{a.총교재량}</p>
                            </td>
                            <td>
                              <input
                                type="number"
                                placeholder="-1"
                                className="inputText"
                                onChange={(e) => {
                                  change_depth_three("학습", i, "최근진도", parseInt(e.target.value));
                                }}
                              />
                            </td>
                            <td>
                              <TimePicker
                                className="timepicker"
                                locale="sv-sv"
                                value="00:00"
                                openClockOnFocus={false}
                                clearIcon={null}
                                clockIcon={null}
                                onChange={(value) => {
                                  var newTR = JSON.parse(JSON.stringify(TR));
                                  newTR.학습[i].학습시간 = value;
                                  let 실제학습시간 = 0;
                                  let 실제학습분 = 0;
                                  newTR.학습.map(function (b, j) {
                                    if (b.학습시간) {
                                      실제학습시간 += parseInt(b.학습시간.split(":")[0]);
                                      실제학습분 += parseInt(b.학습시간.split(":")[1]);
                                    }
                                  });
                                  newTR.실제학습 = parseFloat((실제학습시간 + 실제학습분 / 60).toFixed(1));
                                  TR변경(newTR);
                                }}
                              ></TimePicker>
                            </td>
                            <td>
                              <button
                                className="btn btn-delete"
                                onClick={() => {
                                  if (i > -1) {
                                    if (window.confirm("삭제하시겠습니까?")) {
                                      var newTR = JSON.parse(JSON.stringify(TR));
                                      newTR.학습.splice(i, 1);
                                      let 실제학습시간 = 0;
                                      let 실제학습분 = 0;
                                      newTR.학습.map(function (b, j) {
                                        if (b.학습시간) {
                                          실제학습시간 += parseInt(b.학습시간.split(":")[0]);
                                          실제학습분 += parseInt(b.학습시간.split(":")[1]);
                                        }
                                      });
                                      newTR.실제학습 = parseFloat((실제학습시간 + 실제학습분 / 60).toFixed(1));
                                      TR변경(newTR);
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
                        <td colSpan={4}>목표 학습 - {TR.목표학습} 시간</td>
                        <td> {TR.실제학습} 시간</td>
                        <td>{(TR.실제학습 - TR.목표학습).toFixed(1)}시간</td>
                      </tr>
                      <tr>
                        <td colSpan={6}>
                          {" "}
                          <button
                            className="btn btn-add program-add"
                            onClick={() => {
                              push_depth_one("학습", {
                                과목: "선택",
                                교재: "선택",
                                총교재량: "",
                                최근진도: -1,
                                학습시간: "",
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

                <div className="trCard">
                  <Table striped hover size="sm">
                    <thead>
                      <tr>
                        <th width="20%">프로그램</th>
                        <th width="20%">매니저</th>
                        <th width="15%">소요시간</th>
                        <th width="35%">상세내용</th>
                        <th width="10%"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {TR.프로그램.map(function (a, i) {
                        return (
                          <tr key={i}>
                            <td>
                              <Form.Select
                                size="sm"
                                onChange={(e) => {
                                  change_depth_three("프로그램", i, "프로그램분류", e.target.value);
                                }}
                              >
                                <option>선택</option>
                                {stuDB.프로그램분류.map(function (p, j) {
                                  return (
                                    <option value={p} key={j}>
                                      {p}
                                    </option>
                                  );
                                })}
                              </Form.Select>
                            </td>
                            <td>
                              <Form.Select
                                size="sm"
                                onChange={(e) => {
                                  change_depth_three("프로그램", i, "매니저", e.target.value);
                                }}
                              >
                                <option>선택</option>
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
                              <TimePicker
                                className="timepicker"
                                locale="sv-sv"
                                value="00:00"
                                openClockOnFocus={false}
                                clearIcon={null}
                                clockIcon={null}
                                onChange={(value) => {
                                  var newTR = JSON.parse(JSON.stringify(TR));
                                  newTR.프로그램[i].소요시간 = value;
                                  let 실제시간 = 0;
                                  let 실제분 = 0;
                                  newTR.프로그램.map(function (c, k) {
                                    if (c.소요시간) {
                                      실제시간 += parseInt(c.소요시간.split(":")[0]);
                                      실제분 += parseInt(c.소요시간.split(":")[1]);
                                    }
                                  });
                                  newTR.프로그램시간 = parseFloat((실제시간 + 실제분 / 60).toFixed(1));
                                  TR변경(newTR);
                                }}
                              ></TimePicker>
                            </td>
                            <td>
                              <textarea
                                className="textArea"
                                name=""
                                id=""
                                rows="3"
                                placeholder="프로그램 상세내용/특이사항 입력"
                                onChange={(e) => {
                                  change_depth_three("프로그램", i, "상세내용", e.target.value);
                                }}
                              ></textarea>
                            </td>
                            <td>
                              <button
                                className="btn btn-delete"
                                onClick={() => {
                                  if (i > -1) {
                                    if (window.confirm("삭제하시겠습니까?")) {
                                      var newTR = JSON.parse(JSON.stringify(TR));
                                      newTR.프로그램.splice(i, 1);
                                      let 실제시간 = 0;
                                      let 실제분 = 0;
                                      newTR.프로그램.map(function (c, k) {
                                        if (c.소요시간) {
                                          실제시간 += parseInt(c.소요시간.split(":")[0]);
                                          실제분 += parseInt(c.소요시간.split(":")[1]);
                                        }
                                      });
                                      newTR.프로그램시간 = parseFloat((실제시간 + 실제분 / 60).toFixed(1));
                                      TR변경(newTR);
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
                        <td colSpan={5}>프로그램 진행 시간 : {TR.프로그램시간}시간</td>
                      </tr>
                      <tr>
                        <td colSpan={5}>
                          {" "}
                          <button
                            className="btn btn-add program-add"
                            onClick={() => {
                              push_depth_one("프로그램", {
                                프로그램분류: "",
                                매니저: "",
                                소요시간: "",
                                상세내용: "",
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
              </div>
            ) : (
              <div className="trCard mt-3">
                <Form.Select
                  size="sm"
                  onChange={(e) => {
                    change_depth_one("결석사유", e.target.value);
                  }}
                >
                  <option>결석사유 선택</option>
                  <option value="병가">병가</option>
                  <option value="무단">무단</option>
                  <option value="휴가">휴가</option>
                  <option value="구조적용중">"구조적용중"</option>
                  <option value="기타">기타</option>
                </Form.Select>
                <textarea
                  name=""
                  id=""
                  className="textArea mt-3"
                  placeholder="결석 사유를 입력"
                  onChange={(e) => {
                    change_depth_one("결석상세내용", e.target.value);
                  }}
                ></textarea>
              </div>
            )}
          </div>
        </div>

        <div className="col-xl-3 trCol">
          {TR.결석여부 === false ? (
            <div className="trCard">
              <>
                <h5 className="fw-bold mt-3 mb-3">
                  <strong>[ 학습태도 ]</strong>
                </h5>
                {TR.학습태도.map((prob, i) => (
                  <div key={`study-${prob.분류}`} className="mb-1 mt-1 checkBox">
                    <Form.Check
                      defaultValue={prob.문제여부}
                      className="border-bottom"
                      type="checkbox"
                      id={`study-${prob.분류}`}
                      label={`${prob.분류}`}
                      onChange={(e) => {
                        change_depth_three("학습태도", i, "문제여부", e.target.checked);
                      }}
                    />
                  </div>
                ))}
              </>
            </div>
          ) : null}
          <div className="trCard">
            <h5 className="fw-bold mt-3 mb-3">
              <strong>[ 문제행동 ]</strong>
            </h5>
            {TR.문제행동.map((prob, i) => (
              <div key={`study-${prob.분류}`} className="mb-1 mt-1 checkBox">
                <Form.Check
                  defaultValue={prob.문제여부}
                  className="border-bottom"
                  type="checkbox"
                  id={`study-${prob.분류}`}
                  label={`${prob.분류}`}
                  onChange={(e) => {
                    change_depth_three("문제행동", i, "문제여부", e.target.checked);
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        <div className="col-xl-3 trCol">
          <div className="trCard">
            <h5 className="fw-bold mt-3 mb-3">
              <strong>[ 큐브책 체크리스트 ]</strong>
            </h5>
            {TR.큐브책.map((a, i) => (
              <div key={i} className="mb-1 mt-1 checkBox">
                <Form.Check
                  className="border-bottom"
                  type="checkbox"
                  label={`${a.할일}`}
                  onChange={(e) => {
                    change_depth_three("큐브책", i, "완료여부", e.target.checked);
                  }}
                />
              </div>
            ))}

            <h5 className="fw-bold mt-5 mb-3">
              <strong>[ 매니저 피드백 ]</strong>
            </h5>
            <textarea
              className="textArea"
              rows="5"
              onChange={(e) => {
                change_depth_one("매니저피드백", e.target.value);
              }}
            ></textarea>
          </div>
          <Button
            variant="danger"
            className="btn-TRcommit btn-edit"
            onClick={() => {
              if (입력확인()) {
                if (window.confirm(`${TR.이름}학생의 ${TR.날짜} 일간하루를 저장하시겠습니까?`)) {
                  axios
                    .post("/api/TR/write", TR)
                    .then(function (result) {
                      if (result.data === true) {
                        window.alert("저장되었습니다.");
                        history.push("/studentList");
                      } else if (result.data === "로그인필요") {
                        window.alert("로그인이 필요합니다.");
                        return history.push("/");
                      } else {
                        console.log(result.data);
                        window.alert("중복되는 날짜의 일간하루가 존재합니다.");
                      }
                    })
                    .catch(function (err) {
                      console.log("저장 실패 : ", err);
                    });
                }
              }
            }}
          >
            <strong>일간하루 저장</strong>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default TRwrite;
