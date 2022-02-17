import "../App.scss";
import { Form, Button, Card, ListGroup, Table, Modal, Row, Col } from "react-bootstrap";
import { useHistory } from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect } from "react";
import axios from "axios";

function TRedit(props) {
  let history = useHistory();
  const [학생정보, 학생정보변경] = useState(props.stuDB);
  const [TR, TR변경] = useState(props.existTR);

  function 차이계산(목표, 실제) {
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
                <input
                  type="date"
                  defaultValue={TR.날짜}
                  className="w-100"
                  onChange={(e) => {
                    var newTR = JSON.parse(JSON.stringify(TR));
                    newTR.날짜 = e.target.value;
                    TR변경(newTR);
                  }}
                />
              </div>
              <div className="col-2 pe-0">
                <button
                  className="btn btn-good mt-3"
                  onClick={() => {
                    console.log(TR);
                    var newTR = JSON.parse(JSON.stringify(TR));
                    newTR.결석여부 = false;
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
                    if (window.confirm("입력된 생활 및 학습 등이 삭제됩니다. 결석으로 전환하시겠습니까?")) {
                      console.log(TR);
                      var newTR = JSON.parse(JSON.stringify(TR));
                      newTR.결석여부 = true;
                      TR변경(newTR);
                    }
                  }}
                >
                  결석
                </button>
              </div>
            </div>
            {TR.결석여부 === false ? (
              <div className="mt-4">
                <Form.Group as={Row} className="mb-3">
                  <Form.Label column sm="2">
                    신체 컨디션
                  </Form.Label>
                  <Col sm="10">
                    <Form.Select
                      size="sm"
                      onChange={(e) => {
                        const newTR = JSON.parse(JSON.stringify(TR));
                        newTR.신체컨디션 = parseInt(e.target.value);
                        TR변경(newTR);
                      }}
                    >
                      <option>{TR.신체컨디션}</option>
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
                    정서 컨디션
                  </Form.Label>
                  <Col sm="10">
                    <Form.Select
                      size="sm"
                      onChange={(e) => {
                        const newTR = JSON.parse(JSON.stringify(TR));
                        newTR.정서컨디션 = parseInt(e.target.value);
                        TR변경(newTR);
                      }}
                    >
                      <option>{TR.정서컨디션}</option>
                      <option value={5}>매우 좋음</option>
                      <option value={4}> 좋음</option>
                      <option value={3}>보통</option>
                      <option value={2}> 안좋음</option>
                      <option value={1}>매우 안좋음</option>
                    </Form.Select>
                  </Col>
                </Form.Group>
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
                    {["취침", "기상", "등원", "귀가"].map(function (a, i) {
                      return (
                        <tr key={i}>
                          <td>{a}</td>
                          <td>
                            <input
                              type="time"
                              defaultValue={TR[`목표${a}`]}
                              className="inputTime"
                              onChange={(e) => {
                                const newTR = JSON.parse(JSON.stringify(TR));
                                newTR[`목표${a}`] = e.target.value;
                                newTR[`${a}차이`] = 차이계산(newTR[`목표${a}`], newTR[`실제${a}`]);
                                TR변경(newTR);
                              }}
                            />
                          </td>

                          <td>
                            <input
                              type="time"
                              defaultValue={TR[`실제${a}`]}
                              className="inputTime"
                              onChange={(e) => {
                                const newTR = JSON.parse(JSON.stringify(TR));
                                newTR[`실제${a}`] = e.target.value;
                                newTR[`${a}차이`] = 차이계산(newTR[`목표${a}`], newTR[`실제${a}`]);
                                TR변경(newTR);
                              }}
                            />
                          </td>
                          <td>{차이출력(TR[`${a}차이`], a)}</td>
                        </tr>
                      );
                    })}
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
                              <option>{a.과목 ? a.과목 : "선택"}</option>
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
                              <option>{a.교재 ? a.교재 : "선택"}</option>
                              <option value="모의고사">모의고사</option>
                              <option value="테스트">테스트</option>
                            </Form.Select>
                          </td>
                          <td>
                            <p className="fs-13px">{a.총교재량}</p>
                          </td>
                          <td>
                            <input
                              type="number"
                              defaultValue={a.최근진도}
                              className="inputText"
                              onChange={(e) => {
                                var newTR = JSON.parse(JSON.stringify(TR));
                                newTR.학습[i].최근진도 = parseInt(e.target.value);
                                TR변경(newTR);
                              }}
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              defaultValue={a.학습시간}
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
                                newTR.실제학습 = parseFloat((실제학습시간 + 실제학습분 / 60).toFixed(1));
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
                      <td colSpan={4}>목표 학습 - {TR.목표학습} 시간</td>
                      <td> {TR.실제학습} 시간</td>
                      <td>{TR.실제학습 - TR.목표학습}시간</td>
                    </tr>
                    <tr>
                      <td colSpan={6}>
                        {" "}
                        <button
                          className="btn btn-dark"
                          onClick={() => {
                            var newTR = JSON.parse(JSON.stringify(TR));
                            newTR.학습.push({
                              과목: "",
                              교재: "",
                              총교재량: "---",
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
                              <option>{a.프로그램분류 ? a.프로그램분류 : "선택"}</option>
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
                              <option>{a.매니저 ? a.매니저 : "선택"}</option>
                              <option value="유장훈">유장훈</option>
                              <option value="오지영">오지영</option>
                            </Form.Select>
                          </td>
                          <td>
                            <input
                              type="text"
                              placeholder="ex) 0:50"
                              defaultValue={a.소요시간}
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
                                newTR.프로그램시간 = parseFloat((실제시간 + 실제분 / 60).toFixed(1));
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
                              placeholder="프로그램 진행 내용"
                              defaultValue={a.상세내용}
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
                      <td colSpan={5}>프로그램 진행 시간 : {TR.프로그램시간}시간</td>
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
                    newTR.결석사유 = e.target.value;
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
                    newTR.결석상세내용 = e.target.value;
                    TR변경(newTR);
                  }}
                ></textarea>
              </div>
            )}
          </div>
        </div>
        <div className="col-xl-3 trCol">
          <div className="trCard border border-3">
            {TR.결석여부 === false ? (
              <>
                <p className="fw-bold">학습태도</p>
                {TR.학습태도.map((prob, i) => (
                  <div key={`study-${prob.분류}`} className="mb-2">
                    <Form.Check
                      defaultChecked={prob.문제여부}
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
                  defaultChecked={prob.문제여부}
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
                          <option>{a.매니저 ? a.매니저 : "선택"}</option>
                          <option value="유장훈">유장훈</option>
                          <option value="오지영">오지영</option>
                        </Form.Select>
                      </td>
                      <td>
                        <input
                          type="text"
                          placeholder="ex) 0:30"
                          defaultValue={a.소요시간}
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
                            newTR.상담시간 = parseFloat((실제시간 + 실제분 / 60).toFixed(1));
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
                          defaultValue={a.상세내용}
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
                  <td colSpan={5}>총 상담 시간 : {TR.상담시간}시간</td>
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
          <Button
            variant="primary"
            className="mt-3 fs-4"
            onClick={() => {
              const newTR = JSON.parse(JSON.stringify(TR));
              if (newTR._id) {
                delete newTR._id;
                TR변경(newTR);
                console.log(TR);
              }
              if (window.confirm("수정된 DB를 저장하시겠습니까?")) {
                axios
                  .put("/api/TR/edit", TR)
                  .then(function (result) {
                    console.log(result);
                    if (result.data === true) {
                      console.log("수정 성공", result);
                      history.push("/studentList");
                    } else {
                      window.alert("수정 중 해당 일간하루가 삭제되었습니다. 개발/데이터 팀에 문의해주세요");
                    }
                  })
                  .catch(function (err) {
                    console.log("수정 실패 : ", err);
                  });
              }
            }}
          >
            일간하루 수정
          </Button>

          <Button
            variant="danger"
            className="ms-4   mt-4 fs-6"
            onClick={() => {
              if (window.confirm(`현재 작성중인 일간하루를 정말 삭제하시겠습니까?`)) {
                axios
                  .delete(`/api/TR/delete/${TR._id}`)
                  .then(function (response) {
                    console.log(response);
                    if (response.data === true) {
                      window.alert("삭제되었습니다");
                    } else {
                      window.alert("삭제에 실패했습니다. 개발/데이터 팀에게 문의해주세요");
                    }
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
            일간하루 삭제
          </Button>
        </div>
      </div>
    </div>
  );
}

export default TRedit;
