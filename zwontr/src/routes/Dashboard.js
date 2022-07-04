import "./Dashboard.css";
import moment from "moment";
import {
  Form,
  Button,
  Card,
  ListGroup,
  Table,
  Modal,
  Row,
  Col,
  Input,
} from "react-bootstrap";
import {
  useHistory,
  useParams,
} from "react-router-dom/cjs/react-router-dom.min";
import { useState, useEffect, useRef } from "react";
import axios from "axios";
import TimePicker from "react-time-picker";
import menuarrow from "../next.png";
import createPlotlyComponent from "react-plotly.js/factory";
import React, { PureComponent } from "react";
import {
  PieChart,
  Pie,
  Legend,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LineChart,
  Line,
  CartesianGrid,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ReferenceLine,
  RadialBarChart,
  RadialBar,
  AreaChart,
  Area,
} from "recharts";

function Dashboard() {
  const Plotly = window.Plotly;
  const Plot = createPlotlyComponent(Plotly);
  let [dashshow, dashshowChange] = useState(true);
  let history = useHistory();

  const [stuDBList, setstuDBList] = useState([]);
  const [filteredstuDBList, setfilteredstuDBList] = useState([]);
  const [searchStudent, setsearchStudent] = useState("");
  const [searchStudentGo, setsearchStudentGo] = useState("");
  const [TRlist, setTRlist] = useState([]);
  const [data, setdata] = useState([]);
  const [chartMode, setChartMode] = useState([1, 0, 0, 0]); //취침, 기상, 등원, 학습시간 버튼 화면전환을 위한 state

  const [startday, setstartday] = useState("");
  const [lastday, setlastday] = useState("");
  const [aver, setaver] = useState(0);
  const [include_abscent, setinclude_abscent] = useState(true);
  const [include_sunday, setinclude_sunday] = useState(true);
  const [stuchange, setstuchange] = useState(false);
  const isInitialMount = useRef(true);

  // 데이터 초기화 - 지각율 파이그래프
  const [lateRate, setLateRate] = useState([
    { name: "정시등원", value: 0, fill: "#0088FE" },
    { name: "지각", value: 0, fill: "#FFBB28" },
  ]);
  const lateRateCOLORS = ["rgb(164, 180, 255)", "rgb(234, 153, 153)"];
  const lateRateLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
    index,
  }) => {
    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 1.4;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <text
        x={x}
        y={y}
        fill="black"
        textAnchor={x > cx ? "start" : "end"}
        dominantBaseline="central"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // 데이터 초기화 - 취침시각 그래프
  const [sleepingTime, setSleepingTime] = useState([]);

  useEffect(async () => {
    const newstudentDBlist = await axios
      .get("/api/studentList")
      .then((result) => {
        return result.data;
      })
      .catch((err) => {
        return err;
      });

    if (newstudentDBlist && newstudentDBlist == "로그인필요") {
      window.alert("로그인이 필요합니다.");
      return history.push("/");
    }
    newstudentDBlist.sort(function (a, b) {
      return +(a.이름 > b.이름) - 0.5;
    });
    setstuDBList(newstudentDBlist);
    isInitialMount.current = false;
  }, []);

  useEffect(() => {
    setfilteredstuDBList(
      stuDBList.filter((studb) => {
        return studb["ID"].includes(searchStudent);
      })
    );
  }, [searchStudent]);

  useEffect(async () => {
    if (isInitialMount.current === false) {
      console.log("TRlist 요청");
      const foundTRlist = await axios
        .get(`/api/TR/${searchStudentGo}`)
        .then((result) => {
          if (result.data === "로그인필요") {
            window.alert("로그인이 필요합니다.");
            return history.push("/");
          }
          return result.data;
        })
        .catch(function (err) {
          console.log("/api/TR/:ID fail : ", err);
        });

      [foundTRlist].sort(function (a, b) {
        return +(new Date(a.날짜) > new Date(b.날짜)) - 0.5;
      });

      setTRlist(foundTRlist);
      setdata(foundTRlist);
      // setstartday(foundTRlist[0].날짜);
      const last = new Date(foundTRlist[foundTRlist.length - 1].날짜);
      const last_7 = new Date(
        last.getFullYear(),
        last.getMonth(),
        last.getDate() - 6
      );

      setstartday(last_7.toISOString().split("T")[0]);
      setlastday(foundTRlist[foundTRlist.length - 1].날짜);
      setstuchange(!stuchange);
    }
  }, [searchStudentGo]);

  useEffect(() => {
    if (!isInitialMount.current) {
      var newdata = [...TRlist];
      newdata = newdata.filter((data) => {
        return (
          new Date(data.날짜) >= new Date(startday) &&
          new Date(data.날짜) <= new Date(lastday)
        );
      });

      if (!include_abscent) {
        newdata = newdata.filter((data) => {
          return (
            new Date(data.날짜) >= new Date(startday) &&
            new Date(data.날짜) <= new Date(lastday) &&
            data.결석여부 == false
          );
        });
      }

      if (!include_sunday) {
        newdata = newdata.filter((data) => {
          return (
            new Date(data.날짜) >= new Date(startday) &&
            new Date(data.날짜) <= new Date(lastday) &&
            data.요일 !== "일요일"
          );
        });
      }

      newdata.sort(function (a, b) {
        return +(new Date(a.날짜) > new Date(b.날짜)) - 0.5;
      });

      const sum = newdata.reduce(
        (total, current) => total + current["실제학습"],
        0
      );
      setaver(parseInt((sum / newdata.length) * 10) / 10);
      setdata(newdata);
    }
  }, [startday, lastday, include_abscent, include_sunday, stuchange]);

  // 시각화를 위한 데이터 계산
  useEffect(() => {
    if (isInitialMount.current === false) {
      setLateRate([
        {
          name: "정시등원",
          value: data.filter((element) => {
            return (
              element["목표등원"] != null &&
              element["목표등원"] >= element["실제등원"]
              && element['결석여부'] != true
            );
          }).length,
          fill: "rgb(164, 180, 255)",
        },
        {
          name: "지각",
          value: data.filter((element) => {
            return (
              element["목표등원"] != null &&
              element["목표등원"] < element["실제등원"]
              &&element['결석여부'] != true
            );
          }).length,
          fill: "rgb(234, 153, 153)",
        },
      ]);
      const temporal = data.map((element, i) => {
        return {
          indice: i,
          결석여부: element['결석여부'],
          날짜: element["날짜"],
          목표취침: convertFromStringToDateTime(element["목표취침"]),
          실제취침: convertFromStringToDateTime(element["실제취침"]),
          목표기상: convertFromStringToDateTime(element["목표기상"]),
          실제기상: convertFromStringToDateTime(element["실제기상"]),
          목표등원: convertFromStringToDateTime(element["목표등원"]),
          실제등원: convertFromStringToDateTime(element["실제등원"]),
          목표학습: element["목표학습"],
          실제학습: element["실제학습"],
        };
      });
      setSleepingTime(temporal);
    }
  }, [data]);

  function convertFromStringToDateTime(responseDate) {
    if (responseDate !== null) {
      let timePieces = responseDate.split(":");
      if (timePieces[0] >= "18") {
        return new Date(2001, 0, 1, timePieces[0], timePieces[1]);
      } else {
        return new Date(2001, 0, 2, timePieces[0], timePieces[1]);
      }
    }
  }

  return (
    <div className="dashboard-background">
      <div className="dashboard-bigbox">
        <div className="dashcard profilebox">
          <div className="input-group">
            <input
              type="text"
              className="form-control w-80"
              placeholder="학생 검색"
              value={searchStudent}
              onChange={(e) => {
                setsearchStudent(e.target.value);
              }}
            ></input>
            <button
              className="w-20"
              onClick={() => {
                setsearchStudentGo(searchStudent);
              }}
            >
              <span>
                <strong>조회</strong>
              </span>
            </button>
          </div>
          <button
            className="w-20"
            onClick={() => {
              console.log(data);
              console.log(sleepingTime);
              console.log(sleepingTime.filter((element)=>{
                return (element['결석여부'] === false);
              })
              .map((element) => {
                return element["날짜"];
              })
              );
            }}
          >
            <span>
              <strong>확인</strong>
            </span>
          </button>

          {searchStudent.length >= 10
            ? null
            : searchStudent.length >= 1
            ? filteredstuDBList.map(function (db, index) {
                return (
                  <ListGroup.Item
                    className="stuList"
                    onClick={() => {
                      setsearchStudent(db.ID);
                    }}
                  >
                    <p className="p-0 m-0">{db.ID}</p>
                  </ListGroup.Item>
                );
              })
            : null}
          <div className="remoteController">
            <div>
              <strong>
                <p>[ 리모컨 ]</p>
              </strong>
            </div>
            <Card className="p-2">
              <Form.Control
                type="date"
                value={startday}
                onChange={(e) => {
                  setstartday(e.target.value);
                }}
              />
              <Form.Label>
                <p className="mb-0">
                  <strong>부터</strong>
                </p>
              </Form.Label>
              <Form.Control
                type="date"
                value={lastday}
                onChange={(e) => {
                  setlastday(e.target.value);
                }}
              />
              <Form.Label>
                <p className="mb-0">
                  <strong>까지</strong>
                </p>
              </Form.Label>
              <Form.Check
                className="mb-2"
                type="checkbox"
                label="미등원 포함"
                checked={include_abscent}
                onChange={(e) => {
                  setinclude_abscent(!include_abscent);
                }}
              />
              <Form.Check
                className="mb-2"
                type="checkbox"
                label="일요일 포함"
                checked={include_sunday}
                onChange={(e) => {
                  setinclude_sunday(!include_sunday);
                }}
              />
              <div>
                <Button
                  className="modeBtn"
                  variant="secondary"
                  onClick={() => {
                    setChartMode([1, 0, 0, 0]);
                  }}
                >
                  <p>취침</p>
                </Button>
                <Button
                  className="modeBtn"
                  variant="secondary"
                  onClick={() => {
                    setChartMode([0, 1, 0, 0]);
                  }}
                >
                  <p>기상</p>
                </Button>
                <Button
                  className="modeBtn"
                  variant="secondary"
                  onClick={() => {
                    setChartMode([0, 0, 1, 0]);
                  }}
                >
                  <p>등원</p>
                </Button>
                <Button
                  className="modeBtn"
                  variant="secondary"
                  onClick={() => {
                    setChartMode([0, 0, 0, 1]);
                  }}
                >
                  <p>학습</p>
                </Button>
              </div>
            </Card>
            <div className="center">
              <p>기간 내 등원일 - {data.filter((element)=>{
                      return (
                        element['결석여부'] ===false
                      );})
                      .length}일 </p>
            </div>
          </div>
        </div>
        {chartMode[0] == 1 ? ( //취침
          <div className="dashcard contentbox">
            <div className="dashcard FlowChart">
              <p>
                <strong>취침 추이</strong>
              </p>
              <Plot
                className="p-0 m-0"
                data={[
                  {
                    x: sleepingTime.map((element) => {
                      return element["날짜"];
                    }),
                    y: sleepingTime.map((element) => {
                      return element["목표취침"];
                    }),
                    type: "line",
                    mode: "lines",
                    name: "목표취침시각",
                    line: {
                      dash: "dot",
                      width: 2,
                      color: "grey",
                    },
                  },
                  {
                    x: sleepingTime.filter((element)=>{
                      return (
                        element['결석여부'] ===false
                      );
                    }).map((element) => {
                      return element["날짜"];
                    }),
                    y: sleepingTime.filter((element)=>{
                      return (
                        element['결석여부'] ===false
                      );
                    }).map((element) => {
                      return element["실제취침"];
                    }),
                    type: "scatter",
                    mode: "markers",
                    name: "실제취침시각",
                    marker: {
                      size: 10,
                      color: "#003973",
                    },
                  },
                ]}
                layout={{
                  margin: { t: 0, b: 30, l: 60, r: 10, pad: 0 },
                  width: 1100,
                  height: 500,
                  xaxis: {
                    title: "날짜",
                  },
                  yaxis: {
                    visible: true,
                    title: "취침시각",
                    tickformat: "%H:%M",
                  },
                }}
              />
            </div>
            <div className="dashcard"></div>
            <div className="dashcard"></div>
            <div className="dashcard"></div>
            <div className="dashcard"></div>
          </div>
        ) : chartMode[1] == 1 ? ( //기상
          <div className="dashcard contentbox">
            <div className="dashcard FlowChart">
              <p>
                <strong>기상 추이</strong>
              </p>
              <Plot
                className="p-0 m-0"
                data={[
                  {
                    x: sleepingTime.map((element) => {
                      return element["날짜"];
                    }),
                    y: sleepingTime.map((element) => {
                      return element["목표기상"];
                    }),
                    type: "line",
                    mode: "lines",
                    name: "목표기상시각",
                    line: {
                      dash: "dot",
                      width: 2,
                      color: "grey",
                    },
                  },
                  {
                    x: sleepingTime.filter((element)=>{
                      return (
                        element['결석여부'] ===false
                      );
                    }).map((element) => {
                      return element["날짜"];
                    }),
                    y: sleepingTime.filter((element)=>{
                      return (
                        element['결석여부'] ===false
                      );
                    }).map((element) => {
                      return element["실제기상"];
                    }),
                    type: "scatter",
                    mode: "markers",
                    name: "실제기상시각",
                    marker: {
                      size: 10,
                      color: "#ec2F4B",
                    },
                  },
                ]}
                layout={{
                  margin: { t: 0, b: 30, l: 60, r: 10, pad: 0 },
                  width: 1100,
                  height: 500,
                  xaxis: {
                    title: "날짜",
                  },
                  yaxis: {
                    visible: true,
                    title: "기상시각",
                    tickformat: "%H:%M",
                  },
                }}
              />
            </div>
            <div className="dashcard"></div>
            <div className="dashcard"></div>
            <div className="dashcard"></div>
            <div className="dashcard"></div>
          </div>
        ) : chartMode[2] == 1 ? ( //등원
          <div className="dashcard contentbox">
            <div className="dashcard">
              <p>
                <strong>지각율</strong>
              </p>
              <ResponsiveContainer width="100%" height="80%">
                <PieChart width={100} height={80}>
                  <Pie
                    dataKey="value"
                    isAnimationActive={true}
                    data={lateRate}
                    cx="50%"
                    cy="50%"
                    outerRadius={80}
                    fill={lateRateCOLORS}
                    label={lateRateLabel}
                  >
                    {data.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={lateRateCOLORS[index % lateRateCOLORS.length]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="dashcard FlowChart">
              <p>
                <strong>등원 추이</strong>
              </p>
              <Plot
                className="p-0 m-0"
                data={[
                  {
                    x: sleepingTime.map((element) => {
                      return element["날짜"];
                    }),

                    y: sleepingTime.map((element) => {
                      return element["목표등원"];
                    }),
                    type: "line",
                    mode: "lines",
                    name: "목표등원시각",
                    line: {
                      dash: "dot",
                      width: 2,
                      color: "grey",
                    },
                  },
                  {
                    x: sleepingTime.filter((element)=>{
                      return (
                        element['결석여부'] ===false
                      );
                    }).map((element) => {
                      return element["날짜"];
                    }),
                    y: sleepingTime.filter((element)=>{
                      return (
                        element['결석여부'] ===false
                      );
                    }).map((element) => {
                      return element["실제등원"];
                    }),
                    type: "scatter",
                    mode: "markers",
                    name: "실제등원시각",
                    marker: {
                      size: 10,
                      color: "#F9D423",
                    },
                  },
                ]}
                layout={{
                  margin: { t: 0, b: 30, l: 60, r: 10, pad: 0 },
                  width: 1100,
                  height: 500,
                  xaxis: {
                    title: "날짜",
                  },
                  yaxis: {
                    visible: true,
                    title: "등원시각",
                    tickformat: "%H:%M",
                  },
                }}
              />
            </div>
            <div className="dashcard"></div>
            <div className="dashcard"></div>
            <div className="dashcard"></div>
            <div className="dashcard"></div>
          </div>
        ) : chartMode[3] == 1 ? ( //학습시간
          <div className="dashcard contentbox">
            <div className="dashcard lifecycleChartSleep">
              <p>
                <strong>취침-학습패턴</strong>
              </p>
              <Plot
                className="p-0 m-0"
                data={[
                  {
                    x: sleepingTime.filter((element)=>{
                      return (
                        element['결석여부'] ===false
                      );}).map((element) => {
                      return element["실제취침"];
                    }),
                    y: sleepingTime.filter((element)=>{
                      return (
                        element['결석여부'] ===false
                      );}).map((element) => {
                      return element["실제학습"];
                    }),
                    type: "scatter",
                    mode: "markers",
                    name: '취침 point',
                    marker: {
                      size: 12,
                      opacity: 0.7,
                      color: sleepingTime.map((element) => {
                        return element["indice"];
                      }),
                      colorscale: [
                        [0, "#E5E5BE"],
                        [1, "#003973"],
                      ],
                      colorbar: {
                        title: "날짜",
                        titleside: "Top",
                        ticktext: sleepingTime
                          .map((element) => {
                            return element["날짜"];
                          })
                          .fill(" ", 1, -1),
                        tickvals: sleepingTime.map((element) => {
                          return element["indice"];
                        }),
                        mode: "array",
                      },
                    },
                  },
                ]}
                layout={{
                  margin: { t: 0, b: 30, l: 35, r: 10, pad: 0 },
                  width: 400,
                  height: 300,
                  xaxis: {
                    title: "취침시각(시/분)",
                    tickformat: "%H:%M",
                  },
                  yaxis: {
                    visible: true,
                    title: "학습시간",
                    tickmode: "linear",
                    tick0: 0.0,
                    dtick: 2.0,
                  },
                }}
              />
            </div>
            <div className="dashcard lifecycleChartWakeup">
              <p>
                <strong>기상-학습패턴</strong>
              </p>
              <Plot
                className="p-0 m-0"
                data={[
                  {
                    x: sleepingTime.filter((element)=>{
                      return (
                        element['결석여부'] ===false
                      );}).map((element) => {
                      return element["실제기상"];
                    }),
                    y: sleepingTime.filter((element)=>{
                      return (
                        element['결석여부'] ===false
                      );}).map((element) => {
                      return element["실제학습"];
                    }),
                    type: "scatter",
                    mode: "markers",
                    marker: {
                      size: 12,
                      opacity: 0.7,
                      color: sleepingTime.map((element) => {
                        return element["indice"];
                      }),
                      colorscale: [
                        [0, "#F7BB97"],
                        [1, "#ec2F4B"],
                      ],
                      colorbar: {
                        title: "날짜",
                        titleside: "Top",
                        ticktext: sleepingTime
                          .map((element) => {
                            return element["날짜"];
                          })
                          .fill(" ", 1, -1),
                        tickvals: sleepingTime.map((element) => {
                          return element["indice"];
                        }),
                        mode: "array",
                      },
                    },
                  },
                ]}
                layout={{
                  margin: { t: 0, b: 30, l: 35, r: 10, pad: 0 },
                  width: 400,
                  height: 300,
                  xaxis: {
                    title: "기상시각(시/분)",
                    tickformat: "%H:%M",
                  },
                  yaxis: {
                    visible: true,
                    title: "학습시간",
                    tickmode: "linear",
                    tick0: 0.0,
                    dtick: 2.0,
                  },
                }}
              />
            </div>
            <div className="dashcard lifecycleChartAttend">
              <p>
                <strong>등원-학습패턴</strong>
              </p>
              <Plot
                className="p-0 m-0"
                data={[
                  {
                    x: sleepingTime.filter((element)=>{
                      return (
                        element['결석여부'] ===false
                      );}).map((element) => {
                      return element["실제등원"];
                    }),
                    y: sleepingTime.filter((element)=>{
                      return (
                        element['결석여부'] ===false
                      );}).map((element) => {
                      return element["실제학습"];
                    }),
                    type: "scatter",
                    mode: "markers",
                    marker: {
                      size: 12,
                      opacity: 0.7,
                      color: sleepingTime.map((element) => {
                        return element["indice"];
                      }),
                      colorscale: [
                        [0, "#F9D423"],
                        [1, "#f12711"],
                      ],
                      colorbar: {
                        title: "날짜",
                        titleside: "Top",
                        ticktext: sleepingTime
                          .map((element) => {
                            return element["날짜"];
                          })
                          .fill(" ", 1, -1),
                        tickvals: sleepingTime.map((element) => {
                          return element["indice"];
                        }),
                        mode: "array",
                      },
                    },
                  },
                ]}
                layout={{
                  margin: { t: 0, b: 30, l: 35, r: 10, pad: 0 },
                  width: 400,
                  height: 300,
                  xaxis: {
                    title: "등원시각(시/분)",
                    tickformat: "%H:%M",
                  },
                  yaxis: {
                    visible: true,
                    title: "학습시간",
                    tickmode: "linear",
                    tick0: 0.0,
                    dtick: 2.0,
                  },
                }}
              />
            </div>

            <div className="dashcard"></div>
            <div className="dashcard FlowChart">
              <p>
                <strong>학습시간 추이</strong>
              </p>
              <ResponsiveContainer width="100%" height="90%">
                <AreaChart
                  className="graph"
                  width={1000}
                  height={500}
                  data={data}
                >
                  <Area
                    type="monotone"
                    dataKey="실제학습"
                    stroke="#FFBB28"
                    fill="#FFBB28"
                  />
                  <CartesianGrid strokeDasharray="3 3" />
                  <Tooltip />
                  <XAxis dataKey="날짜" />
                  <YAxis />
                  <ReferenceLine
                    y={aver}
                    label={`Average : ${aver}`}
                    stroke="#0088FE"
                    strokeDasharray="3 3"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="dashcard"></div>
            <div className="dashcard"></div>
            <div className="dashcard"></div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default Dashboard;
