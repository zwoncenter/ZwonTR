import "../App.scss";
import { Form, Button, Card, ListGroup, Table, Modal, Row, Col } from "react-bootstrap";
import { Link, Route, Switch } from "react-router-dom";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect } from "react";
import 강진영 from "../강진영.js";
import 강진영TR from "../강진영TR.js";
import axios from "axios";

function TRpage(props) {
  let [학생정보, 학생정보변경] = useState(강진영);
  let [TR, TR변경] = useState(강진영TR);

  // 학생DB에 있는 생활학습목표 및 진행중교재 추가
  useEffect(() => {
    let newTR = JSON.parse(JSON.stringify(TR));

    newTR.생활.목표취침 = 학생정보.생활학습목표.취침;
    newTR.생활.목표기상 = 학생정보.생활학습목표.기상;
    newTR.생활.목표등원 = 학생정보.생활학습목표.등원;
    newTR.생활.목표귀가 = 학생정보.생활학습목표.귀가;
    newTR.생활.목표학습 = 학생정보.생활학습목표.학습;

    newTR.생활.실제취침 = 학생정보.생활학습목표.취침;
    newTR.생활.실제기상 = 학생정보.생활학습목표.기상;
    newTR.생활.실제등원 = 학생정보.생활학습목표.등원;
    newTR.생활.실제귀가 = 학생정보.생활학습목표.귀가;
    newTR.생활.실제학습 = 0;
    newTR.생활.프로그램시간 = 0;
    newTR.생활.상담시간 = 0;

    let tmp = [];
    학생정보.진행중교재.map(function (a, i) {
      tmp.push({
        과목: a.과목,
        교재: a.교재,
        총교재량: a.총교재량,
        최근진도: a.최근진도,
        학습시간: "",
      });
    });
    newTR.학습 = tmp;

    tmp = [];
    tmp.push({
      프로그램분류: "",
      매니저: "",
      소요시간: "",
      상세내용: "",
    });
    newTR.프로그램 = tmp;

    tmp = [];
    tmp.push({
      매니저: "",
      소요시간: "",
      상세내용: "",
    });
    newTR.상담 = tmp;

    TR변경(newTR);
  }, []);

  function 시간계산(목표, 실제, 종류) {
    let [목표시간, 목표분] = 목표.split(":");
    let [실제시간, 실제분] = 실제.split(":");
    let diff = parseInt(목표시간) - parseInt(실제시간) + (parseInt(목표분) - parseInt(실제분)) / 60;
    if (diff < -12) {
      diff += 24;
    } else if (diff > 12) {
      diff -= 24;
    }

    if (diff < 0) {
      diff = -diff;
      return diff.toFixed(1) + "시간 늦게 " + 종류;
    } else if (diff > 0) {
      return diff.toFixed(1) + "시간 일찍 " + 종류;
    } else {
      return "정시 " + 종류;
    }
  }

  return (
    <div>
      <div className="row">
        <div className="col-xl-5 trCol">
          <div className="trCard border border-3">
            <div className="row mb-2">
              <div className="col-4">
                <p className="fw-bold">이름</p>
                <p>{TR.이름}</p>
              </div>
              <div className="col-4">
                <p className="fw-bold">날짜</p>
                <input type="date" defaultValue={new Date().toISOString().split("T")[0]} className="w-100" />
              </div>
              <div className="col-2 pe-0">
                <button
                  className="btn btn-good mt-3"
                  onClick={() => {
                    console.log(TR);
                    var newTR = JSON.parse(JSON.stringify(TR));
                    newTR.생활.결석여부 = false;
                    TR변경(newTR);
                  }}
                >
                  등원
                </button>
              </div>
              <div className="col-2 ps-0">
                <button
                  className="btn btn-danger btn-bad mt-3"
                  onClick={() => {
                    console.log(TR);
                    var newTR = JSON.parse(JSON.stringify(TR));
                    newTR.생활.결석여부 = true;
                    TR변경(newTR);
                  }}
                >
                  결석
                </button>
              </div>
            </div>
            {TR.생활.결석여부 === false ? (
              <div>
                <Table striped bordered hover className="mt-3">
                  <thead>
                    <tr>
                      <th width="10%">생활</th>
                      <th>목표</th>
                      <th>실제</th>
                      <th width="25%">차이</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr>
                      <td>취침</td>
                      <td>
                        <input
                          type="time"
                          defaultValue={학생정보.생활학습목표.취침}
                          className="inputTime"
                          onChange={(e) => {
                            var newTR = JSON.parse(JSON.stringify(TR));
                            newTR.생활.목표취침 = e.target.value;
                            TR변경(newTR);
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="time"
                          defaultValue={학생정보.생활학습목표.취침}
                          className="inputTime"
                          onChange={(e) => {
                            var newTR = JSON.parse(JSON.stringify(TR));
                            newTR.생활.실제취침 = e.target.value;
                            TR변경(newTR);
                          }}
                        />
                      </td>
                      <td>{시간계산(TR.생활.목표취침, TR.생활.실제취침, "취침")}</td>
                    </tr>
                    <tr>
                      <td>기상</td>
                      <td>
                        <input
                          type="time"
                          defaultValue={학생정보.생활학습목표.기상}
                          className="inputTime"
                          onChange={(e) => {
                            var newTR = JSON.parse(JSON.stringify(TR));
                            newTR.생활.목표기상 = e.target.value;
                            TR변경(newTR);
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="time"
                          defaultValue={학생정보.생활학습목표.기상}
                          className="inputTime"
                          onChange={(e) => {
                            var newTR = JSON.parse(JSON.stringify(TR));
                            newTR.생활.실제기상 = e.target.value;
                            TR변경(newTR);
                          }}
                        />
                      </td>
                      <td>{시간계산(TR.생활.목표기상, TR.생활.실제기상, "기상")}</td>
                    </tr>
                    <tr>
                      <td>등원</td>
                      <td>
                        <input
                          type="time"
                          defaultValue={학생정보.생활학습목표.등원}
                          className="inputTime"
                          onChange={(e) => {
                            var newTR = JSON.parse(JSON.stringify(TR));
                            newTR.생활.목표등원 = e.target.value;
                            TR변경(newTR);
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="time"
                          defaultValue={학생정보.생활학습목표.등원}
                          className="inputTime"
                          onChange={(e) => {
                            var newTR = JSON.parse(JSON.stringify(TR));
                            newTR.생활.실제등원 = e.target.value;
                            TR변경(newTR);
                          }}
                        />
                      </td>
                      <td>{시간계산(TR.생활.목표등원, TR.생활.실제등원, "등원")}</td>
                    </tr>
                    <tr>
                      <td>귀가</td>
                      <td>
                        <input
                          type="time"
                          defaultValue={학생정보.생활학습목표.귀가}
                          className="inputTime"
                          onChange={(e) => {
                            var newTR = JSON.parse(JSON.stringify(TR));
                            newTR.생활.목표귀가 = e.target.value;
                            TR변경(newTR);
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="time"
                          defaultValue={학생정보.생활학습목표.귀가}
                          className="inputTime"
                          onChange={(e) => {
                            var newTR = JSON.parse(JSON.stringify(TR));
                            newTR.생활.실제귀가 = e.target.value;
                            TR변경(newTR);
                          }}
                        />
                      </td>
                      <td>{시간계산(TR.생활.목표귀가, TR.생활.실제귀가, "귀가")}</td>
                    </tr>
                  </tbody>
                </Table>
                <Table striped bordered hover className="mt-3">
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
                                var newTR = JSON.parse(JSON.stringify(TR));
                                newTR.학습[i].과목 = e.target.value;
                                TR변경(newTR);
                              }}
                            >
                              <option>{a.과목}</option>
                              <option value="선택">선택</option>
                              <option value="국어">국어</option>
                              <option value="수학">수학</option>
                              <option value="영어">영어</option>
                              <option value="탐구">탐구</option>
                            </Form.Select>
                          </td>
                          <td>
                            <Form.Select
                              size="sm"
                              onChange={(e) => {
                                var newTR = JSON.parse(JSON.stringify(TR));
                                newTR.학습[i].교재 = e.target.value;
                                TR변경(newTR);
                              }}
                            >
                              <option>{a.교재}</option>
                              <option value="선택">선택</option>
                              <option value="모의고사">모의고사</option>
                              <option value="테스트">테스트</option>
                            </Form.Select>
                          </td>
                          <td>
                            <p className="fs-13px">{a.총교재량}</p>
                          </td>
                          <td>
                            <input
                              type="text"
                              placeholder={a.최근진도}
                              className="inputText"
                              onChange={(e) => {
                                var newTR = JSON.parse(JSON.stringify(TR));
                                newTR.학습[i].최근진도 = e.target.value;
                                TR변경(newTR);
                              }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              placeholder={a.학습시간}
                              className="inputText"
                              onChange={(e) => {
                                var newTR = JSON.parse(JSON.stringify(TR));
                                newTR.학습[i].학습시간 = e.target.value;
                                let 실제학습시간 = 0;
                                let 실제학습분 = 0;
                                newTR.학습.map(function (a, i) {
                                  if (a.학습시간) {
                                    실제학습시간 += parseInt(a.학습시간.split(":")[0]);
                                    실제학습분 += parseInt(a.학습시간.split(":")[1]);
                                  }
                                });
                                newTR.생활.실제학습 = (실제학습시간 + 실제학습분 / 60).toFixed(1);
                                TR변경(newTR);
                              }}
                            />
                          </td>
                          <td>
                            <button
                              className="btn btn-delete"
                              onClick={() => {
                                if (i > -1) {
                                  var newTR = JSON.parse(JSON.stringify(TR));
                                  newTR.학습.splice(i, 1);
                                  TR변경(newTR);
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
                      <td colSpan={4}>목표 학습 - {TR.생활.목표학습} 시간</td>
                      <td> {TR.생활.실제학습} 시간</td>
                      <td>{TR.생활.실제학습 - TR.생활.목표학습}시간</td>
                    </tr>
                    <tr>
                      <td colSpan={6}>
                        {" "}
                        <button
                          className="btn btn-dark"
                          onClick={() => {
                            var newTR = JSON.parse(JSON.stringify(TR));
                            newTR.학습.push({
                              과목: "선택",
                              교재: "선택",
                              총교재량: "",
                              최근진도: "",
                              학습시간: "",
                            });
                            TR변경(newTR);
                          }}
                        >
                          +
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </Table>

                <Table striped bordered hover className="mt-3">
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
                                var newTR = JSON.parse(JSON.stringify(TR));
                                newTR.프로그램[i].프로그램분류 = e.target.value;
                                TR변경(newTR);
                              }}
                            >
                              <option>선택</option>
                              {학생정보.프로그램분류.map(function (p, j) {
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
                                var newTR = JSON.parse(JSON.stringify(TR));
                                newTR.프로그램[i].매니저 = e.target.value;
                                TR변경(newTR);
                              }}
                            >
                              <option>선택</option>
                              <option value="유장훈">유장훈</option>
                              <option value="오지영">오지영</option>
                            </Form.Select>
                          </td>
                          <td>
                            <input
                              type="text"
                              placeholder="0:00"
                              className="inputText"
                              onChange={(e) => {
                                var newTR = JSON.parse(JSON.stringify(TR));
                                newTR.프로그램[i].소요시간 = e.target.value;
                                let 실제시간 = 0;
                                let 실제분 = 0;
                                newTR.프로그램.map(function (c, k) {
                                  if (c.소요시간) {
                                    실제시간 += parseInt(c.소요시간.split(":")[0]);
                                    실제분 += parseInt(c.소요시간.split(":")[1]);
                                  }
                                });
                                newTR.생활.프로그램시간 = (실제시간 + 실제분 / 60).toFixed(1);
                                TR변경(newTR);
                              }}
                            />
                          </td>
                          <td>
                            <textarea
                              className="textArea"
                              name=""
                              id=""
                              rows="3"
                              placeholder="프로그램 상세내용/특이사항 입력"
                              onChange={(e) => {
                                var newTR = JSON.parse(JSON.stringify(TR));
                                newTR.프로그램[i].상세내용 = e.target.value;
                                TR변경(newTR);
                              }}
                            ></textarea>
                          </td>
                          <td>
                            <button
                              className="btn btn-delete"
                              onClick={() => {
                                if (i > -1) {
                                  var newTR = JSON.parse(JSON.stringify(TR));
                                  newTR.프로그램.splice(i, 1);
                                  TR변경(newTR);
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
                      <td colSpan={5}>프로그램 진행 시간 : {TR.생활.프로그램시간}시간</td>
                    </tr>
                    <tr>
                      <td colSpan={5}>
                        {" "}
                        <button
                          className="btn btn-dark"
                          onClick={() => {
                            var newTR = JSON.parse(JSON.stringify(TR));
                            newTR.프로그램.push({
                              프로그램분류: "",
                              매니저: "",
                              소요시간: "",
                              상세내용: "",
                            });
                            TR변경(newTR);
                          }}
                        >
                          +
                        </button>
                      </td>
                    </tr>
                  </tbody>
                </Table>
              </div>
            ) : (
              <div>
                <Form.Select
                  size="sm"
                  onChange={(e) => {
                    var newTR = JSON.parse(JSON.stringify(TR));
                    newTR.생활.결석사유 = e.target.value;
                    TR변경(newTR);
                  }}
                >
                  <option>선택</option>
                  <option value="병가">병가</option>
                  <option value="무단">무단</option>
                  <option value="휴가">휴가</option>
                  <option value="기타">기타</option>
                </Form.Select>
                <textarea
                  name=""
                  id=""
                  className="textArea mt-3"
                  placeholder="결석 사유를 입력"
                  onChange={(e) => {
                    var newTR = JSON.parse(JSON.stringify(TR));
                    newTR.생활.결석상세내용 = e.target.value;
                    TR변경(newTR);
                  }}
                ></textarea>
              </div>
            )}
          </div>
        </div>
        <div className="col-xl-3 trCol">
          <div className="trCard border border-3">
            {TR.생활.결석여부 === false ? (
              <>
                <p className="fw-bold">학습태도</p>
                {TR.학습태도.map((prob, i) => (
                  <div key={`study-${prob.분류}`} className="mb-2">
                    <Form.Check
                      defaultValue={prob.문제여부}
                      className="border-bottom"
                      type="checkbox"
                      id={`study-${prob.분류}`}
                      label={`${prob.분류}`}
                      onChange={(e) => {
                        var newTR = JSON.parse(JSON.stringify(TR));
                        newTR.학습태도[i].문제여부 = e.target.checked;
                        TR변경(newTR);
                      }}
                    />
                  </div>
                ))}
              </>
            ) : null}
            <p className="fw-bold">문제행동</p>
            {TR.문제행동.map((prob, i) => (
              <div key={`study-${prob.분류}`} className="mb-2">
                <Form.Check
                  defaultValue={prob.문제여부}
                  className="border-bottom"
                  type="checkbox"
                  id={`study-${prob.분류}`}
                  label={`${prob.분류}`}
                  onChange={(e) => {
                    var newTR = JSON.parse(JSON.stringify(TR));
                    newTR.문제행동[i].문제여부 = e.target.checked;
                    TR변경(newTR);
                  }}
                />
              </div>
            ))}
          </div>
        </div>
        <div className="col-xl-4 trCol">
          <div className="trCard border border-3">
            <p className="fw-bold mt-3">상담</p>
            <Table striped bordered hover className="mt-3">
              <thead>
                <tr>
                  <th width="15%">매니저</th>
                  <th width="20%">소요시간</th>
                  <th width="55%">상세내용</th>
                  <th width="10%"></th>
                </tr>
              </thead>
              <tbody>
                {TR.상담.map(function (a, i) {
                  return (
                    <tr key={i}>
                      <td>
                        <Form.Select
                          size="sm"
                          onChange={(e) => {
                            var newTR = JSON.parse(JSON.stringify(TR));
                            newTR.상담[i].매니저 = e.target.value;
                            TR변경(newTR);
                          }}
                        >
                          <option>선택</option>
                          <option value="유장훈">유장훈</option>
                          <option value="오지영">오지영</option>
                        </Form.Select>
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="0:00"
                          className="inputText"
                          onChange={(e) => {
                            var newTR = JSON.parse(JSON.stringify(TR));
                            newTR.상담[i].소요시간 = e.target.value;
                            let 실제시간 = 0;
                            let 실제분 = 0;
                            newTR.상담.map(function (c, k) {
                              if (c.소요시간) {
                                실제시간 += parseInt(c.소요시간.split(":")[0]);
                                실제분 += parseInt(c.소요시간.split(":")[1]);
                              }
                            });
                            newTR.생활.상담시간 = (실제시간 + 실제분 / 60).toFixed(1);
                            TR변경(newTR);
                          }}
                        />
                      </td>
                      <td>
                        <textarea
                          className="textArea"
                          name=""
                          id=""
                          rows="3"
                          placeholder="상담 상세내용 입력"
                          onChange={(e) => {
                            var newTR = JSON.parse(JSON.stringify(TR));
                            newTR.상담[i].상세내용 = e.target.value;
                            TR변경(newTR);
                          }}
                        ></textarea>
                      </td>
                      <td>
                        <button
                          className="btn btn-delete"
                          onClick={() => {
                            if (i > -1) {
                              var newTR = JSON.parse(JSON.stringify(TR));
                              newTR.상담.splice(i, 1);
                              TR변경(newTR);
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
                  <td colSpan={5}>총 상담 시간 : {TR.생활.상담시간}시간</td>
                </tr>
                <tr>
                  <td colSpan={5}>
                    {" "}
                    <button
                      className="btn btn-dark"
                      onClick={() => {
                        var newTR = JSON.parse(JSON.stringify(TR));
                        newTR.상담.push({
                          매니저: "",
                          소요시간: "",
                          상세내용: "",
                        });
                        TR변경(newTR);
                      }}
                    >
                      +
                    </button>
                  </td>
                </tr>
              </tbody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default TRpage;
